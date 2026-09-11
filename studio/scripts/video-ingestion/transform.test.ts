import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTranscriptChunks,
  buildVideoDocument,
  parseDescriptionChapters,
  parseTimestamp,
  sanityVideoDocumentId,
} from "./transform";
import type { RawVideoExtraction, TranscriptCue } from "./types";

test("parses minute and hour timestamps and rejects invalid values", () => {
  assert.equal(parseTimestamp("03:12"), 192);
  assert.equal(parseTimestamp("90:00"), 5400);
  assert.equal(parseTimestamp("1:02:03"), 3723);
  assert.equal(parseTimestamp("1:90"), null);
  assert.equal(parseTimestamp("1:90:00"), null);
  assert.equal(parseTimestamp("hello"), null);
});

test("keeps authored description chapters and ignores a lone timestamp", () => {
  assert.deepEqual(
    parseDescriptionChapters(
      "Chapters\n00:00 Intro\n02:15 - Routing\n05:10 | Summary",
      400,
    ),
    [
      { startSeconds: 0, label: "Intro" },
      { startSeconds: 135, label: "Routing" },
      { startSeconds: 310, label: "Summary" },
    ],
  );
  assert.deepEqual(
    parseDescriptionChapters("See the example at 03:12 for details.", 400),
    [],
  );
  assert.deepEqual(parseDescriptionChapters("03:12 Relevant section", 400), []);
});

test("builds short timestamped chunks deterministically", () => {
  const cues: TranscriptCue[] = Array.from({ length: 18 }, (_, index) => ({
    startSeconds: index * 5,
    durationSeconds: 5,
    text: `Caption segment ${index}${index % 5 === 4 ? "." : ""}`,
  }));
  const first = buildTranscriptChunks(cues);
  const second = buildTranscriptChunks(cues);

  assert.deepEqual(first, second);
  assert.ok(first.length >= 2);
  assert.equal(first[0].startSeconds, 0);
  assert.ok(first.every((chunk) => chunk.text.length <= 1200));
  assert.ok(
    first.every(
      (chunk, index) =>
        index === 0 || chunk.startSeconds > first[index - 1].startSeconds,
    ),
  );
});

test("builds a stable Sanity video document with stable array keys", () => {
  const extraction: RawVideoExtraction = {
    version: 1,
    provider: "youtube",
    videoId: "9602Yzvd7ik",
    url: "https://youtu.be/9602Yzvd7ik",
    title: "Routing",
    description: "",
    expectedDurationSeconds: 60,
    transcript: [
      {
        startSeconds: 0,
        durationSeconds: 12,
        text: "Start with the file system.",
      },
      { startSeconds: 12, durationSeconds: 12, text: "Create a route folder." },
      {
        startSeconds: 24,
        durationSeconds: 12,
        text: "Then add a page component.",
      },
    ],
    chapters: [
      { startSeconds: 0, label: "Introduction" },
      { startSeconds: 24, label: "Creating a route" },
    ],
    fetchedAt: "2026-09-11T00:00:00.000Z",
  };

  const first = buildVideoDocument(extraction);
  const second = buildVideoDocument(extraction);

  assert.deepEqual(first, second);
  assert.equal(first._id, "video.youtube.9602Yzvd7ik");
  assert.equal(first.url, "https://www.youtube.com/watch?v=9602Yzvd7ik");
  assert.ok(
    first.chapters.every((chapter) => chapter._key.startsWith("chapter-")),
  );
  assert.ok(first.chunks.every((chunk) => chunk._key.startsWith("chunk-")));
  assert.equal(sanityVideoDocumentId("unsafe.id"), "video.youtube.unsafe-id");
  assert.equal(
    sanityVideoDocumentId("-BBulGM6xF0"),
    "video.youtube.id_-BBulGM6xF0",
  );
  assert.equal(
    sanityVideoDocumentId("-QVoIxEpFkM"),
    "video.youtube.id_-QVoIxEpFkM",
  );
});

test("rejects an extraction without usable transcript content", () => {
  assert.throws(
    () =>
      buildVideoDocument({
        version: 1,
        provider: "youtube",
        videoId: "9602Yzvd7ik",
        url: "https://www.youtube.com/watch?v=9602Yzvd7ik",
        title: "Routing",
        description: "",
        expectedDurationSeconds: 60,
        transcript: [],
        chapters: [],
        fetchedAt: "2026-09-11T00:00:00.000Z",
      }),
    /No usable transcript chunks/,
  );
});
