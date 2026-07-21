import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Progress from '../models/Progress';
import Course from '../models/Course';
import Purchase from '../models/Purchase';

// POST /api/progress/:courseId/lesson/:lessonId/complete
export async function markLessonComplete(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user!._id;

    // Verify purchase
    const purchase = await Purchase.findOne({ userId, courseId, status: 'completed' });
    if (!purchase && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Purchase required' });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    // Find the lesson and its chapter
    let foundChapterId: string | null = null;
    for (const chapter of course.chapters) {
      const lesson = chapter.lessons.find((l) => l._id.toString() === lessonId);
      if (lesson) {
        foundChapterId = chapter._id.toString();
        break;
      }
    }

    if (!foundChapterId) {
      res.status(404).json({ success: false, message: 'Lesson not found' });
      return;
    }

    // Upsert progress
    let progress = await Progress.findOne({ userId, courseId });
    if (!progress) {
      progress = new Progress({ userId, courseId, completedLessons: [] });
    }

    // Add lesson to completed (avoid duplicates)
    const lessonObjectId = require('mongoose').Types.ObjectId(lessonId);
    const alreadyCompleted = progress.completedLessons.some(
      (id) => id.toString() === lessonId
    );

    if (!alreadyCompleted) {
      progress.completedLessons.push(lessonObjectId);
    }

    progress.lastWatchedLessonId = lessonObjectId;
    progress.lastWatchedChapterId = require('mongoose').Types.ObjectId(foundChapterId);

    // Calculate completion percentage
    const totalLessons = course.totalLessons || 1;
    progress.completionPercentage = Math.round(
      (progress.completedLessons.length / totalLessons) * 100
    );

    await progress.save();

    res.json({
      success: true,
      progress: {
        completedLessons: progress.completedLessons.length,
        completionPercentage: progress.completionPercentage,
      },
    });
  } catch (error) {
    console.error('Mark lesson complete error:', error);
    res.status(500).json({ success: false, message: 'Failed to update progress' });
  }
}

// GET /api/progress/:courseId
export async function getCourseProgress(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const userId = req.user!._id;

    const progress = await Progress.findOne({ userId, courseId });

    res.json({
      success: true,
      progress: progress
        ? {
            completedLessons: progress.completedLessons,
            completionPercentage: progress.completionPercentage,
            lastWatchedLessonId: progress.lastWatchedLessonId,
            lastWatchedChapterId: progress.lastWatchedChapterId,
          }
        : { completedLessons: [], completionPercentage: 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get progress' });
  }
}
