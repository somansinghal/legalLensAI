import { getFirestoreDb } from './firebaseService.js';

/**
 * Retrieves the persisted checklist state for a specific analysis.
 */
export async function getChecklist(userId, analysisId) {
  const db = getFirestoreDb();
  if (!db || !userId || !analysisId) {
    return null;
  }

  try {
    const checklistRef = db.collection('users').doc(userId).collection('checklists').doc(analysisId);
    const doc = await checklistRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (data.userId !== userId) {
      return null;
    }

    return {
      analysisId: data.analysisId,
      documentName: data.documentName,
      items: data.items || [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  } catch (error) {
    console.warn('[ChecklistService] Error reading checklist:', error.message);
    return null;
  }
}

/**
 * Updates checklist items or completion states for an authenticated user's analysis.
 * Verifies that the user owns the record before updating.
 */
export async function updateChecklist(userId, analysisId, updateData) {
  const db = getFirestoreDb();
  if (!db || !userId || !analysisId || !updateData) {
    return null;
  }

  try {
    const checklistRef = db.collection('users').doc(userId).collection('checklists').doc(analysisId);
    const doc = await checklistRef.get();

    if (!doc.exists) {
      return null;
    }

    const current = doc.data();
    if (current.userId !== userId) {
      return null;
    }

    const now = new Date().toISOString();
    let updatedItems = current.items || [];

    // Support bulk items array or individual index update
    if (Array.isArray(updateData.items)) {
      updatedItems = updateData.items.map((item, idx) => ({
        index: typeof item.index === 'number' ? item.index : idx,
        task: String(item.task || ''),
        completed: Boolean(item.completed)
      }));
    } else if (typeof updateData.index === 'number' && typeof updateData.completed === 'boolean') {
      const target = updatedItems.find((i) => i.index === updateData.index);
      if (target) {
        target.completed = updateData.completed;
      } else {
        updatedItems.push({
          index: updateData.index,
          task: updateData.task || '',
          completed: updateData.completed
        });
      }
    }

    await checklistRef.set({
      ...current,
      items: updatedItems,
      updatedAt: now
    }, { merge: true });

    return {
      analysisId,
      items: updatedItems,
      updatedAt: now
    };
  } catch (error) {
    console.warn('[ChecklistService] Error updating checklist:', error.message);
    return null;
  }
}
