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

- **No Secrets in Frontend**: `GROQ_API_KEY`, `FIREBASE_PRIVATE_KEY`, `GOOGLE_CLIENT_SECRET`, and session secrets exist solely within the server environment.
- **Service Account Protection**: Firebase Admin credentials are fed through environment variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) or Google Cloud Application Default Credentials (ADC). No physical service account JSON files are committed to source control.
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
- **Serverless Session Resilience via Cloud Firestore**: Sessions are stored in Firestore under `sessions/{tokenHash}` using HMAC-SHA256 hashed keys (`tokenHash = HMAC(SESSION_SECRET, token)`), with an in-memory cache and automatic TTL expiration. This ensures session state persists across cold starts and distinct serverless function instances on Vercel without storing credentials in localStorage or sessionStorage.
- **Zero Client-Side Credentials**: No tokens, keys, passwords, or user credentials exist in `localStorage` or `sessionStorage`.
- **Timing-Safe Credential Verification**: Evaluator demo authentication uses `crypto.timingSafeEqual` over SHA-256 hashes to prevent timing attacks.
- **OAuth 2.0 CSRF Defense**: Google OAuth requests require a cryptographically generated, 32-byte `state` token with a 10-minute time-to-live. States are persisted in Firestore (`oauthStates/{stateHash}`), consumed once, and deleted.
- **Session Expiration**: Sessions expire automatically after 4 hours of inactivity (`SESSION_TTL_MS = 14,400,000`).

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
