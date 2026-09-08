# Upload PostHog source maps and document the analytics env vars

## Goal

Make front-end exceptions in Vertex diagnosable with readable stack traces.

The base branch already initializes the PostHog browser SDK in
`instrumentation-client.ts` (with client exception autocapture) and adds a
server client in `lib/posthog-server.ts`. It does not upload source maps, so
captured exceptions still point at minified bundles, and it does not document
the PostHog environment variables.

This change adds the missing half of the fix: upload source maps at build time
so exceptions symbolicate to real files and lines, and document the PostHog
variables in `.env.example`.

Note: an earlier draft of this branch also added a client `PostHogProvider`.
That was dropped because the base branch already initializes PostHog through
`instrumentation-client.ts`, whose own code warns against a second
provider-based initialization (it would double-initialize the SDK).

## Skills and guidance read

- `instrument-product-analytics` (bundled) and its `references/COMMANDMENTS.md`:
  a missing PostHog configuration must never break the build.
- PostHog docs: `@posthog/nextjs-config` source-map upload for Next.js.
- `AGENTS.md`: the browser holds only public values; any private key stays
  server-only; `.env.example` is the canonical env list.

## Existing code and configuration inspected

- `instrumentation-client.ts` (base): client init with `capture_exceptions`.
- `lib/posthog-server.ts` (base): server client.
- `next.config.ts` (base): `/ingest` reverse-proxy rewrites.
- `.env.example` (base): Clerk and Sanity vars only; no PostHog vars.

## Decisions and assumptions

- Source maps: wrap `next.config.ts` with `withPostHogConfig`, guarded so it
  only activates when the server-only `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID`
  are set. Without them the build uses the plain config, so builds never break.
- `.env.example` documents the browser token variable the base code reads
  (`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`) and the
  server-only source-map variables (`POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`,
  `POSTHOG_HOST`).

## Files to touch

- `package.json` / lockfile: add `@posthog/nextjs-config`.
- `next.config.ts`: guarded `withPostHogConfig` wrapper for source-map upload.
- `.env.example`: add the PostHog vars.

## Requirements

- The personal API key is server-only, used only in `next.config.ts` at build
  time. It never reaches the browser.
- A missing PostHog config never breaks build or boot.

## Acceptance criteria

- With no PostHog vars set, `next build` succeeds using the plain config.
- With `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` set, a production build
  uploads source maps.
- Type check and lint pass.

## Checks to run

- `npm run lint`
- `npm run build` (config changed)

## Manual test steps

1. Set `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` (server-only) in the build
   environment.
2. Run `npm run build` and confirm the source-map upload step runs.
3. Trigger a client error and confirm the Error Tracking issue now carries
   symbolicated stack frames.
