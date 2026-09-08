# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured for Vertex, a Next.js learning platform. Session Replay was already enabled; Error Tracking and Support were enabled with server-owned defaults. Health checks, Error Tracking, and Support signal sources are enabled, and two Replay Vision monitors now feed confirmed defects into the inbox.

Fresh scout configurations and monitors start being evaluated within about 30 minutes. Findings will appear in the [Self-driving inbox](https://us.posthog.com/project/597479/inbox).

## AI data processing

Approved.

## GitHub

The PostHog GitHub App was already connected before this setup. GitHub Issues was not selected as a Self-driving responder, so no GitHub Issues warehouse source or responder was added.

## Products enabled

| Product | Result | Notes |
|---|---|---|
| Session Replay | already enabled | Web client initialization does not disable session recording. |
| Error Tracking | enabled | Web client initialization explicitly allows exception capture. |
| Support (Conversations) | enabled | Tickets begin arriving after an inbound email, inbox, or Slack channel is connected in PostHog. |

## Signal sources

| source_product | source_type | Action |
|---|---|---|
| signals_scout | cross_source_issue | Kept enabled through the server default; no row is required unless opting out. |
| health_checks | health_issue | Enabled. |
| error_tracking | issue_created | Enabled. |
| error_tracking | issue_reopened | Enabled. |
| error_tracking | issue_spiking | Enabled. |
| conversations | ticket | Enabled. It remains idle until a Support channel is connected. |
| session_replay | session_analysis_cluster | Skipped; this retired route is replaced by Replay Vision scanners. |
| replay_vision | scanner_finding | No source row created; scanners self-authorize through `emits_signals`. |

## Connected tools

No external tools were selected in the connected-tools prompt, so no warehouse source or external responder was added. The existing GitHub App connection remains unchanged.

## Scout troop

**Enabled (3)**

| Scout | Why it is enabled |
|---|---|
| `signals-scout-general` | Watches cross-product patterns and surfaces without a dedicated specialist. |
| `signals-scout-product-analytics` | Vertex uses learner engagement events across catalog, course, search, bookmarks, and starts. |
| `signals-scout-web-analytics` | Vertex is a web learning application and web analytics is active. |

**Disabled (24)**

| Scout(s) | Reason |
|---|---|
| `signals-scout-error-tracking` | Covered by the enabled native Error Tracking signal sources. |
| `signals-scout-session-replay` | Covered by the Replay Vision monitors below. |
| `signals-scout-ai-observability` | No AI observability events or traces are configured. |
| `signals-scout-anomaly-detection` | No actively used saved insights or dashboards warrant a separate anomaly specialist yet. |
| `signals-scout-apm` | No APM or distributed tracing evidence. |
| `signals-scout-conversations` | Support is newly enabled but no inbound channel or ticket stream is connected. |
| `signals-scout-csp-violations` | No CSP reporting evidence. |
| `signals-scout-customer-analytics` | No account or group analytics evidence. |
| `signals-scout-data-pipelines` | No active CDP delivery, export, or pipeline surface. |
| `signals-scout-data-warehouse` | No warehouse sources are connected. |
| `signals-scout-experiments` | No active experiments. |
| `signals-scout-feature-flags` | No active feature flags. |
| `signals-scout-health-checks` | Native health-check responder is enabled; a specialist is not needed yet. |
| `signals-scout-inbox-validation` | Fresh inbox with no resolved reports to validate. |
| `signals-scout-insight-alerts` | No enabled insight alerts. |
| `signals-scout-logs` | No PostHog Logs evidence. |
| `signals-scout-mcp-tool-calls` | No MCP-tool telemetry surface is in scope for Vertex product monitoring. |
| `signals-scout-observability-gaps` | No event volume or insight coverage evidence has accumulated yet. |
| `signals-scout-replay-vision` | No accumulated scanner observations yet; turn on later to analyze scanner trends. |
| `signals-scout-revenue-analytics` | No payment or revenue data evidence. |
| `signals-scout-skills-store` | Skill-store hygiene is not a product surface for this application. |
| `signals-scout-surveys` | No surveys exist. |
| `signals-scout-tasks` | No PostHog Tasks delivery surface is active. |
| `signals-scout-web-vitals` | No Core Web Vitals evidence yet. |

**Run budget**

- Maximum runs per day: **100**
- Runs used today: **1**
- Runs remaining today: **99**
- Announcement: Scouts are in early access. Each project gets up to 100 scout runs a day. Contact `team-self-driving@posthog.com` if more capacity is needed.

## Custom scouts

No custom scouts were created because the proposals were not selected.

| Considered surface | Why it was proposed | Outcome |
|---|---|---|
| Course discovery and learning starts | `courses_catalog_viewed`, course-card interaction, course views, and starts form Vertex’s core learner path. The enabled product-analytics scout partly covers conversion regression, but this would additionally detect entry-volume collapse. | Proposed, declined. |
| Learning search availability | Homepage search submission is a concrete, watchable interaction; a sharp drop while site activity remains normal can reveal a hidden or broken search flow. | Proposed, declined. |

The current built-in troop covers the chosen generic surfaces. If a future custom scout becomes noisy, set its config `emit` field to `false` in PostHog to run it in dry-run mode.

## Replay Vision scanners

A scanner is an LLM that watches individual session recordings on a schedule and pushes material on-screen defects to the inbox. These are the only items in this setup that spend Replay Vision quota. Findings arrive at half weight and require corroboration before promotion into a report.

| Brief | Scanner | Status | Query scope | Sampling | Estimate |
|---|---|---|---|---|---|
| Breakage monitor | **Broken course discovery** | Created | Sessions whose URL includes `/courses`, covering the catalog and course-detail path where learners choose and start learning. | 0.5 | 0 observations/month; 0 credits/month at creation. |
| Frustration monitor | **Learner navigation frustration** | Created | Sessions with a `$rageclick`; no URL filter, keeping it separate from the course-path monitor. | 1.0 | 0 observations/month; 0 credits/month at creation. |

Session Replay has no recordings yet. Both monitors are armed and will begin working as soon as recordings arrive. The organization had 2,500 Replay Vision credits remaining when configured, with no projected scanner spend from the current zero-recording estimate.

## Follow-ups

- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so the enabled Conversations responder can receive tickets.
- [ ] Generate real browser traffic with the configured PostHog client so Session Replay recordings and Replay Vision monitors have sessions to inspect.
- [ ] Revisit disabled specialists as surveys, feature flags, experiments, payments, logs, or other product surfaces become active.
- [ ] The shared `creating-replay-vision-scanners` mechanics skill was unavailable from the project skill store; scanner sizing was completed through the supported estimate and quota endpoints instead.

## What happens next

The scout coordinator picks up fresh configurations within about 30 minutes. Scout runs draw from the verified daily budget, and corroborated findings cluster into reports in the [Self-driving inbox](https://us.posthog.com/project/597479/inbox), where immediately actionable findings can start coding tasks.

## Files modified or created

| File | Change |
|---|---|
| `posthog-self-driving-report.md` | Created this Self-driving configuration report. |

## Manual next steps

1. Connect a Support inbound channel if Support tickets should feed the inbox.
2. Exercise the course catalog and course-detail flow with the PostHog client configured to generate recordings.
3. Review initial findings after approximately 30 minutes in the inbox.
