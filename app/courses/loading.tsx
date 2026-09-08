import styles from "./loading.module.css";

function HeaderSkeleton() {
  return (
    <div className={styles.header} aria-hidden="true">
      <span className={`${styles.pulse} ${styles.brand}`} />
      <span className={`${styles.pulse} ${styles.nav}`} />
      <span className={`${styles.pulse} ${styles.account}`} />
    </div>
  );
}

export default function CoursesLoading() {
  return (
    <div className={styles.viewport} aria-busy="true" aria-label="Loading courses">
      <div className={styles.pageFrame}>
        <HeaderSkeleton />
        <main className={styles.catalogMain}>
          <div className={styles.intro} aria-hidden="true">
            <span className={`${styles.pulse} ${styles.eyebrow}`} />
            <span className={`${styles.pulse} ${styles.title}`} />
            <span className={`${styles.pulse} ${styles.copy}`} />
          </div>
          <div className={styles.grid} aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <div className={styles.card} key={index}>
                <span className={`${styles.pulse} ${styles.cardCover}`} />
                <div className={styles.cardBody}>
                  <span className={`${styles.pulse} ${styles.cardEyebrow}`} />
                  <span className={`${styles.pulse} ${styles.cardTitle}`} />
                  <span className={`${styles.pulse} ${styles.cardCopy}`} />
                  <span className={`${styles.pulse} ${styles.cardMeta}`} />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
