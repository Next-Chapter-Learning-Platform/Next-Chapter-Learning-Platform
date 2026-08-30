# Implement the Vertex home page

## Goal

Replace the current design-system specimen at `/` with a faithful implementation of `design/vertex-home.png`. Reproduce the supplied 1024 × 1536 desktop reference and adapt it cleanly for tablet and mobile without redesigning it.

## Source of truth

- Visual reference: `design/vertex-home.png` (1024 × 1536).
- The screenshot is authoritative for layout, spacing, typography, colors, borders, shadows, copy, and decorative details.
- Preserve all files in `design/`.
- Preserve the unrelated existing `README.md` modification.

## Guidance read

- Repository `AGENTS.md`, including the screenshot-reproduction and approval workflow.
- Installed Next.js 16.3.3 App Router documentation for layouts/pages, CSS, and optimized fonts.
- In-app browser skill for local responsive and visual verification.
- No Sanity or Sanity Context skill is required because this task does not touch schemas, GROQ, content fetching, or agent configuration.

## Existing code inspected

- `package.json`: Next.js 16.3.3, React 19.2.8, Tailwind CSS 4, TypeScript, and ESLint.
- `app/page.tsx` and `app/page.module.css`: the previously implemented design-system specimen.
- `app/layout.tsx`: Inter and Playfair Display through `next/font`, with design-system metadata.
- `app/globals.css`: existing Vertex color tokens, resets, and typography variables.
- `public/`: only default starter SVGs; no avatar or course-logo assets.
- Current worktree status: only `README.md` is modified and must remain untouched.

## Decisions and assumptions

- The learner home page replaces `/`; the design-system specimen will no longer render at that route.
- Keep the page as a static Server Component with semantic HTML and no new runtime dependency.
- Reuse Inter for UI/body copy and Playfair Display for the hero and course titles.
- Reuse the existing Vertex color variables and inline Vertex mark.
- Recreate the avatar as a compact decorative inline SVG because no source portrait is provided.
- Recreate the Next.js, Docker, and TypeScript course marks with inline SVG/CSS rather than downloading or inventing external assets.
- Header links and calls to action use in-page anchors because no catalog, learning, profile, notification, or search routes currently exist.
- The search input is a functional native text field but remains presentational; it must not invent a search backend.
- On tablet and mobile, preserve content order, stack the course cards, collapse navigation spacing sensibly, and reduce/reshape the bottom decoration without adding a mobile-only design.

## Files expected to change

- `app/page.tsx`
- `app/page.module.css`
- `app/layout.tsx`
- `app/globals.css` only if a small page-wide canvas adjustment is needed

No package, lockfile, TypeScript configuration, or data-layer changes are expected.

## Implementation requirements

### Page frame and navigation

- Reproduce the warm white canvas with narrow diagonal-striped side gutters and fine vertical frame borders.
- Match the approximately 100px-tall header with the Vertex mark/wordmark, Courses and My Learning links, notification bell, and circular avatar.
- Keep navigation semantically accessible and responsive.

### Hero

- Match the centered `INTELLIGENT LEARNING` eyebrow badge.
- Render the two-line Playfair Display headline exactly: `Search your learning` / `in plain English.`
- Match the two-line supporting copy.
- Reproduce the coral `Explore Courses` button and arrow.
- Reproduce the large search field with search icon, exact placeholder, and `⌘ K` shortcut hint.
- Maintain the hero section’s generous whitespace and subtle border divider.

### Course section

- Add the `All Courses` title and `View all courses` action.
- Reproduce all three course cards with the exact screenshot copy:
  - Next.js for Production
  - Docker Essentials
  - TypeScript Deep Dive
- Include matching course marks, descriptions, separators, and metadata for level, duration, and module count.
- Cards should use semantic articles/links and the screenshot’s border, radius, typography, and spacing.

### Closing message and decoration

- Reproduce the centered outlined star and `New courses and lessons added every week.` message with horizontal rules.
- Build the bottom coral skyline/equalizer decoration with CSS blocks, soft vertical gradients, and blur matching the reference.
- Treat the skyline as decorative and hide it from assistive technology.

### Responsive behavior

- At 1024px, match the supplied composition and approximate 1536px page height.
- At tablet widths, retain the header hierarchy and stack or wrap the course cards without crowding.
- At mobile widths, use a compact header, single-column hero and cards, appropriately scaled headline, full-width search/CTA, and no page-level horizontal overflow.

### Semantics and accessibility

- Use `header`, `nav`, `main`, `section`, headings, form labels, links, buttons, and articles appropriately.
- Give notification/profile controls and the search field accessible names.
- Hide purely decorative SVGs and skyline elements from assistive technology.
- Preserve visible keyboard focus, readable contrast, and comfortable touch targets.

## Security considerations

- This is a static presentational page with no authentication, user data, API route, server action, or external request.
- Do not introduce secrets, environment variables, HTML injection, or unsafe URLs.
- Do not create fake backend behavior for search, profile, notifications, or learning state.

## Acceptance criteria

- At a 1024 × 1536 viewport, `/` closely matches `design/vertex-home.png` in composition, spacing, typography, colors, borders, shadows, copy, and decoration.
- The header, hero, search field, three course cards, weekly-content message, and coral skyline are all present.
- No design-system specimen content remains on `/`.
- Inter and Playfair Display are used in the same roles as the reference.
- Tablet and mobile layouts have no page-level horizontal overflow, overlapping text, or clipped controls.
- Interactive controls have semantic names and visible hover/focus behavior.
- No new dependency is added.
- Type checking, linting, and a production build succeed.

## Checks to run

From the repository root:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. Start or reuse `npm run dev` and verify `/` in the browser.
5. Compare the page at 1024 × 1536 against `design/vertex-home.png`.
6. Inspect responsive layouts at 768px and 375px.
7. Confirm no browser console errors and no page-level horizontal overflow.

Report the real output of each check and any environment-specific fallback used.

## Manual test steps

1. Open `/` and compare the page frame and header to the reference.
2. Confirm the hero eyebrow, headline, supporting copy, CTA, and search field match the screenshot.
3. Activate the Courses, Explore Courses, and View all courses links and confirm they move to the course section.
4. Confirm all three course cards show the exact titles, descriptions, and metadata.
5. Keyboard-tab through navigation, controls, and cards; confirm focus is visible.
6. Resize to 768px and 375px; confirm clean reflow and no horizontal page scrolling.
7. Return to 1024 × 1536 and compare a final screenshot with the supplied reference.
