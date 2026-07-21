import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Course from '../models/Course';
import Purchase from '../models/Purchase';
import { generateSasUrl } from '../config/azure';

// GET /api/videos/:courseId/:lessonId/stream
// Generates a short-lived SAS URL for secure video streaming
export async function getVideoStream(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { courseId, lessonId } = req.params;

    // 1. Verify purchase (or admin)
    if (req.user?.role !== 'admin') {
      const purchase = await Purchase.findOne({
        userId: req.user!._id,
        courseId,
        status: 'completed',
      });

      if (!purchase) {
        res.status(403).json({ success: false, message: 'Purchase required to watch this video' });
        return;
      }
    }

    // 2. Find lesson in course
    const course = await Course.findById(courseId);
    if (!course || !course.published) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    let targetLesson: typeof course.chapters[0]['lessons'][0] | null = null;
    for (const chapter of course.chapters) {
      const lesson = chapter.lessons.find((l) => l._id.toString() === lessonId);
      if (lesson) {
        targetLesson = lesson;
        break;
      }
    }

    if (!targetLesson) {
      res.status(404).json({ success: false, message: 'Lesson not found' });
      return;
    }

    // 3. Generate short-lived SAS URL (10 minutes)
    const sasDuration = parseInt(process.env.AZURE_SAS_DURATION_MINUTES || '10');
    const videoUrl = await generateSasUrl(
      targetLesson.container,
      targetLesson.blobName,
      sasDuration
    );

    res.json({
      success: true,
      videoUrl,
      expiresIn: sasDuration * 60, // seconds
      lesson: {
        id: targetLesson._id,
        title: targetLesson.title,
        duration: targetLesson.duration,
        hasNotes: !!targetLesson.notesBlobName,
      },
    });
  } catch (error) {
    console.error('Get video stream error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate video stream' });
  }
}

// GET /api/videos/:courseId/:lessonId/notes
export async function getLessonNotes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { courseId, lessonId } = req.params;

    if (req.user?.role !== 'admin') {
      const purchase = await Purchase.findOne({
        userId: req.user!._id,
        courseId,
        status: 'completed',
      });

      if (!purchase) {
        res.status(403).json({ success: false, message: 'Purchase required' });
        return;
      }
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    let targetLesson: typeof course.chapters[0]['lessons'][0] | null = null;
    for (const chapter of course.chapters) {
      const lesson = chapter.lessons.find((l) => l._id.toString() === lessonId);
      if (lesson) {
        targetLesson = lesson;
        break;
      }
    }

    if (!targetLesson || !targetLesson.notesBlobName || !targetLesson.notesContainer) {
      res.status(404).json({ success: false, message: 'Notes not available for this lesson' });
      return;
    }

    const notesUrl = await generateSasUrl(
      targetLesson.notesContainer,
      targetLesson.notesBlobName,
      30 // 30 minutes for PDF
    );

    res.json({ success: true, notesUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate notes URL' });
  }
}
