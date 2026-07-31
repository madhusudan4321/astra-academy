import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, generateAccessToken, setAuthCookies, TokenPayload } from '../utils/jwt';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: TokenPayload & { _id: string };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const accessToken = req.cookies?.accessToken;

    if (accessToken) {
      try {
        const decoded = verifyAccessToken(accessToken);
        req.user = { ...decoded, _id: decoded.userId };
        return next();
      } catch {
        // Access token expired - try refresh
      }
    }

    // Try refresh token
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);

    // Verify refresh token is still stored in DB
    const user = await User.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ success: false, message: 'Invalid session. Please login again.' });
      return;
    }

    // Issue new access token
    const payload: TokenPayload = { userId: decoded.userId, role: decoded.role };
    const newAccessToken = generateAccessToken(payload);

    const isSecure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    req.user = { ...payload, _id: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }
  next();
}

export async function requirePurchase(courseId: string, userId: string): Promise<boolean> {
  const Purchase = (await import('../models/Purchase')).default;
  const purchase = await Purchase.findOne({ userId, courseId, status: 'completed' });
  return !!purchase;
}
