import { Router, Response } from 'express';
import crypto from 'crypto';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { getRazorpay } from '../config/razorpay';
import Purchase from '../models/Purchase';
import Course from '../models/Course';

const router = Router();

router.use(authenticate);

// POST /api/purchases/create-order — Create a Razorpay order + pending Purchase
router.post('/create-order', async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course || !course.published) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    // Check for existing completed purchase
    const existing = await Purchase.findOne({
      userId: req.user!._id,
      courseId,
      status: 'completed',
    });
    if (existing) {
      res.status(409).json({ success: false, message: 'Already purchased' });
      return;
    }

    // Handle free courses — grant access immediately
    if (course.price === 0) {
      // Remove any stale pending purchase
      await Purchase.deleteMany({ userId: req.user!._id, courseId, status: 'pending' });

      await Purchase.create({
        userId: req.user!._id,
        courseId,
        amount: 0,
        status: 'completed',
        paymentMethod: 'free',
        transactionId: `free_${Date.now()}`,
      });

      res.json({ success: true, free: true });
      return;
    }

    const razorpay = getRazorpay();
    const amountInPaise = Math.round(course.price * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `course_${courseId}_${Date.now()}`,
      notes: {
        courseId: courseId.toString(),
        userId: req.user!._id.toString(),
        courseTitle: course.title,
      },
    });

    // Remove any stale pending purchase for this user+course, then create fresh one
    await Purchase.deleteMany({ userId: req.user!._id, courseId, status: 'pending' });

    await Purchase.create({
      userId: req.user!._id,
      courseId,
      amount: course.price,
      status: 'pending',
      razorpayOrderId: order.id,
    });

    res.json({
      success: true,
      free: false,
      order: {
        id: order.id,
        amount: amountInPaise,
        currency: 'INR',
      },
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// POST /api/purchases/verify — Verify Razorpay payment signature
router.post('/verify', async (req: AuthRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ success: false, message: 'Missing payment details' });
      return;
    }

    // Verify HMAC signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      res.status(500).json({ success: false, message: 'Payment configuration error' });
      return;
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
      return;
    }

    // Update the pending purchase to completed
    const purchase = await Purchase.findOneAndUpdate(
      {
        userId: req.user!._id,
        razorpayOrderId: razorpay_order_id,
        status: 'pending',
      },
      {
        status: 'completed',
        razorpayPaymentId: razorpay_payment_id,
        transactionId: razorpay_payment_id,
      },
      { new: true }
    );

    if (!purchase) {
      res.status(404).json({ success: false, message: 'Purchase not found' });
      return;
    }

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

// GET /api/purchases — Get user's purchases
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const purchases = await Purchase.find({
      userId: req.user!._id,
      status: 'completed',
    }).populate('courseId', 'title');
    res.json({ success: true, purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch purchases' });
  }
});

export default router;
