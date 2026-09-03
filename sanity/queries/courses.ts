import {defineQuery} from 'next-sanity'

export const COURSES_QUERY = defineQuery(`
  *[_type == "course"] | order(popular desc, title asc) {
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
    "instructor": instructor-> {
      _id,
      name,
      "slug": slug.current,
      photo {
        asset,
        alt,
        crop,
        hotspot
      },
      expertise
    },
    "moduleCount": count(modules),
    "lessonCount": count(modules[].lessons[]),
    "duration": math::sum(modules[].lessons[]->duration)
  }
`)

export const COURSE_BY_SLUG_QUERY = defineQuery(`
  *[_type == "course" && slug.current == $slug][0] {
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
    learningOutcomes[] {
      _key,
      title,
      description,
      icon
    },
    "category": category-> {
      _id,
      title,
      "slug": slug.current,
      description
    },
    "instructor": instructor-> {
      _id,
      name,
      "slug": slug.current,
      photo {
        asset,
        alt,
        crop,
        hotspot
      },
      expertise
    },
    modules[] {
      _key,
      title,
      summary,
      lessons[] {
        _key,
        ...@-> {
          _id,
          title,
          "slug": slug.current,
          thumbnail {
            asset,
            alt,
            crop,
            hotspot
          },
          duration,
          freePreview,
          studentCount,
          keyPoints
        }
      }
    }
  }
`)

export const COURSE_SLUGS_QUERY = defineQuery(`
  *[_type == "course" && defined(slug.current)] | order(slug.current asc) {
    "slug": slug.current
  }
`)
