import 'server-only'

const apiVersion = '2026-08-31'

function requireEnvironmentValue(value: string | undefined, variableName: string) {
  if (!value) {
    throw new Error(`Missing environment variable: ${variableName}`)
  }

  return value
}

const projectId = requireEnvironmentValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
)

const dataset = requireEnvironmentValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'NEXT_PUBLIC_SANITY_DATASET',
)

const readToken = requireEnvironmentValue(
  process.env.SANITY_API_READ_TOKEN,
  'SANITY_API_READ_TOKEN',
)

export {apiVersion, dataset, projectId, readToken}
