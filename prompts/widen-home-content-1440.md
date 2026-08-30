# Widen the Vertex home page to approximately 1440px

## Goal

Allow the main framed homepage content to expand to approximately 1440px on wide desktop screens while preserving the existing 1024px reference layout and current responsive behavior.

## Guidance read

- Repository `AGENTS.md`, including the approval and verification workflow.
- In-app browser skill for local visual and responsive verification.
- The relevant existing homepage CSS and the approved homepage implementation prompt.

## Existing code inspected

- `app/page.module.css`: `.pageFrame` currently uses `width: min(calc(100% - 58px), 966px)`, which permanently caps the main frame at 966px.
- Existing breakpoints at 850px and 640px already control tablet and mobile widths.
- The page is currently running at `http://localhost:3000/`.

## Decision and assumptions

- Interpret “main content takes about 1440px” as a maximum width of 1440px for the framed homepage canvas, not a forced fixed width.
- Retain the 29px side gutters through `calc(100% - 58px)`, so the original 1024px screenshot still renders at 966px wide.
- On viewports wider than 1498px, cap the frame at 1440px and center it.
- Preserve the existing internal hero widths and responsive breakpoints unless visual QA reveals overflow or an obvious spacing regression.

## File expected to change

- `app/page.module.css`

## Requirements

- Change the desktop `.pageFrame` maximum width from 966px to 1440px.
- Keep the frame fluid below its maximum width.
- Preserve centered alignment, side gutters, borders, and background treatment.
- Preserve the supplied 1024px reference composition.
- Keep tablet and mobile layouts free of horizontal overflow.
- Do not add dependencies or change content, routes, or behavior.

## Acceptance criteria

- At a viewport of at least 1498px, the main frame measures approximately 1440px and remains centered.
- At 1024px, the main frame remains approximately 966px.
- At 768px and 375px, the existing responsive layouts remain intact with no horizontal overflow.
- Type checking, linting, and the production build succeed.

## Checks

1. Run `npx tsc --noEmit`.
2. Run the app ESLint check.
3. Run a production build.
4. Verify frame width and centering at wide desktop, 1024px, 768px, and 375px.
5. Confirm the page has no horizontal overflow.

## Manual test

1. Open `/` on a desktop viewport at least 1498px wide.
2. Confirm the framed content is centered and approximately 1440px wide.
3. Resize to 1024px and confirm the original composition remains unchanged.
4. Resize to tablet and mobile widths and confirm the layout still reflows cleanly.
