import { createHash } from "node:crypto";

import type {
  RawVideoExtraction,
  SanityVideoDocument,
  TranscriptCue,
  VideoChapter,
} from "./types";

const CHUNK_MIN_SECONDS = 20;
const CHUNK_TARGET_SECONDS = 35;
const CHUNK_MAX_SECONDS = 45;
const CHUNK_MAX_CHARACTERS = 800;

export function normalizeText(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseTimestamp(value: string) {
  const parts = value.split(":").map(Number);

  if (
    (parts.length !== 2 && parts.length !== 3) ||
    parts.some((part) => !Number.isInteger(part) || part < 0)
  ) {
    return null;
  }

  const seconds = parts.at(-1) ?? 0;
  const minutes = parts.at(-2) ?? 0;
  const hours = parts.length === 3 ? parts[0] : 0;

  if (seconds >= 60 || (parts.length === 3 && minutes >= 60)) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

export function parseDescriptionChapters(
  description: string,
  durationSeconds?: number,
) {
  const candidates: VideoChapter[] = [];
  const timestampAtStart =
    /^\s*(?:[-*•]\s*)?\(?((?:\d{1,2}:)?\d{1,2}:\d{2})\)?\s*(?:[-–—|:]\s*)?(.{2,180})\s*$/;

  for (const line of description.split(/\r?\n/)) {
    const match = line.match(timestampAtStart);

    if (!match) continue;

    const startSeconds = parseTimestamp(match[1]);
    const label = normalizeText(match[2]);

    if (
      startSeconds === null ||
      !label ||
      /^https?:\/\//i.test(label) ||
      (durationSeconds !== undefined && startSeconds >= durationSeconds)
    ) {
      continue;
    }

    candidates.push({ startSeconds, label });
  }

  const byStart = new Map<number, VideoChapter>();

  for (const chapter of candidates.sort(
    (a, b) => a.startSeconds - b.startSeconds,
  )) {
    if (!byStart.has(chapter.startSeconds))
      byStart.set(chapter.startSeconds, chapter);
  }

  const chapters = [...byStart.values()];

  // A single timestamp is commonly an ordinary reference, not authored chapter data.
  return chapters.length >= 2 ? chapters : [];
}

export function canonicalYouTubeUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

export function sanityVideoDocumentId(videoId: string) {
  const safeId = videoId.replace(/[^A-Za-z0-9_-]/g, "-");

  if (!safeId)
    throw new Error(
      `Cannot derive a Sanity document ID from video ID: ${videoId}`,
    );

  const validElement = /^[A-Za-z0-9_]/.test(safeId) ? safeId : `id_${safeId}`;

  return `video.youtube.${validElement}`;
}

function stableKey(prefix: string, startSeconds: number, text: string) {
  const digest = createHash("sha1")
    .update(`${startSeconds}\u0000${text}`)
    .digest("hex")
    .slice(0, 14);

  return `${prefix}-${digest}`;
}

export function buildTranscriptChunks(cues: TranscriptCue[]) {
  const normalized = cues
    .filter(
      (cue) =>
        Number.isFinite(cue.startSeconds) &&
        Number.isFinite(cue.durationSeconds) &&
        cue.startSeconds >= 0,
    )
    .map((cue) => ({
      startSeconds: Math.floor(cue.startSeconds),
      durationSeconds: Math.max(0, cue.durationSeconds),
      text: normalizeText(cue.text),
    }))
    .filter((cue) => cue.text.length >= 2)
    .sort((a, b) => a.startSeconds - b.startSeconds)
    .filter(
      (cue, index, all) => index === 0 || cue.text !== all[index - 1].text,
    );

  const chunks: Array<{ startSeconds: number; text: string }> = [];
  let current: {
    startSeconds: number;
    endSeconds: number;
    parts: string[];
  } | null = null;

  const flush = () => {
    if (!current) return;

    const text = normalizeText(current.parts.join(" ")).slice(0, 1200).trim();
    if (text.length >= 2)
      chunks.push({ startSeconds: current.startSeconds, text });
    current = null;
  };

  for (const cue of normalized) {
    const cueEnd = cue.startSeconds + cue.durationSeconds;

    if (!current) {
      current = {
        startSeconds: cue.startSeconds,
        endSeconds: cueEnd,
        parts: [cue.text],
      };
      continue;
    }

    const elapsed = cueEnd - current.startSeconds;
    const nextLength = current.parts.join(" ").length + 1 + cue.text.length;

    if (elapsed > CHUNK_MAX_SECONDS || nextLength > CHUNK_MAX_CHARACTERS) {
      flush();
      current = {
        startSeconds: cue.startSeconds,
        endSeconds: cueEnd,
        parts: [cue.text],
      };
      continue;
    }

    current.parts.push(cue.text);
    current.endSeconds = Math.max(current.endSeconds, cueEnd);

    const duration = current.endSeconds - current.startSeconds;
    const endsSentence = /[.!?]["')\]]?$/.test(cue.text);

    if (
      duration >= CHUNK_TARGET_SECONDS ||
      (duration >= CHUNK_MIN_SECONDS && endsSentence)
    ) {
      flush();
    }
  }

  flush();
  return chunks;
}

export function buildVideoDocument(
  extraction: RawVideoExtraction,
): SanityVideoDocument {
  const chapters = extraction.chapters
    .filter(
      (chapter) =>
        chapter.startSeconds >= 0 && normalizeText(chapter.label).length >= 2,
    )
    .sort((a, b) => a.startSeconds - b.startSeconds)
    .map((chapter) => {
      const startSeconds = Math.floor(chapter.startSeconds);
      const label = normalizeText(chapter.label).slice(0, 180);

      return {
        _key: stableKey("chapter", startSeconds, label),
        _type: "chapter" as const,
        startSeconds,
        label,
      };
    });

  const chunks = buildTranscriptChunks(extraction.transcript).map((chunk) => ({
    _key: stableKey("chunk", chunk.startSeconds, chunk.text),
    _type: "transcriptChunk" as const,
    ...chunk,
  }));

  if (chunks.length === 0) {
    throw new Error(
      `No usable transcript chunks were extracted for ${extraction.videoId}`,
    );
  }

  return {
    _id: sanityVideoDocumentId(extraction.videoId),
    _type: "video",
    videoId: extraction.videoId,
    url: canonicalYouTubeUrl(extraction.videoId),
    chapters,
    chunks,
  };
}
