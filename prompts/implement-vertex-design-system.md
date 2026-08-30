# Implement the Vertex Design System specimen

## Goal

Replace the default Next.js starter page with a faithful implementation of `design/vertex-designsystem.png`. Reproduce the reference at its 1024px desktop width and adapt the layout sensibly for narrower screens without redesigning it.

## Source of truth

- Visual reference: `design/vertex-designsystem.png` (1024 × 1536)
- The screenshot is authoritative for layout, spacing, typography, color, borders, shadows, labels, and visual states.
- Preserve every file in `design/`; it is user-provided, untracked reference material.

## Guidance read

- Repository `AGENTS.md`, especially the approval workflow, exact screenshot reproduction rule, and Next.js version warning.
- Installed Next.js 16.3.3 App Router documentation for layouts/pages, CSS, fonts, images, and metadata.
- In-app browser skill for local visual verification after implementation.
- No Sanity or Sanity Context skill is needed because this page does not use schemas, GROQ, content fetching, or agent configuration.

## Existing code inspected

- `package.json`: Next.js 16.3.3, React 19.2.8, Tailwind CSS 4, TypeScript, and ESLint; no icon package.
- `app/page.tsx`: untouched Create Next App starter content.
- `app/layout.tsx`: Geist font setup and starter metadata.
- `app/globals.css`: Tailwind import, starter color variables, and forced dark-mode overrides.
- `next.config.ts`, `tsconfig.json`, `public/`, and the current Git status.

## Decisions and assumptions

- Implement the design-system specimen at `/`; no additional route is required.
- Keep the page as a static Server Component. The screenshot shows examples of states, not application workflows, so client-side state is unnecessary.
- Use `next/font/google` for Inter and Playfair Display, exposing both as CSS variables. Remove the unrelated Geist setup.
- Use inline SVG icon components with `currentColor`, rounded caps, and consistent sizing. Do not add a dependency solely for icons.
- Use a co-located CSS module for specimen layout and component styling, with global CSS limited to reset, font/color tokens, and body defaults.
- Model the screenshot's colors as reusable CSS custom properties:
  - Primary: `#F97316`, `#FB923C`, `#FDBA74`, `#FED7AA`, `#FFEEE5`
  - Neutral: `#0F172A`, `#334155`, `#64748B`, `#CBD5E1`, `#E2E8F0`, `#F1F5F9`, `#FAFAFC`, `#FFFFFF`
- At approximately 1024px, match the screenshot's multi-column composition and compact scale. Below tablet widths, stack section grids and allow dense comparison rows to scroll or reflow. Below mobile widths, use one-column cards and controls while preserving the visual hierarchy.
- Do not invent additional components, content, navigation, or dark mode.

## Files expected to change

- `app/page.tsx`
- `app/page.module.css` (new)
- `app/layout.tsx`
- `app/globals.css`

No dependency or lockfile changes are expected.

## Implementation requirements

### Page shell and brand

- Warm off-white canvas with a centered specimen grid and fine neutral borders.
- Reproduce the orange Vertex triangular mark as an inline SVG and pair it with the `Vertex` wordmark.
- Match the introductory title, description, version, and date shown in the reference.

### Sections

Implement all 14 numbered sections with the exact visible labels and sample content:

1. Colors
2. Typography
3. Type Scale
4. Spacing System
5. Radius & Shadows
6. Icons
7. Buttons
8. Inputs
9. Badges / Tags
10. Status / Indicators
11. Progress Bar
12. Cards
13. Navigation
14. Principles

### Component specimens

- Color swatches must show every visible token name and hex value.
- Typography must demonstrate Playfair Display and Inter, including the visible type-scale table.
- Spacing blocks, radius samples, and four shadow elevations must reflect the listed values.
- Icons must include matching outline and filled rows plus the icon specification notes.
- Buttons must show primary, secondary, tertiary, and text styles across default, hover, and disabled examples.
- Inputs must reproduce the search field with shortcut hint and the sort select.
- Badges, statuses, progress, course/lesson/resource cards, navigation, breadcrumbs, and pagination must match the screenshot's copy and composition.
- The bottom principles row must include Clarity First, Consistency, Focus & Calm, and Accessible with corresponding icons.

### Semantics and accessibility

- Use `main`, `section`, headings, tables, labels, buttons, inputs, select, links, and navigation landmarks where appropriate.
- Provide a real label or accessible name for every form control.
- Mark decorative SVGs as hidden from assistive technology; meaningful icons need accessible text through surrounding labels.
- Keep keyboard focus visible and maintain readable contrast.
- Disabled specimens must use native disabled semantics where applicable.

## Security considerations

- This is a static, presentational page with no user data, authentication, server action, API route, or external request.
- Do not introduce secrets, environment variables, HTML injection, or unsafe URL handling.
- Links represented only as design specimens should not navigate to invented destinations.

## Acceptance criteria

- At a 1024px-wide browser viewport, the rendered page closely matches the full reference image in layout, spacing, typography, colors, borders, shadows, component sizing, and copy.
- Every one of the 14 numbered sections is present in the same order.
- Inter is used for UI/body text and Playfair Display for display typography.
- The page contains no starter Next.js/Vercel content and no unintended dark-mode styling.
- The page is responsive at 768px and 375px without horizontal page overflow, clipped text, or overlapping controls.
- Interactive HTML elements have clear hover, focus-visible, and disabled behavior consistent with the specimens.
- No new runtime dependency is added.
- Type checking, linting, and production build succeed.

## Checks to run

From the repository root:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. Start `npm run dev` and verify the page in the browser.
5. Capture and inspect the full page at 1024px width against `design/vertex-designsystem.png`.
6. Inspect responsive layouts at 768px and 375px and check for overflow.

Report the real output of every check; do not claim a pass without running it.

## Manual test steps

1. Open `/` and confirm the Vertex mark, title, description, version, and date match the reference.
2. Scroll through the page and confirm sections 01–14 appear in order with all reference content.
3. Compare color swatches and typography samples to the screenshot.
4. Hover and keyboard-focus each enabled button, input, select, and link specimen.
5. Confirm disabled buttons cannot be activated.
6. Resize to 768px and 375px; verify sections reflow cleanly and the page has no horizontal scrolling.
7. Return to 1024px and compare a full-page screenshot to the supplied reference.
