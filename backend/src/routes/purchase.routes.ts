import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import Purchase from '../models/Purchase';
import Course from '../models/Course';

const router = Router();

router.use(authenticate);

// POST /api/purchases/:courseId - Grant self-purchase (for manual/direct payment flow)
router.post('/:courseId', async (req: AuthRequest, res: Response) => {
  try {
    const courseId = req.params.courseId as string;
    const { transactionId, amount } = req.body;

    const course = await Course.findById(courseId);
    if (!course || !course.published) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    const existing = await Purchase.findOne({ userId: req.user!._id, courseId });
    if (existing) {
      res.status(409).json({ success: false, message: 'Already purchased' });
      return;
    }

    const purchase = await Purchase.create({
      userId: req.user!._id,
      courseId: courseId as any,
      amount: amount || course.price,
      status: 'completed',
      transactionId,
    });

    res.status(201).json({ success: true, purchase: { id: (purchase as any)._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Purchase failed' });
  }
});

// GET /api/purchases - Get user's purchases
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const purchases = await Purchase.find({ userId: req.user!._id }).populate('courseId', 'title');
    res.json({ success: true, purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch purchases' });
  }
});

export default router;
