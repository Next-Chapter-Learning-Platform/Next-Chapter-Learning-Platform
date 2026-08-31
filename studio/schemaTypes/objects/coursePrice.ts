import {defineField, defineType} from 'sanity'

export const coursePrice = defineType({
  name: 'coursePrice',
  title: 'Price',
  type: 'object',
  fields: [
    defineField({
      name: 'amount',
      title: 'Amount',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).precision(2),
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      description: 'Three-letter ISO 4217 currency code, such as USD.',
      initialValue: 'USD',
      validation: (Rule) =>
        Rule.required()
          .uppercase()
          .regex(/^[A-Z]{3}$/, {name: 'ISO 4217 currency code'}),
    }),
  ],
  preview: {
    select: {amount: 'amount', currency: 'currency'},
    prepare({amount, currency}) {
      return {
        title:
          typeof amount === 'number'
            ? `${currency ?? 'USD'} ${amount.toFixed(2)}`
            : 'Price not set',
      }
    },
  },
})
