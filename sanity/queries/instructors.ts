import {defineQuery} from 'next-sanity'

export const INSTRUCTOR_BY_SLUG_QUERY = defineQuery(`
  *[_type == "instructor" && slug.current == $slug][0] {
    _id,
    name,
    "slug": slug.current,
    photo {
      asset,
      alt,
      crop,
      hotspot
    },
    expertise,
    bio,
    "courses": *[_type == "course" && references(^._id)] | order(title asc) {
      _id,
      title,
      "slug": slug.current,
      summary,
      coverImage {
        asset,
        alt,
        crop,
        hotspot
      },
      level,
      price,
      popular,
      studentCount,
      "category": category-> {
        _id,
        title,
        "slug": slug.current
      },
      "moduleCount": count(modules),
      "lessonCount": count(modules[].lessons[]),
      "duration": math::sum(modules[].lessons[]->duration)
    }
  }
`)

export const INSTRUCTOR_SLUGS_QUERY = defineQuery(`
  *[_type == "instructor" && defined(slug.current)] | order(slug.current asc) {
    "slug": slug.current
  }
`)
