import {defineField, defineType} from 'sanity'

export const learningOutcome = defineType({
  name: 'learningOutcome',
  title: 'Learning outcome',
  type: 'object',
  fields: [
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Semantic icon key rendered by the Vertex interface.',
      options: {
        list: [
          {title: 'Code', value: 'code'},
          {title: 'Gauge', value: 'gauge'},
          {title: 'Layers', value: 'layers'},
          {title: 'Puzzle', value: 'puzzle'},
          {title: 'Rocket', value: 'rocket'},
          {title: 'Shield', value: 'shield'},
          {title: 'Sparkles', value: 'sparkles'},
          {title: 'Workflow', value: 'workflow'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().max(240),
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'description'},
  },
})
