import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User';
import Purchase from '../models/Purchase';
import bcrypt from 'bcryptjs';

const router = Router();

router.use(authenticate);

// GET /api/users/profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const purchasedCount = await Purchase.countDocuments({
      userId: user._id,
      status: 'completed',
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        purchasedCourses: purchasedCount,
        joinedAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

// PUT /api/users/profile
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { name },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: { id: user!._id, name: user!.name, email: user!.email, avatar: user!.avatar },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// PUT /api/users/change-password
router.put('/change-password', async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Both passwords are required' });
      return;
    }

    const user = await User.findById(req.user!._id).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

export default router;
