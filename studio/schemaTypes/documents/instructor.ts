import {defineArrayMember, defineField, defineType} from 'sanity'

export const instructor = defineType({
  name: 'instructor',
  title: 'Instructor',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
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
      name: 'expertise',
      title: 'Expertise',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'string',
          validation: (Rule) => Rule.required().max(80),
        }),
      ],
      validation: (Rule) => Rule.required().min(1).max(8).unique(),
    }),
    defineField({
      name: 'bio',
      title: 'Biography',
      type: 'portableText',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: 'name', expertise: 'expertise', media: 'photo'},
    prepare({title, expertise, media}) {
      return {
        title,
        subtitle: Array.isArray(expertise) ? expertise.slice(0, 3).join(', ') : '',
        media,
      }
    },
  },
})
