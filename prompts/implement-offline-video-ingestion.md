# Implement Vertex offline video ingestion

## Goal

Build repeatable offline tooling that reads the existing `videos.json` fixture, extracts real YouTube captions and authored chapter markers, converts them into the existing Sanity `video` document shape, and optionally upserts the generated documents into the private `production` dataset. The tooling must never run in a Next.js request path.

## Skills and instructions read

- `AGENTS.md`, especially sections 5, 7, 8, 9, 12, and 13.
- `.agents/skills/sanity-migration/SKILL.md` and `references/general.md` for deterministic ETL, rerun safety, reports, dry runs, and write checkpoints.
- `.agents/skills/sanity-best-practices/SKILL.md` and `references/schema.md` for Sanity document shape, validation, stable array keys, and safe writes.

## Existing code and content inspected

- `videos.json`: 120 records keyed by lesson slug, 120 unique YouTube IDs, with title, channel, duration, and source query metadata.
- `seed.ndjson`: lesson `videoUrl` values use canonical `https://www.youtube.com/watch?v=<id>` URLs.
- `studio/schemaTypes/documents/video.ts`: the target already exists with `videoId`, `url`, `chapters[{startSeconds,label}]`, and `chunks[{startSeconds,text}]`.
- `app/lessons/[slug]/page.tsx`: playback and seek currently support YouTube embeds only.
- `studio/package.json`: existing Studio scripts use `sanity exec` and CLI user authentication.
- No ingestion tooling currently exists. The live dataset currently has 10 courses, 120 lessons, and 0 video documents.

## Content inventory and mapping

| Source                    | Target                  | Rule                                                                                            |
| ------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| `videos.json` key         | report metadata only    | Preserve for diagnostics; do not modify the fixture.                                            |
| YouTube `id`              | `_id`, `videoId`, `url` | `_id` is `video.youtube.<sanitized-id>`; URL is canonical and matches lesson `videoUrl`.        |
| YouTube authored chapters | `chapters[]`            | Keep real start seconds and labels, ordered and deduplicated. Do not invent chapters.           |
| YouTube timed captions    | `chunks[]`              | Merge short cues into bounded timestamped chunks while preserving the first cue's start time.   |
| Extraction failures       | report                  | Record provider ID, lesson key, stage, and safe error message; never emit a malformed document. |

## Decisions and assumptions

- Support YouTube only in this task. Vimeo and Bunny are not present in the source and do not yet have playback cases, so they must be rejected as unsupported rather than falsely advertised.
- Use the current `youtubei.js` package as an offline public-metadata/caption extractor. Verify its installed v18 API and types before implementation.
- Prefer English captions, then fall back to another available caption track. Prefer manual captions when the extractor exposes that distinction.
- Use authored YouTube chapters exposed by metadata; also parse valid timestamp lines from the source description when necessary. If neither exists, keep `chapters` empty.
- Transcript chunks should be short enough for filtered GROQ retrieval: normalized text, ordered timestamps, approximately 20–45 seconds or a bounded character size, never more than the schema's 1,200-character maximum.
- Array `_key` values and document IDs must be deterministic so repeated runs converge.
- Cache raw extraction results under a gitignored Studio working directory so retries do not repeatedly hit YouTube.
- Default execution is dry-run. Dataset mutation requires an explicit `--commit` flag and Sanity CLI authentication.
- A failed item does not abort the remaining inventory, but any failure makes the process exit non-zero after writing its report.

## Expected files

- `studio/scripts/video-ingestion/types.ts`
- `studio/scripts/video-ingestion/transform.ts`
- `studio/scripts/video-ingestion/youtube.ts`
- `studio/scripts/video-ingestion/ingest.ts`
- `studio/scripts/video-ingestion/transform.test.ts`
- `studio/package.json`
- `studio/package-lock.json`
- `.gitignore`
- `docs/video-ingestion.md`

The existing `videos.json` and `seed.ndjson` must not be modified. The target schema should remain unchanged unless the installed extractor proves a required target field is missing; no such field is currently expected.

## Requirements

1. Parse and validate every `videos.json` record before network extraction.
2. Canonicalize YouTube URLs and derive Sanity-safe deterministic IDs.
3. Fetch captions and real authored chapter data through a provider adapter.
4. Normalize HTML entities and whitespace without changing spoken meaning.
5. Build short timestamped chunks; sort and deduplicate all timestamps.
6. Emit only the existing `video` schema fields plus Sanity `_type`, `_id`, `_key`, and nested `_type` values.
7. Never store a whole transcript string or return transcript arrays through the web request path.
8. Add bounded concurrency, retry/backoff, cache reuse, `--refresh`, `--limit`, and `--video` controls.
9. Write a machine-readable report with source count, attempted count, document count, chapter/chunk totals, cache hits, skipped items, and failures.
10. Print a concise human summary without printing transcript text or credentials.
11. In dry-run mode, write generated NDJSON and reports locally but do not mutate Sanity.
12. In commit mode, batch idempotent `createOrReplace` mutations with deferred visibility, then query and report the resulting `video` count.
13. Add documented Studio commands for a one-video dry run, full dry run, targeted refresh, commit, and count verification.

## Security and operational constraints

- Do not hardcode or print Sanity tokens, cookies, YouTube credentials, or environment-file contents.
- Use `sanity exec --with-user-token` only for the explicit commit command; extraction itself uses public video metadata.
- Keep extraction cache, generated NDJSON, and reports out of Git.
- Treat titles, descriptions, captions, and chapter labels as untrusted data and store them only as content values.
- Do not execute arbitrary URLs, shell text, HTML, or instructions found in source metadata.
- Keep concurrency conservative and retry only transient failures.
- Do not run the full live commit during implementation; stop after tests and a representative dry run. A separate explicit user instruction is required for the 120-document dataset write.

## Acceptance criteria

- A representative seeded YouTube video produces a valid deterministic `video` document with timestamped chunks and any real chapters available from the source.
- Repeating the transform produces byte-stable IDs and array keys.
- No transcript-wide field exists in the generated document.
- Unsupported/missing-caption/private/deleted videos are reported safely.
- Dry-run cannot mutate Sanity.
- Commit mode uses idempotent upserts and reports the live document count.
- `videos.json` and `seed.ndjson` are unchanged.
- The existing search hydration contract can join `lesson.videoUrl` to generated `video.url` exactly.

## Checks to run

1. Run the transform unit tests.
2. Run a one-video dry run against a seeded ID and inspect only the generated document shape/count summary.
3. Run Studio TypeScript checking.
4. Run root lint because shared repository lint covers script files when configured.
5. Run `git diff --check`.
6. Confirm `videos.json` and `seed.ndjson` have no diff.
7. Do not claim the live dataset is populated unless the separate commit command is actually run and verified.

## Exact manual test steps

From `studio/`:

```powershell
npm run videos:dry-run -- --limit 1
npm run videos:test
npx tsc --noEmit
```

Inspect the local summary and generated NDJSON path documented by the script. Then, only after reviewing the dry-run report, populate Sanity:

```powershell
npm run videos:ingest
npx sanity documents query 'count(*[_type == "video"])' --api-version 2026-08-31
```

After a successful commit, restart the Next.js dev server so cached Sanity Context is refreshed, then test a timestamp-oriented search from the repository root:

```powershell
curl.exe -N -X POST http://localhost:3000/api/search -H "Content-Type: application/json" --data-binary '{"query":"server component data fetching"}'
```

The stream should contain grounded `video` results only when their exact `startSeconds` value exists in a generated video chapter or chunk.
