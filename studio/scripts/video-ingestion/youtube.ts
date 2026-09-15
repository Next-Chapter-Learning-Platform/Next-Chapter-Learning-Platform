import { getVideoDetails } from "youtube-caption-extractor";

import { canonicalYouTubeUrl, parseDescriptionChapters } from "./transform";
import type { RawVideoExtraction, VideoCatalogRecord } from "./types";

const MAX_ATTEMPTS = 3;

function isPermanentExtractionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /video unavailable|private|deleted/i.test(message);
}

export async function extractYouTubeVideo(
  source: VideoCatalogRecord,
): Promise<RawVideoExtraction> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const details = await getVideoDetails({ videoID: source.id, lang: "en" });
      const transcript = details.subtitles
        .map((subtitle) => ({
          startSeconds: Number(subtitle.start),
          durationSeconds: Number(subtitle.dur),
          text: subtitle.text,
        }))
        .filter(
          (cue) =>
            Number.isFinite(cue.startSeconds) &&
            Number.isFinite(cue.durationSeconds) &&
            cue.text.trim().length > 0,
        );

      if (transcript.length === 0) {
        throw new Error(`YouTube returned no caption track for ${source.id}`);
      }

      return {
        version: 1,
        provider: "youtube",
        videoId: source.id,
        url: canonicalYouTubeUrl(source.id),
        title: details.title || source.title,
        description: details.description,
        expectedDurationSeconds: source.duration,
        transcript,
        chapters: parseDescriptionChapters(
          details.description,
          source.duration,
        ),
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      lastError = error;

      if (isPermanentExtractionError(error) || attempt === MAX_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`YouTube extraction failed for ${source.id}: ${message}`);
}
