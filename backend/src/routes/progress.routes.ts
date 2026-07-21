import { Router } from 'express';
import { markLessonComplete, getCourseProgress } from '../controllers/progress.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/:courseId', getCourseProgress);
router.post('/:courseId/lesson/:lessonId/complete', markLessonComplete);

export default router;
