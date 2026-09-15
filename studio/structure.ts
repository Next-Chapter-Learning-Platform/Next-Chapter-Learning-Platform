import type {StructureResolver} from 'sanity/structure'

const authoringTypes = ['course', 'lesson', 'instructor', 'category', 'video']

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Vertex content')
    .items([
      S.documentTypeListItem('course').title('Courses'),
      S.documentTypeListItem('lesson').title('Lessons'),
      S.divider(),
      S.documentTypeListItem('instructor').title('Instructors'),
      S.documentTypeListItem('category').title('Categories'),
      S.divider(),
      S.documentTypeListItem('video').title('Video intelligence'),
      ...S.documentTypeListItems().filter(
        (item) => !authoringTypes.includes(item.getId() ?? ''),
      ),
    ])
