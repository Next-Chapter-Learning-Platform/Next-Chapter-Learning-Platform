import {portableText} from './blocks/portableText'
import {category} from './documents/category'
import {course} from './documents/course'
import {instructor} from './documents/instructor'
import {lesson} from './documents/lesson'
import {learningOutcome} from './objects/learningOutcome'
import {courseModule} from './objects/module'
import {resource} from './objects/resource'

export const schemaTypes = [
  portableText,
  learningOutcome,
  resource,
  courseModule,
  category,
  instructor,
  lesson,
  course,
]
