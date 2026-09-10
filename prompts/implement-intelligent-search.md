# Implement Vertex intelligent search

## Goal

Implement rience shown in `dethe full `/search` expesign/vertex-search.png`: connect a server-only Next.js search API to the Sanity Context MCP, let an OpenAI model use the MCP to search the private Vertex dataset, validate and hydrate the grounded results, and render ranked video-moment and lesson cards over the existing seeded courses and lessons.

## Skills and guidance read

- Repository `AGENTS.md` for the fixed search behavior, grounding rules, video timestamp strategy, server/client boundaries, private token rules, PostHog events, and required checks.
- `create-agent-with-sanity-context/SKILL.md` plus its Next.js, Studio, and system-prompt references for initial-context caching, MCP tool discovery, bearer authentication, tool-loop cleanup, and prompt separation.
- `dial-your-context/SKILL.md` for a narrow content filter and concise dataset-specific query instructions.
- `shape-your-agent/SKILL.md` for a minimal learner-facing search role, explicit grounding boundary, and honest empty-result behavior.
- `sanity-best-practices/SKILL.md` plus its GROQ and Next.js references for typed projections, server-only data access, Portable Text text projection, and bounded queries.
- Current official Sanity Context documentation dated September 2026. It supersedes the older project-scoped endpoint examples: production Context MCP endpoints are organization-scoped and require an organization API token with Context Viewer permission.
- Local Next.js 16.3.3 documentation in `node_modules/next/dist/docs/` for Route Handlers, async page search params, Server/Client Component boundaries, and dynamic request handling.
- Current Vercel AI SDK documentation for compatible `ai`, `@ai-sdk/mcp`, and OpenAI provider packages, MCP tools, multi-step tool use, and Zod-validated structured output.
- `design/vertex-search.png`, which is the desktop source of truth for the results header, query field, count/sort row, mixed result cards, and catalog fallback.

## Existing code and content inspected

- The app is Next.js 16.3.3 with the App Router, React 19, npm, Clerk, server-only Sanity helpers, and a single browser PostHog initialization.
- There is no `/search` route, `/api/search` handler, search data layer, Context MCP client, OpenAI provider, AI SDK, or Zod dependency.
- The homepage search form captures a PostHog submission event but currently submits back to the homepage instead of `/search`.
- The private Sanity client already reads published data with `SANITY_API_READ_TOKEN` and is protected by `server-only`.
- Courses embed ordered modules containing lesson references. Lessons do not store a parent course, so course/module/lesson labels must be derived through the course relationship and array order.
- `seed.ndjson` contains 10 courses and 120 lessons. Lesson notes are Portable Text; title, notes, key points, thumbnail, duration, and video URL are available for hydrated results.
- `videos.json` maps all seeded lesson slugs to real YouTube metadata, but neither fixture contains timestamped chapters or transcript chunks.
- The Studio currently has no `video` schema and the dataset currently has no `video` documents. Exact topic timestamps therefore cannot be produced from the present seed without inventing content.
- The Studio uses Sanity 5.31.2 and a custom structure. The current official Context workflow is configured in the Sanity Dashboard Context app; installing an older `@sanity/context` Studio plugin is unnecessary and risks a Sanity-major incompatibility.

## Decisions and assumptions

- Use the current organization-scoped Context MCP endpoint supplied through `SANITY_CONTEXT_MCP_URL` and authenticate it with the server-only `SANITY_ORGANIZATION_TOKEN`. Do not reuse the project dataset read token for Context.
- Use the Vercel AI SDK with `@ai-sdk/openai`, `@ai-sdk/mcp`, `ai`, and `zod`, keeping compatible package majors. Read the OpenAI model name from `OPENAI_SEARCH_MODEL` instead of tying search to a model name in client code.
- Fetch `/initial-context` once per server process, preserve endpoint query parameters, inject the response into the system prompt, and remove the redundant `initial_context` tool.
- Scope the Context endpoint to published `course`, `lesson`, and `video` documents. Context configuration remains in the Sanity Context app, and the repo will contain the exact filter and instructions as an operational reference.
- Keep the system prompt focused on behavior and output safety. Keep dataset-specific reference traversal and GROQ tactics in the Context instructions, while repeating only the critical grounding, ranking, wildcard, and video-match rules inline as required by `AGENTS.md`.
- Let the model use MCP tools to retrieve candidate lesson IDs and timestamped video matches. Then hydrate every candidate through the existing server-only Sanity client. A model-produced ID, URL, label, count, or timestamp that cannot be verified against Sanity is dropped.
- Add the fixed `video` document model now so the deployed Context schema understands video intelligence. It stores a stable provider-derived `videoId`, URL, chapter markers, and short transcript chunks. Do not import, generate, or infer chapters/transcripts in this task.
- Produce a video result only when its exact `startSeconds` exists in a real matching chapter or transcript chunk for a video document whose URL is used by the lesson. The current seed will therefore return lesson results only until the separate offline ingestion pipeline creates video documents.
- Search lesson topics through title, key points, and `pt::text(notes)`. Text search must tokenize the input, wildcard individual terms, and OR the terms; never text-match the full user phrase as one wildcard and never match Portable Text directly.
- For video moments, search chapters first. Only when no chapter matches should the agent query a small filtered transcript slice. Never retrieve or send a whole chunks array or transcript to the model.
- Rank exact title/concept matches above broad title matches, chapter matches above transcript fallbacks, and direct lesson-topic matches above noisy body matches. Return every verified relevant result, not a fixed handful.
- Implement the API as a streamed NDJSON response. It sends status, metadata, verified result records, and a terminal event so the page can show progress and render cards incrementally without becoming a chat interface.
- Keep search public. Apply strict input validation, bounded model steps, abort handling, safe MCP cleanup, sanitized errors, and no raw query logging.
- Match the supplied desktop UI closely and adapt it responsively. Use actual course and lesson images from Sanity with LQIP placeholders; never recreate the placeholder artwork from the reference.
- Capture one browser-side `search_performed` event after a completed request, with query length, result counts, result kinds, latency, and success/failure state. Do not send the raw learner query to PostHog.
- Conversation Insights, classification functions, transcript ingestion, semantic-embedding enablement, progress tracking, and new auth gates are outside this request.

## Expected files to touch

- `.env.example`
- `package.json`
- `package-lock.json`
- `app/homepage-interactions.tsx`
- `app/search/page.tsx` (new)
- `app/search/search-results.tsx` (new)
- `app/search/search-events.tsx` or equivalent client analytics helper (new only if useful)
- `app/search/page.module.css` (new)
- `app/search/loading.tsx` and `app/search/loading.module.css` (new)
- `app/api/search/route.ts` (new)
- `lib/search/context-client.ts` (new)
- `lib/search/search-agent.ts` (new)
- `lib/search/schema.ts` (new)
- `sanity/queries/search.ts` (new)
- `sanity/data/search.ts` (new)
- `sanity/lib/cache-tags.ts`
- `studio/schemaTypes/documents/video.ts` (new)
- `studio/schemaTypes/index.ts`
- `studio/structure.ts`
- `studio/schema.json` (regenerated)
- `sanity.types.ts` (regenerated)
- `docs/sanity-context-search.md` or an equivalent committed setup reference (new)

## Requirements

### Sanity Context configuration

1. Document the current Context Dashboard setup using the MCP URL format `https://api.sanity.io/v1/context/organizations/<organization-id>/mcp/<endpoint-name>`.
2. Configure or instruct the user to configure a GROQ-mode dataset source for the Vertex project and production dataset.
3. Use the least-privilege organization token with Context Viewer access; never accept a browser-provided token.
4. Use this content filter in the endpoint, adjusted only if the Dashboard automatically excludes drafts: `!(_id in path("drafts.**")) && _type in ["course", "lesson", "video"]`.
5. Store concise Context instructions for the non-obvious reverse relationship, Portable Text projection, token wildcard behavior, chapter-first video lookup, transcript fallback, and result grounding.
6. Do not install the outdated Studio Context plugin. Context endpoint management belongs in the current Sanity Dashboard workflow.
7. Require a deployed Studio application and deployed schema before declaring the MCP connection healthy.

### Video content model

1. Add a hidden/internal Studio `video` document with `videoId`, `url`, `chapters[] {startSeconds, label}`, and `chunks[] {startSeconds, text}`.
2. Validate required IDs/URLs, non-negative integer timestamps, concise chapter labels, and bounded short chunk text.
3. Keep videos internal in the Studio structure and never display standalone video documents as learner-facing results.
4. Do not mutate `seed.ndjson` or `videos.json`, and do not invent timestamp content.

### Server-only MCP and model integration

1. Put MCP URL, organization token, OpenAI key, and model configuration in server-only environment variables.
2. Validate the MCP URL as HTTPS on `api.sanity.io` before connecting.
3. Fetch and cache initial context at module scope; clear the cached promise after a failed fetch so a later request can retry.
4. Create one MCP client per search request, remove `initial_context`, and close the client in `finally`, including abort/error paths.
5. Use the OpenAI model only on the server with a bounded multi-step tool loop.
6. Validate the model’s final candidate envelope with Zod.
7. Never return tool traces, prompts, tokens, raw MCP output, full Portable Text, transcript arrays, or secrets to the browser.

### Grounded search behavior

1. Validate a trimmed query between 2 and 200 characters and reject malformed JSON or unsupported methods safely.
2. Search all relevant lessons through title, key points, and plain-text notes, following reverse course references to derive the course, module, and `Lesson X.Y` label.
3. Tokenize the learner query, escape unsafe pattern characters, wildcard terms individually, and OR them.
4. Search real video chapter labels first. Query only filtered matching chapter entries.
5. Search filtered transcript chunks only when no chapter matches, and return only a few matching chunks per video rather than whole transcripts.
6. Merge lesson and video candidates, deduplicate by lesson or lesson/start pair, and rank by verified relevance.
7. Hydrate candidates with a single bounded server-side GROQ query where practical.
8. Drop candidates whose lesson, parent course/module, video URL, or exact timestamp cannot be verified.
9. Return real result and distinct-course counts after hydration; never let the model invent counts.
10. On no match, return a successful empty result set. On MCP/model failure, return a sanitized recoverable error event and keep the catalog link visible.

### Streaming API

1. Add `POST /api/search` and return `application/x-ndjson`.
2. Stream a `status` event immediately, then a `meta` event, each verified result, and `done`.
3. Include a stable request identifier but no secrets or sensitive headers.
4. Stop work when the browser aborts, close the MCP connection, and avoid writing after the stream is cancelled.
5. Prevent route caching for query-specific model output.

### Results page

1. Add `/search?q=<query>` using the Page `searchParams` prop and a focused client component for the streaming request.
2. Reproduce the reference desktop composition: Vertex header, `SEARCH RESULTS` eyebrow, quoted query heading, result/course count, prominent query field, result total, sort control, mixed cards, and catalog fallback.
3. Use a GET search form so submitting or editing the query creates a shareable `/search?q=` URL.
4. Update the homepage form to navigate to `/search` while preserving its existing analytics.
5. Show clear idle, searching, partial-results, empty, configuration-error, and retry states.
6. Render video cards with the real lesson thumbnail, course identity, derived lesson/module labels, lesson duration, matched description, and `Watch from MM:SS` linking to `/lessons/<slug>?start=<seconds>`.
7. Render lesson cards with the real course identity, derived labels, verified key points, short description, and a direct lesson link.
8. Keep all playback on the existing Vertex lesson page; no result link may navigate to YouTube or another provider.
9. Default sorting to Most Relevant and offer deterministic client-side alternatives such as Course A–Z and Shortest First without changing the grounded result set.
10. Use `next/image`, Sanity image URLs, intrinsic dimensions, responsive `sizes`, and LQIP placeholders for smooth routed image loading.
11. Add accessible names, keyboard focus states, status announcements, semantic result lists, and touch-friendly controls.
12. On mobile, stack card media/content/actions, keep the search field and sort usable, and preserve the visual hierarchy.

### Analytics

1. Reuse the existing PostHog browser singleton and Clerk identity integration.
2. Capture `search_performed` once after the terminal API event, not during Server Component render or route prefetch.
3. Include query length, total count, distinct course count, video count, lesson count, latency, and success/error status.
4. Do not include raw query text, MCP payloads, model output, user email, or secrets.

## Security considerations

- Never read, print, or modify `.env.local`.
- Never expose `SANITY_ORGANIZATION_TOKEN`, `SANITY_API_READ_TOKEN`, `OPENAI_API_KEY`, Clerk secrets, or any private PostHog key.
- Treat model output as untrusted and hydrate/verify it against Sanity before sending it to the browser.
- Validate the configured MCP origin and disallow user-supplied endpoint URLs to prevent SSRF.
- Bound query length, model steps, tool output, transcript slices, and response sizes.
- Return only published, filter-allowed content and learner-safe fields.
- Do not log raw learner searches or third-party response bodies.
- Do not interpolate arbitrary URLs into links or images; construct internal lesson URLs and Sanity CDN image URLs from verified data.

## Acceptance criteria

- A valid query submitted from the homepage navigates to `/search?q=...`.
- The results page closely matches `design/vertex-search.png` on desktop and remains usable on mobile.
- `POST /api/search` uses the configured Sanity Context MCP and OpenAI model only on the server and streams typed NDJSON events.
- Initial Context is cached and the redundant MCP tool is removed.
- The agent searches real course/lesson content through MCP, and every returned card is revalidated against the private Sanity dataset.
- Lesson cards contain only seeded Sanity content and link to real lesson routes.
- Video cards render only for exact chapter/chunk timestamps in real `video` documents and link to the existing lesson player with `?start=`.
- With the current seed’s zero `video` documents, search succeeds with lesson results and never fabricates a timestamped video card.
- Result counts and distinct-course counts are calculated from verified hydrated results.
- Wildcard keyword fallback works when semantic search is disabled.
- Empty, loading, abort, retry, missing-configuration, MCP failure, and model failure states are safe and clear.
- No Sanity, Context, OpenAI, Clerk, or private PostHog secrets reach the client bundle, response, analytics, or logs.
- TypeGen, Studio/web type checks, lint, production build, dev runtime checks, and a live MCP tool/query check pass when the required organization endpoint/token and OpenAI key are available.

## Checks to run

From the repository root:

1. Install compatible `ai`, `@ai-sdk/mcp`, `@ai-sdk/openai`, and `zod` package majors with npm after verifying current published versions.
2. Run `npx tsc --noEmit`.
3. Run `npm run lint`.
4. Run `npm run build` because server routes, dynamic search rendering, environment handling, and Sanity queries change.
5. Run `npm run dev` and verify homepage-to-search navigation, streaming, sorting, empty/error states, and lesson links.
6. Inspect the built client chunks for server-only environment names only if necessary; never print their values.

From `studio/`:

1. Run `npm run typegen`.
2. Run `npx tsc --noEmit`.
3. Run `npm run build`.
4. Run `npm run deploy-schema` and `npm run deploy` when authenticated, because Context requires a deployed schema and Studio application.

Live integration:

1. Call the configured Context endpoint’s `tools/list` operation and confirm `initial_context`, `groq_query`, and schema-reading tools are available.
2. Fetch `/initial-context` with the organization token and confirm it includes the deployed course, lesson, and video schema.
3. Run representative searches such as `data fetching`, `server components`, `Docker caching`, and a guaranteed nonsense query.
4. Confirm semantic-search failure falls back to wildcard text matching.
5. Confirm a video result is absent when no real timestamp document exists rather than being fabricated.

## Exact manual test steps

1. In the Sanity Dashboard Context app, create or open a GROQ-mode MCP endpoint for the Vertex production dataset.
2. Apply the committed content filter and instructions, then create an organization token with Context Viewer permission.
3. Set `SANITYON_CTEXT_MCP_URL`, `SANITY_ORGANIZATION_TOKEN`, `OPENAI_API_KEY`, and `OPENAI_SEARCH_MODEL` in the local server environment without exposing them to the browser.
4. Start the Next.js app with `npm run dev`.
5. On `/`, enter `data fetching` in the hero search field and submit.
6. Confirm the browser navigates to `/search?q=data+fetching`, announces the loading state, and renders verified lesson results from the seed.
7. Confirm the heading, total result count, distinct-course count, query field, and default Most Relevant sort match the returned data.
8. Open a lesson result and confirm the real seeded lesson page loads on Vertex.
9. Change the sort to Course A–Z and Shortest First and confirm only order changes.
10. Submit a nonsense query and confirm the empty state links to `/courses` with no invented result.
11. Temporarily omit one required search environment variable and confirm a sanitized configuration message appears without its value.
12. After real timestamped video documents are ingested separately, repeat a chapter query and confirm the video card links to `/lessons/<slug>?start=<verified-seconds>` and the embedded player starts there.
13. Resize to mobile width and confirm search, cards, sorting, errors, and links remain usable.
14. Confirm browser/network output contains no Context token, Sanity read token, OpenAI key, raw MCP trace, transcript array, or arbitrary provider link.

## Known external prerequisites

- Sanity Context must be enabled for the user’s organization.
- A GROQ-mode Context MCP endpoint must be created in the current Sanity Dashboard Context app.
- The user must provide a server-only organization token with Context Viewer permission and a valid OpenAI API key/model.
- The Studio/schema deployment must be current.
- Exact video-moment results require a later authorized ingestion of real chapters/transcript chunks; this task deliberately does not synthesize those timestamps.
