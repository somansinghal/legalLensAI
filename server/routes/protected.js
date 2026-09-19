import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/workspace', (req, res) => {
  res.json({ status: 'ready', message: 'Authenticated workspace foundation. Analysis features are enabled in a later product phase.', user: { email: req.session.email, role: 'demo' } });
});
export default router;
