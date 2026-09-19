import { Router } from 'express';
import { sendContact } from '../services/contactService.js';
const router = Router();
router.post('/contact', async (req, res, next) => { try { const result = await sendContact(req.body); res.json({ requestId: req.requestId, ...result }); } catch (error) { next(error); } });
export default router;
