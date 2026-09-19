import crypto from 'node:crypto';
import { getFirestoreDb } from './firebaseService.js';

export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Saves a validated analysis result to Cloud Firestore.
 *
 * CRITICAL PRIVACY BOUNDARY:
 * User-provided raw legal document text is NEVER persisted.
 * Only document metadata, categorization, and validated structured AI insights are stored.
 */
export async function saveAnalysisHistory({ userId, analysisData }) {
  const db = getFirestoreDb();
  if (!db || !userId || !analysisData) {
    return null;
  }

  const analysisId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Extract structured insights without raw document content
  const record = {
    analysisId,
    userId,
    documentName: analysisData.document?.name || 'Untitled document',
    documentType: analysisData.document?.documentType || 'Unknown Document',
    persona: analysisData.context?.persona || 'other',
    intent: analysisData.context?.intent || 'understand_before_signing',
    summary: Array.isArray(analysisData.summary) ? analysisData.summary : [],
    attentionItems: Array.isArray(analysisData.attentionItems) ? analysisData.attentionItems : [],
    importantClauses: Array.isArray(analysisData.importantClauses) ? analysisData.importantClauses : [],
    obligations: Array.isArray(analysisData.obligations) ? analysisData.obligations : [],
    importantDates: Array.isArray(analysisData.importantDates) ? analysisData.importantDates : [],
    lawyerQuestions: Array.isArray(analysisData.lawyerQuestions) ? analysisData.lawyerQuestions : [],
    checklist: Array.isArray(analysisData.checklist) ? analysisData.checklist : [],
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now
  };

  try {
    const historyRef = db.collection('users').doc(userId).collection('analysisHistory').doc(analysisId);
    await historyRef.set(record);

    // Also persist initial checklist state
    const checklistRef = db.collection('users').doc(userId).collection('checklists').doc(analysisId);
    await checklistRef.set({
      analysisId,
      userId,
      documentName: record.documentName,
      items: record.checklist.map((item, index) => ({
        index,
        task: item.task,
        completed: Boolean(item.completed)
      })),
      createdAt: now,
      updatedAt: now
    });

    return {
      analysisId,
      createdAt: now,
      schemaVersion: CURRENT_SCHEMA_VERSION
    };
  } catch (error) {
    console.warn('[HistoryService] Failed to persist analysis to Firestore:', error.message);
    return null;
  }
}

/**
 * Lists analysis history for the authenticated user.
 * Returns only safe summary metadata, sorted newest first.
 */
export async function listAnalysisHistory(userId) {
  const db = getFirestoreDb();
  if (!db || !userId) {
    return { items: [] };
  }

  try {
    const historyCol = db.collection('users').doc(userId).collection('analysisHistory');
    const snapshot = await historyCol.orderBy('createdAt', 'desc').limit(50).get();

    const items = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: doc.id,
        analysisId: data.analysisId || doc.id,
        documentName: data.documentName || 'Document Analysis',
        documentType: data.documentType || 'Legal Document',
        persona: data.persona,
        intent: data.intent,
        summaryPreview: Array.isArray(data.summary) && data.summary.length > 0
          ? data.summary.slice(0, 2).map((s) => s.text).join(' ')
          : '',
        attentionCount: Array.isArray(data.attentionItems) ? data.attentionItems.length : 0,
        createdAt: data.createdAt
      });
    });

    return { items };
  } catch (error) {
    console.warn('[HistoryService] Failed to retrieve analysis history:', error.message);
    return { items: [] };
  }
}

/**
 * Retrieves a specific historical analysis record for an authenticated user.
 * Strictly verifies user authorization; returns null if not found or unauthorized.
 */
export async function getAnalysisHistoryById(userId, analysisId) {
  const db = getFirestoreDb();
  if (!db || !userId || !analysisId) {
    return null;
  }

  try {
    const docRef = db.collection('users').doc(userId).collection('analysisHistory').doc(analysisId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    // Verify user authorization boundary
    if (data.userId !== userId) {
      return null;
    }

    return {
      id: doc.id,
      analysisId: data.analysisId || doc.id,
      document: {
        name: data.documentName,
        documentType: data.documentType,
        duration: data.duration || 'Not specified',
        parties: data.parties || []
      },
      context: {
        persona: data.persona,
        intent: data.intent
      },
      summary: data.summary || [],
      attentionItems: data.attentionItems || [],
      importantClauses: data.importantClauses || [],
      obligations: data.obligations || [],
      importantDates: data.importantDates || [],
      lawyerQuestions: data.lawyerQuestions || [],
      checklist: data.checklist || [],
      schemaVersion: data.schemaVersion || 1,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  } catch (error) {
    console.warn('[HistoryService] Failed to retrieve analysis item:', error.message);
    return null;
  }
}
