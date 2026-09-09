# Lesson route and read resilience

## Goal

Make the "Start Learning" button reach a real lesson. The button pointed at
`/lessons/<slug>`, but no lesson route existed, so the primary course action
led to a 404. When the first lesson did not resolve, the button fell back to
the in-page anchor `#course-content`, which looked active but did nothing.

## Skills read

- AGENTS.md sections 5, 7, 8, 11 (workspace boundaries, lesson page is video
  plus notes, lesson data model, on-site playback with a start second).
- Next.js App Router docs for the route, error boundary, and data fetch.

## Code inspected

- `app/courses/[slug]/page.tsx` and `start-learning-button.tsx` — the button
  and its `primaryHref`.
- `sanity/data/lessons.ts`, `sanity/queries/lessons.ts` — `getLessonBySlug`
  already returns a lesson plus its parent course, module, and lesson label.
- `sanity/lib/fetch.ts` — `sanityFetch` wrapped `client.fetch` with no timeout.
- `app/courses/[slug]/page.module.css` — the visual language to match.

## Decisions

- Add `app/lessons/[slug]/page.tsx`. It renders the video embed, the lesson
  label and meta, the "In this lesson you will" key points, the Portable Text
  notes, the pro tip, the resources, and a module navigation sidebar with the
  instructor. Playback stays on the page through a provider embed.
- Add `lib/video-embed.ts` to turn a stored video URL into a YouTube, Vimeo, or
  Bunny embed, with an optional start second for search video moments.
- Replace the silent `#course-content` fallback with a disabled "Lessons coming
  soon" button when no lesson resolves.
- Add a request timeout in `sanity/lib/fetch.ts` and a route-level error
  boundary `app/error.tsx`, so a slow or failed read shows a fallback UI.
- Do not link the instructor out; no instructor route exists yet.

## Assumptions

- Lessons are public; there is no auth middleware to gate them.
- `@portabletext/react` renders the notes (added as a dependency).

## Files touched

- New: `app/lessons/[slug]/page.tsx`, `app/lessons/[slug]/page.module.css`,
  `app/error.tsx`, `app/error.module.css`, `lib/video-embed.ts`.
- Changed: `app/courses/[slug]/page.tsx`, `start-learning-button.tsx`,
  `page.module.css`, `sanity/lib/fetch.ts`, `package.json`.

## Security

- The read token stays server side; all content is fetched on the server.
- Resource and notes links open with `rel="noopener noreferrer"`.

## Acceptance criteria

- The button opens `/lessons/<slug>` and the lesson renders.
- When a course has no resolvable first lesson, the button is a visible
  disabled state, not a dead click.
- A failed content read shows the error boundary, not a hung page.

## Checks

- `npm run lint`, TypeScript over the web workspace, `npm run build` compile.

## Manual test

1. Open a course page and click "Start Learning". The lesson page opens.
2. Confirm the video plays on the page and the sidebar marks the current lesson.
3. Open a lesson URL with `?start=90`; the video opens at that second.
