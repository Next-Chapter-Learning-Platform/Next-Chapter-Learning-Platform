import {defineQuery} from 'next-sanity'

export const LESSON_BY_SLUG_QUERY = defineQuery(`
  *[_type == "lesson" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    videoUrl,
    thumbnail {
      asset,
      alt,
      crop,
      hotspot
    },
    duration,
    freePreview,
    studentCount,
    notes,
    keyPoints,
    proTip,
    resources[] {
      _key,
      type,
      title,
      description,
      url
    }
  }
`)

export const COURSE_FOR_LESSON_QUERY = defineQuery(`
  *[_type == "course" && references($lessonId)][0] {
    _id,
    title,
    "slug": slug.current,
    coverImage {
      asset,
      alt,
      crop,
      hotspot
    },
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
    modules[] {
      _key,
      title,
      summary,
      lessons[] {
        _key,
        "_id": @->_id,
        "title": @->title,
        "slug": @->slug.current,
        "duration": @->duration,
        "freePreview": @->freePreview
      }
    }
  }
`)

export const LESSON_SLUGS_QUERY = defineQuery(`
  *[_type == "lesson" && defined(slug.current)] | order(slug.current asc) {
    "slug": slug.current
  }
`)
