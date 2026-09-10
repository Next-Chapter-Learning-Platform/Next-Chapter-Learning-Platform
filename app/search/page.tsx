import {Show, SignInButton, SignUpButton, UserButton} from '@clerk/nextjs'
import type {Metadata} from 'next'
import Link from 'next/link'

import {SearchResults} from './search-results'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Search courses and lessons — Vertex',
  description: 'Find relevant lessons and exact video moments across Vertex courses.',
}

function VertexMark() {
  return (
    <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
      <path d="M2 5h36L20 37 2 5Z" fill="#f04b16" />
      <path d="M11 10h18l-9 16-9-16Z" fill="#fffdfb" />
      <path d="M15 10h10l-5 9-5-9Z" fill="#f04b16" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 6.5-3 7-3 9h18c0-2-3-2.5-3-9" />
      <path d="M10 21h4" />
    </svg>
  )
}

export default async function SearchPage({searchParams}: PageProps<'/search'>) {
  const params = await searchParams
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q
  const query = typeof rawQuery === 'string' ? rawQuery.trim().slice(0, 200) : ''

  return (
    <div className={styles.viewport}>
      <div className={styles.pageFrame}>
        <header className={styles.header}>
          <nav className={styles.headerInner} aria-label="Primary navigation">
            <Link className={styles.brand} href="/" aria-label="Vertex home">
              <VertexMark />
              <span>Vertex</span>
            </Link>
            <div className={styles.navLinks}>
              <Link className={styles.activeNav} href="/courses">Courses</Link>
              <Link href="/#my-learning">My Learning</Link>
            </div>
            <div className={styles.accountActions}>
              <Show when="signed-out">
                <SignInButton>
                  <button type="button" className={styles.authTextButton}>Sign in</button>
                </SignInButton>
                <SignUpButton>
                  <button type="button" className={`${styles.authTextButton} ${styles.signUpButton}`}>Sign up</button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <button type="button" className={styles.notificationButton} aria-label="View notifications">
                  <BellIcon />
                </button>
                <UserButton appearance={{elements: {avatarBox: styles.userAvatar}}} />
              </Show>
            </div>
          </nav>
        </header>
        <main>
          <SearchResults key={query} query={query} />
        </main>
      </div>
    </div>
  )
}
