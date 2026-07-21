import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Course from '../models/Course';
import Purchase from '../models/Purchase';
import Progress from '../models/Progress';
import { generateSasUrl } from '../config/azure';

// GET /api/courses - Get all published courses (authenticated)
export async function getPublishedCourses(req: AuthRequest, res: Response): Promise<void> {
  try {
    const courses = await Course.find({ published: true }).select(
      'title shortDescription thumbnailBlobName thumbnailContainer price totalLessons totalDuration tags createdAt'
    );

    // Get user's purchases
    const purchases = await Purchase.find({
      userId: req.user!._id,
      status: 'completed',
    }).select('courseId');

    const purchasedCourseIds = new Set(purchases.map((p) => p.courseId.toString()));

    const coursesWithAccess = await Promise.all(
      courses.map(async (course) => {
        const hasPurchased = purchasedCourseIds.has(course._id.toString());
        let thumbnailUrl = '';

        try {
          thumbnailUrl = await generateSasUrl(
            course.thumbnailContainer,
            course.thumbnailBlobName,
            60 // 1 hour for thumbnails
          );
        } catch {
          thumbnailUrl = '';
        }

        return {
          id: course._id,
          title: course.title,
          shortDescription: course.shortDescription,
          thumbnailUrl,
          price: course.price,
          totalLessons: course.totalLessons,
          totalDuration: course.totalDuration,
          tags: course.tags,
          hasPurchased,
          createdAt: course.createdAt,
        };
      })
    );

    res.json({ success: true, courses: coursesWithAccess });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
}

// GET /api/courses/my - Get user's purchased courses with progress
export async function getMyCourses(req: AuthRequest, res: Response): Promise<void> {
  try {
    const purchases = await Purchase.find({
      userId: req.user!._id,
      status: 'completed',
    }).populate('courseId');

    const myCourses = await Promise.all(
      purchases.map(async (purchase) => {
        const course = purchase.courseId as InstanceType<typeof Course>;
        const progress = await Progress.findOne({
          userId: req.user!._id,
          courseId: course._id,
        });

        let thumbnailUrl = '';
        try {
          thumbnailUrl = await generateSasUrl(
            (course as any).thumbnailContainer,
            (course as any).thumbnailBlobName,
            60
          );
        } catch {
          thumbnailUrl = '';
        }

        return {
          id: course._id,
          title: (course as any).title,
          shortDescription: (course as any).shortDescription,
          thumbnailUrl,
          totalLessons: (course as any).totalLessons,
          completedLessons: progress?.completedLessons?.length || 0,
          completionPercentage: progress?.completionPercentage || 0,
          lastWatchedLessonId: progress?.lastWatchedLessonId,
          lastWatchedChapterId: progress?.lastWatchedChapterId,
          purchasedAt: purchase.createdAt,
        };
      })
    );

    res.json({ success: true, courses: myCourses });
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your courses' });
  }
}

// GET /api/courses/:courseId - Get full course structure (requires purchase)
export async function getCourseDetails(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;

    const purchase = await Purchase.findOne({
      userId: req.user!._id,
      courseId,
      status: 'completed',
    });

    if (!purchase && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Purchase required to access this course' });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course || !course.published) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    const progress = await Progress.findOne({
      userId: req.user!._id,
      courseId,
    });

    let thumbnailUrl = '';
    try {
      thumbnailUrl = await generateSasUrl(course.thumbnailContainer, course.thumbnailBlobName, 60);
    } catch {
      thumbnailUrl = '';
    }

    // Don't include video blob names in the response - only metadata
    const sanitizedChapters = course.chapters.map((chapter) => ({
      id: chapter._id,
      title: chapter.title,
      description: chapter.description,
      order: chapter.order,
      lessons: chapter.lessons.map((lesson) => ({
        id: lesson._id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        order: lesson.order,
        hasNotes: !!lesson.notesBlobName,
        isCompleted: progress?.completedLessons?.some(
          (id) => id.toString() === lesson._id.toString()
        ) || false,
      })),
    }));

    res.json({
      success: true,
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        thumbnailUrl,
        totalLessons: course.totalLessons,
        totalDuration: course.totalDuration,
        tags: course.tags,
        chapters: sanitizedChapters,
        progress: {
          completedLessons: progress?.completedLessons?.length || 0,
          completionPercentage: progress?.completionPercentage || 0,
          lastWatchedLessonId: progress?.lastWatchedLessonId,
          lastWatchedChapterId: progress?.lastWatchedChapterId,
        },
      },
    });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course' });
  }
}
