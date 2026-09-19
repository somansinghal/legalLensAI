import { analyzeDocument } from '../services/analysisService.js';
import { saveAnalysisHistory, listAnalysisHistory, getAnalysisHistoryById } from '../services/historyService.js';
import { AppError } from '../utils/errors.js';

export async function postAnalysis(req, res, next) {
  try {
    const { persona, intent, document } = req.body || {};
    const result = await analyzeDocument({ persona, intent, text: document?.text, name: document?.name });

    let analysisId = null;
    let isPersisted = false;

    // Optional server-side Firestore persistence for authenticated sessions
    if (req.session?.userId) {
      try {
        const saved = await saveAnalysisHistory({
          userId: req.session.userId,
          analysisData: result
        });
        if (saved?.analysisId) {
          analysisId = saved.analysisId;
          isPersisted = true;
        }
      } catch (persistenceError) {
        // Graceful degradation: never fail analysis if persistence encounters an issue
        console.warn('[AnalysisController] Persistence skipped:', persistenceError.message);
      }
    }

    res.json({
      requestId: req.requestId,
      analysisId,
      persisted: isPersisted,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

export async function getHistory(req, res, next) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required.'));
    }
    const history = await listAnalysisHistory(userId);
    res.json(history);
  } catch (error) {
    next(error);
  }
}

export async function getHistoryItem(req, res, next) {
  try {
    const userId = req.session?.userId;
    const { id } = req.params;
    if (!userId) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required.'));
    }
    const item = await getAnalysisHistoryById(userId, id);
    if (!item) {
      return next(new AppError(404, 'NOT_FOUND', 'Analysis record not found.'));
    }
    res.json({ item });
  } catch (error) {
    next(error);
  }
}
