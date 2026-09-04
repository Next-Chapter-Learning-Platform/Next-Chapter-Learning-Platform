# Implement the Vertex course detail page

## Goal

Implement a production-style course detail page at `/courses/[slug]` that closely reproduces `design/vertex-course.png`, reads the selected course and its relationships from the private seeded Sanity dataset on the server, and adapts cleanly to tablet and mobile without redesigning the desktop reference.

## Source of truth

- Visual reference: `design/vertex-course.png` (1024 x 1536).
- The screenshot is authoritative for the page frame, spacing, typography, colors, borders, shadows, controls, curriculum layout, progress footer, and decorative details.
- Sanity is authoritative for course titles, descriptions, cover images, levels, student counts, learning outcomes, modules, lessons, category, and instructor.
- The seeded counterpart to the mock screenshot is `/courses/nextjs-app-router-in-depth`:
  - `Next.js App Router in Depth`
  - 4 ordered modules containing 12 ordered lesson references
  - 4 learning outcomes
  - intermediate level, popular flag, 18,240 students
  - category `Web Development` and instructor `Mira Kovac`
- Do not copy the screenshot's fictional `Next.js for Production`, 12-module, 18h 24m, or 35%-complete values over the seeded data.

## Guidance read

- Repository `AGENTS.md`, including the approval loop, strict screenshot reproduction rule, private Sanity boundary, progress rules, and Next.js version warning.
- `sanity-best-practices/SKILL.md` plus its Next.js and GROQ references for server-only fetching, explicit projections, image handling, dynamic routes, TypeGen, and missing-document behavior.
- Installed Next.js 16.3.3 documentation for dynamic route segments, async `params`, Server and Client Components, optimized remote images, and generated metadata.
- The dedicated in-app browser skill is unavailable in this session; use the available in-app browser control directly for local visual verification.

## Existing code and data inspected

- `app/page.tsx` and `app/page.module.css`: current Vertex home page, header/auth controls, inline icon conventions, colors, fonts, page frame, and responsive breakpoints.
- `app/layout.tsx` and `app/globals.css`: Clerk provider, Inter and Playfair Display variables, global reset, and Vertex design tokens.
- `sanity/queries/courses.ts`: existing typed course projections, nested modules/lessons, category, instructor, images, duration, and free-preview fields.
- `sanity/data/courses.ts`: server-only `getCourseBySlug` and `getCourseSlugs` helpers with cache tags.
- `sanity/lib/client.ts`, `fetch.ts`, `image.ts`, and `env.ts`: private read-token client and Sanity image URL builder.
- `studio/schemaTypes/documents/course.ts` and `lesson.ts`: canonical seeded field names and relationships.
- `seed.ndjson`: exact seeded Next.js course content, module summaries, lesson references, cover directive, outcomes, category, and instructor.
- `next.config.ts`: currently has no Sanity CDN image allow-list.
- Current Git status was clean before creating this prompt.

## Decisions and assumptions

- Add a dynamic App Router page at `app/courses/[slug]/page.tsx`; use Next.js 16's promised `params`, `generateStaticParams`, generated metadata, and `notFound()` for an unknown slug.
- Keep content fetching in the Server Component through `getCourseBySlug`; never pass the Sanity token or client to browser code.
- Extend the existing course projection only where the UI needs another derived value. Compute course and per-module durations from the already projected lesson durations rather than adding stored presentation fields.
- Use `next/image` with a narrowly scoped `cdn.sanity.io` remote pattern and `urlFor()` transformations. If a seeded image reference is temporarily unavailable, render a styled, accessible fallback instead of crashing or inventing another image.
- Reproduce the signed-in screenshot header with the existing Clerk-aware behavior: signed-out users see sign-in/sign-up actions; signed-in users see the bell and `UserButton`.
- Render the screenshot's hero, popular badge, metadata row, learning-outcome grid, curriculum list, CTA hierarchy, and bottom coral skyline using the existing Inter/Playfair and inline-SVG approach. Add no icon dependency.
- Map the eight Sanity outcome icon keys to a small typed inline-SVG renderer with a safe fallback.
- Render each module as a native accessible disclosure. Its summary row matches the screenshot; opening it reveals its ordered lesson links and durations.
- Show at most six module rows initially only when a future seeded course contains more than six; the current four-module course renders all four without a misleading `Show all 12 modules` label.
- `Continue Learning`/`Start Learning` links to the first ordered lesson at `/lessons/[slug]`, preserving the future lesson-route contract without implementing the lesson page in this task.
- Add a local accessible bookmark toggle only for the visible UI state. It is explicitly non-persistent because no bookmark content model or server write route exists.
- Do not fabricate the screenshot's 35% learner progress. Until the separate server-written progress feature exists, render the truthful initial 0% state and label the CTA `Start Learning`. No progress write is added.
- Surface the seeded instructor in a compact section after the curriculum so the fixed Vertex course-page relationship requirement is met without changing the reference's above-the-fold composition.
- Keep the home page unchanged; the course route is tested directly by its real seeded slug.
- Complete or retry the already-authorized strict Sanity fixture asset import only if the live course cover reference is still missing. Keep `seed.ndjson` and `videos.json` unchanged and never use a failing-asset bypass.

## Files expected to change

- `app/courses/[slug]/page.tsx` (new)
- `app/courses/[slug]/page.module.css` (new)
- `app/courses/[slug]/bookmark-button.tsx` (new, only for local UI state)
- `next.config.ts` (Sanity image CDN allow-list)
- `sanity/queries/courses.ts` only if the final projection needs an additional UI field
- `sanity.types.ts` regenerated if the query changes
- `prompts/implement-vertex-course-page.md`

No schema, package, lockfile, authentication, progress-write, search, analytics, or lesson-page changes are planned.

## Implementation requirements

### Dynamic route and data

1. Create `/courses/[slug]` as an async Server Component using `PageProps<'/courses/[slug]'>` and `await params`.
2. Fetch through `getCourseBySlug`, return `notFound()` for an unknown or unpublished slug, and expose seeded slugs through `generateStaticParams`.
3. Generate page title and description from the course with clean server-fetched values.
4. Preserve authored module and lesson order from Sanity; derive module/lesson numbering from array position.
5. Derive total duration and per-module duration from lesson durations and format them consistently as hours/minutes.
6. Format level labels and student counts for display without altering stored values.

### Desktop visual match

1. Reproduce the warm off-white framed canvas, diagonal side rules, subtle borders, and approximately 88px header.
2. Match the breadcrumb row, two-column hero, near-square cover treatment, coral popular badge, Playfair course title, summary, metadata row, coral primary CTA, and bordered bookmark control.
3. Match the bordered `What you'll learn` panel and two-column learning-outcome cards with coral outline icons.
4. Match the `Course Content` heading, aggregate count/duration, numbered module rows, summaries, durations, chevrons, and disclosure styling.
5. Match the sticky bottom progress panel and coral skyline decoration while using the honest 0% initial progress state.
6. Place the instructor section after curriculum content and keep it visually consistent with the same restrained card system.

### Responsive behavior

1. Preserve the desktop composition at 1024 x 1536.
2. At tablet widths, stack the hero cleanly, retain a two-column outcome grid where space allows, and keep curriculum rows readable.
3. At mobile widths, use a compact header, one-column hero/outcomes, wrapped metadata, full-width CTAs, and a non-overlapping progress footer.
4. Prevent page-level horizontal overflow at 1024px, 768px, and 375px.

### Semantics and accessibility

1. Use semantic header, navigation, main, section, heading, list, link, button, and `details`/`summary` elements.
2. Supply meaningful image alt text from Sanity and hide decorative SVG/background elements.
3. Give bookmark, notification, module disclosures, and auth controls clear accessible names and visible focus styles.
4. Respect reduced-motion preferences for transitions and decorative movement.

## Security considerations

- Keep the private Sanity read token and client inside the server-only data layer.
- Do not fetch Sanity directly from a Client Component or expose environment values beyond the existing public project/dataset identifiers.
- Do not add a browser-side content or progress write.
- Do not expose `CLERK_SECRET_KEY` or alter Clerk route protection.
- Do not inject Portable Text or other HTML on this page.
- Allow optimized remote images only from the Sanity CDN host.

## Acceptance criteria

- `/courses/nextjs-app-router-in-depth` renders the seeded course, cover/fallback, four outcomes, four ordered modules, twelve ordered lesson references, category metadata, student count, and instructor.
- At 1024 x 1536, the page closely matches `design/vertex-course.png` in frame, hierarchy, spacing, typography, colors, cards, curriculum rows, sticky footer, and decoration while showing real seeded values.
- Unknown course slugs return the Next.js 404 state.
- Page metadata uses the seeded title and summary.
- No Sanity token or write capability reaches client code.
- Bookmark state is clearly local-only; learner progress is not fabricated or written.
- The page reflows without overlap or horizontal page scrolling at 768px and 375px.
- Type checking, lint, production build, and local visual checks pass.
- `seed.ndjson` and `videos.json` remain byte-for-byte unchanged.

## Checks to run

From the repository root unless noted:

1. Recompute and compare SHA-256 hashes for `seed.ndjson` and `videos.json`.
2. If needed, finish the strict Sanity CLI asset import and query the live course/image reference.
3. From `studio/`, run `npm run typegen` if the GROQ projection changes.
4. Run `npx tsc --noEmit`.
5. Run `npm run lint`.
6. Run `npm run build`.
7. Start or reuse `npm run dev` and open `/courses/nextjs-app-router-in-depth`.
8. Compare the live page at 1024 x 1536 to `design/vertex-course.png`.
9. Check the page at 768px and 375px for reflow and horizontal overflow.
10. Open an invalid slug and confirm it returns a 404.
11. Confirm the browser console has no errors and no Sanity secret is present in client-delivered code.
12. Run `git diff --check` and inspect `git status --short`.

## Exact manual test steps

1. Open `http://localhost:3000/courses/nextjs-app-router-in-depth`.
2. Confirm the header, breadcrumb, hero, cover, popular badge, and metadata match the reference layout.
3. Confirm the title and summary say `Next.js App Router in Depth` and the page shows 4 modules, 12 lessons, and 18.2k students from Sanity.
4. Confirm the four outcome cards match the seeded outcome titles/descriptions and display mapped coral icons.
5. Open each curriculum module and confirm its three seeded lessons appear in authored order with derived labels and durations.
6. Activate the bookmark control and confirm its local pressed state is keyboard- and screen-reader-accessible.
7. Confirm the primary CTA points to the first seeded lesson slug.
8. Scroll below the curriculum and confirm Mira Kovac is surfaced as the course instructor.
9. Confirm the sticky footer reports 0% instead of the screenshot's fictional 35% and does not write progress.
10. Visit `/courses/not-a-real-course` and confirm the 404 state.
11. Resize to 768px and 375px and confirm there is no horizontal scrolling, clipped text, or overlap.
12. Return to 1024 x 1536 and compare a full-page capture against the supplied reference.
