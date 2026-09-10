'use client'

import Image from 'next/image'
import Link from 'next/link'
import posthog from 'posthog-js'
import {useEffect, useMemo, useState} from 'react'

import type {SearchImage, SearchResult, SearchStreamEvent} from '@/lib/search/schema'

import styles from './page.module.css'

type Meta = Extract<SearchStreamEvent, {type: 'meta'}>
type SortMode = 'relevant' | 'course' | 'shortest'

const EMPTY_META: Meta = {
  type: 'meta',
  requestId: '',
  total: 0,
  courseCount: 0,
  videoCount: 0,
  lessonCount: 0,
}

function Icon({name, size = 20}: {name: 'arrow' | 'external' | 'file' | 'folder' | 'play' | 'search'; size?: number}) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (name === 'arrow') return <svg {...props}><path d="M5 12h14M14 6l6 6-6 6" /></svg>
  if (name === 'external') return <svg {...props}><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6H5V6h6" /></svg>
  if (name === 'file') return <svg {...props}><path d="M6 3h8l4 4v14H6zM14 3v5h5" /><path d="M9 13h6M9 17h5" /></svg>
  if (name === 'folder') return <svg {...props}><path d="M3 6h7l2 3h9v10H3z" /></svg>
  if (name === 'play') return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4z" /></svg>
  return <svg {...props}><circle cx="10.5" cy="10.5" r="7.5" /><path d="m16 16 5 5" /></svg>
}

function isSearchEvent(value: unknown): value is SearchStreamEvent {
  return Boolean(value && typeof value === 'object' && 'type' in value && typeof value.type === 'string')
}

function formatTimestamp(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`
    : `${minutes}:${remainder.toString().padStart(2, '0')}`
}

function initials(title: string) {
  return (title.match(/[A-Za-z0-9]+/g) ?? ['V'])
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function ResultImage({image, alt, className}: {image: SearchImage | null; alt: string; className: string}) {
  if (!image) return <span className={`${className} ${styles.imageFallback}`}>{initials(alt)}</span>
  return (
    <span className={className}>
      <Image
        src={image.url}
        alt={image.alt || alt}
        fill
        sizes="(max-width: 640px) calc(100vw - 64px), 350px"
        placeholder={image.lqip ? 'blur' : 'empty'}
        blurDataURL={image.lqip ?? undefined}
      />
    </span>
  )
}

function CourseIdentity({result}: {result: SearchResult}) {
  return (
    <div className={styles.courseIdentity}>
      <ResultImage image={result.course.image} alt={result.course.title} className={styles.courseIcon} />
      <span>{result.course.title}</span>
    </div>
  )
}

function ResultCard({result}: {result: SearchResult}) {
  const lessonLabel = `Lesson ${result.module.number}.${result.lesson.number}`
  const lessonHref = `/lessons/${result.lesson.slug}`

  return (
    <li className={styles.resultCard}>
      <div className={styles.resultVisual}>
        {result.kind === 'video' ? (
          <>
            <ResultImage image={result.lesson.thumbnail} alt={result.lesson.title} className={styles.videoImage} />
            <span className={styles.playBadge}><Icon name="play" size={32} /></span>
            <span className={styles.durationBadge}>{formatTimestamp(result.lesson.duration)}</span>
          </>
        ) : (
          <div className={styles.lessonVisual}>
            <Icon name="file" size={25} />
            <ul>
              {result.keyPoints.slice(0, 3).map((point) => <li key={point}>{point}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className={styles.resultContent}>
        <CourseIdentity result={result} />
        <span className={`${styles.resultKind} ${result.kind === 'lesson' ? styles.lessonKind : ''}`}>
          {result.kind}
        </span>
        <h2>{result.lesson.title}</h2>
        <p>{result.description}</p>
        <div className={styles.resultMeta}>
          <span><Icon name="file" size={17} />{lessonLabel}</span>
          <span className={styles.metaDot}>·</span>
          <span><Icon name="folder" size={18} />{result.module.title}</span>
        </div>
      </div>

      <Link
        className={styles.resultAction}
        href={result.kind === 'video' ? `${lessonHref}?start=${result.startSeconds}` : lessonHref}
      >
        {result.kind === 'video' ? (
          <><Icon name="play" size={21} />Watch from {formatTimestamp(result.startSeconds)}</>
        ) : (
          <>View lesson <Icon name="external" size={18} /></>
        )}
        <Icon name="arrow" size={20} />
      </Link>
    </li>
  )
}

export function SearchResults({query}: {query: string}) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [meta, setMeta] = useState<Meta>(EMPTY_META)
  const [message, setMessage] = useState(query ? 'Preparing intelligent search…' : '')
  const [error, setError] = useState<string | null>(null)
  const [complete, setComplete] = useState(query.length < 2)
  const [sort, setSort] = useState<SortMode>('relevant')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (query.length < 2) return

    const controller = new AbortController()
    let active = true
    let localMeta = EMPTY_META
    let localResults: SearchResult[] = []
    let localError: string | null = null
    const startedAt = performance.now()

    async function run() {
      try {
        await Promise.resolve()
        if (!active) return
        setResults([])
        setMeta(EMPTY_META)
        setMessage('Preparing intelligent search…')
        setError(null)
        setComplete(false)

        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({query}),
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          const payload = (await response.json().catch(() => null)) as {error?: string} | null
          throw new Error(payload?.error || 'Search request failed.')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (active) {
          const {done, value} = await reader.read()
          buffer += decoder.decode(value, {stream: !done})
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const item of lines) {
            if (!item.trim()) continue
            const event: unknown = JSON.parse(item)
            if (!isSearchEvent(event)) continue
            if (event.type === 'status') setMessage(event.message)
            if (event.type === 'meta') {
              localMeta = event
              setMeta(event)
            }
            if (event.type === 'result') {
              localResults = [...localResults, event.result]
              setResults(localResults)
            }
            if (event.type === 'error') {
              localError = event.message
              setError(event.message)
            }
            if (event.type === 'done') {
              setComplete(true)
              posthog.capture('search_performed', {
                query_length: query.length,
                total_results: localMeta.total,
                course_count: localMeta.courseCount,
                video_results: localMeta.videoCount,
                lesson_results: localMeta.lessonCount,
                duration_ms: event.durationMs,
                status: localError ? 'error' : 'success',
              })
            }
          }

          if (done) break
        }
      } catch (cause) {
        if (!active || controller.signal.aborted) return
        const failure = cause instanceof Error ? cause.message : 'Search is temporarily unavailable.'
        setError(failure)
        setComplete(true)
        posthog.capture('search_performed', {
          query_length: query.length,
          total_results: 0,
          course_count: 0,
          video_results: 0,
          lesson_results: 0,
          duration_ms: Math.round(performance.now() - startedAt),
          status: 'error',
        })
      }
    }

    void run()
    return () => {
      active = false
      controller.abort()
    }
  }, [query, retry])

  const sortedResults = useMemo(() => {
    if (sort === 'relevant') return results
    return [...results].sort((left, right) => {
      if (sort === 'course') {
        return left.course.title.localeCompare(right.course.title) || left.lesson.title.localeCompare(right.lesson.title)
      }
      return left.lesson.duration - right.lesson.duration || right.score - left.score
    })
  }, [results, sort])

  const isSearching = query.length >= 2 && !complete
  const resultWord = meta.total === 1 ? 'result' : 'results'
  const courseWord = meta.courseCount === 1 ? 'course' : 'courses'

  return (
    <section className={styles.searchPage} aria-labelledby="search-heading">
      <p className={styles.eyebrow}>Search Results</p>
      <h1 id="search-heading">
        {query ? <>Results for <span>“{query}”</span></> : 'Search your learning'}
      </h1>
      <p className={styles.summary} aria-live="polite">
        {isSearching
          ? message
          : query
            ? `Found ${meta.total} ${resultWord} across ${meta.courseCount} ${courseWord}`
            : 'Find lessons and exact video moments across every course.'}
      </p>

      <form className={styles.searchForm} action="/search" method="get" role="search">
        <Icon name="search" size={27} />
        <label className={styles.srOnly} htmlFor="results-search">Search courses and lessons</label>
        <input id="results-search" name="q" type="search" defaultValue={query} minLength={2} maxLength={200} placeholder="What do you want to learn?" />
        <kbd>⌘ K</kbd>
      </form>

      <div className={styles.resultsToolbar}>
        <strong>{isSearching ? 'Searching…' : `${meta.total} ${resultWord}`}</strong>
        <label>
          <span className={styles.srOnly}>Sort results</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
            <option value="relevant">Most Relevant</option>
            <option value="course">Course A–Z</option>
            <option value="shortest">Shortest First</option>
          </select>
        </label>
      </div>

      {error ? (
        <div className={styles.errorState} role="alert">
          <h2>Search couldn’t finish</h2>
          <p>{error}</p>
          <button type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button>
        </div>
      ) : null}

      {isSearching && results.length === 0 ? (
        <div className={styles.skeletonList} aria-hidden="true">
          {[0, 1, 2].map((item) => <span key={item} />)}
        </div>
      ) : null}

      {sortedResults.length > 0 ? (
        <ol className={styles.resultsList} aria-label="Search results">
          {sortedResults.map((result) => <ResultCard key={result.id} result={result} />)}
        </ol>
      ) : null}

      {complete && !error && query.length >= 2 && results.length === 0 ? (
        <div className={styles.emptyState}>
          <Icon name="search" size={34} />
          <div><h2>No matching lessons yet</h2><p>Try different keywords or browse the full course catalog.</p></div>
          <Link href="/courses">Browse all courses <Icon name="arrow" size={20} /></Link>
        </div>
      ) : null}

      {query.length < 2 ? (
        <div className={styles.emptyState}>
          <Icon name="search" size={34} />
          <div><h2>What would you like to learn?</h2><p>Use at least two characters to search every course and lesson.</p></div>
          <Link href="/courses">Browse all courses <Icon name="arrow" size={20} /></Link>
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className={styles.catalogCallout}>
          <Icon name="search" size={34} />
          <div><h2>Can’t find what you’re looking for?</h2><p>Try different keywords or browse our full course catalog.</p></div>
          <Link href="/courses">Browse all courses <Icon name="arrow" size={20} /></Link>
        </div>
      ) : null}
    </section>
  )
}
