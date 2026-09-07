# Implement the All Courses page

## Goal

Add a simple `/courses` catalog page that fetches every seeded course from the private Sanity dataset on the server. Each card must use the course's Sanity cover image instead of generated capital-letter artwork and link to the existing course detail route.

## Guidance read

- `AGENTS.md`
- `.agents/skills/sanity-best-practices/SKILL.md`
- `.agents/skills/sanity-best-practices/references/nextjs.md`
- `.agents/skills/sanity-best-practices/references/groq.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

## Existing code inspected

- `app/page.tsx` and `app/page.module.css`
- `app/courses/[slug]/page.tsx` and `app/courses/[slug]/page.module.css`
- `app/layout.tsx` and `app/globals.css`
- `sanity/queries/courses.ts`
- `sanity/data/courses.ts`
- `sanity/lib/image.ts`
- `sanity.types.ts`
- `next.config.ts`
- `package.json`
- `seed.ndjson` image fields, read only

## Decisions and assumptions

- `/courses` is the canonical All Courses route.
- Keep the page intentionally simple: existing Vertex header, a short title/intro, and one responsive course-card grid.
- Reuse the existing server-only `getCourses()` helper and generated `COURSES_QUERY_RESULT` type; do not add client fetching or a new query unless implementation reveals a missing field.
- Show every course returned by Sanity in its existing `popular desc, title asc` order.
- Use `next/image` with `urlFor(course.coverImage)` when `coverImage.asset` exists.
- Do not generate initials or capital-letter artwork. If a Sanity asset is absent, show a quiet neutral placeholder with accessible text; do not invent an external image.
- Cards link to `/courses/[slug]` and display only useful catalog metadata: title, summary, level, duration, module count, category, and optional popular state.
- Update existing homepage and course-detail navigation links that mean “All Courses” so they point to `/courses`.
- Preserve the current warm Vertex visual language without introducing filters, sorting controls, pagination, search behavior, or new dependencies.
- The existing local Sanity read token previously returned `401 Session not found`; implementation can proceed, but production-build and browser data verification require a valid server-only viewer token.

## Files expected to change

- `app/courses/page.tsx` (new)
- `app/courses/page.module.css` (new)
- `app/page.tsx`
- `app/courses/[slug]/page.tsx`
- This prompt file

No Sanity schema, seed, or environment files should change.

## Requirements

1. Implement an async Next.js App Router Server Component at `/courses`.
2. Fetch data through `getCourses()` only on the server.
3. Render all courses in a responsive grid with semantic headings, articles, and links.
4. Use Sanity image crop/hotspot data through the existing image URL builder.
5. Give each image meaningful alt text from Sanity, falling back to `<title> course cover`.
6. Use a responsive `sizes` value and an appropriate fixed aspect ratio to avoid layout shift.
7. Never render an abbreviation or capital letter as cover artwork.
8. Format course duration and level defensively.
9. Include a useful empty state if Sanity returns no courses.
10. Point homepage “Courses”, “Explore Courses”, and “View all courses” navigation to `/courses` where semantically appropriate.
11. Point course-detail “Courses” and breadcrumb links to `/courses`.
12. Keep Clerk controls and the private-content browsing behavior unchanged.

## Security considerations

- Keep the Sanity dataset read in a Server Component through `sanity/data/courses.ts`.
- Do not expose `SANITY_API_READ_TOKEN` or import the server-only data layer into a Client Component.
- Do not read, print, or modify `.env.local`.
- Do not add client-side Sanity access or content writes.

## Acceptance criteria

- `/courses` renders one card for every seeded course returned by Sanity.
- Each card links to the matching `/courses/[slug]` page.
- A course with a valid `coverImage.asset` displays that Sanity CDN image.
- No catalog card contains generated initial/capital-letter artwork.
- A missing image produces a neutral, accessible placeholder without breaking the grid.
- Desktop shows a clean multi-column grid; tablet and mobile stack sensibly.
- Existing homepage and course-detail All Courses links navigate to `/courses`.
- TypeScript and ESLint pass.
- The production build passes when valid Sanity credentials are present.

## Checks to run

From the web workspace root:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. `git diff --check`
5. Start or reuse `npm run dev` and verify `/courses` in the browser.

## Exact manual test steps

1. Ensure `.env.local` contains a valid server-only `SANITY_API_READ_TOKEN`; do not paste it into chat.
2. Run `npm run dev` from the repository root.
3. Open `http://localhost:3000/courses`.
4. Confirm all seeded courses appear in the grid.
5. Confirm cards use Sanity cover images and show no initial-letter artwork.
6. Open a card and confirm it navigates to the matching course detail page.
7. Return home and confirm Courses, Explore Courses, and View all courses lead to `/courses`.
8. Resize to tablet and mobile widths and confirm the grid remains readable without horizontal scrolling.
