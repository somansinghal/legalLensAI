import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getChecklist, updateChecklist } from '../services/checklistService.js';
import { AppError } from '../utils/errors.js';

const router = Router();

router.get('/checklists/:analysisId', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    const { analysisId } = req.params;
    if (!userId || !analysisId) {
      return next(new AppError(400, 'BAD_REQUEST', 'Missing required parameters.'));
    }

    const checklist = await getChecklist(userId, analysisId);
    if (!checklist) {
      return next(new AppError(404, 'NOT_FOUND', 'Checklist not found for this analysis.'));
    }

    res.json({ checklist });
  } catch (error) {
    next(error);
  }
});

router.patch('/checklists/:analysisId', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    const { analysisId } = req.params;
    if (!userId || !analysisId) {
      return next(new AppError(400, 'BAD_REQUEST', 'Missing required parameters.'));
    }

    const updated = await updateChecklist(userId, analysisId, req.body || {});
    if (!updated) {
      return next(new AppError(404, 'NOT_FOUND', 'Checklist not found or unauthorized.'));
    }

    res.json({ checklist: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
