# Fix Vercel web-build TypeScript boundary

## Goal

Make the Vercel deployment for the root Next.js application (`next-chapter`) build successfully without installing or compiling the standalone Sanity Studio package as part of the web application.

## Skills and guidance read

- `sanity-best-practices/SKILL.md`
- `sanity-best-practices/references/project-structure.md`
- `sanity-best-practices/references/nextjs.md`
- Next.js 16.3.3 local documentation at `node_modules/next/dist/docs/01-app/03-api-reference/05-config/02-typescript.md`
- Next.js 16.3.3 local documentation at `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/typescript.md`

The guidance establishes that the Studio is a standalone application with its own package boundary and that `next build` type-checks the complete project selected by the root TypeScript configuration.

## Code and configuration inspected

- `package.json`: root Next.js package; it intentionally does not declare Studio-only dependencies.
- `package-lock.json`: root web dependency lockfile used by Vercel.
- `tsconfig.json`: root config includes every repository `*.ts`, `*.tsx`, and `*.mts` file and currently does not exclude `studio/`.
- `next.config.ts`: strict build type checking is enabled; there is no unsafe `ignoreBuildErrors` bypass.
- `studio/package.json` and `studio/package-lock.json`: standalone package that correctly declares `@sanity/vision` and `youtube-caption-extractor`.
- `studio/tsconfig.json`: independent strict TypeScript configuration for Studio and ingestion files.
- `studio/sanity.config.ts`: imports `@sanity/vision` from the Studio package.
- `studio/scripts/video-ingestion/youtube.ts`: imports `youtube-caption-extractor`; its callback parameters are inferred from that package's bundled declarations when the Studio dependencies are installed.
- `docs/vercel-deployment-plan.md`: confirms Vercel should deploy the root Next.js package and the Studio should be deployed independently to Sanity hosting.
- Current Git state: preserve the unrelated untracked `docs/vercel-deployment-plan.md` and all other user-owned files.

## Diagnosis

Vercel runs `npm install` at the repository root, so it installs the root web dependencies only. During `next build`, Next.js invokes TypeScript with the root `tsconfig.json`. The broad `**/*.ts` and `**/*.tsx` includes pull the standalone `studio/` source into the web type-check even though Studio dependencies belong to `studio/package.json` and are not installed by the root install. This produces the missing-module errors. The implicit-`any` errors in `youtube.ts` are cascading diagnostics because TypeScript cannot load `youtube-caption-extractor` and therefore cannot infer its exported subtitle types.

## Decisions and assumptions

- Keep the repository root as the Vercel Root Directory and keep the root build command as `npm run build`.
- Preserve the standalone Studio package and its independent dependency installation/deployment workflow.
- Fix the root TypeScript project boundary rather than duplicating Studio dependencies in the web package.
- Keep strict TypeScript build checking enabled. Do not use `typescript.ignoreBuildErrors`.
- Do not add manual `any` annotations or change ingestion behavior to silence cascading diagnostics.
- Make the smallest configuration-only change unless verification exposes a separate root-web error.

## Files expected to change

- `tsconfig.json`

This prompt file is planning documentation and is already added before implementation approval.

## Implementation requirements

1. Add `studio` to the root TypeScript `exclude` list so the root Next.js type-check owns only the web application and shared root web code.
2. Preserve the existing root includes for `next-env.d.ts`, application TypeScript, and generated `.next` route types.
3. Preserve the Studio's own `tsconfig.json` and package dependencies so Studio code remains independently type-checked.
4. Do not alter Vercel settings, root/studio dependencies, ingestion code, or Next.js error handling unless a verification failure proves an additional change is necessary.
5. Do not suppress TypeScript errors globally.

## Security considerations

- Do not read, print, modify, or expose values from `.env.local` or `studio/.env.local`.
- Do not move Sanity tokens or Studio/browser dependencies into the web client bundle.
- Keep the existing server/client and standalone-package boundaries intact.

## Acceptance criteria

- The root TypeScript project no longer includes files under `studio/`.
- Root strict type checking succeeds.
- Root lint succeeds.
- The root production Next.js build succeeds with TypeScript checking enabled.
- Studio strict type checking still succeeds when run from `studio/` with its own dependencies.
- No application behavior or UI changes.
- No unrelated user-owned changes are modified.

## Checks to run

From the repository root:

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`

From `studio/`:

4. `npx tsc --noEmit`

Also inspect the effective/root TypeScript file set or equivalent compiler output to confirm that no `studio/` source file participates in the root project.

## Manual test steps

1. Commit and push the configuration change to the branch connected to Vercel project `next-chapter`.
2. Open the new Vercel deployment and confirm dependency installation is followed by a successful `npm run build`.
3. Confirm the log no longer reports `studio/sanity.config.ts` or `studio/scripts/video-ingestion/youtube.ts` during the root TypeScript phase.
4. Open the deployed site and smoke-test the home page plus one course and lesson route.
5. Continue to install, type-check, build, and deploy the Sanity Studio separately from `studio/`.
