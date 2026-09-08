# Fix PostHog critical/high findings and Sanity route images

## Goal

Correct the critical and high PostHog findings from the current Vertex audit, and make Sanity-backed course images and data feel reliable during navigation to the course catalog and course detail routes.

## Skills and guidance read

- Repository `AGENTS.md` for project boundaries, approval workflow, private Sanity data access, PostHog requirements, and required checks.
- `sanity-best-practices/SKILL.md`, including the Next.js and image references, for server-only reads, explicit image projections, LQIP placeholders, responsive image sizing, and asset handling.
- `clerk-nextjs-patterns/SKILL.md`, including `references/server-vs-client.md`, for using Clerk client hooks only in client components and preserving server/client boundaries.
- Next.js 16.3.3 local documentation in `node_modules/next/dist/docs/`, especially `Image` and `loading.tsx` behavior. The installed version prefers `fetchPriority`/`loading` for most important images and uses route loading files for instant navigation feedback.
- Current official PostHog Next.js and reverse-proxy guidance reviewed during the audit: initialize once in `instrumentation-client.ts`, identify with a stable authenticated ID, reset after sign-out, and keep the reverse-proxy path outside middleware matching.

## Code and data inspected

- `instrumentation-client.ts` initializes the browser PostHog singleton through `/ingest`. This is the correct Next.js integration and should remain the only browser initializer; a `PostHogProvider` is not needed.
- `lib/posthog-server.ts` creates a Node client, but the two current page-view calls misuse it.
- `app/courses/page.tsx` captures `courses_catalog_viewed` while the Server Component renders with the shared distinct ID `anonymous`.
- `app/courses/[slug]/page.tsx` captures `course_viewed` while rendering and uses the course slug as the distinct ID.
- `app/layout.tsx` has Clerk at the root but no Clerk-to-PostHog identity lifecycle.
- `proxy.ts` allows `/ingest` through Clerk middleware.
- `sanity/queries/courses.ts` projects image references but not dereferenced asset metadata/LQIP.
- `sanity/lib/client.ts` and `sanity/lib/fetch.ts` correctly keep the private dataset token server-only and cache reads with revalidation/tags.
- `next.config.ts` already permits `cdn.sanity.io` and contains the PostHog reverse proxy.
- `seed.ndjson` contains ten exact course cover sources under `coverImage._sanityAsset`, all using the `image@https://picsum.photos/seed/...` import form.
- The live course documents have `coverImage` and alt text but no `coverImage.asset` references, which is why the homepage, catalog, and detail route render their fallbacks. The seed files will remain unchanged.

## Decisions and assumptions

- Keep `instrumentation-client.ts`; do not add `PostHogProvider` or another `posthog.init()` call.
- Use Clerk's stable `user.id` as PostHog `distinct_id`, without sending names, email addresses, or other profile data. Call `posthog.reset()` only when an identified user signs out, not on the initial anonymous visit.
- Capture catalog/course views from small client components after a real browser mount. Do not capture from Server Component renders, static generation, metadata generation, or prefetches.
- Keep the existing Node PostHog helper for future server-only events, but remove it from read-only page rendering.
- Exclude `/ingest` from the broad Clerk matcher while preserving the API/TRPC matcher and the required Clerk auto-proxy matcher order.
- Repair only missing course cover assets in the configured Sanity dataset. Read the exact source URLs from `seed.ndjson`; do not generate replacement content and do not edit `seed.ndjson` or `videos.json`.
- Make the repair script idempotent: skip a course that already has an asset reference, upload and patch only missing covers, and print a final count. If a remote source cannot be fetched, report the failed course and exit non-zero instead of inventing an image.
- Continue using server-only cached Sanity reads. Improve navigation perception with route-level skeletons and improve image paint with Sanity LQIP metadata, correct responsive `sizes`, high fetch priority only for the primary/above-fold image, and lazy loading for the remainder.

## Expected files to touch

- `app/layout.tsx`
- `app/posthog-identity.tsx` (new)
- `app/courses/page.tsx`
- `app/courses/course-view-events.tsx` (new, or an equivalently scoped client file)
- `app/courses/loading.tsx` (new)
- `app/courses/loading.module.css` (new, if needed)
- `app/courses/[slug]/page.tsx`
- `app/courses/[slug]/loading.tsx` (new)
- `app/courses/[slug]/loading.module.css` (new, if needed)
- `app/page.tsx`
- `proxy.ts`
- `.env.example`
- `sanity/queries/courses.ts`
- `sanity.types.ts` (regenerated)
- `studio/scripts/repair-course-cover-assets.ts` (new)
- `studio/package.json` (add a named repair command if useful)

## Implementation requirements

### PostHog critical/high fixes

1. Add one root client identity synchronizer inside `ClerkProvider`.
2. Wait for Clerk to load before changing identity.
3. Identify signed-in users with `user.id` only.
4. Reset PostHog when the previously identified user signs out.
5. Remove server-render capture and `flush()` calls from the catalog and detail pages.
6. Add client-mounted `courses_catalog_viewed` and `course_viewed` capture with the existing non-sensitive course properties.
7. Avoid duplicate capture from a single mounted route in React development checks.
8. Exclude `/ingest` and its descendants from Clerk's catch-all matcher.
9. Keep a single PostHog initialization path and do not add `@posthog/react`.

### Sanity asset/data fixes

1. Add an idempotent Studio CLI script that reads `../seed.ndjson` without writing to it.
2. Extract only course documents and their `coverImage._sanityAsset` image URLs.
3. Query the configured live dataset for the matching course IDs.
4. For each course missing `coverImage.asset`, download the exact seed source, upload it through `client.assets.upload('image', ...)`, and patch the course image with the returned asset reference while preserving existing alt/crop/hotspot values.
5. Run the script through `sanity exec ... --with-user-token` so credentials remain in the CLI session and are never printed or committed.
6. Verify live counts after the repair: total published courses, courses with a cover asset reference, and courses still missing one. The target is 10 total, 10 with a cover asset, 0 missing.
7. Update course GROQ projections to dereference image assets explicitly and include `_id`, `url`, and `metadata.lqip` plus dimensions for course covers. Include equivalent metadata for instructor photos where displayed.
8. Regenerate Sanity query types from the Studio workspace.
9. Use LQIP blur placeholders only when metadata is present; retain accessible fallbacks for truly missing images.
10. Use responsive `sizes`, reserve layout space, prioritize only above-fold images, and leave below-fold images lazy.
11. Add lightweight catalog and detail loading skeletons that preserve the existing visual layout during route navigation.
12. Do not expose the Sanity read token or add client-side Sanity fetching.

## Security considerations

- Never read, print, or modify existing `.env.local` files.
- Keep `SANITY_API_READ_TOKEN`, Clerk secret keys, Sanity write access, and any private PostHog key server/CLI-only.
- The PostHog browser project token is public by design; document it in `.env.example` without committing a real value.
- Do not send Clerk PII to PostHog; identify only by the stable Clerk user ID.
- Do not use shared literal identities such as `anonymous` and do not use content identifiers as people identifiers.
- Sanity mutations must be limited to missing `coverImage.asset` fields on the ten seeded course documents.

## Acceptance criteria

- A real browser visit to `/courses` emits one `courses_catalog_viewed` event for that mount; server rendering and link prefetching emit none.
- A real browser visit to `/courses/[slug]` emits one `course_viewed` event for that course; the course slug is an event property, never the distinct ID.
- Signed-in events use the Clerk user ID, and signing out starts a fresh anonymous PostHog identity.
- `/ingest` requests bypass Clerk middleware and continue through the configured PostHog rewrite.
- No additional PostHog initializer or provider is introduced.
- The live Sanity dataset has cover image asset references for all ten seeded courses, sourced from the unchanged `seed.ndjson`.
- Homepage course images, `/courses` cards, and `/courses/[slug]` hero covers display from `cdn.sanity.io` after direct loads and client-side route transitions.
- Images use blur placeholders when available and do not create layout shifts.
- Catalog and detail navigation show immediate, layout-appropriate loading feedback if Sanity data is not yet ready.
- Server-only Sanity fetching, private token handling, cache tags, and five-minute revalidation remain intact.
- TypeScript, ESLint, production build, and Studio TypeGen pass.

## Checks to run

From `studio/`:

1. Run the course-cover repair script with the authenticated Sanity CLI user token.
2. Run a read-only verification query/count and report the exact totals.
3. Run `npm run typegen`.
4. Run `npm run build` if the repair script or Studio config affects the Studio build.

From the web root:

1. Run `npx tsc --noEmit`.
2. Run `npm run lint`.
3. Run `npm run build` because route, server query, image, and proxy files change.
4. Start `npm run dev` and verify the affected routes in a browser.

## Exact manual test steps

1. Start the web app with the existing valid Clerk, Sanity, and PostHog environment configuration.
2. Open `/` and confirm each seeded homepage course image renders instead of initials.
3. Click `View all courses`; confirm an immediate catalog loading state appears when needed and every course card resolves to a real Sanity image.
4. Click at least two course cards; confirm the detail loading state is stable and each hero cover resolves after client-side navigation.
5. Hard-refresh one detail URL and confirm its cover also renders on a direct request.
6. In the browser network panel, confirm course images come from `cdn.sanity.io` and PostHog capture calls go to `/ingest` without a Clerk redirect or auth response.
7. While signed out, visit the catalog and one course and confirm their view events use an anonymous PostHog-generated identity, not the literal `anonymous` or a course slug.
8. Sign in through Clerk, visit another course, and confirm PostHog events use the Clerk user ID.
9. Sign out, visit another page, and confirm the old identified distinct ID is no longer used.
10. Confirm browser console and terminal show no Sanity image, Next Image, Clerk middleware, or PostHog errors.
