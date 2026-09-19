import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { postAnalysis } from '../controllers/analysisController.js';

const router = Router();
router.post('/analysis', requireAuth, postAnalysis);
export default router;
