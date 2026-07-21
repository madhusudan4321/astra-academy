import { Router } from 'express';
import { getPublishedCourses, getMyCourses, getCourseDetails } from '../controllers/course.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All course routes require authentication
router.use(authenticate);

router.get('/', getPublishedCourses);
router.get('/my', getMyCourses);
router.get('/:courseId', getCourseDetails);

export default router;
