/**
 * Firebase Web App Configuration (Client-Side)
 *
 * Project: legallenz-ai
 * Web App: LegalLenz AI (appId: 1:10907545077:web:5bc5044789a39859b444bc)
 *
 * CRITICAL SECURITY ARCHITECTURE:
 * - These values are standard Firebase Web Client configuration.
 * - Server credentials (FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, GROQ_API_KEY,
 *   GOOGLE_CLIENT_SECRET, SMTP_PASSWORD, SESSION_SECRET, DEMO_PASSWORD) are STRICTLY
 *   server-only and NEVER included here.
 * - LegalLens AI uses a secure server-mediated architecture:
 *   Browser -> Express API -> Firebase Admin SDK -> Cloud Firestore
 *   Raw legal document text is transient and NEVER stored in Cloud Storage or Firestore.
 */

export const firebaseConfig = {
  apiKey: "AIzaSyDP0h5OEmXzv3J_ajF24gZ_p4hIrSf72U4",
  authDomain: "legallenz-ai.firebaseapp.com",
  projectId: "legallenz-ai",
  storageBucket: "legallenz-ai.firebasestorage.app",
  messagingSenderId: "10907545077",
  appId: "1:10907545077:web:5bc5044789a39859b444bc",
  measurementId: "G-ZZW2QYZ0NK"
};

export default firebaseConfig;
