# Fix Sanity video document ID segments

## Goal

Fix the offline video ingestion pipeline so every generated Sanity document ID follows Sanity's document ID element rules, including YouTube IDs that begin with `-`.

## Guidance read

- `AGENTS.md`
- `.agents/skills/sanity-best-practices/SKILL.md`
- `.agents/skills/sanity-best-practices/references/schema.md`

The project requirement for deterministic, idempotent video ingestion IDs takes precedence over the skill's general preference for generated IDs. The external YouTube ID remains stored in the explicit `videoId` field.

## Existing code inspected

- `studio/scripts/video-ingestion/transform.ts`
- `studio/scripts/video-ingestion/transform.test.ts`
- `studio/scripts/video-ingestion/ingest.ts`
- `studio/scripts/video-ingestion/types.ts`
- `videos.json`

The current transform produces `video.youtube.<sanitized-video-id>`. Sanity treats dot-separated portions as ID elements, and an element cannot begin with `-`. Two of the 120 seeded IDs are affected: `-QVoIxEpFkM` and `-BBulGM6xF0`.

## Decisions and assumptions

- Preserve the existing ID output for every already-valid YouTube ID to avoid creating duplicates on rerun.
- When the sanitized provider ID does not begin with an ASCII letter, digit, or underscore, prefix only that final element with `id_`.
- Keep the original YouTube ID unchanged in the document's `videoId` field and canonical URL.
- Continue replacing unsupported characters with `-`.
- Do not modify `videos.json`, `seed.ndjson`, schema files, or existing Sanity documents directly.
- Do not run the full live ingestion commit as part of this fix.

## Files expected to change

- `studio/scripts/video-ingestion/transform.ts`
- `studio/scripts/video-ingestion/transform.test.ts`
- `docs/video-ingestion.md`

## Requirements

- `9602Yzvd7ik` must remain `video.youtube.9602Yzvd7ik`.
- `-BBulGM6xF0` must become `video.youtube.id_-BBulGM6xF0`.
- `-QVoIxEpFkM` must become `video.youtube.id_-QVoIxEpFkM`.
- The transform must reject an input that cannot produce a non-empty safe element.
- The fix must remain deterministic and idempotent.
- Add a regression test covering both affected seeded IDs and preservation of valid IDs.

## Security considerations

- Keep ingestion offline and server-side.
- Do not expose or print Sanity tokens or environment file contents.
- Do not introduce new client-side code or runtime request-path work.
- Keep commit mode explicit and authenticated through the existing Sanity CLI flow.

## Acceptance criteria

- Every ID generated from all 120 `videos.json` records has valid dot-separated elements.
- The two leading-hyphen video IDs no longer trigger a Sanity mutation validation error.
- Existing valid document IDs are unchanged.
- Unit tests, Studio TypeScript, root lint, formatting, and a targeted live dry run pass.
- `videos.json` and `seed.ndjson` remain unchanged.

## Checks to run

From `studio/`:

```powershell
npm run videos:test
npx tsc --noEmit
npm run videos:dry-run -- --video=-BBulGM6xF0
```

From the repository root:

```powershell
npm run lint
git diff --check
git diff --exit-code -- seed.ndjson videos.json
```

Also run an in-memory validation over all 120 source IDs and confirm that every generated dot-separated ID element begins with a letter, digit, or underscore.

## Manual test

After reviewing the targeted dry-run artifact, retry one affected live document from `studio/`:

```powershell
npm run videos:ingest -- --video=-BBulGM6xF0
```

Confirm the report contains `selectedVideoDocuments: 1`, then rerun the intended catalog ingestion command.
