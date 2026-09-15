# Fix search timestamps, YouTube playback, and search latency

## Goal

Repair three connected learner-facing bugs:

1. Content-word searches do not surface grounded video moments with timestamps.
2. The current YouTube lesson embed does not load or play.
3. Search blocks on the skeleton for roughly ten seconds before failing or returning no useful results.

## Guidance read

- `AGENTS.md`
- `.agents/skills/create-agent-with-sanity-context/SKILL.md`
- `.agents/skills/create-agent-with-sanity-context/references/nextjs-agent.md`
- `.agents/skills/create-agent-with-sanity-context/references/system-prompts.md`
- `.agents/skills/sanity-best-practices/SKILL.md`
- `.agents/skills/sanity-best-practices/references/groq.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`
- `node_modules/next/dist/docs/01-app/02-guides/streaming.md`
- Computer-use guidance for inspecting the rendered local iframe

The Context workflow has four stages: build the agent, configure Studio, add Conversation Insights, and tune the agent. This task repairs the existing agent implementation. Studio and the Context document already exist. Insights and interactive Context/system-prompt tuning are not part of this narrow bugfix.

## Code and live state inspected

- `app/api/search/route.ts`
- `lib/search/context-client.ts`
- `lib/search/search-agent.ts`
- `lib/search/schema.ts`
- `sanity/data/search.ts`
- `sanity/queries/search.ts`
- `sanity/lib/client.ts`
- `sanity/lib/fetch.ts`
- `app/search/page.tsx`
- `app/search/search-results.tsx`
- `app/search/loading.tsx`
- `app/search/loading.module.css`
- `app/lessons/[slug]/page.tsx`
- `app/lessons/[slug]/page.module.css`
- `sanity/data/lessons.ts`
- `sanity/queries/lessons.ts`
- `next.config.ts`
- Root and Studio package configuration

Live findings:

- `POST /api/search` with `vector databases` reproduces an error after about 10.7 seconds.
- The route currently waits entirely on up to ten Context/OpenAI tool steps before it can hydrate or stream a result.
- The live Sanity dataset contains 120 `video` documents.
- `video.youtube.dN0lsF2cvm4` exists with five chapters and eight transcript chunks.
- Its stored chapters include `Why do we need vector databases` at 44 seconds, `Vector embeddings and indexes` at 89 seconds, and `Different vector databases` at 225 seconds.
- The hydrator drops video candidates unless the lesson URL and video document URL are identical strings, even when they represent the same YouTube ID.
- The local lesson iframe has the correct source attribute but remains `about:blank` in the rendered frame.
- A direct standard YouTube embed reports a video player configuration error and links to YouTube's HTTP-referrer requirement.
- The source video is still available: the offline extractor successfully fetched it and its captions.

## Decisions and assumptions

- Add a fast, deterministic, server-only Sanity keyword path as the primary search for explicit content words.
- Keep Context MCP plus OpenAI for semantic expansion only when the grounded keyword path returns no results.
- Bound the semantic fallback so a failing provider cannot hold the UI for roughly ten seconds.
- Cache the compact course/lesson search index with the existing Sanity fetch helper.
- Query only matching video chapter labels and a few matching transcript chunks. Never fetch a whole transcript for the model or browser.
- Tokenize learner text, wildcard useful terms separately, and OR the terms.
- Prefer matching chapters. Use transcript chunks for a video only when no chapter matches that query.
- Join lesson and video records by a validated YouTube provider ID, not exact URL string equality.
- Preserve the existing result-card model and visual styling.
- Use YouTube's own embedded player, not a custom player.
- Switch the iframe to the standard YouTube embed origin, add the page origin to the embed URL client-side, and explicitly send a compatible referrer policy on lesson responses and the iframe.
- Preserve `?start=<seconds>` seeking and keep the source URL on the site.
- Do not modify seeded content, Sanity documents, schemas, or environment files.

## Files expected to change

- `app/api/search/route.ts`
- `lib/search/search-agent.ts`
- `lib/search/schema.ts` if the stream status needs a small type adjustment
- `sanity/queries/search.ts`
- `sanity/data/search.ts`
- `sanity.types.ts` through Sanity TypeGen
- `app/search/search-results.tsx`
- `app/search/loading.tsx` and/or its CSS only if needed to avoid a misleading long card skeleton
- `app/lessons/[slug]/page.tsx`
- `app/lessons/[slug]/youtube-player.tsx` as a small client boundary
- `next.config.ts`
- `docs/sanity-context-search.md`

No dependency installation is expected.

## Search requirements

- A query such as `vector databases` must return the matching lesson and grounded video moments from the stored chapters.
- Every video result must carry the exact stored `startSeconds` and link to `/lessons/<slug>?start=<seconds>`.
- Lesson matching must cover course title/summary, module title/summary, lesson title, key points, and plain-text notes.
- Match terms with wildcarded, parameterized GROQ expressions; never interpolate learner text into GROQ.
- Return a few filtered moment matches per video, not full `chapters` or `chunks` arrays.
- Chapter matches outrank transcript matches; exact title/concept matches outrank broad text matches.
- Normalize and validate YouTube IDs for lesson-to-video joins.
- Stream grounded fast-path results without waiting for Context/OpenAI.
- Run the Context/OpenAI agent only when fast search finds nothing, with an abortable timeout.
- If semantic expansion fails but direct Sanity search is healthy, complete gracefully with an empty or direct result set rather than a generic search failure.
- If Sanity itself fails, retain a clear error state.
- Keep initial Context caching and MCP authentication server-only.

## Playback requirements

- Keep the provider's own YouTube player.
- Build the final embed URL in a client component so `window.location.origin` can be supplied explicitly.
- Use `https://www.youtube.com/embed/<id>` with `rel=0`, `playsinline=1`, the validated origin, and the stored start second when present.
- Send `Referrer-Policy: strict-origin-when-cross-origin` for lesson routes and retain the iframe referrer policy.
- Render the existing lesson poster while the client derives the embed URL.
- Preserve fullscreen, picture-in-picture, encrypted media, and accessibility title support.
- Invalid or unsupported provider URLs must continue to show the existing unavailable state.

## Loading and performance requirements

- Do not show three large card skeletons for the full duration of a failing semantic request.
- Keep the static search shell visible immediately.
- Hide the client skeleton as soon as the first result arrives.
- Abort stale searches on navigation or query change.
- Add a finite client/server timeout for semantic fallback and show a usable empty/error state.
- Target a warm explicit keyword search response under three seconds locally, with the first result streamed as soon as it is grounded.

## Security considerations

- Keep `SANITY_API_READ_TOKEN`, `SANITY_ORGANIZATION_TOKEN`, and `OPENAI_API_KEY` server-only.
- Do not read, print, or alter environment files.
- Treat the learner query as untrusted data and bind all GROQ values through parameters.
- Never send transcript arrays, Context credentials, or LLM credentials to the browser.
- Keep result hydration grounded in IDs and timestamps returned by Sanity.
- Only expose the public page origin to YouTube as required for embedded playback.

## Acceptance criteria

- `vector databases` returns one or more lesson results and video-moment results with real stored timestamps.
- The target lesson's `Watch from 0:44`-style action routes to the lesson and loads the video at that point.
- The `dN0lsF2cvm4` lesson player renders YouTube content instead of an `about:blank` frame or player configuration error.
- Explicit keyword searches no longer wait for the failing ten-second Context/OpenAI path.
- Semantic no-hit searches are bounded and cannot leave the skeleton indefinitely.
- Existing search sorting, counts, cards, PostHog capture, and empty/error states continue to work.
- No secret reaches client code.
- No seeded file or Sanity content document is modified.

## Checks to run

From the repository root:

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

From `studio/` when a typed query changes:

```powershell
npm run typegen
npx tsc --noEmit
```

Runtime checks:

```powershell
curl.exe -N -X POST http://localhost:3000/api/search `
  -H "Content-Type: application/json" `
  --data-binary '{"query":"vector databases"}'
```

Verify that the stream contains video results with exact stored seconds and completes without `search_unavailable`. Measure the reported `durationMs`.

Also run a no-hit query to verify that semantic fallback times out cleanly, and inspect browser-delivered code/network requests to confirm no server token is present.

## Exact manual test

1. Restart `npm run dev` because `next.config.ts` headers and cached server modules may change.
2. Open `/search?q=vector%20databases`.
3. Confirm lesson and video cards appear quickly and show real `Watch from` timestamps.
4. Open the `Watch from 0:44` result.
5. Confirm the route contains `?start=44`, the embedded YouTube player loads, and playback starts near 44 seconds.
6. Search `approximate nearest neighbour` and confirm grounded course/lesson content is returned.
7. Search a nonsense phrase and confirm the UI leaves loading state within the bounded fallback window.
8. Inspect the Network panel and client bundle for exposed tokens; there must be none.
