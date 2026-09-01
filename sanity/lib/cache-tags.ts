export const sanityCacheTags = {
  categories: 'sanity:categories',
  courses: 'sanity:courses',
  instructors: 'sanity:instructors',
  lessons: 'sanity:lessons',
  course: (slug: string) => `sanity:course:${slug}`,
  instructor: (slug: string) => `sanity:instructor:${slug}`,
  lesson: (slug: string) => `sanity:lesson:${slug}`,
} as const
