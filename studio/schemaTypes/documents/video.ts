import {defineArrayMember, defineField, defineType} from 'sanity'

export const video = defineType({
  name: 'video',
  title: 'Video intelligence',
  type: 'document',
  description:
    'Internal chapter and transcript lookup used by intelligent search. It is never shown as a standalone learner result.',
  fields: [
    defineField({
      name: 'videoId',
      title: 'Provider video ID',
      type: 'string',
      validation: (Rule) => Rule.required().min(3).max(256),
    }),
    defineField({
      name: 'url',
      title: 'Video URL',
      type: 'url',
      validation: (Rule) => Rule.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'chapters',
      title: 'Table of contents',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'chapter',
          title: 'Chapter',
          type: 'object',
          fields: [
            defineField({
              name: 'startSeconds',
              title: 'Start (seconds)',
              type: 'number',
              validation: (Rule) => Rule.required().integer().min(0),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required().min(2).max(180),
            }),
          ],
          preview: {
            select: {title: 'label', startSeconds: 'startSeconds'},
            prepare({title, startSeconds}) {
              return {title, subtitle: `${startSeconds ?? 0}s`}
            },
          },
        }),
      ],
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'chunks',
      title: 'Transcript chunks',
      type: 'array',
      description: 'Short timestamped transcript pieces. Never store a whole transcript in one item.',
      of: [
        defineArrayMember({
          name: 'transcriptChunk',
          title: 'Transcript chunk',
          type: 'object',
          fields: [
            defineField({
              name: 'startSeconds',
              title: 'Start (seconds)',
              type: 'number',
              validation: (Rule) => Rule.required().integer().min(0),
            }),
            defineField({
              name: 'text',
              title: 'Text',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required().min(2).max(1200),
            }),
          ],
          preview: {
            select: {text: 'text', startSeconds: 'startSeconds'},
            prepare({text, startSeconds}) {
              return {title: text, subtitle: `${startSeconds ?? 0}s`}
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'videoId', subtitle: 'url'},
  },
})
