import {defineField, defineType} from 'sanity'

export const lessonResource = defineType({
  name: 'lessonResource',
  title: 'Lesson resource',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Article', value: 'article'},
          {title: 'Code', value: 'code'},
          {title: 'Download', value: 'download'},
          {title: 'External link', value: 'link'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required().max(240),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) =>
        Rule.required().uri({scheme: ['http', 'https']}),
    }),
  ],
  preview: {
    select: {title: 'title', type: 'type', subtitle: 'description'},
    prepare({title, type, subtitle}) {
      return {title, subtitle: `${type ?? 'resource'} · ${subtitle ?? ''}`}
    },
  },
})
