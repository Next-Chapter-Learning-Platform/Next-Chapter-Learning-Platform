# Write the Vertex Vercel deployment plan

## Goal

Create a concise, production-oriented deployment plan for Vertex that explains how to deploy the root Next.js application to Vercel while keeping the Sanity Studio as a standalone application deployed separately through Sanity hosting. Answer whether the project is ready for preview and production deployment, identify release blockers, and give exact verification and rollback steps. Do not deploy anything in this task.

## Skills and documentation consulted

- `AGENTS.md`
- `.agents/skills/sanity-best-practices/SKILL.md`
- `.agents/skills/sanity-best-practices/references/nextjs.md`
- `.agents/skills/sanity-best-practices/references/project-structure.md`
- Installed Next.js project configuration and package scripts
- Official Vercel monorepo, build, Functions, and environment-variable documentation
- Official Sanity Studio deployment, schema deployment, Context, and CORS documentation
- Official Clerk Vercel deployment documentation

## Existing code and configuration inspected

- Root `package.json`, `next.config.ts`, `.env.example`, `.gitignore`, and `proxy.ts`
- `sanity/lib/env.ts`, `sanity/lib/client.ts`, and the server-only Sanity fetch layer
- `app/api/search/route.ts` and `lib/search/context-client.ts`
- `instrumentation-client.ts` and `lib/posthog-server.ts`
- `studio/package.json`, `studio/sanity.config.ts`, `studio/sanity.cli.ts`, `studio/env.ts`, and `studio/.env.example`
- Current Git status and tracked generated Studio/ingestion artifacts

## Current assessment

- The repository root is the Next.js application and is the correct Vercel project root. Vercel can auto-detect Next.js from the root `package.json`; a `vercel.json` file is not currently required.
- `studio/` is intentionally standalone. It does not need to run inside the Vercel deployment and is not a runtime dependency of the web application. Its browser UI talks to Sanity's hosted Content Lake.
- The Studio has a configured Sanity deployment `appId` and scripts for both schema and Studio deployment. Deploy it separately with Sanity rather than changing the application to an embedded Studio.
- The root production build currently passes and generates 136 pages. The web app depends on Sanity during build-time prerendering and at runtime.
- The dataset is private. `SANITY_API_READ_TOKEN` is required during both the Vercel build and server-function execution.
- Search uses a public Node.js route. Direct grounded search is cheap, but a no-result query invokes the Sanity Context MCP and OpenAI. Without rate limiting, arbitrary public traffic can create cost and abuse risk.
- The working tree contains many uncommitted implementation files. A Git-connected Vercel deployment will not contain those changes until they are committed and pushed.
- Production environment-variable values in Vercel have not been verified. Existing local environment files must not be read or copied into documentation.
- A server-side Sanity Viewer credential appeared in local build diagnostic output during verification. Its value must never be copied into the plan, logs, or source; rotate that credential before production and update local/Vercel configuration.
- The repository currently tracks generated Studio build output and video-ingestion artifacts (about 13 MB total). This is not a runtime blocker, but it increases repository and deployment source size and should be cleaned up deliberately in a separate approved change.

## Deliverable

Create `docs/vercel-deployment-plan.md` with these sections:

1. **Readiness verdict**
   - Preview deployment: allowed after Vercel Preview variables are configured and the current changes are committed/pushed.
   - Production deployment: not yet recommended until the credential rotation, production Clerk/domain setup, environment verification, public search abuse protection, and Sanity Studio/schema deployment gates are complete.

2. **Target architecture**
   - Vercel project: repository root, Next.js framework preset, npm install, `npm run build`, default `.next` output.
   - Sanity project: hosted Content Lake remains remote; deploy the standalone `studio/` separately with Sanity CLI.
   - No embedded Studio and no second backend.

3. **Environment-variable matrix**
   - Public web values:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
     - `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
     - `NEXT_PUBLIC_SANITY_PROJECT_ID`
     - `NEXT_PUBLIC_SANITY_DATASET`
     - `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`
     - `NEXT_PUBLIC_POSTHOG_HOST`
   - Sensitive server-only values, marked Sensitive in Vercel Preview and Production:
     - `CLERK_SECRET_KEY`
     - `SANITY_API_READ_TOKEN`
     - `SANITY_CONTEXT_MCP_URL`
     - `SANITY_ORGANIZATION_TOKEN`
     - `OPENAI_API_KEY`
     - `OPENAI_SEARCH_MODEL` is configuration rather than a secret, but remains server-only.
   - Studio-only deployment values:
     - `SANITY_STUDIO_PROJECT_ID`
     - `SANITY_STUDIO_DATASET`
     - `SANITY_AUTH_TOKEN` only for non-interactive Studio/schema CI deployment.
   - Note that `NEXT_PUBLIC_SANITY_API_VERSION` appears in `.env.example`, but the current web client uses a code constant and does not consume it.
   - Never paste actual values into the document.

4. **Pre-deployment release gates**
   - Rotate the exposed Sanity Viewer token and replace it everywhere it is configured.
   - Add rate limiting/abuse controls for `POST /api/search`; keep search public unless product requirements change.
   - Configure separate Preview and Production Vercel environments.
   - Use Clerk test keys for Preview; use a Clerk production instance, production keys, and owned custom domain for Production.
   - Deploy the current Sanity schema and hosted Studio so Context sees the current content model.
   - Commit and push the intended source changes from a reviewed branch.
   - Decide separately whether to untrack generated `studio/dist`, `studio/.sanity`, and `studio/.video-ingestion` artifacts; do not remove them as part of this documentation task.

5. **Deployment sequence**
   - Rotate credentials first.
   - Run local checks.
   - Deploy schema and Studio from `studio/`.
   - Create/import the root Vercel project and configure Preview variables.
   - Deploy Preview, execute smoke tests, inspect Function logs and PostHog events.
   - Configure Clerk production domain/keys and Production variables.
   - Promote/deploy Production only after gates pass.

6. **Exact checks and smoke tests**
   - Root: `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.
   - Studio: `npm ci`, `npx tsc --noEmit`, `npm run typegen`, `npm run build`, `npm run deploy-schema`, `npm run deploy`.
   - Verify homepage/catalog/course/lesson routes, Clerk sign-in/sign-up, YouTube timestamp playback, Sanity images, search direct results and semantic fallback, PostHog events, response headers, and no server-only secrets in browser bundles/network payloads.

7. **Rollback**
   - Roll back the web app using Vercel's previous successful deployment.
   - Keep Sanity content/schema deployment independent; do not delete content as a web rollback step.
   - Rotate/revoke credentials immediately if logs or browser payloads expose them.

8. **Known operational concerns**
   - Build-time Sanity dependency and transient upstream timeouts.
   - Public AI-search cost/abuse risk.
   - Preview deployments using production content unless separate datasets are introduced later.
   - Cache revalidation is time-based, so published changes may take up to the configured interval to appear.
   - OpenAI, Context, Sanity, PostHog, Clerk, and YouTube are external runtime dependencies.

## Security requirements

- Never read, print, commit, or document values from `.env.local` or `studio/.env.local`.
- Never expose `CLERK_SECRET_KEY`, `SANITY_API_READ_TOKEN`, `SANITY_ORGANIZATION_TOKEN`, `SANITY_AUTH_TOKEN`, or `OPENAI_API_KEY` to the browser.
- Mark production and preview credentials Sensitive in Vercel where supported.
- Do not deploy, rotate credentials, alter dashboards, add domains, or mutate Sanity/Vercel/Clerk state in this documentation-only task.

## Acceptance criteria

- `docs/vercel-deployment-plan.md` clearly answers whether Preview and Production deployments are ready.
- The document treats the standalone Sanity Studio as the recommended separate deployment, not a problem to solve.
- Every required environment variable is classified correctly.
- Production blockers, exact deployment order, smoke tests, and rollback steps are explicit.
- Claims about Vercel, Sanity, and Clerk are linked to their official current documentation.
- No secret values or local environment-file contents appear in the document.

## Checks

- Review the document against `.env.example` and actual `process.env` references without reading local environment files.
- Confirm all links use official Vercel, Sanity, Clerk, or PostHog sources.
- Run `git diff --check -- docs/vercel-deployment-plan.md`.
- Confirm the task made no external deployment or configuration changes.

## Manual review steps

1. Open `docs/vercel-deployment-plan.md`.
2. Confirm the readiness verdict distinguishes Preview from Production.
3. Confirm the Vercel root is the repository root and the Studio deploys separately through Sanity.
4. Compare the environment-variable matrix with Vercel Project Settings without copying values into source.
5. Confirm the production gates include credential rotation and search rate limiting.
