import {readFile} from 'node:fs/promises'
import path from 'node:path'

import {getCliClient} from 'sanity/cli'

const apiVersion = '2026-08-31'
const seedPath = path.resolve(process.cwd(), '..', 'seed.ndjson')
const client = getCliClient({apiVersion})

type SeedCourse = {
  _id: string
  _type: 'course'
  coverImage?: {
    _sanityAsset?: string
  }
}

type LiveCourse = {
  _id: string
  coverImage?: Record<string, unknown> & {
    asset?: {_ref?: string}
  }
}

function getImageUrl(source: string | undefined, courseId: string) {
  const prefix = 'image@'

  if (!source?.startsWith(prefix)) {
    throw new Error(`${courseId} does not have a valid image@ source in seed.ndjson`)
  }

  return source.slice(prefix.length)
}

async function downloadImage(url: string) {
  let lastError: unknown

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(45_000),
        headers: {'User-Agent': 'Vertex-Sanity-Cover-Repair/1.0'},
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }

      return {
        bytes: Buffer.from(await response.arrayBuffer()),
        contentType: response.headers.get('content-type') ?? 'image/jpeg',
      }
    } catch (error) {
      lastError = error

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1_000))
      }
    }
  }

  throw lastError
}

async function main() {
  const seed = await readFile(seedPath, 'utf8')
  const seedCourses = seed
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as {_type?: string})
    .filter((document): document is SeedCourse => document._type === 'course')

  if (seedCourses.length === 0) {
    throw new Error(`No course documents found in ${seedPath}`)
  }

  const ids = seedCourses.map((course) => course._id)
  const liveCourses = await client.fetch<LiveCourse[]>(
    '*[_type == "course" && _id in $ids]{_id, coverImage}',
    {ids},
  )
  const liveById = new Map(liveCourses.map((course) => [course._id, course]))
  const failures: string[] = []

  for (const seedCourse of seedCourses) {
    const liveCourse = liveById.get(seedCourse._id)

    if (!liveCourse) {
      failures.push(`${seedCourse._id}: document is missing from the configured dataset`)
      continue
    }

    if (liveCourse.coverImage?.asset?._ref) {
      console.log(`skip ${seedCourse._id}: cover asset already linked`)
      continue
    }

    try {
      const imageUrl = getImageUrl(seedCourse.coverImage?._sanityAsset, seedCourse._id)
      const {bytes, contentType} = await downloadImage(imageUrl)
      const filename = `${seedCourse._id.replace(/[^a-zA-Z0-9_-]/g, '-')}.jpg`
      const asset = await client.assets.upload('image', bytes, {filename, contentType})
      const coverImage = liveCourse.coverImage ?? {_type: 'image'}

      await client
        .patch(seedCourse._id)
        .set({
          coverImage: {
            ...coverImage,
            _type: 'image',
            asset: {_type: 'reference', _ref: asset._id},
          },
        })
        .commit()

      console.log(`linked ${seedCourse._id} -> ${asset._id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push(`${seedCourse._id}: ${message}`)
    }
  }

  const verification = await client.fetch<{
    total: number
    withCoverAsset: number
    missingCoverAsset: number
  }>(`{
    "total": count(*[_type == "course"]),
    "withCoverAsset": count(*[_type == "course" && defined(coverImage.asset._ref)]),
    "missingCoverAsset": count(*[_type == "course" && !defined(coverImage.asset._ref)])
  }`)

  console.log('verification', verification)

  if (failures.length > 0) {
    throw new Error(`Cover repair failed:\n${failures.join('\n')}`)
  }

  if (verification.withCoverAsset !== verification.total || verification.missingCoverAsset !== 0) {
    throw new Error('Cover repair completed, but the dataset still has courses without cover assets')
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
