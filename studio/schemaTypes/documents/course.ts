import {defineArrayMember, defineField, defineType} from 'sanity'

export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  groups: [
    {name: 'details', title: 'Course details', default: true},
    {name: 'curriculum', title: 'Curriculum'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'details',
      validation: (Rule) => Rule.required().min(3).max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'details',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 4,
      group: 'details',
      validation: (Rule) => Rule.required().min(40).max(500),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      group: 'details',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          validation: (Rule) => Rule.required().max(160),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'level',
      title: 'Level',
      type: 'string',
      group: 'details',
      options: {
        list: [
          {title: 'Beginner', value: 'beginner'},
          {title: 'Intermediate', value: 'intermediate'},
          {title: 'Advanced', value: 'advanced'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      group: 'details',
      description: 'Price in US dollars. Use 0 for a free course.',
      validation: (Rule) => Rule.required().min(0).precision(2),
    }),
    defineField({
      name: 'popular',
      title: 'Popular course',
      type: 'boolean',
      group: 'details',
      initialValue: false,
    }),
    defineField({
      name: 'studentCount',
      title: 'Student count',
      type: 'number',
      description: 'Display-only enrollment count.',
      group: 'details',
      initialValue: 0,
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: 'learningOutcomes',
      title: 'What learners will learn',
      type: 'array',
      group: 'details',
      of: [defineArrayMember({type: 'learningOutcome'})],
      validation: (Rule) => Rule.required().min(1).max(6),
    }),
    defineField({
      name: 'instructor',
      title: 'Instructor',
      type: 'reference',
      group: 'details',
      to: [{type: 'instructor'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      group: 'details',
      to: [{type: 'category'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'modules',
      title: 'Modules',
      type: 'array',
      group: 'curriculum',
      description: 'Module and lesson labels are derived from this order.',
      of: [defineArrayMember({type: 'module'})],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  orderings: [
    {
      title: 'Title A–Z',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      level: 'level',
      instructor: 'instructor.name',
      media: 'coverImage',
    },
    prepare({title, level, instructor, media}) {
      const details = [level, instructor].filter(Boolean).join(' · ')
      return {title, subtitle: details, media}
    },
  },
})
