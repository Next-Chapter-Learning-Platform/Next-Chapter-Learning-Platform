const apiVersion = '2026-08-31'

function requireStudioValue(value: string | undefined, variableName: string) {
  if (!value) {
    throw new Error(`Missing environment variable: ${variableName}`)
  }

  return value
}

const projectId = requireStudioValue(
  process.env.SANITY_STUDIO_PROJECT_ID,
  'SANITY_STUDIO_PROJECT_ID',
)

const dataset = requireStudioValue(
  process.env.SANITY_STUDIO_DATASET,
  'SANITY_STUDIO_DATASET',
)

export {apiVersion, dataset, projectId}
