import {defineArrayMember, defineField, defineType} from 'sanity'

export const courseModule = defineType({
  name: 'module',
  title: 'Module',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().max(400),
    }),
    defineField({
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      description: 'Lesson and module numbers are derived from this order.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'lesson'}],
        }),
      ],
      validation: (Rule) => Rule.required().min(1).unique(),
    }),
  ],
  preview: {
    select: {title: 'title', lessons: 'lessons'},
    prepare({title, lessons}) {
      const count = Array.isArray(lessons) ? lessons.length : 0
      return {title, subtitle: `${count} ${count === 1 ? 'lesson' : 'lessons'}`}
    },
  },
})
