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

---

## ADR-005: Two-Tier Firebase Configuration & Decoupled Client/Server Boundaries

- **Status**: Accepted
- **Context**: Firebase provides client-facing SDK configuration (`apiKey`, `appId`, `projectId`, etc.) as well as server-side administrative service account credentials (`FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`). Confusing these two layers risks critical security leakage.
- **Decision**:
  1. Maintain two strictly separated configuration scopes:
     - **Layer A (Public Client)**: `public/js/firebase-config.js` exposes public Web App parameters for `legallenz-ai`. Safe for browser consumption.
     - **Layer B (Server Admin Private)**: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` reside exclusively in server-side environment variables.
  2. Maintain `allow read, write: if false;` on Cloud Firestore so all data access remains server-mediated.
- **Consequences**:
  - Administrative private keys are 100% shielded from browser bundles and network responses.
  - Client web app configuration is cleanly documented and ready if client features are expanded.

---

## ADR-006: One-Click Evaluator Authentication Endpoint (POST /api/auth/demo)

- **Status**: Accepted
- **Context**: Hackathon judges require an effortless, one-click experience to evaluate the full application without manually copying or typing credentials, while preserving strict security that never exposes `DEMO_PASSWORD` to browser JavaScript.
- **Decision**:
  1. Introduce `POST /api/auth/demo` which reads `DEMO_EMAIL` and `DEMO_PASSWORD` strictly server-side.
  2. Validate credentials via `verifyDemoCredentials`, create the standard session in Firestore, issue an `HttpOnly` cookie, and return safe identity metadata without passwords.
  3. Wire the login page "Judge Demo — use configured credentials" button directly to this endpoint with an accessible loading state ("Starting judge demo...") and duplicate request suppression.
- **Consequences**:
  - Seamless zero-friction evaluator onboarding.
  - Strict security guarantee: `DEMO_PASSWORD` is never exposed to frontend code, DOM, or client API payloads.

---

## ADR-007: Transient In-Memory Multi-Format Document Ingestion (PDF, DOCX, RTF, TXT, MD)

- **Status**: Accepted
- **Context**: Legal documents commonly arrive as Word documents (`.docx`) or scanned/rendered PDFs, alongside RTF and plain text. Users need to analyze these files without compromising confidentiality or requiring persistent server storage.
- **Decision**:
  1. Implement transient in-memory extraction via `pdf-parse` (PDF) and `mammoth` (DOCX), coupled with a regex-based RTF extractor and UTF-8 text parser.
  2. Implement binary magic-byte header validation (`%PDF-`, `PK\x03\x04`, `{\rt`) to detect file corruption and prevent MIME-type spoofing before parsing.
  3. Enforce strict resource boundaries: 500 KB file ceiling and 120,000 extracted character ceiling.
  4. Never write uploaded files to disk, temporary OS storage, or cloud buckets. All operations execute strictly in transient RAM buffers and populate the workspace textarea.
- **Consequences**:
  - Broad format accessibility for real-world legal agreements.
  - Absolute privacy preservation: raw files vanish from memory immediately upon response dispatch.

---

## ADR-008: Stateless Cryptographic HMAC Session Token Signatures & Firestore REST Mode

- **Status**: Accepted
- **Context**: In serverless cloud environments (Vercel lambdas), Firestore gRPC over HTTP/2 can experience connection latency or channel permission drops across disparate containers. In-memory caches are isolated per container, risking unexpected session drops during rapid navigation or tab switching.
- **Decision**:
  1. Configure Firestore Admin with `preferRest: true` to use standard HTTPS REST transport, bypassing gRPC connection drops.
  2. Implement dual-layer stateless HMAC-SHA256 session signatures: session tokens are issued in `base64url(payload).signature` format.
  3. Any serverless lambda instance can instantly verify token validity in constant time using `SESSION_SECRET` without requiring synchronous database roundtrips, while Firestore remains the authoritative store for revocations and TTL.
- **Consequences**:
  - Zero session loss across arbitrary serverless lambdas.
  - Tab navigation and rapid dashboard clicks remain 100% resilient without dropping authentication.

