import { Router } from 'express';
import { getVideoStream, getLessonNotes } from '../controllers/video.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/:courseId/:lessonId/stream', getVideoStream);
router.get('/:courseId/:lessonId/notes', getLessonNotes);

export default router;
