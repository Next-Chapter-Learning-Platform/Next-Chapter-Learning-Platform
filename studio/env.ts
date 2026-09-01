const apiVersion = '2026-08-31'

function requireStudioValue(value: string | undefined, variableName: string) {
  if (!value) {
    throw new Error(`Missing environment variable: ${variableName}`)
  }

  return value
}

const projectId = requireStudioValue(
  process.env.SANITY_STUDIO_PROJECT_ID ??
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'SANITY_STUDIO_PROJECT_ID (or NEXT_PUBLIC_SANITY_PROJECT_ID)',
)

const dataset = requireStudioValue(
  process.env.SANITY_STUDIO_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET,
  'SANITY_STUDIO_DATASET (or NEXT_PUBLIC_SANITY_DATASET)',
)

export {apiVersion, dataset, projectId}
