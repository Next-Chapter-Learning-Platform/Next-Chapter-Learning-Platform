import {defineQuery} from 'next-sanity'

export const SEARCH_INDEX_QUERY = defineQuery(`
  {
    "lessons": *[_type == "lesson" && defined(slug.current)] {
      _id,
      title,
      videoUrl,
      keyPoints,
      "notesText": pt::text(notes)
    },
    "courses": *[_type == "course" && defined(slug.current)] {
      _id,
      title,
      summary,
      modules[] {
        _key,
        title,
        summary,
        lessons[] {
          _key,
          "_id": @->_id
        }
      }
    }
  }
`)

export const SEARCH_VIDEO_MOMENTS_QUERY = defineQuery(`
  *[_type == "video" && (
    count(chapters[label match $term0 || label match $term1 || label match $term2 || label match $term3 || label match $term4 || label match $term5 || label match $term6 || label match $term7]) > 0 ||
    count(chunks[text match $term0 || text match $term1 || text match $term2 || text match $term3 || text match $term4 || text match $term5 || text match $term6 || text match $term7]) > 0
  )] {
    _id,
    videoId,
    url,
    "chapters": chapters[label match $term0 || label match $term1 || label match $term2 || label match $term3 || label match $term4 || label match $term5 || label match $term6 || label match $term7][0...3] {
      startSeconds,
      label
    },
    "chunks": chunks[text match $term0 || text match $term1 || text match $term2 || text match $term3 || text match $term4 || text match $term5 || text match $term6 || text match $term7][0...3] {
      startSeconds,
      text
    }
  }
`)

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
      summary,
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
        summary,
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

