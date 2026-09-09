import posthog from "posthog-js";
import type { CaptureResult } from "posthog-js";

// Local development runs share the production PostHog project, so an exception
// thrown in a dev browser (for example a transient vendor network error) would
// otherwise open a real error tracking issue. Drop exceptions raised on
// localhost so only deployed environments report them.
function dropLocalhostExceptions(
  event: CaptureResult | null
): CaptureResult | null {
  if (
    event?.event === "$exception" &&
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]")
  ) {
    return null;
  }
  return event;
}

if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
  if (process.env.NODE_ENV === "development") {
    console.error(
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, " +
        "this causes events to be silently missed. " +
        "This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
    );
  }
} else {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
    before_send: dropLocalhostExceptions,
  });
}

// IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches,
// especially components like a PostHogProvider. instrumentation-client.ts is the correct solution
// for initializing client-side PostHog in Next.js 15.3+ apps.
