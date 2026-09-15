# Implement the Vertex lesson page

## Goal

Implement `/lessons/[slug]` from `design/vertex-lesson.png`, wired entirely to the seeded private Sanity content, with the lesson video playing through an on-site provider embed. Preserve the approved PostHog and Sanity image fixes already in the working tree.

## Skills and guidance read

- Repository `AGENTS.md` for the fixed lesson model, provider playback rules, private server-only Sanity boundary, responsive UI requirements, analytics direction, and required checks.
- `sanity-best-practices/SKILL.md` and its Next.js and Portable Text references for typed GROQ, reverse references, server-only reads, Portable Text rendering, and provider-hosted video.
- Local Next.js 16.3.3 documentation in `node_modules/next/dist/docs/` for async route params/search params, dynamic routes, links, loading UI, and server/client boundaries.
- The supplied `design/vertex-lesson.png`, which is the visual source of truth for desktop layout, spacing, typography, colors, sidebar hierarchy, video area, content sections, resource cards, and previous/next navigation.

## Existing code and content inspected

- No lesson route exists yet.
- `sanity/queries/lessons.ts` already fetches a lesson plus a reverse-reference query for its parent course and ordered modules.
- `sanity/data/lessons.ts` derives the current module and lesson number, but currently discards the parent course’s full module outline and does not derive previous/next lessons.
- `lesson` documents already contain title, slug, `videoUrl`, thumbnail, duration, free-preview flag, student count, Portable Text notes, key points, optional pro tip, and resources.
- Parent courses embed ordered modules whose lessons are references; numbering must be derived from those orders.
- `seed.ndjson` contains 120 lesson documents. Every seeded `videoUrl` currently uses `www.youtube.com` and has a corresponding `videos.json` entry.
- The representative seeded Next.js lesson is `nextjs-app-router-in-depth-fetching-in-server-components`, under module `Data Fetching and Caching`, with a real YouTube URL, duration, notes, key points, and a resource.
- The root PostHog singleton and Clerk identity lifecycle are already being corrected in the approved working changes; the lesson page must use that same singleton and must not add another provider/initializer.
- `@portabletext/react` is not currently a direct dependency and must be added for the required typed notes rendering.

## Decisions and assumptions

- Match the reference composition closely, but use real seeded data rather than copying placeholder values from the mockup. For example, the seeded Next.js course has four modules, not twelve.
- Browsing remains public. Do not gate lesson playback with Clerk because the current requirements mark browsing as public and the free-preview badge is presentational only.
- Embed the provider player on the Vertex page. The seeded content is YouTube, so YouTube playback is the verified path. Add small, pure URL parsing support for standard YouTube/watch, short, and embed URLs; reject unrecognized URLs with an accessible fallback instead of navigating the learner away.
- Read an optional non-negative integer `start` query parameter and pass it to the YouTube embed so future search results can open the exact second.
- Do not build a custom media player or proxy video bytes.
- Render lesson notes with `@portabletext/react` and a typed serializer. Keep external note links and resource links safe with `noopener noreferrer`.
- Use the full ordered course outline in the sidebar, expand the current module, highlight the current lesson, and derive every module/lesson label from array order.
- Derive previous and next lessons across module boundaries from the flattened ordered course outline.
- Show `0% complete` and no fake completion marks until the learner-progress backend exists.
- The Notes tab remains presentational as specified in `AGENTS.md`; the active Lesson Content view renders the Sanity-authored notes, key points, pro tip, and resources.
- Add a browser-only `lesson_viewed` event through the existing PostHog singleton. Do not add a PostHog provider or server-render capture. Detailed provider playback/progress analytics remain a separate integration because an iframe requires the YouTube IFrame API to observe player state reliably.
- Add an immediate route skeleton and responsive behavior. At narrower widths, move the course outline above the lesson content in a collapsible navigator; do not attempt to preserve the desktop two-column layout on mobile.

## Expected files to touch

- `package.json`
- `package-lock.json`
- `sanity/queries/lessons.ts`
- `sanity/data/lessons.ts`
- `sanity.types.ts` (regenerated)
- `app/lessons/[slug]/page.tsx` (new)
- `app/lessons/[slug]/page.module.css` (new)
- `app/lessons/[slug]/lesson-video.tsx` (new, only if a client boundary is needed)
- `app/lessons/[slug]/lesson-viewed.tsx` (new)
- `app/lessons/[slug]/loading.tsx` (new)
- `app/lessons/[slug]/not-found.tsx` (new only if the generic 404 is insufficient)

## Requirements

### Data and routing

1. Add the dynamic App Router route `/lessons/[slug]`.
2. Await Next.js 16 route params and search params.
3. Generate metadata from the real lesson and course.
4. Return `notFound()` for a missing lesson or a lesson that is not connected to a course/module.
5. Keep Sanity access in Server Components/server-only helpers and keep the private read token out of the browser.
6. Extend the lesson query only with fields required by the page, including course level and image metadata where displayed.
7. Preserve the full ordered module outline and derive the current module number, lesson number, previous lesson, and next lesson in the data layer.
8. Keep cache tags for lesson, course, instructor, category, and related lesson changes.

### Video playback

1. Convert seeded YouTube URLs to `https://www.youtube-nocookie.com/embed/<id>`.
2. Support `youtube.com/watch?v=`, `youtu.be/`, and existing YouTube embed forms.
3. Pass safe embed parameters such as `rel=0` and the validated `start` second when supplied.
4. Render the iframe with a meaningful title, `allowFullScreen`, strict referrer policy, and only the capabilities required for provider playback.
5. Keep the responsive 16:9 frame inside the page and do not send the learner to YouTube for normal playback.
6. If the URL cannot be parsed, show the Sanity thumbnail/fallback and a clear unavailable message; never interpolate an untrusted arbitrary URL into the iframe source.

### UI

1. Reproduce the reference desktop structure: global header, left course outline, main breadcrumbs/lesson header, video, tabs, lesson content, key points, optional pro tip, resources, and previous/next footer.
2. Use the existing Vertex logo, fonts, auth controls, palette, borders, and page background patterns.
3. Show a compact course cover, course title, and real `0% complete` progress state in the sidebar.
4. Render each module and its lessons from Sanity; expand and highlight the current module/lesson.
5. Display the derived `Lesson X.Y` badge, real duration, course level, and lesson student count.
6. Render Portable Text notes with typed block/list/mark components.
7. Render key points, the optional pro tip only when present, and all resources with type-appropriate icons and safe external links.
8. Disable or omit navigation at the first/last lesson boundary while preserving the footer layout.
9. Add a lightweight loading state matching the two-column geometry.
10. At tablet/mobile widths, stack the layout, expose the course outline through a native collapsible control, keep the iframe full-width, stack resource cards, and preserve usable tap targets.
11. Do not invent course progress, note data, lesson completion state, resources, students, durations, or module counts.

### Analytics

1. Capture `lesson_viewed` only after a real browser mount.
2. Use the Clerk/PostHog identity lifecycle already added at the root.
3. Send only lesson/course IDs, slugs, derived module/lesson numbers, and non-sensitive content properties.
4. Do not capture from metadata generation, static generation, Server Component rendering, or link prefetching.
5. Prevent duplicate capture for one mounted lesson in React development checks.

## Security considerations

- Never read, print, or modify `.env.local` files.
- Never expose `SANITY_API_READ_TOKEN`, Clerk secret keys, or a private PostHog key.
- Validate and reconstruct provider embed URLs; never render an arbitrary Sanity URL directly as an iframe source.
- Keep external links on HTTPS/HTTP data already validated by the Sanity schema and apply `rel="noopener noreferrer"` when opening a new tab.
- Do not add client-side Sanity fetching or content writes.
- Do not use or modify `videos.json`/`seed.ndjson` at runtime.

## Acceptance criteria

- Every seeded lesson slug can render at `/lessons/[slug]` with its real lesson, course, module, and curriculum data.
- The representative Next.js lesson displays the correct derived lesson number and parent module.
- Its seeded YouTube video plays inside the Vertex page.
- `/lessons/<slug>?start=60` loads the same on-site embed configured to begin at 60 seconds.
- The current lesson is visually highlighted and the current module is expanded.
- Previous/next links follow actual seeded course order and cross module boundaries correctly.
- Portable Text notes, key points, optional pro tip, and resources render from Sanity without invented content.
- The layout closely matches `design/vertex-lesson.png` on desktop and remains usable on mobile.
- A missing or malformed relationship returns a safe not-found state; an invalid provider URL never becomes an arbitrary iframe source.
- One browser-mounted `lesson_viewed` event is emitted per mounted lesson, with no render/prefetch events.
- TypeGen, web and Studio type checks, ESLint, production build, and dev runtime verification pass.

## Checks to run

From the repository root:

1. Install `@portabletext/react` with npm.
2. Run `npx tsc --noEmit`.
3. Run `npm run lint`.
4. Run `npm run build` because a dynamic route and server data/query modules change.
5. Run `npm run dev` or use the existing development server and verify direct plus client-side navigation.

From `studio/`:

1. Run `npm run typegen`.
2. Run `npx tsc --noEmit`.

## Exact manual test steps

1. Start the app with the existing valid Clerk, Sanity, and PostHog environment configuration.
2. Open `/courses/nextjs-app-router-in-depth` and click the first available lesson.
3. Confirm an immediate lesson loading state appears and the lesson page resolves without a full-page failure.
4. Confirm the sidebar shows the seeded Next.js course’s real four modules, expands the current module, and highlights the selected lesson.
5. Confirm the lesson badge, title, duration, level, and student count come from Sanity/derived order.
6. Start the embedded YouTube player and confirm playback remains on the Vertex page.
7. Open the same URL with `?start=60` and confirm the embed is configured to start at 60 seconds.
8. Confirm Portable Text notes, key points, pro tip only when present, and resource links render correctly.
9. Use Previous Lesson and Next Lesson across at least one module boundary and confirm the correct seeded lessons load.
10. Test a direct hard refresh of a lesson URL.
11. Resize to mobile width and confirm the course outline collapses, content stacks, the video remains 16:9, and navigation stays usable.
12. Confirm no Sanity token, arbitrary iframe URL, hydration warning, image error, or route error appears in the browser console or terminal.
