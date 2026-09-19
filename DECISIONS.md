# LegalLens AI — Architecture Decision Records (ADRs)

## ADR-001: Express with Vanilla ES Modules Over Full-Stack Frameworks

- **Status**: Accepted
- **Context**: The project required a fast, lightweight, and explainable legal document intelligence product with minimal bundle size and strict sub-10MB repository constraints.
- **Decision**: Use Node.js with native ES Modules, Express 4, and vanilla HTML5/CSS3/JavaScript without bundlers or heavy meta-frameworks (e.g. Next.js, React).
- **Consequences**: Fast startup times, zero build overhead, deterministic behavior, and extreme portability across local and serverless deployment environments.

---

## ADR-002: Server-Side Groq API Integration with Llama 3.3 70B

- **Status**: Accepted
- **Context**: Document analysis requires high contextual comprehension, low latency, and deterministic structured JSON outputs.
- **Decision**: Integrate Groq Cloud's server-side API running `llama-3.3-70b-versatile` with `temperature: 0.1` and explicit XML boundary delimiters.
- **Consequences**: Inference times are sub-second; prompt injection defenses are enforced server-side; API keys are never exposed to browser clients.

---

## ADR-003: Use Firebase Admin SDK + Cloud Firestore for Server-Side Persistence

- **Status**: Accepted
- **Context**:
  Authenticated users require a way to view their previous document analyses and track progress on their action checklists across devices and sessions. However, legal documents contain highly sensitive commercial and personal data.
- **Decision**:
  1. Integrate the **Firebase Admin SDK** exclusively on the backend as a trusted persistence layer.
  2. Deny all direct client-side Firestore access via `firestore.rules`.
  3. Store user profiles (`users/{userId}`), analysis history (`users/{userId}/analysisHistory/{analysisId}`), and checklists (`users/{userId}/checklists/{analysisId}`).
  4. **Strict Privacy Boundary**: Persist only structured insights, categorizations, and metadata. **Never persist user-supplied raw contract text.**
  5. Include `schemaVersion: 1` on all persisted analysis records.
- **Alternatives Considered**:
  - *Client-side Firebase Web SDK*: Rejected because exposing Firebase credentials and managing client auth rules increases client bundle size, exposes the database structure, and conflicts with the existing HttpOnly cookie session architecture.
  - *PostgreSQL / Relational DB*: Rejected due to connection management overhead and heavier deployment footprint for serverless environments.
  - *Local SQLite*: Rejected because serverless environments (e.g. Vercel) feature ephemeral filesystems.
- **Consequences**:
  - Cloud Firestore provides scalable NoSQL persistence with native JSON compatibility.
  - Backend mediation ensures strict authorization checks, schema validation, and logging redaction before records ever reach the database.
  - If Firebase is unconfigured or offline, the application degrades gracefully to transient memory analysis.

---

## ADR-004: Dual-Track Authentication (Google OAuth + Evaluator Demo)

- **Status**: Accepted
- **Context**: The application requires production Google OAuth 2.0 while enabling seamless evaluation for competition judges without requiring pre-configured OAuth client credentials.
- **Decision**: Implement server-side Google OAuth 2.0 OpenID Connect alongside an environment-configurable Demo login (`judge@example.com`). Both authentication pathways mint identical, secure HttpOnly sessions and map to stable Firestore user IDs (`google:<subId>` and `demo:<hash>`).
- **Consequences**: Evaluators can immediately test the full product without setup friction, while production users benefit from Google OAuth.

---

## ADR-0010: Vercel Serverless Function Deployment with Firestore-Backed Session Persistence

- **Status**: Accepted
- **Context**: Deploying Express onto Vercel serverless infrastructure presents challenges with ephemeral memory across lambdas and cold starts. In-memory session maps do not survive across independent serverless function instances.
- **Decision**:
  1. Export the Express application via `api/index.js` as a Vercel Serverless Function.
  2. Configure `vercel.json` with edge static caching for `public/` assets and route rewrites directing `/api/*` to `api/index.js`.
  3. Store session tokens and OAuth states in Cloud Firestore (`sessions/{tokenHash}` and `oauthStates/{stateHash}`) with cryptographic HMAC hashing and automatic expiration.
  4. Retain an in-memory Map as a fast cache and offline fallback.
- **Consequences**:
  - Full serverless compatibility without changing Express router code or weakening security.
  - Sessions persist across distinct Vercel function instances without storing credentials in `localStorage` or `sessionStorage`.
