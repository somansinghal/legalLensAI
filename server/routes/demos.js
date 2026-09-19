import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDemo, listDemos } from '../services/demoService.js';
import { AppError } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);
router.get('/', (req, res) => res.json({ demos: listDemos() }));
router.get('/:id', (req, res, next) => { const demo = getDemo(req.params.id); if (!demo) return next(new AppError(404, 'DEMO_NOT_FOUND', 'That demo document was not found.')); return res.json({ demo }); });
export default router;
