import { Request, Response } from 'express';
import User from '../models/User';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  TokenPayload,
} from '../utils/jwt';

// POST /api/auth/register
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    const user = await User.create({ name, email: email.toLowerCase(), password });

    const payload: TokenPayload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const payload: TokenPayload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
}

// POST /api/auth/logout
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        await User.findByIdAndUpdate(decoded.userId, { $unset: { refreshToken: 1 } });
      } catch {
        // Token might be expired, just clear cookies
      }
    }

    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
}

// POST /api/auth/refresh
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'No refresh token' });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      clearAuthCookies(res);
      res.status(401).json({ success: false, message: 'Invalid session' });
      return;
    }

    const payload: TokenPayload = { userId: user._id.toString(), role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    clearAuthCookies(res);
    res.status(401).json({ success: false, message: 'Session expired' });
  }
}

// GET /api/auth/me
export async function getMe(req: Request & { user?: TokenPayload & { _id: string } }, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
}

// POST /api/auth/forgot-password
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    // In production, send reset email. For now, return success to avoid email enumeration
    const user = await User.findOne({ email: email?.toLowerCase() });
    
    if (user) {
      // TODO: integrate nodemailer / SendGrid for reset email
      console.log(`Password reset requested for: ${email}`);
    }

    res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Request failed' });
  }
}
