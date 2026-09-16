# Vertex Vercel deployment plan

## Readiness verdict

**Preview:** Yes. The application can be deployed to a protected Vercel Preview after its Preview environment variables are configured. Commit `a0f6621` is on the current branch and the working tree was clean before this runbook was added.

**Production:** Not yet recommended. Complete these release blockers first:

1. Rotate the Sanity Viewer token that appeared in local diagnostic output and replace it in every environment where it is configured.
2. Add rate limiting or equivalent abuse protection to the public `POST /api/search` endpoint. A no-result query can invoke Sanity Context and OpenAI and therefore has cost and denial-of-service exposure.
3. Configure and verify every Production environment variable in Vercel.
4. Use a Clerk production instance, production keys, and an owned production domain.
5. Deploy the current Sanity schema and hosted Studio, then verify Context against that deployed schema.

The standalone Sanity Studio is not a deployment problem. It is the recommended architecture: Vercel hosts the root Next.js application, while Sanity hosts the authoring Studio and Content Lake independently. Sanity documents this standalone model in its [Studio deployment guide](https://www.sanity.io/docs/studio/deployment).

## Target architecture

| Component | Deployment target | Project directory | Purpose |
| --- | --- | --- | --- |
| Vertex web application | Vercel | Repository root (`.`) | Next.js pages, Clerk, PostHog, server-side Sanity reads, and `/api/search` |
| Vertex Content Studio | Sanity hosting | `studio/` | Content authoring and deployed schema |
| Content Lake | Sanity managed service | None | Private production dataset |
| Search intelligence | Vercel Node.js Function | `app/api/search/route.ts` | Direct Sanity search with bounded Context/OpenAI fallback |
| Video playback | YouTube embeds | None | Playback and timestamp seeking on lesson pages |

Do not set the Vercel Root Directory to `studio`. The root `package.json` is the Next.js application and is already suitable for Vercel framework detection. A `vercel.json` file is not required for the current setup. Vercel documents Root Directory configuration in its [build settings](https://vercel.com/docs/builds/configure-a-build) and [monorepo guide](https://vercel.com/docs/monorepos).

Use these web project settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root Directory | `.` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Framework default (`.next`) |
| Node.js | `24.x` |

The project currently builds with Node.js 24. Vercel also uses Node.js 24 for new projects by default and documents available versions in its [Node.js runtime guide](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Environment-variable matrix

Add values in Vercel Project Settings for both Preview and Production as appropriate. Environment changes only apply to new deployments, so redeploy after changing a value. See [Vercel environment variables](https://vercel.com/docs/environment-variables).

Never copy values into this document or commit them to Git.

### Vercel web project

| Variable | Browser-visible | Mark Sensitive | Preview | Production | Notes |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | No | Clerk test key | Clerk production key | Must match the corresponding secret key |
| `CLERK_SECRET_KEY` | No | Yes | Clerk test secret | Clerk production secret | Server only |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | No | `/sign-in` | `/sign-in` | Existing route |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | No | `/sign-up` | `/sign-up` | Existing route |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | No | Current project ID | Current project ID | Project IDs are not secrets |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | No | `production`, unless a preview dataset is introduced | `production` | Current application reads this dataset |
| `SANITY_API_READ_TOKEN` | No | Yes | Rotated Viewer token | Rotated Viewer token | Required during build and runtime for the private dataset |
| `SANITY_CONTEXT_MCP_URL` | No | Yes | Current Context endpoint | Current Context endpoint | Keep server-side even though the URL alone is not a credential |
| `SANITY_ORGANIZATION_TOKEN` | No | Yes | Context Viewer token | Context Viewer token | Organization token; do not substitute the dataset token |
| `OPENAI_API_KEY` | No | Yes | Preview key or restricted project key | Production restricted project key | Used only by semantic fallback |
| `OPENAI_SEARCH_MODEL` | No | No | Tool-capable model name | Tool-capable model name | Configuration, not a credential |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Yes | No | Preview or shared public project token | Production public project token | Public by PostHog design |
| `NEXT_PUBLIC_POSTHOG_HOST` | Yes | No | `https://us.i.posthog.com` for the current project | Same, unless the PostHog region differs | Must match the configured PostHog region |

`NEXT_PUBLIC_SANITY_API_VERSION` remains in `.env.example`, but the current web client uses a code constant and does not read this variable. It is not required for deployment in the current implementation.

Vercel supports non-readable Sensitive variables for Preview and Production. Use that option for all tokens and secret keys. See [Sensitive environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables).

### Sanity Studio deployment

These belong in the Studio deployment environment or local shell, not in the Vercel web project:

| Variable | Required | Notes |
| --- | --- | --- |
| `SANITY_STUDIO_PROJECT_ID` | Yes | Same Sanity project used by the web app |
| `SANITY_STUDIO_DATASET` | Yes | `production` |
| `SANITY_AUTH_TOKEN` | CI only | Use a least-privilege deploy token for non-interactive schema/Studio deployments |

The deployed Studio must never contain dataset, organization, OpenAI, or Clerk secret tokens in its browser bundle. Sanity explains CI deployment tokens and hosted Studio behavior in its [deployment documentation](https://www.sanity.io/docs/studio/deployment).

## Pre-deployment release gates

### Gate 1: Credential safety

- Rotate the existing `SANITY_API_READ_TOKEN` in Sanity Manage.
- Replace it in local development and Vercel Preview/Production without printing it in terminals, tickets, or chat.
- Revoke the old token after the new token is verified.
- Confirm `.env.local` and `studio/.env.local` remain untracked.

### Gate 2: Search abuse protection

- Add per-IP or per-user rate limiting to `POST /api/search`.
- Bound request size and preserve the existing Zod query-length validation.
- Keep the current 4.5-second semantic fallback timeout.
- Decide on a reasonable anonymous quota because course browsing and search are intentionally public.
- Return a clear `429` response without calling Context or OpenAI after the quota is exceeded.

This is the main application change required before public Production traffic. Vercel Functions are suitable for I/O-bound AI work, but public endpoints still need application or platform-level abuse controls. See [Vercel Functions](https://vercel.com/docs/functions).

### Gate 3: Clerk production configuration

- Use Clerk test keys only for Preview.
- Create or activate the Clerk production instance.
- Add the owned production domain in Clerk and configure its DNS records.
- Add the Clerk production publishable and secret keys only to Vercel Production.
- Verify sign-in, sign-up, sign-out, session persistence, and the signed-in user button on the production domain.

Clerk's [Vercel deployment guide](https://clerk.com/docs/guides/development/deployment/vercel) distinguishes Preview test keys from Production keys and requires an owned domain for a production Clerk application.

### Gate 4: Sanity schema and Studio

From `studio/`:

```bash
npm ci
npx tsc --noEmit
npm run typegen
npm run build
npm run deploy-schema
npm run deploy
```

`npm run deploy` uses the configured Sanity application ID and `--schema-required`. Schema deployment is required for reliable Context schema access. See [Sanity schema deployment](https://www.sanity.io/docs/apis-and-sdks/schema-deployment) and [Sanity Context requirements](https://www.sanity.io/docs/ai/sanity-context).

When using Sanity-hosted Studio, its `*.sanity.studio` origin does not need an additional CORS entry. If the Studio is ever self-hosted elsewhere, add only its exact origin with credentials and never use a platform-wide credentialed wildcard. See [Sanity CORS guidance](https://www.sanity.io/docs/content-lake/cors).

### Gate 5: Source and build

From the repository root:

```bash
npm ci
npx tsc --noEmit
npm run lint
npm run build
```

Next.js 16 does not run ESLint as part of `next build`, so both commands are required. See the [Next.js installation and system requirements](https://nextjs.org/docs/app/getting-started/installation).

The current project has already passed TypeScript, ESLint, and a production build that generated 136 pages. Run the checks again against the exact commit selected for release and with production-like environment configuration.

## Deployment sequence

### Phase 1: Prepare

1. Rotate the Sanity Viewer credential.
2. Implement and verify `/api/search` rate limiting.
3. Review and commit the intended changes.
4. Push the reviewed commit to a branch for Preview.
5. Deploy the Sanity schema and hosted Studio.

### Phase 2: Vercel Preview

1. Import the Git repository into Vercel.
2. Leave Root Directory at the repository root.
3. Confirm the Next.js framework preset and Node.js 24.x.
4. Add all Preview environment variables from the matrix.
5. Keep the Preview deployment access-protected where available.
6. Deploy the branch and run the Preview smoke tests below.
7. Inspect Vercel Function logs without logging credential values.
8. Confirm Preview PostHog events are reaching the intended project.

### Phase 3: Production

1. Configure the owned production domain in Vercel.
2. Configure the same domain in the Clerk production instance.
3. Add every Production environment variable, using Clerk production keys.
4. Redeploy after the final environment-variable update.
5. Promote the verified commit or deploy from `main`.
6. Run Production smoke tests immediately.
7. Monitor Vercel errors, search latency, OpenAI usage, and PostHog ingestion during the initial release window.

## Preview and Production smoke tests

### Pages and Sanity content

- Open `/`, `/courses`, one `/courses/[slug]`, and one `/lessons/[slug]` route.
- Confirm Sanity cover images, lesson content, instructor data, and module ordering render correctly.
- Confirm no route returns a Sanity `401`, missing-variable error, or empty page.
- Publish a harmless Studio edit and confirm it reaches the web app after the configured cache interval.

### Authentication

- Create a test account from the navigation.
- Sign out and sign back in.
- Confirm the user avatar appears only when signed in.
- Confirm `/sign-in` and `/sign-up` work on the deployment domain.

### Search

Run against the deployment URL:

```bash
curl -N -X POST https://YOUR_DEPLOYMENT_DOMAIN/api/search \
  -H "Content-Type: application/json" \
  --data-binary '{"query":"data fetching"}'
```

- Confirm the stream includes `status`, `meta`, grounded `result`, and `done` events without an `error` event.
- Confirm video results include stored timestamps.
- Test one deliberately semantic query and confirm Context/OpenAI fallback completes within the configured bound.
- Exceed the configured search quota and confirm the route responds with `429` without invoking paid fallback services.

### Lesson video

- Open a timestamp result such as `/lessons/<slug>?start=93`.
- Confirm the YouTube player remains on the Vertex page and starts near the requested second.
- Confirm the lesson response includes `Referrer-Policy: strict-origin-when-cross-origin`.

### Analytics and security

- Confirm PostHog receives catalog views, lesson views, searches, and available video events.
- Inspect browser source maps, network requests, and rendered HTML.
- Confirm no value from `CLERK_SECRET_KEY`, `SANITY_API_READ_TOKEN`, `SANITY_ORGANIZATION_TOKEN`, or `OPENAI_API_KEY` reaches the browser.
- Confirm browser requests never call Sanity Context or OpenAI directly.

## Rollback

### Web rollback

1. In Vercel, promote or redeploy the previous known-good deployment.
2. Verify `/`, `/courses`, `/lessons/[slug]`, authentication, and `/api/search`.
3. If the incident involves a credential, rotate or revoke it immediately; a code rollback alone is insufficient.

### Sanity rollback

- Do not delete or re-import Content Lake documents as part of a normal web rollback.
- Web and Studio deployments are independent, so a Vercel rollback does not require taking Studio offline.
- If a schema deployment caused the incident, redeploy the last compatible Studio/schema source after confirming that the existing documents remain valid.

## Known operational concerns

- **Build-time Sanity dependency:** Static parameter and page generation query the private dataset during `next build`. A transient Sanity connection timeout occurred once locally; a retry completed successfully. Consider consolidating build queries or adding narrowly scoped retry behavior if Vercel builds show the same problem.
- **Sanity read performance:** The current server client uses `useCdn: false` for all reads. A later optimization can use Sanity's CDN for published runtime reads while reserving direct API reads for freshness-sensitive operations.
- **Search cost:** Direct search is fast, but deliberately unmatched queries can invoke Context and OpenAI. Rate limiting and usage alerts are required before public Production traffic.
- **Preview data isolation:** Preview currently reads the production dataset unless a separate dataset is explicitly configured. Treat Preview access and changes accordingly.
- **Cache delay:** Current content queries use time-based revalidation, generally between 60 and 300 seconds. Published edits are not guaranteed to appear immediately.
- **External dependencies:** Sanity, Clerk, OpenAI, Sanity Context, PostHog, and YouTube outages can degrade individual platform features.
- **Tracked generated artifacts:** `studio/dist`, `studio/.sanity`, and `studio/.video-ingestion` currently contribute roughly 13 MB of tracked generated files. They do not block the root Vercel build, but untracking them should be considered in a separate reviewed cleanup.

## Go/no-go checklist

Production is a **go** only when every item is checked:

- [ ] Sanity Viewer token rotated and old token revoked
- [ ] Search rate limiting deployed and tested
- [ ] Sanity schema deployed
- [ ] Sanity-hosted Studio deployed and opens successfully
- [ ] Vercel Preview environment configured and smoke-tested
- [ ] Clerk production instance, keys, and custom domain configured
- [ ] Vercel Production environment configured with sensitive variables protected
- [ ] TypeScript, ESLint, Studio checks, and production build pass on the release commit
- [ ] Production smoke tests pass
- [ ] Vercel, OpenAI, and PostHog monitoring is ready for the release window
