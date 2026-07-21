import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User';
import Purchase from '../models/Purchase';
import Course from '../models/Course';
import Progress from '../models/Progress';
import { generateSasUrl, uploadToAzure } from '../config/azure';
import { v4 as uuidv4 } from 'uuid';

// GET /api/admin/dashboard
export async function getAdminDashboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [totalStudents, totalCourses, totalPurchases, recentStudents] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Course.countDocuments(),
      Purchase.countDocuments({ status: 'completed' }),
      User.find({ role: 'student' }).sort({ createdAt: -1 }).limit(5).select('name email createdAt avatar'),
    ]);

    const revenue = await Purchase.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalCourses,
        totalPurchases,
        totalRevenue: revenue[0]?.total || 0,
      },
      recentStudents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
}

// GET /api/admin/courses
export async function getAllCourses(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });

    const coursesWithThumbnails = await Promise.all(
      courses.map(async (course) => {
        let thumbnailUrl = '';
        try {
          thumbnailUrl = await generateSasUrl(course.thumbnailContainer, course.thumbnailBlobName, 60);
        } catch {
          thumbnailUrl = '';
        }
        return {
          id: course._id,
          title: course.title,
          shortDescription: course.shortDescription,
          price: course.price,
          published: course.published,
          totalLessons: course.totalLessons,
          totalDuration: course.totalDuration,
          thumbnailUrl,
          createdAt: course.createdAt,
          chaptersCount: course.chapters.length,
        };
      })
    );

    res.json({ success: true, courses: coursesWithThumbnails });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
}

// POST /api/admin/courses
export async function createCourse(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, description, shortDescription, price, tags } = req.body;
    const thumbnailFile = req.file;

    if (!title || !description || !shortDescription || price === undefined) {
      res.status(400).json({ success: false, message: 'Required fields missing' });
      return;
    }

    if (!thumbnailFile) {
      res.status(400).json({ success: false, message: 'Thumbnail is required' });
      return;
    }

    const thumbnailContainer = process.env.AZURE_THUMBNAIL_CONTAINER || 'astra-thumbnails';
    const thumbnailBlobName = `thumbnails/${uuidv4()}-${thumbnailFile.originalname}`;

    await uploadToAzure(thumbnailContainer, thumbnailBlobName, thumbnailFile.buffer, thumbnailFile.mimetype);

    const course = await Course.create({
      title,
      description,
      shortDescription,
      price: parseFloat(price),
      tags: tags ? JSON.parse(tags) : [],
      thumbnailBlobName,
      thumbnailContainer,
      chapters: [],
    });

    res.status(201).json({ success: true, course: { id: course._id, title: course.title } });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ success: false, message: 'Failed to create course' });
  }
}

// PUT /api/admin/courses/:courseId
export async function updateCourse(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const { title, description, shortDescription, price, tags, published } = req.body;

    const updates: Record<string, unknown> = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (shortDescription) updates.shortDescription = shortDescription;
    if (price !== undefined) updates.price = parseFloat(price);
    if (tags) updates.tags = JSON.parse(tags);
    if (published !== undefined) updates.published = published === 'true' || published === true;

    // Handle thumbnail update
    if (req.file) {
      const thumbnailContainer = process.env.AZURE_THUMBNAIL_CONTAINER || 'astra-thumbnails';
      const thumbnailBlobName = `thumbnails/${uuidv4()}-${req.file.originalname}`;
      await uploadToAzure(thumbnailContainer, thumbnailBlobName, req.file.buffer, req.file.mimetype);
      updates.thumbnailBlobName = thumbnailBlobName;
      updates.thumbnailContainer = thumbnailContainer;
    }

    const course = await Course.findByIdAndUpdate(courseId, updates, { new: true });
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    res.json({ success: true, message: 'Course updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update course' });
  }
}

// POST /api/admin/courses/:courseId/chapters
export async function addChapter(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    const order = course.chapters.length + 1;
    course.chapters.push({
      title,
      description,
      order,
      courseId: course._id,
      lessons: [],
    } as any);

    await course.save();

    const newChapter = course.chapters[course.chapters.length - 1];
    res.status(201).json({ success: true, chapter: { id: newChapter._id, title: newChapter.title, order } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add chapter' });
  }
}

// POST /api/admin/courses/:courseId/chapters/:chapterId/lessons
export async function uploadLesson(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { courseId, chapterId } = req.params;
    const { title, description } = req.body;
    const videoFile = req.file;

    if (!videoFile) {
      res.status(400).json({ success: false, message: 'Video file is required' });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    const chapter = course.chapters.find((c) => c._id.toString() === chapterId);
    if (!chapter) {
      res.status(404).json({ success: false, message: 'Chapter not found' });
      return;
    }

    const videoContainer = process.env.AZURE_CONTAINER_NAME || 'astra-videos';
    const blobName = `videos/${courseId}/${chapterId}/${uuidv4()}-${videoFile.originalname}`;

    await uploadToAzure(videoContainer, blobName, videoFile.buffer, videoFile.mimetype);

    const order = chapter.lessons.length + 1;
    chapter.lessons.push({
      title,
      description,
      blobName,
      container: videoContainer,
      order,
      chapterId: chapter._id,
      courseId: course._id,
    } as any);

    // Update totals
    course.totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
    await course.save();

    res.status(201).json({ success: true, message: 'Lesson uploaded successfully' });
  } catch (error) {
    console.error('Upload lesson error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload lesson' });
  }
}

// POST /api/admin/courses/:courseId/chapters/:chapterId/lessons/:lessonId/notes
export async function uploadLessonNotes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { courseId, chapterId, lessonId } = req.params;
    const pdfFile = req.file;

    if (!pdfFile) {
      res.status(400).json({ success: false, message: 'PDF file is required' });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    const chapter = course.chapters.find((c) => c._id.toString() === chapterId);
    const lesson = chapter?.lessons.find((l) => l._id.toString() === lessonId);
    if (!lesson) {
      res.status(404).json({ success: false, message: 'Lesson not found' });
      return;
    }

    const notesContainer = process.env.AZURE_NOTES_CONTAINER || 'astra-notes';
    const notesBlobName = `notes/${courseId}/${lessonId}/${uuidv4()}.pdf`;

    await uploadToAzure(notesContainer, notesBlobName, pdfFile.buffer, 'application/pdf');

    lesson.notesBlobName = notesBlobName;
    lesson.notesContainer = notesContainer;
    await course.save();

    res.json({ success: true, message: 'Notes uploaded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upload notes' });
  }
}

// GET /api/admin/students
export async function getStudents(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });

    const studentsWithPurchases = await Promise.all(
      students.map(async (student) => {
        const purchases = await Purchase.countDocuments({
          userId: student._id,
          status: 'completed',
        });
        return {
          id: student._id,
          name: student.name,
          email: student.email,
          avatar: student.avatar,
          purchasedCourses: purchases,
          joinedAt: student.createdAt,
        };
      })
    );

    res.json({ success: true, students: studentsWithPurchases });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
}

// POST /api/admin/purchases/grant
export async function grantAccess(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { userId, courseId } = req.body;

    const existing = await Purchase.findOne({ userId, courseId });
    if (existing) {
      res.status(409).json({ success: false, message: 'User already has access' });
      return;
    }

    const course = await Course.findById(courseId);
    await Purchase.create({
      userId,
      courseId,
      amount: 0,
      status: 'completed',
      paymentMethod: 'admin_grant',
      transactionId: `admin_${uuidv4()}`,
    });

    res.json({ success: true, message: 'Access granted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to grant access' });
  }
}
