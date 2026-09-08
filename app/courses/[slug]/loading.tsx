import styles from "../loading.module.css";

export default function CourseLoading() {
  return (
    <div className={styles.viewport} aria-busy="true" aria-label="Loading course">
      <div className={styles.pageFrame}>
        <div className={styles.header} aria-hidden="true">
          <span className={`${styles.pulse} ${styles.brand}`} />
          <span className={`${styles.pulse} ${styles.nav}`} />
          <span className={`${styles.pulse} ${styles.account}`} />
        </div>
        <main className={styles.detailMain} aria-hidden="true">
          <span className={`${styles.pulse} ${styles.breadcrumb}`} />
          <section className={styles.detailHero}>
            <span className={`${styles.pulse} ${styles.detailCover}`} />
            <div className={styles.detailCopy}>
              <span className={`${styles.pulse} ${styles.badge}`} />
              <span className={`${styles.pulse} ${styles.detailTitle}`} />
              <span className={`${styles.pulse} ${styles.detailText}`} />
              <span className={`${styles.pulse} ${styles.detailMeta}`} />
              <span className={`${styles.pulse} ${styles.detailButton}`} />
            </div>
          </section>
          <span className={`${styles.pulse} ${styles.detailPanel}`} />
          <span className={`${styles.pulse} ${styles.detailPanel}`} />
        </main>
      </div>
    </div>
  );
}
