# Offline video ingestion

The ingestion tooling reads the existing `videos.json` catalog, extracts public YouTube captions and authored description chapters, and builds Sanity `video` documents. It is an offline Studio task and never runs from a Next.js request.

## Safety model

- Dry-run is the default and performs no Sanity writes.
- Raw extraction responses are cached in `studio/.video-ingestion/cache/`.
- Generated NDJSON and the machine-readable report stay under `studio/.video-ingestion/` and are ignored by Git.
- Documents use deterministic IDs such as `video.youtube.9602Yzvd7ik`; rerunning commit mode uses `createOrReplace`.
- Provider IDs whose first character is not valid at the start of a Sanity ID element receive an `id_` prefix, for example `video.youtube.id_-BBulGM6xF0`.
- Missing captions are failures. The pipeline does not create empty transcript documents.
- Commit mode writes nothing when any selected video fails extraction.
- Chapters come only from timestamped markers authored in the source description. The pipeline does not invent chapter labels.
- `videos.json` and `seed.ndjson` are read-only inputs.

## Commands

Run these from `studio/`.

```powershell
# Pure transform tests; no network or Sanity writes
npm run videos:test

# Extract one catalog entry and generate local artifacts
npm run videos:dry-run -- --limit 1

# Select one entry by lesson slug or YouTube video ID
npm run videos:dry-run -- --video 9602Yzvd7ik

# Use the equals form when a provider ID begins with a hyphen
npm run videos:dry-run -- --video=-BBulGM6xF0

# Ignore a cached extraction and fetch it again
npm run videos:dry-run -- --video 9602Yzvd7ik --refresh
```

Review these generated files before committing:

- `studio/.video-ingestion/video-import.ndjson`
- `studio/.video-ingestion/report.json`

After the dry run is clean and the Sanity CLI is authenticated with write access, commit the selected documents:

```powershell
# One video first
npm run videos:ingest -- --video 9602Yzvd7ik

# Full catalog only after reviewing the dry-run report
npm run videos:ingest
```

Commit mode prints and records verification counts for all `video` documents and for the selected IDs. A failed extraction is reported and makes the process exit non-zero while preserving successful dry-run artifacts for inspection.

## Supported providers

YouTube is supported because both its offline caption ingestion and its in-site playback path exist. Vimeo and Bunny remain intentionally unsupported until provider-specific caption, chapter, and playback/seek handling are implemented together.
