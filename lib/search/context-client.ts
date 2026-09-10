import 'server-only'

import {createMCPClient} from '@ai-sdk/mcp'

export class SearchConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SearchConfigurationError'
  }
}

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new SearchConfigurationError(`Missing required search configuration: ${name}`)
  return value
}

export function getSearchConfiguration() {
  const endpoint = required('SANITY_CONTEXT_MCP_URL')
  const url = new URL(endpoint)

  if (url.protocol !== 'https:' || url.hostname !== 'api.sanity.io') {
    throw new SearchConfigurationError(
      'SANITY_CONTEXT_MCP_URL must be an HTTPS api.sanity.io Context endpoint.',
    )
  }

  return {
    endpoint: url.toString(),
    organizationToken: required('SANITY_ORGANIZATION_TOKEN'),
    openAiApiKey: required('OPENAI_API_KEY'),
    openAiModel: required('OPENAI_SEARCH_MODEL'),
  }
}

let initialContextPromise: Promise<string> | null = null

export function getInitialContext() {
  if (initialContextPromise) return initialContextPromise

  initialContextPromise = (async () => {
    const {endpoint, organizationToken} = getSearchConfiguration()
    const initialContextUrl = new URL(endpoint)
    initialContextUrl.pathname = `${initialContextUrl.pathname.replace(/\/$/, '')}/initial-context`

    const response = await fetch(initialContextUrl, {
      headers: {Authorization: `Bearer ${organizationToken}`},
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Sanity Context initial context request failed with status ${response.status}.`)
    }

    const context = await response.text()
    if (!context.trim()) throw new Error('Sanity Context returned an empty initial context.')
    if (context.length > 1_000_000) throw new Error('Sanity Context initial context is unexpectedly large.')
    return context
  })().catch((error) => {
    initialContextPromise = null
    throw error
  })

  return initialContextPromise
}

export async function createSanityContextClient() {
  const {endpoint, organizationToken} = getSearchConfiguration()
  return createMCPClient({
    transport: {
      type: 'http',
      url: endpoint,
      headers: {Authorization: `Bearer ${organizationToken}`},
    },
  })
}

