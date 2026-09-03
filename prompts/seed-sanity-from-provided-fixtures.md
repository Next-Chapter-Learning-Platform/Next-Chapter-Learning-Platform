# Seed Sanity from the provided immutable fixtures

## Goal

Seed the Vertex Sanity project `yvdbypvw`, dataset `production`, using the supplied `seed.ndjson` and `videos.json` as the only content sources. Align the current schema and read layer with the fixture's canonical field names and shapes, deploy the compatible schema and Studio, import the original NDJSON with the Sanity CLI, verify exact document counts and integrity afterward, and prove both source files remain byte-for-byte unchanged.

## Skills and guidance read

- `sanity-best-practices`: established current Sanity schema, validation, deployment, GROQ, and TypeGen conventions.
- `sanity-migration`: established the required human checkpoint, deterministic IDs, reference ordering, CLI import, idempotent replacement, asset handling, and post-import validation.
- `sanity-migration/references/general.md`: established inventory, source-to-schema mapping, `sanity datasets import --replace`, asset directives, count checks, reference checks, and document validation.
- `AGENTS.md`: established the private production dataset, fixed Vertex content relationships, standalone Studio, server-only read layer, and required deploy/import/check workflow.

## Existing files and configuration inspected

- `seed.ndjson`: 141 newline-delimited Sanity documents with 141 unique deterministic IDs and no duplicate slugs.
  - 6 `category` documents
  - 5 `instructor` documents
  - 120 `lesson` documents
  - 10 `course` documents
  - 140 references, 131 unique reference targets, 0 unresolved targets
  - 135 unique `image@...` `_sanityAsset` directives
  - 135 images, all with alt text and an asset directive
  - SHA-256 before import: `5EE46E27377C8257172CD2D511FCAAF000DF039A45E4EC08C176C19E9B9FFBF2`
- `videos.json`: a JSON object keyed by the same 120 lesson slugs, not an NDJSON document stream.
  - Each entry contains `id`, `title`, `channel`, `duration`, and `query`.
  - Every seed lesson has a corresponding entry.
  - All 120 seed `videoUrl` values contain the matching video ID.
  - All 120 seed `duration` values match the manifest duration.
  - SHA-256 before import: `A5230DAF8F745CC51F6CE2A66AF585E292732CD5FF508726AB00F102E45D86E5`
- Fixture value inventory:
  - levels: `beginner`, `intermediate`, `advanced`
  - prices: numeric values from 0 through 139
  - outcome icon keys: `code`, `gauge`, `layers`, `puzzle`, `rocket`, `shield`, `sparkles`, `workflow`
  - lesson resource type: `link`
  - lesson resource object `_type`: `resource`
  - durations: 187 through 2156 seconds
  - free previews: 10 lessons
  - all lesson notes and instructor bios are Portable Text arrays
- Current Studio schema:
  - uses `course.isPopular`, structured `course.price`, image-based outcome icons, `lesson.durationSeconds`, `lesson.isFreePreview`, and object type `lessonResource`;
  - these shapes do not match the immutable fixture's `popular`, numeric `price`, string icon key, `duration`, `freePreview`, and `_type: "resource"`.
- Current web queries/data layer use the same incompatible names and price projection.
- `studio/sanity.cli.ts`: targets project `yvdbypvw`, dataset `production`, and deployed Studio app `xgx17gg4sl45r2lb1zpohxfg`.
- `studio/package.json`: provides TypeGen, Studio build/deploy, and schema-deploy scripts.
- Live pre-import count query:
  - 0 categories
  - 0 instructors
  - 0 lessons
  - 0 courses
  - 0 image assets
  - 13 Sanity system documents

## Decisions and assumptions

- Treat `seed.ndjson` as the import source of record and `videos.json` as the authoritative video metadata manifest used to validate the lesson video mapping.
- Do not create separate `video` documents from `videos.json`: it has no chapters or transcript chunks and therefore does not satisfy Vertex's fixed video-document contract.
- Do not write generated or invented content. Every imported content field and asset comes from `seed.ndjson`; every video URL/duration is cross-checked against `videos.json`.
- Do not edit, reformat, rename, replace, or append to either supplied file.
- Align schema and web projections to the fixture rather than silently importing unknown or unusable fields.
- Keep lesson duration measured in integer seconds, but use the fixture's canonical field name `duration`.
- Use the fixture's `freePreview` and `popular` field names.
- Use numeric `price`, matching the fixture and the fixed model's single price value. Formatting/currency presentation remains a frontend concern outside this task.
- Use a controlled string list for learning-outcome `icon`, containing exactly the eight fixture keys.
- Rename the embedded resource schema type to `resource` so imported resource objects are recognized by Studio.
- Remove the now-unused `coursePrice` object schema and its generated type.
- Deploy the compatible schema and Studio before importing content.
- Import directly from the original `seed.ndjson` with `--replace`. This is deterministic and rerunnable; it replaces only matching IDs and does not clear unrelated documents.
- Keep asset import strict. Do not use `--allow-failing-assets`; a failed asset should fail the import and be reported.
- Run the import from `studio/` with explicit source path, project, and dataset targeting so there is no ambiguity.
- Use the authenticated Sanity CLI; do not print, copy, or create an import token.

## Expected files to touch

- `studio/schemaTypes/documents/course.ts`
- `studio/schemaTypes/documents/lesson.ts`
- `studio/schemaTypes/objects/learningOutcome.ts`
- `studio/schemaTypes/objects/lessonResource.ts` renamed to `studio/schemaTypes/objects/resource.ts`
- `studio/schemaTypes/objects/coursePrice.ts` removed
- `studio/schemaTypes/index.ts`
- `sanity/queries/courses.ts`
- `sanity/queries/lessons.ts`
- `sanity/queries/instructors.ts`
- `sanity.types.ts` regenerated
- `studio/schema.json` regenerated
- `prompts/seed-sanity-from-provided-fixtures.md`

The following source fixtures must not change:

- `seed.ndjson`
- `videos.json`

No transformation output or duplicate content file should be committed.

## Source-to-Sanity mapping

### Category

- Import directly as `category` with `_id`, title, slug, and description.

### Instructor

- Import directly as `instructor` with `_id`, name, slug, photo asset directive/alt text, expertise, and Portable Text bio.

### Lesson

- Import directly as `lesson` with `_id`, title, slug, video URL, thumbnail asset directive/alt text, integer `duration`, `freePreview`, student count, Portable Text notes, string key points, optional pro tip, and `resource` objects.
- Validate every slug/video URL/duration against the corresponding `videos.json` entry before import.

### Course

- Import directly as `course` with `_id`, title, slug, summary, cover asset directive/alt text, instructor/category references, level, numeric price, `popular`, student count, learning outcomes with controlled icon keys, and embedded modules containing ordered lesson references.
- Preserve all fixture `_key` values and authored module/lesson order.

### Assets and references

- Let the CLI resolve the 135 image asset directives and strengthen references after all documents exist.
- Preserve all deterministic fixture `_id`, `_key`, and `_ref` values.
- Do not use failing-asset or broken-reference bypass flags.

## Implementation requirements

1. Recompute fixture SHA-256 hashes immediately before any write.
2. Update the Studio schema to accept the supplied field names and shapes without weakening unrelated validation.
3. Update web GROQ projections and lesson-context derivation to use `popular`, numeric `price`, `duration`, and `freePreview`.
4. Remove obsolete structured-price and old resource-type schema registrations.
5. Run Studio schema extraction and TypeGen; fix all generated-type compile issues.
6. Run Studio and web TypeScript checks plus root lint.
7. Build and deploy the compatible Studio/schema before import.
8. Import the unchanged file with the explicit command shape:
   - `npx sanity datasets import ../seed.ndjson --project-id yvdbypvw --dataset production --replace`
9. Do not add `--allow-failing-assets`, `--missing`, or a destructive dataset clear/delete command.
10. Run post-import aggregate counts through `sanity documents query`.
11. Verify all 141 expected content IDs exist and every type count matches the source.
12. Verify all imported course/instructor/category references resolve and all module lesson references resolve.
13. Verify image assets were created and imported image fields resolve to Sanity asset references.
14. Run Sanity document validation against the deployed schema and report any errors or warnings exactly.
15. Spot-check at least one category, instructor, lesson, and course projection.
16. Recompute both fixture hashes after all operations and compare them to the recorded pre-import hashes.

## Security and safety considerations

- Target only project `yvdbypvw`, dataset `production`.
- Use the authenticated CLI session; never display or persist credentials in commands or logs.
- Do not read or print environment-file contents.
- Do not clear, delete, or recreate the production dataset.
- Use `--replace` only for deterministic fixture IDs, making retries converge without duplicating content.
- Do not allow failed assets or unresolved references to be silently skipped.
- Do not modify the source fixtures, even to normalize field names or formatting.
- Keep the server read token untouched and server-only.

## Acceptance criteria

- `seed.ndjson` and `videos.json` have the same SHA-256 hashes before and after the operation.
- The schema, TypeGen output, and server queries use the fixture's canonical names and shapes.
- The Studio and deployed schema are updated before import.
- The Sanity CLI import completes successfully from the original `seed.ndjson`.
- Production contains exactly 6 categories, 5 instructors, 120 lessons, and 10 courses from the fixture.
- All 140 fixture reference occurrences point to existing imported targets.
- All module lesson ordering and `_key` values are preserved.
- All 135 image fields resolve through imported Sanity image assets and retain alt text.
- All 120 lesson video URLs and durations remain consistent with `videos.json`.
- Sanity document validation has no schema errors for the imported content.
- Web and Studio TypeScript checks pass, root lint passes, and Studio build/deploy succeeds.
- No generated replacement seed content is created or imported.

## Automated checks

Run from the appropriate workspace and report the real output:

1. Fixture hashes before import.
2. Fixture inventory and reference/video-manifest comparison.
3. From `studio/`: `npm run typegen`.
4. From `studio/`: `npx tsc --noEmit`.
5. From the root: `npx tsc --noEmit`.
6. From the root: `npm run lint`.
7. From `studio/`: `npm run build`.
8. From `studio/`: `npm run deploy`.
9. From `studio/`: `npm run deploy-schema`.
10. From `studio/`: CLI import with explicit project, dataset, and `--replace`.
11. Post-import GROQ counts by type and asset type.
12. Post-import broken-reference and representative-document queries.
13. From `studio/`: `npx sanity documents validate` using the deployed schema.
14. Fixture hashes after import.
15. `git diff --check` and `git status --short` to confirm fixture immutability.

## Exact manual test steps

1. Open [Vertex Content Studio](https://vertex-next-chapter.sanity.studio/).
2. Confirm the Studio lists 10 courses, 120 lessons, 5 instructors, and 6 categories.
3. Open a course and confirm its price, popular flag, learning-outcome icon keys, and ordered modules are editable without unknown-field warnings.
4. Open a module and confirm its lesson references appear in the same order as the fixture.
5. Open a lesson and confirm its duration, free-preview flag, thumbnail, notes, key points, pro tip, and resource render in their schema fields.
6. Open an instructor and category and confirm their referenced courses resolve.
7. Open several images and confirm the uploaded Sanity asset and alt text are present.
8. Compare a lesson's YouTube ID and duration against its entry in `videos.json`.
9. Run the web app and confirm the server-side catalog/course/lesson/instructor reads return the seeded values with no missing renamed fields.
