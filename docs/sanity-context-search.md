# Vertex search: Sanity Context setup

Vertex connects to the organization-scoped Sanity Context MCP from the server. Context setup lives in the Sanity Dashboard rather than in the Studio bundle.

## Endpoint

1. Enable Context for the Sanity organization.
2. In the Dashboard Context app, create a GROQ-mode MCP named `vertex-search`.
3. Add the Vertex project and production dataset as its source.
4. Copy the endpoint URL into `SANITY_CONTEXT_MCP_URL`.
5. Create an organization API token with the least-privilege Context Viewer role and store it as `SANITY_ORGANIZATION_TOKEN` on the server.

The endpoint has this shape:

```text
https://api.sanity.io/v1/context/organizations/<organization-id>/mcp/<endpoint-name>
```

A project-level dataset token cannot authenticate this endpoint.

## Content filter

Use this filter expression:

```groq
!(_id in path("drafts.**")) && _type in ["course", "lesson", "video"]
```

## Instructions

Use these concise dataset-specific instructions:

```text
- Lessons have no parent field. Find their course by traversing course.modules[].lessons references; derive module and lesson numbers from array order.
- Search lesson topics in title, keyPoints, and pt::text(notes). Portable Text notes cannot be matched directly.
- Tokenize learner searches, wildcard each useful token, and OR the token patterns. Never match the whole phrase as one wildcard pattern.
- For a video moment, join lesson.videoUrl to video.url. Match chapters[].label first and use chunks[].text only when no chapter matches.
- Project only matching chapter entries or a few matching chunks. Never return an entire chunks array or transcript.
- Every result must use real document IDs, slugs, labels, URLs, durations, and startSeconds returned by a tool query.
- If semantic similarity is unavailable, retry with wildcard text matching.
```

## Required server variables

```text
SANITY_CONTEXT_MCP_URL
SANITY_ORGANIZATION_TOKEN
OPENAI_API_KEY
OPENAI_SEARCH_MODEL
```

Keep every value server-only. Do not add a `NEXT_PUBLIC_` prefix.

## Deployment and verification

From `studio/`, deploy the schema and Studio application:

```text
npm run deploy-schema
npm run deploy
```

Then verify that the MCP endpoint exposes `initial_context`, `groq_query`, and schema-reading tools. The current seed has no `video` documents, so timestamped video cards correctly remain absent until the separate transcript/chapter ingestion step is completed.
