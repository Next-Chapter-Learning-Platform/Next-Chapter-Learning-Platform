import styles from './loading.module.css'

export default function SearchLoading() {
  return (
    <div className={styles.page} aria-label="Loading search">
      <span className={styles.title} />
      <span className={styles.search} />
      <span className={styles.card} />
      <span className={styles.card} />
      <span className={styles.card} />
    </div>
  )
}

