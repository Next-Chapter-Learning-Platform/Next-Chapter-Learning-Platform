import {portableText} from './blocks/portableText'
import {category} from './documents/category'
import {course} from './documents/course'
import {instructor} from './documents/instructor'
import {lesson} from './documents/lesson'
import {coursePrice} from './objects/coursePrice'
import {learningOutcome} from './objects/learningOutcome'
import {lessonResource} from './objects/lessonResource'
import {courseModule} from './objects/module'

export const schemaTypes = [
  portableText,
  coursePrice,
  learningOutcome,
  lessonResource,
  courseModule,
  category,
  instructor,
  lesson,
  course,
]
