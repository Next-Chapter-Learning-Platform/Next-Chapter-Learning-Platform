import {defineQuery} from 'next-sanity'

export const COURSES_QUERY = defineQuery(`
  *[_type == "course"] | order(isPopular desc, title asc) {
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
    price {
      amount,
      currency
    },
    isPopular,
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
    "durationSeconds": math::sum(modules[].lessons[]->durationSeconds)
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
    price {
      amount,
      currency
    },
    isPopular,
    studentCount,
    learningOutcomes[] {
      _key,
      title,
      description,
      icon {
        asset,
        alt,
        crop,
        hotspot
      }
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
          durationSeconds,
          isFreePreview,
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
