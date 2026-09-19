import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getUserProfile } from '../services/userService.js';
import { getUserPreferences, setUserPreferences } from '../services/preferenceService.js';
import { AppError } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

router.get('/profile', async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required.'));

    const profile = await getUserProfile(userId);
    res.json({
      user: {
        userId,
        email: profile?.email || req.session.email,
        displayName: profile?.displayName || req.session.displayName || (req.session.role === 'demo' ? 'Judge Demo Evaluator' : null),
        photoURL: profile?.photoURL || req.session.photoURL || null,
        provider: profile?.provider || req.session.provider || (req.session.role === 'demo' ? 'demo' : 'google'),
        role: req.session.role || 'user',
        createdAt: profile?.createdAt || req.session.createdAt || null,
        lastLoginAt: profile?.lastLoginAt || null
      },
      session: {
        role: req.session.role,
        expiresAt: req.session.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/preferences', async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required.'));

    const preferences = await getUserPreferences(userId);
    res.json({ preferences });
  } catch (error) {
    next(error);
  }
});

router.put('/preferences', async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required.'));

    const updated = await setUserPreferences(userId, req.body || {});
    res.json({ preferences: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
