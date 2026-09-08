# Fix broken course cover images

## Goal

Course cover images are broken on the home page, the catalog, and the course detail page. Learners see a black rectangle or the native broken-image box with raw alt text where the cover art should be. Restore the cover art and, when a load still fails, show the designed placeholder instead of a black box.

## Root cause

- The Sanity dataset is private. The server-side GROQ query runs with the read token, so course data and each asset's inline low-quality image preview (LQIP) load, but the full-size image is fetched by the browser (through the `next/image` optimizer) from `cdn.sanity.io` without a token, so the private dataset refuses it.
- Each surface has one fallback branch that only fires when the course has no asset reference at all. Our courses do have references, so nothing catches the failed fetch. The browser shows its native broken-image box, and the near-black `.cover` background on the detail page turns it into a solid black rectangle.

## Skills and guidance read

- `AGENTS.md` / `CLAUDE.md`: server/client boundary rules — keep the read token server-only, fetch all content server side, the browser holds no token.
- Next.js 16 App Router route handlers and `next/image` behaviour (local `src` is always allowed and optimized).

## Code inspected

- `sanity/lib/image.ts` (`urlFor`), `sanity/lib/client.ts`, `sanity/lib/env.ts` (`readToken`, `projectId`, `dataset`).
- `sanity/queries/courses.ts` — confirms `assetData.metadata.lqip` is fetched (the preview learners see).
- `app/page.tsx`, `app/courses/page.tsx`, `app/courses/[slug]/page.tsx` — the three surfaces and their existing fallback branches.
- `app/courses/[slug]/page.module.css` — `.cover` has a near-black background; `.coverFallback` is the designed placeholder.

## Decisions

- Serve Sanity assets through an authenticated server route so the private dataset accepts the request and the token never reaches the browser.
- Route every built image URL through `proxyImageUrl()`; validate host and path in the route to avoid an open proxy.
- Add an `onError` fallback via a small client component so any residual load failure shows the designed placeholder, not a black box.
- Apply the same fix to the instructor photo, which fails for the identical reason.

## Files touched

- New `app/api/sanity-image/route.ts` — authenticated proxy; validates `cdn.sanity.io` + `/images/<projectId>/<dataset>/` prefix; streams bytes back with a long cache header.
- New `app/cover-image.tsx` — client component wrapping `next/image` with an `onError` fallback.
- `sanity/lib/image.ts` — new `proxyImageUrl(url)` helper.
- `app/page.tsx`, `app/courses/page.tsx`, `app/courses/[slug]/page.tsx` — route cover/instructor URLs through `proxyImageUrl` and render via `CoverImage`.

## Security

- The read token stays in the route handler (server only). The browser sees only the local `/api/sanity-image?url=...` path.
- The route rejects any URL whose host is not `cdn.sanity.io` or whose path is outside the project's image prefix.

## Checks

- Type check (`tsc`) and lint (`eslint`) pass.
- `next build` compiles and type-checks; data collection needs the real private-dataset credentials, which are not present in this environment.
- Full visual verification needs the live private dataset; it cannot run here.
