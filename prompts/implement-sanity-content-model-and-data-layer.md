# Implement the Vertex Sanity content model, standalone Studio, and server data layer

## Goal

Implement the first production-style Sanity slice for Vertex: a separately deployable Sanity Studio, the authoring model for courses, embedded modules, lessons, instructors, and categories, and a type-safe server-only read layer for the existing Next.js application. Keep the private dataset token on the server, derive course/module context for lessons through reverse references, and do not add catalog pages, search, video ingestion, progress, or other later features in this task.

## Skills and guidance read

- `sanity-best-practices`: established current schema APIs, validation, GROQ projection, TypeGen, Studio structure, project layout, and Next.js integration rules.
- `sanity-best-practices/references/schema.md`: established `defineType`, `defineField`, and `defineArrayMember`, validation patterns, previews, object reuse, image metadata, and subpath icon imports.
- `sanity-best-practices/references/nextjs.md`: established the official `next-sanity` client boundary, server-side fetching, current API-version rules, and image integration.
- `sanity-best-practices/references/groq.md`: established `defineQuery`, parameterized queries, minimal projections, query performance rules, and Portable Text handling.
- `sanity-best-practices/references/typegen.md`: established schema extraction, query discovery, generated types, and the Studio-to-web TypeGen workflow.
- `sanity-best-practices/references/project-structure.md`: established a standalone `studio/` package and a separate frontend integration.
- `content-modeling-best-practices`: established structured, reusable, presentation-independent content modeling.
- `content-modeling-best-practices/references/reference-vs-embedding.md`: confirmed modules should be embedded in courses while lessons, instructors, and categories should be referenced documents.
- `content-modeling-best-practices/references/taxonomy-classification.md`: established a reusable category document as the initial flat taxonomy.
- `content-modeling-best-practices/references/separation-of-concerns.md`: established separation of content fields from page layout and presentation choices.
- Installed Next.js 16.3.3 docs:
  - `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`
  - `node_modules/next/dist/docs/01-app/02-guides/data-security.md`
- Installed `next-sanity` and Sanity client package docs/types for server tokens, `client.fetch` cache options, and current package behavior.

## Existing code and configuration inspected

- `AGENTS.md`: requires two independently deployable workspaces, a private dataset, a server-only read client, minimal DTOs, fixed course/module/lesson relationships, TypeGen, and real checks.
- `package.json` and `package-lock.json`: the repository root is the existing Next.js 16.3.3/npm web workspace. A recent Sanity scaffold added `next-sanity`, `@sanity/image-url`, and Studio-only packages to this root.
- `sanity.config.ts`, `sanity.cli.ts`, `sanity/env.ts`, `sanity/structure.ts`, and `sanity/schemaTypes/index.ts`: a new but empty embedded-Studio scaffold currently lives in the web workspace.
- `app/studio/[[...tool]]/page.tsx`: the scaffold mounts Studio inside Next.js, which conflicts with the required independent Studio deployment boundary.
- `sanity/lib/client.ts`: the current client is not marked server-only, has no private read token, and uses the CDN.
- `sanity/lib/live.ts`: the generated live helper has no private dataset token and would encourage a browser/live integration that is outside this read-layer task.
- `sanity/lib/image.ts`: existing web-side Sanity image URL helper can be preserved and adapted to the new environment module.
- `.env.example`: currently documents Clerk variables only; Sanity variable names are missing.
- `.gitignore`: local environment files are already ignored.
- `tsconfig.json`: strict TypeScript includes the repository TypeScript sources and excludes dependencies.
- `next.config.ts`: no Sanity image-host or other integration configuration exists yet.
- Repository state: branch `sanity-studio-content-model` contains uncommitted Sanity scaffold changes. Treat them as user-owned work, migrate their useful intent, and avoid disturbing unrelated changes.

## Decisions and assumptions

- Keep the existing Next.js app at the repository root as the web workspace. Create `studio/` as the second npm package; moving the whole web app into a new folder would be unrelated and unnecessarily risky.
- Replace the embedded Studio scaffold with a standalone Studio. Remove the Next.js `/studio` route and root Studio configuration only after their schema/config intent has been migrated.
- Keep web-side Sanity integration under root `sanity/`; keep all authoring schema and Studio configuration under `studio/`.
- Use the current installed Sanity 5 and `next-sanity` 13 package APIs and npm in both workspaces.
- Use environment-driven project and dataset configuration. Do not read or print `.env.local` or any other existing environment file. Add safe examples only.
- Use API version `2026-08-31`, pinned as a literal rather than generated dynamically.
- Model `course`, `lesson`, `instructor`, and `category` as documents. Model `module` as an object embedded in the ordered `course.modules` array.
- Store lesson duration as nonnegative integer seconds so later video playback, labels, and timestamp features share one unambiguous unit.
- Store course price as a structured object with a nonnegative amount and ISO-style currency code, defaulting to `USD`; this avoids baking formatting into content while preserving the required `price` field.
- Model course level as a controlled string list: beginner, intermediate, and advanced.
- Model lesson notes and instructor bio as Portable Text. Keep summaries, descriptions, pro tips, outcomes, and key points as purpose-specific structured fields rather than Markdown.
- Use image objects with hotspot support and required author-facing alternative text where an image is required. Learning-outcome icons use image assets because the repository has no established icon-key system.
- Keep category taxonomy flat for this scope. Do not add parent category relationships without a product requirement.
- Store lesson resources as embedded objects with a controlled type, title, description, and validated HTTP(S) URL.
- A lesson must not store a course or module reference. Course/module/lesson numbering is derived from array order in the data layer.
- Use a custom Studio structure that exposes Courses, Lessons, Instructors, and Categories as top-level authoring lists. Modules remain editable only within a course.
- Define all GROQ queries with `defineQuery`, parameterize slugs/IDs, project only fields needed by consumers, include `_key` for projected array objects, and dereference only intentional relationships.
- Build one server-only client using the read token, `perspective: 'published'`, and `useCdn: false`. Add a typed fetch wrapper supporting Next.js cache tags and revalidation without exposing the client to browser modules.
- Do not add `SanityLive` or a browser token in this task. Freshness will use explicit Next.js caching controls; Visual Editing can be added later as its own scoped feature.
- Generate `sanity.types.ts` from the standalone Studio schema and the web workspace's `defineQuery` declarations. Commit the generated file so web checks do not depend on generating types at runtime.
- Keep the data layer small: catalog courses/categories, course detail by slug, lesson detail by slug with reverse-derived course/module context, and instructor detail by slug with authored courses. Add slug-list helpers only where they support future static route generation cleanly.
- Do not create sample production content automatically. Manual verification will author a minimal linked record set in Studio.

## Expected files to touch

### Root web workspace

- `package.json`
- `package-lock.json`
- `.env.example`
- `.gitignore` only if standalone Studio build output is not already covered
- `sanity/lib/env.ts`
- `sanity/lib/client.ts`
- `sanity/lib/fetch.ts`
- `sanity/lib/image.ts`
- `sanity/lib/cache-tags.ts`
- `sanity/queries/categories.ts`
- `sanity/queries/courses.ts`
- `sanity/queries/lessons.ts`
- `sanity/queries/instructors.ts`
- `sanity/data/categories.ts`
- `sanity/data/courses.ts`
- `sanity/data/lessons.ts`
- `sanity/data/instructors.ts`
- `sanity.types.ts` generated by Sanity TypeGen

### Standalone Studio workspace

- `studio/package.json`
- `studio/package-lock.json`
- `studio/.env.example`
- `studio/sanity.config.ts`
- `studio/sanity.cli.ts`
- `studio/tsconfig.json`
- `studio/structure.ts`
- `studio/schemaTypes/index.ts`
- `studio/schemaTypes/documents/course.ts`
- `studio/schemaTypes/documents/lesson.ts`
- `studio/schemaTypes/documents/instructor.ts`
- `studio/schemaTypes/documents/category.ts`
- `studio/schemaTypes/objects/module.ts`
- `studio/schemaTypes/objects/coursePrice.ts`
- `studio/schemaTypes/objects/learningOutcome.ts`
- `studio/schemaTypes/objects/lessonResource.ts`
- `studio/schemaTypes/blocks/portableText.ts`
- `studio/schema.json` generated by schema extraction

### Embedded scaffold to remove after migration

- `app/studio/[[...tool]]/page.tsx`
- root `sanity.config.ts`
- root `sanity.cli.ts`
- `sanity/env.ts`
- `sanity/structure.ts`
- `sanity/schemaTypes/`
- `sanity/lib/live.ts`

The exact grouping may be tightened during implementation if fewer files remain clearer, but the workspace and security boundaries must not change.

## Content model requirements

### Course document

- Required title and slug.
- Required marketing summary and cover image with alt text.
- Required controlled level and structured price.
- Optional popular flag and nonnegative integer student count for display.
- Short ordered learning-outcomes array; every item has an icon image with alt text, title, and description.
- Required single references to an instructor and category.
- Required ordered modules array with at least one module.
- Useful document preview using title, level/category context, and cover image when possible.

### Module object

- Required title and summary.
- Required ordered unique array of lesson references with at least one lesson.
- No stored module number, lesson number, slug, or standalone document ID.
- Preview should communicate title and lesson count.

### Lesson document

- Required title and slug.
- Required validated HTTP(S) video URL.
- Required poster/thumbnail image with alt text.
- Required nonnegative integer duration seconds.
- Free-preview boolean defaulting to false and nonnegative integer student count.
- Required notes using the shared Portable Text type.
- Short ordered key-points array of strings.
- Optional concise pro tip.
- Ordered resource objects with controlled type, title, description, and validated HTTP(S) URL.
- No parent course or module field.
- Useful document preview with title, duration, and thumbnail.

### Instructor document

- Required name and slug.
- Required photo with alt text.
- Required nonempty expertise list.
- Required bio using the shared Portable Text type.
- Useful preview with name, expertise, and photo.

### Category document

- Required title, slug, and description.
- No presentation layout or parent category fields in this scope.
- Useful preview with title and description.

### Shared authoring quality

- Use `defineType`, `defineField`, and `defineArrayMember` consistently.
- Use current Sanity icon subpath imports only.
- Apply required, length, uniqueness, numeric, and URL validation where it protects content quality.
- Provide concise field descriptions where units or relationships could confuse authors.
- Use `options.hotspot: true` on editorial images.
- Keep schema names stable, descriptive, and TypeGen-friendly.

## Server read client and data-layer requirements

1. Add an environment module that validates project ID, dataset, API version, and server-only read token with clear variable-name errors but never includes secret values in messages.
2. Add `import 'server-only'` at the server boundary and ensure every exported data accessor is reachable only through server modules.
3. Configure the client for the private dataset using the Viewer/read token, published perspective, pinned API version, and no browser export.
4. Add a typed `sanityFetch` wrapper around `client.fetch` with parameter support, deterministic cache behavior, optional revalidation, and cache tags.
5. Keep GROQ query declarations separate from data access functions and wrap each query in `defineQuery` for TypeGen.
6. Implement compact catalog projections for courses and categories.
7. Implement course detail by slug with category, instructor, outcomes, modules, and ordered lesson summaries. Preserve array `_key` values.
8. Implement lesson detail by slug plus a reverse course lookup using `references($lessonId)`. Derive course, module, module number, and lesson number from the returned array order in TypeScript rather than storing them in Sanity.
9. Implement instructor detail by slug with the courses that reference that instructor.
10. Return minimal data-transfer shapes; do not return full documents, system metadata, unused Portable Text, or any later transcript/chunk data.
11. Return `null` for a missing single record and empty arrays for missing collections. Do not silently invent placeholder content.
12. Keep image URL building server-compatible and based on the configured client/project.
13. Configure TypeGen in `studio/sanity.cli.ts` to extract `studio/schema.json`, scan web query files, and generate the root `sanity.types.ts`.

## Package and workspace requirements

1. Move Studio-only dependencies (`sanity`, `@sanity/vision`, and `styled-components`) from the root web package into `studio/package.json`.
2. Keep `next-sanity` and `@sanity/image-url` in the root web package.
3. Add only direct dependencies actually imported by the web data layer; do not add Portable Text rendering packages until a page renders notes.
4. Add Studio scripts for development, build, schema extraction/type generation, Studio deployment, and schema deployment.
5. Keep root web scripts working independently from Studio scripts.
6. Do not embed or proxy Studio through the Next.js app.
7. Do not install `@sanity/context`; search configuration is outside this request and current compatibility may lag Sanity 5.

## Environment configuration

Document safe placeholders only:

- Web:
  - `NEXT_PUBLIC_SANITY_PROJECT_ID`
  - `NEXT_PUBLIC_SANITY_DATASET`
  - `NEXT_PUBLIC_SANITY_API_VERSION=2026-08-31`
  - `SANITY_API_READ_TOKEN`
- Studio:
  - `SANITY_STUDIO_PROJECT_ID`
  - `SANITY_STUDIO_DATASET`

The project ID and dataset name are not secrets, but the read token is. Never read, print, copy into source, expose through a `NEXT_PUBLIC_` name, or include its value in errors. The user must configure local/deployment environment values if they are not already available.

## Security considerations

- Treat the Sanity dataset as private at all times.
- Keep `SANITY_API_READ_TOKEN` in server-only code and deployment environment configuration.
- Never create a browser client containing the token and never add a browser token to `defineLive`.
- Do not expose the raw Sanity client through a client-component import path.
- Do not query or return more fields than each server consumer needs.
- Parameterize all slug and document-ID inputs in GROQ; do not concatenate user input into query strings.
- Use a read-only Viewer token for this layer. Do not use a write/editor token.
- Keep local `.env*` files ignored and commit only example variable names.
- Do not add content mutations, progress writes, search/MCP calls, or client-side dataset access.

## Acceptance criteria

- The repository has two independently runnable npm workspaces: the root Next.js web app and `studio/` Sanity Studio.
- No embedded `/studio` Next.js route or root Studio config remains.
- Studio exposes Course, Lesson, Instructor, and Category document lists; modules are embedded only in courses.
- All fixed Vertex fields and relationships are represented with appropriate validations and previews.
- Courses preserve module order and modules preserve referenced lesson order.
- Lessons do not store a parent course/module reference.
- Studio authors use Portable Text rather than Markdown for lesson notes and instructor bios.
- The web app has a private, server-only Sanity read client and reusable fetch helper.
- The data layer can list catalog data and read course, lesson, and instructor details without returning raw documents.
- Lesson results include reverse-derived course/module context and derived ordinal positions.
- Queries use `defineQuery`, parameters, compact projections, and `_key` for array objects.
- TypeGen successfully extracts the schema and generates root web types.
- `.env.example` files document all required variable names without real secrets.
- Root and Studio dependencies are separated correctly.
- Web type check, lint, production build, and startup checks complete successfully when required environment variables are configured.
- Studio TypeGen/build checks complete successfully, and the Studio application and schema are deployed when Sanity authentication/project configuration are available.

## Automated checks

Run and report exact results; do not claim success for a command that was not run.

### Root web workspace

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. Start `npm run dev` and confirm Next.js reaches ready state without Sanity integration errors.

### Standalone Studio workspace

1. `npm install`
2. `npm run typegen`
3. `npm run build`
4. Start `npm run dev` and confirm Studio reaches ready state.
5. `npm run deploy`
6. `npm run deploy-schema`

If authentication, project values, or network approval blocks a deploy, capture the exact failure and report it under `Needs your attention`; do not substitute a schema-only deploy for the required Studio application deployment.

## Exact manual test steps

1. Copy safe Sanity variable names from the example files into the appropriate ignored local environment files and provide a Sanity Viewer token to the web workspace.
2. From `studio/`, run `npm run dev` and open the local Studio URL.
3. Confirm the desk shows Courses, Lessons, Instructors, and Categories, with no standalone Module document list.
4. Create and publish one category with title, slug, and description.
5. Create and publish one instructor with name, slug, photo, expertise, and Portable Text bio.
6. Create and publish two lessons with unique slugs, valid video URLs, poster images, duration seconds, notes, key points, and at least one resource.
7. Create and publish one course referencing the category and instructor. Add one embedded module and reference the two lessons in a deliberate order.
8. Reorder the lesson references inside the module and confirm the course retains the new order without editing either lesson.
9. In Studio Vision, confirm a query for the course can dereference its category, instructor, and module lessons.
10. Run the web workspace data access checks from a server context and confirm the course detail returns the module lessons in authored order.
11. Confirm lesson detail resolves the parent course through a reverse reference and derives Module 1 / Lesson 1.1 or Lesson 1.2 from array position.
12. Change a lesson's module position, publish the course, rerun the read, and confirm the derived lesson number changes without any lesson document field changing.
13. Request a nonexistent course, lesson, and instructor slug and confirm each single-record accessor returns `null`.
14. Inspect browser-delivered source/network payloads and confirm no `SANITY_API_READ_TOKEN` value or browser Sanity query credential is present.
15. Deploy the Studio application, open its hosted URL, and confirm the same authoring structure and schema are available there.
