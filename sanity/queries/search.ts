import {defineQuery} from 'next-sanity'

export const SEARCH_HYDRATION_QUERY = defineQuery(`
  {
    "lessons": *[_type == "lesson" && _id in $lessonIds] {
      _id,
      title,
      "slug": slug.current,
      videoUrl,
      duration,
      keyPoints,
      "notesText": pt::text(notes),
      "thumbnail": {
        "url": thumbnail.asset->url,
        "lqip": thumbnail.asset->metadata.lqip,
        "width": thumbnail.asset->metadata.dimensions.width,
        "height": thumbnail.asset->metadata.dimensions.height,
        "alt": thumbnail.alt
      }
    },
    "courses": *[_type == "course" && references($lessonIds)] {
      _id,
      title,
      "slug": slug.current,
      "image": {
        "url": coverImage.asset->url,
        "lqip": coverImage.asset->metadata.lqip,
        "width": coverImage.asset->metadata.dimensions.width,
        "height": coverImage.asset->metadata.dimensions.height,
        "alt": coverImage.alt
      },
      modules[] {
        _key,
        title,
        lessons[] {
          _key,
          "_id": @->_id
        }
      }
    },
    "videos": *[_type == "video" && _id in $videoDocumentIds] {
      _id,
      videoId,
      url,
      "chapters": chapters[startSeconds in $startSeconds] {
        startSeconds,
        label
      },
      "chunks": chunks[startSeconds in $startSeconds] {
        startSeconds,
        text
      }
    }
  }
`)

