import { Router } from 'express';
import {
  getAdminDashboard,
  getAllCourses,
  createCourse,
  updateCourse,
  addChapter,
  uploadLesson,
  uploadLessonNotes,
  getStudents,
  grantAccess,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { uploadImage, uploadVideo, uploadPdf } from '../middleware/upload.middleware';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard', getAdminDashboard);

// Courses
router.get('/courses', getAllCourses);
router.post('/courses', uploadImage.single('thumbnail'), createCourse);
router.put('/courses/:courseId', uploadImage.single('thumbnail'), updateCourse);

// Chapters
router.post('/courses/:courseId/chapters', addChapter);

// Lessons
router.post('/courses/:courseId/chapters/:chapterId/lessons', uploadVideo.single('video'), uploadLesson);
router.post(
  '/courses/:courseId/chapters/:chapterId/lessons/:lessonId/notes',
  uploadPdf.single('notes'),
  uploadLessonNotes
);

// Students
router.get('/students', getStudents);
router.post('/purchases/grant', grantAccess);

export default router;
