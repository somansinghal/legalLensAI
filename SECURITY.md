# LegalLens AI — Security & Privacy Architecture

## 1. Threat Model & Principles

LegalLens AI processes sensitive contracts and legal agreements. Security is integrated at every tier, treating all user-submitted text and client inputs as untrusted data.

### Core Security Tenets:
1. **Server-Side Exclusivity**: Zero secret leakage to the browser.
2. **Document Privacy by Default**: Raw legal document text is **never** written to persistent storage.
3. **Defense-in-Depth AI**: Layered prompt injection mitigation and strict JSON schema validation.
4. **Strict Authorization**: Access to user data is governed strictly through authenticated backend sessions.

---

## 2. Credential & Secret Management

- **Dual-Layer Firebase Separation**:
  - **Layer A (Public Client Safe)**: `public/js/firebase-config.js` exposes standard Web App configuration (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`, `measurementId`) for project `legallenz-ai`. These parameters are public and contain zero administrative privileges.
  - **Layer B (Server Admin Private)**: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` exist exclusively within server-side environment variables. They are never bundled into client JavaScript, injected into HTML, stored in storage, or returned in API responses.
- **No Server Secrets in Frontend**: `GROQ_API_KEY`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `GOOGLE_CLIENT_SECRET`, `SMTP_PASSWORD`, `DEMO_PASSWORD`, and `SESSION_SECRET` exist solely within the server environment.
- **One-Click Judge Demo Security**: The `POST /api/auth/demo` endpoint reads `DEMO_EMAIL` and `DEMO_PASSWORD` strictly server-side. Evaluators are authenticated and issued a secure `HttpOnly` cookie without exposing `DEMO_PASSWORD` to browser JavaScript or network payloads.
- **Service Account Protection**: Firebase Admin credentials are fed through environment variables or Google Cloud Application Default Credentials (ADC). No physical service account JSON files are committed to source control.
- **Repository Cleanliness**: Verified `.gitignore` blocks `.env`, credentials, temporary logs, and sensitive artifacts.

---

## 3. Firestore Access Control & Security Rules

Because LegalLens AI utilizes the **Firebase Admin SDK** exclusively server-side, direct client access to the database is disabled.

### `firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- **Backend Enforcement**: All read, write, and update operations occur through verified Express controllers that derive the `userId` directly from `req.session.userId`.
- **Cross-User Isolation**: Every Firestore query is strictly scoped to `users/{userId}/...`. An authenticated user cannot query or mutate records belonging to another account.

---

## 4. Authentication & Session Security

- **HttpOnly Cookies**: Session tokens are transmitted via an `HttpOnly`, `SameSite=Lax` cookie (`legallens_session`). Marked `Secure` automatically in `production` environment.
- **Serverless Session Resilience via Cloud Firestore & Signed HMAC**: Sessions are stored in Firestore under `sessions/{tokenHash}` using HMAC-SHA256 hashed keys (`tokenHash = HMAC(SESSION_SECRET, token)`), with an in-memory cache and automatic TTL expiration. In addition, session tokens are cryptographically signed using HMAC-SHA256 (`base64url(payload).sig`), allowing serverless lambda containers to verify session authenticity in constant time across instances with zero cold start latency.
- **Zero Client-Side Credentials**: No tokens, keys, passwords, or user credentials exist in `localStorage` or `sessionStorage`.
- **Timing-Safe Credential Verification**: Evaluator demo authentication uses `crypto.timingSafeEqual` over SHA-256 hashes to prevent timing attacks.
- **OAuth 2.0 CSRF Defense**: Google OAuth requests require a cryptographically generated, 32-byte `state` token with a 10-minute time-to-live. States are persisted in Firestore (`oauthStates/{stateHash}`), consumed once, and deleted.
- **Session Expiration**: Sessions expire automatically after 4 hours of inactivity (`SESSION_TTL_MS = 14,400,000`).

---

## 4.1 Document Ingestion & Parser Security

- **Transient In-Memory Processing**: Uploaded documents (PDF, DOCX, RTF, TXT, MD) are held transiently in memory buffers only during text extraction. Files are **never** written to local disk, temporary directories, or cloud storage buckets.
- **Magic-Byte Signature Verification**: Before parsing, document buffers undergo header validation against known magic bytes:
  - PDF: `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`)
  - DOCX: Zip package signature `PK\x03\x04` (`0x50 0x4B 0x03 0x04`)
  - RTF: `{\rt` (`0x7B 0x5C 0x72 0x74`)
  Files with mismatched extensions and binary headers are rejected immediately as corrupted or tampered.
- **Strict Parsing Boundaries**:
  - Memory ceiling: 500 KB per uploaded document
  - Extracted text ceiling: 120,000 characters
  - Empty or image-only scanned PDFs without extractable text are rejected with clear guidance.

---

## 5. Network & HTTP Defenses

- **Strict Content Security Policy (CSP)**: Powered by Helmet:
  - `defaultSrc: ["'self'"]`
  - `scriptSrc: ["'self'"]`
  - `styleSrc: ["'self'"]`
  - `imgSrc: ["'self'", "data:"]`
  - `frameAncestors: ["'none'"]`
- **Clickjacking Protection**: `X-Frame-Options: DENY`.
- **MIME Sniffing Prevention**: `X-Content-Type-Options: nosniff`.
- **Referrer Control**: `Referrer-Policy: no-referrer`.
- **Payload Limits**: Max body payload capped at 500 KB to eliminate buffer overflow and DoS vectors.
- **Tiered Rate Limiting**:
  - Global API: 20 req / minute
  - Authentication (`/api/auth/*`): 20 req / 15 minutes
  - AI Analysis (`/api/analysis`): 10 req / hour
  - Contact Form (`/api/contact`): 5 req / hour

---

## 6. Audit & Logging Redaction

Server logs strictly prohibit recording:
- Raw document content or contract text
- OAuth tokens or client secrets
- Firebase credentials or private keys
- User passwords
- Complete email message bodies

Logs include only operational metadata: `timestamp`, `requestId`, `method`, `path`, `statusCode`, and `durationMs`.
