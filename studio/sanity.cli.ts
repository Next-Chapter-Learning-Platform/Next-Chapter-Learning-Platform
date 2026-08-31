import {defineCliConfig} from 'sanity/cli'

import {dataset, projectId} from './env'

export default defineCliConfig({
  api: {projectId, dataset},
  schemaExtraction: {
    enabled: true,
    path: 'schema.json',
  },
  typegen: {
    enabled: true,
    path: '../sanity/queries/**/*.{ts,tsx,js,jsx}',
    schema: 'schema.json',
    generates: '../sanity.types.ts',
    overloadClientMethods: true,
  },
})
