import {defineArrayMember, defineField, defineType} from 'sanity'

function formatDuration(totalSeconds: unknown) {
  if (typeof totalSeconds !== 'number' || totalSeconds < 0) return 'Duration not set'

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const lesson = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(3).max(140),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'A YouTube, Vimeo, or Bunny video URL used by the lesson player.',
      validation: (Rule) =>
        Rule.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Poster or thumbnail',
      type: 'image',
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
      name: 'durationSeconds',
      title: 'Duration (seconds)',
      type: 'number',
      description: 'Whole seconds; used later by playback and progress features.',
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: 'isFreePreview',
      title: 'Free preview',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'studentCount',
      title: 'Student count',
      type: 'number',
      description: 'Display-only learner count.',
      initialValue: 0,
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: 'notes',
      title: 'Lesson notes',
      type: 'portableText',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'keyPoints',
      title: 'In this lesson you will',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'string',
          validation: (Rule) => Rule.required().max(160),
        }),
      ],
      validation: (Rule) => Rule.required().min(1).max(6).unique(),
    }),
    defineField({
      name: 'proTip',
      title: 'Pro tip',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(400),
    }),
    defineField({
      name: 'resources',
      title: 'Resources',
      type: 'array',
      of: [defineArrayMember({type: 'lessonResource'})],
      validation: (Rule) => Rule.max(12),
    }),
  ],
  preview: {
    select: {title: 'title', duration: 'durationSeconds', media: 'thumbnail'},
    prepare({title, duration, media}) {
      return {title, subtitle: formatDuration(duration), media}
    },
  },
})
