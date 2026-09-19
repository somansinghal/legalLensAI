import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { postAnalysis, getHistory, getHistoryItem } from '../controllers/analysisController.js';

const router = Router();

router.post('/analysis', requireAuth, postAnalysis);
router.get('/analysis/history', requireAuth, getHistory);
router.get('/analysis/history/:id', requireAuth, getHistoryItem);

export default router;
