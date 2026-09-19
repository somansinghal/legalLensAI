import { analyzeDocument } from '../services/analysisService.js';

export async function postAnalysis(req, res, next) {
  try {
    const { persona, intent, document } = req.body || {};
    const result = await analyzeDocument({ persona, intent, text: document?.text, name: document?.name });
    res.json({ requestId: req.requestId, ...result });
  } catch (error) { next(error); }
}
