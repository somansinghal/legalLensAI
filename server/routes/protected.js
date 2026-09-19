import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/workspace', (req, res) => {
  res.json({ status: 'ready', message: 'Authenticated LegalLens AI workspace ready.', user: { email: req.session.email, role: 'demo' } });
});
export default router;
