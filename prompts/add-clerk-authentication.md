# Add Clerk authentication with the Clerk CLI

## Goal

Add production-style Clerk authentication to the existing Vertex Next.js application. Link the repository to Clerk application `app_3IVNHN7FGl529Q1JR61fFI4fDBd`, preserve the public learning catalog, and expose clear sign-in, sign-up, and signed-in account controls in the existing header.

## Skills and guidance read

- `clerk`: routed the work to Clerk setup, CLI, and Next.js integration guidance.
- `clerk-cli`: established host execution requirements, CLI safety rules, authentication behavior, explicit app targeting, and `clerk doctor` verification.
- `clerk-setup`: established the current SDK package, provider placement, CLI-first setup, environment-key rules, and shadcn detection.
- `clerk-nextjs-patterns`: established async Clerk auth APIs and public-first proxy patterns.
- `clerk-nextjs-patterns/references/middleware-strategies.md`: established the public-first matcher shape for a public learning site.
- Installed Next.js 16 docs:
  - `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

## Existing code and configuration inspected

- `package.json`: existing Next.js 16.3.3 App Router app, React 19, npm lockfile, no Clerk dependency.
- `app/layout.tsx`: root layout currently renders children directly inside `<body>`.
- `app/page.tsx`: public Vertex landing/catalog page with a notification button and a decorative fake profile avatar in the header.
- `app/page.module.css`: existing desktop and responsive header/account styles.
- `app/globals.css`: Tailwind 4 import and global Vertex tokens.
- `next.config.ts`: minimal Next.js configuration.
- `.gitignore`: all `.env*` files are ignored.
- `tsconfig.json`: strict TypeScript and App Router aliases.
- Repository state: clean branch `clerk-auth`.
- No root `components.json`, `proxy.ts`, or `middleware.ts` exists.
- Clerk CLI check: not installed.
- Runtime check: Node 20.20.0 and npm 10.8.2.

## Decisions and assumptions

- Treat this as an existing npm-managed Next.js project; do not pass `--framework` or `--pm` to `clerk init`.
- Install the latest global CLI with npm because no different package-manager preference was supplied.
- Run Clerk commands that require the browser, OS credential store, home-directory Clerk state, or network on the host.
- Follow the requested command order: install CLI, immediately run `clerk auth login`, then initialize with the explicit Clerk application ID.
- Keep `/` and the catalog public. The initial proxy will establish Clerk session handling without protecting public pages; later private features can add explicit protected route matchers.
- Use `proxy.ts`, not `middleware.ts`, because the installed Next.js version is 16.3.3.
- Keep `ClerkProvider` inside `<body>`.
- Replace the fake avatar with Clerk controls. Signed-out visitors see distinct Sign in and Sign up actions; signed-in users see the existing notification affordance and Clerk `UserButton`.
- Preserve the existing visual language and responsive header instead of redesigning the page.
- Use current `@clerk/nextjs` APIs installed by the CLI. If server auth is added, always use `await auth()`.
- Do not install `@clerk/ui` because the project has no root `components.json` and therefore is not configured as a shadcn/ui project.
- Do not read or print any existing environment file. Allow the CLI to write its framework env file, and keep secret values ignored and server-only.
- If `clerk init` reports incomplete or unsupported scaffolding, use only the official Next.js Clerk quickstart to finish the missing pieces.

## Expected files to touch

- `package.json`
- `package-lock.json`
- `app/layout.tsx`
- `app/page.tsx`
- `app/page.module.css`
- `proxy.ts` (expected new file)
- `.env.example` (variable names only, if missing)
- An ignored Clerk-generated local environment/config file, as created by the CLI

The CLI may touch additional Clerk-specific files. Review every generated change before making manual edits.

## Implementation requirements

1. From the project root, install the latest Clerk CLI globally with npm.
2. Immediately run `clerk auth login` and wait for the user to finish the browser login if needed.
3. Confirm the installed CLI command syntax with its help/version output when necessary.
4. Run `clerk init --app app_3IVNHN7FGl529Q1JR61fFI4fDBd` with no framework or package-manager override.
5. Review the CLI output and generated diff without displaying environment values.
6. Confirm the CLI installed current `@clerk/nextjs` and placed `ClerkProvider` inside `<body>`.
7. For Next.js 16, create or correct root `proxy.ts` using `clerkMiddleware`.
8. Ensure `config.matcher` contains the ordinary Clerk/Next static-asset exclusion, followed by these entries exactly once and in this order:
   - `/(api|trpc)(.*)`
   - `/__clerk/:path*`
9. Keep the landing page public.
10. Integrate Clerk's signed-out and signed-in controls into the existing header:
    - signed out: visible Sign in and Sign up controls;
    - signed in: notification control and `UserButton`;
    - no duplicate controls or decorative fake profile avatar;
    - preserve responsive behavior and accessible labels/focus states.
11. Add `.env.example` only with required variable names and safe placeholders/comments. Never include real keys.
12. Run `clerk doctor` after initialization and resolve actionable integration failures.
13. If CLI scaffolding is incomplete, follow Clerk's official Next.js quickstart for only the missing steps.

## Security considerations

- Never expose, print, commit, or import `CLERK_SECRET_KEY` in client code.
- Only `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` may be browser-visible.
- Keep Clerk-generated environment files ignored.
- Do not read existing environment files during implementation or verification.
- Use `@clerk/nextjs`, not `@clerk/clerk-react`.
- Keep authentication/session handling in Clerk's proxy and server APIs; do not add a custom token/session implementation.
- Keep public routes public and avoid accidentally gating the catalog.
- Use `await auth()` for every Next.js server-side auth call.

## Acceptance criteria

- The CLI is installed at the latest available version and the user is authenticated with Clerk.
- The repository is initialized against exactly `app_3IVNHN7FGl529Q1JR61fFI4fDBd`.
- `@clerk/nextjs` is installed and the app builds with its current SDK APIs.
- `ClerkProvider` is inside `<body>`.
- Root `proxy.ts` exists and includes `/(api|trpc)(.*)` immediately before `/__clerk/:path*`, each once.
- The home/catalog remains accessible while signed out.
- Signed-out users see clear Sign in and Sign up controls in the header.
- After authentication, the user sees a Clerk profile button and can recognize the signed-in state.
- No fake account avatar remains.
- The header remains polished and responsive.
- No secret is printed, committed, or referenced from client code.
- Clerk doctor, type checking, linting, and production build complete successfully.
- The development server starts and the auth UI is verified in the browser.

## Automated checks

Run from the repository root and report exact results:

1. `clerk --version`
2. `clerk doctor`
3. `npx tsc --noEmit`
4. `npm run lint`
5. `npm run build`
6. Start `npm run dev` and confirm it becomes ready without runtime errors.

## Exact manual test steps

1. Open the local Vertex home page in a signed-out browser session.
2. Confirm the page and catalog load without being redirected.
3. Confirm the header shows visible Sign in and Sign up actions and no profile avatar.
4. Select Sign in, complete the Clerk flow, and return to Vertex.
5. Confirm a Clerk profile icon appears in the header.
6. Open the profile menu and confirm it identifies the signed-in test account.
7. Sign out and confirm the Sign in and Sign up actions return.
8. Select Sign up and create the first test user if one does not yet exist.
9. Confirm signup succeeds and the profile icon appears.
10. If Clerk displays a “Configure your application” callout, select it to finish application configuration.
11. Repeat the signed-out and signed-in header checks at desktop and mobile widths.

