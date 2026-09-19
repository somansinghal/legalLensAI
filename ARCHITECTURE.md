# LegalLens AI — Architecture

## 1. Scope and Design Principles

LegalLens AI is a context-aware legal document intelligence platform. The architecture favors explainability, strict privacy by default, minimal external dependencies, clear boundaries, graceful failure, and a repository footprint strictly below 10 MB.

### Core Architectural Principles:
1. **Explainable AI Over Chatbots**: Replaces open-ended chat hallucination with deterministic, schema-validated document analysis.
2. **Privacy by Default**: Raw user-supplied legal documents are analyzed transiently in memory and **never** persisted to Firestore.
3. **Defense-in-Depth AI Pipeline**: Encloses untrusted document text in XML delimiters, defends against prompt injection, and strictly validates all LLM output against schemas before rendering.
4. **Decoupled Server-Side Persistence**: Firebase Admin SDK is deployed strictly server-side. Direct client SDK access to Firestore is denied.
5. **Schema Versioning**: All persisted analysis and profile records include `schemaVersion: 1` to ensure seamless schema evolution.
6. **Graceful Offline Degradation**: The core application functions seamlessly even when external services (Google OAuth, Firebase, SMTP) are unconfigured or offline.

---

## 2. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client Layer [Client Layer (Browser)]
        UI[Vanilla HTML5 / CSS3 / ES Modules]
        State[Local UI State & DOM Controller]
    end

    subgraph Transport [Transport Layer]
        HTTP[HTTPS & HttpOnly Session Cookie]
    end

    subgraph Server Layer [Express API Server]
        Middleware[Helmet, Rate Limiter, Context]
        Router[API Routers: Auth, Analysis, Checklist, Contact, Health]
        AuthSvc[Auth & Session Manager]
    end

    subgraph Service Layer [Application Services]
        ContextSvc[Context & Persona Engine]
        GroqSvc[Prompt Builder & Groq AI Client]
        Validator[JSON Parser & Schema Normalizer]
        FirebaseSvc[Firebase Admin SDK Singleton]
        UserSvc[User Profile Service]
        HistorySvc[Analysis History Service]
        ChecklistSvc[Checklist Sync Service]
    end

    subgraph External Infrastructure [Cloud Infrastructure]
        GroqCloud[Groq Cloud / Llama 3.3 70B]
        FirestoreDB[(Cloud Firestore)]
    end

    UI -->|User Context & Document| HTTP
    HTTP --> Middleware
    Middleware --> Router
    Router --> AuthSvc
    Router --> GroqSvc
    GroqSvc --> ContextSvc
    GroqSvc -->|Delimited Prompt| GroqCloud
    GroqCloud -->|Raw JSON Completion| Validator
    Validator -->|Validated Structured Result| Router
    Router -->|Optional Persistence| HistorySvc
    HistorySvc --> FirebaseSvc
    UserSvc --> FirebaseSvc
    ChecklistSvc --> FirebaseSvc
    FirebaseSvc --> FirestoreDB
    Router -->|Safe HTML View Model| UI
```

---

## 3. Component Breakdown

```text
server/
  server.js                 Entry point & HTTP server bootstrap
  app.js                    Express application factory, security middleware, and router mounts
  middleware/
    auth.js                 Session cookie verification and route guard (requireAuth)
    errorHandler.js         Safe centralized error handling and payload limiters
    rateLimit.js            Tiered in-memory rate limiting per endpoint
    requestContext.js       Cryptographic requestId injection and request logging
  routes/
    auth.js                 Google OAuth flow and demo authentication
    analysis.js             Document analysis and analysis history endpoints
    checklist.js            Checklist retrieval and task completion sync
    contact.js              Product contact form and optional SMTP delivery
    demos.js                Synthetic demo agreement repository
    health.js               Public liveness and health status
    protected.js            Protected workspace session verification
    services/
    analysisService.js      AI analysis orchestrator and timeout manager
    authService.js          Session & OAuth state manager (Firestore-backed with in-memory cache)
    checklistService.js     Action checklist state persistence and toggles
    contactService.js       Contact input validation and optional SMTP delivery
    contextService.js       Persona and intent validation rules
    demoService.js          Curated demo contracts repository
    documentService.js      Text sanitization, length boundaries, and metadata extraction
    firebaseService.js      Firebase Admin SDK singleton & credential resolver
    historyService.js       Analysis history persistence and scoped query builder
    preferenceService.js    User UI preferences persistence
    userService.js          User profile upsert and identity mapping
api/
  index.js                  Vercel Serverless Function entry point exporting Express app
vercel.json                 Vercel routing, clean URLs, and edge security headers
  utils/
    config.js               Server environment configuration parser
    errors.js               AppError class with standardized error shapes
```

---

## 4. Cloud Firestore Data Model

The Firestore persistence model is designed for strict user isolation, minimal storage overhead, and zero raw document retention.

### Collection Hierarchy:

```
users/{userId}
  ├── provider: string ("google" | "demo")
  ├── providerUserId: string | null
  ├── email: string
  ├── displayName: string | null
  ├── photoURL: string | null
  ├── createdAt: ISO timestamp
  ├── updatedAt: ISO timestamp
  ├── lastLoginAt: ISO timestamp
  │
  ├── analysisHistory/{analysisId}
  │     ├── analysisId: string (UUIDv4)
  │     ├── userId: string
  │     ├── documentName: string
  │     ├── documentType: string
  │     ├── persona: string
  │     ├── intent: string
  │     ├── summary: Array<{ text: string }>
  │     ├── attentionItems: Array<{ level: string, title: string, explanation: string, suggestedAction: string }>
  │     ├── importantClauses: Array<{ title: string, explanation: string, attention: string, sourceText: string }>
  │     ├── obligations: Array<{ party: string, action: string, deadline?: string }>
  │     ├── importantDates: Array<{ value: string, label: string, event: string, explanation: string }>
  │     ├── lawyerQuestions: Array<string>
  │     ├── checklist: Array<{ task: string, completed: boolean }>
  │     ├── schemaVersion: number (1)
  │     ├── createdAt: ISO timestamp
  │     └── updatedAt: ISO timestamp
  │
  ├── checklists/{analysisId}
  │     ├── analysisId: string
  │     ├── userId: string
  │     ├── documentName: string
  │     ├── items: Array<{ index: number, task: string, completed: boolean }>
  │     ├── createdAt: ISO timestamp
  │     └── updatedAt: ISO timestamp
  │
  └── preferences/settings
        ├── persona: string
        ├── intent: string
        └── updatedAt: ISO timestamp
```

---

## 5. Data Privacy & Storage Boundary

```
+-------------------------------------------------------------+
|                      DATA BOUNDARY                          |
+-------------------------------------------------------------+
| TRANSIENT MEMORY ONLY           | PERSISTED TO CLOUD FIRESTORE|
+---------------------------------+---------------------------+
| - User document text            | - Document Name           |
| - Pasted contract excerpts      | - Persona & Intent        |
| - Raw Groq AI prompt            | - Plain-language summary  |
| - Groq completion tokens        | - Categorized clauses     |
| - Google OAuth access tokens    | - Obligations & deadlines |
| - Google OAuth refresh tokens   | - Lawyer questions        |
| - Temporary session tokens      | - Checklist task status   |
+-------------------------------------------------------------+
```

---

## 5.1 Two-Tier Firebase Configuration Architecture

To enforce strict security and zero leakage of administrative keys, Firebase is partitioned into two isolated configuration layers:

### Layer A: Firebase Web App Client Configuration (`public/js/firebase-config.js`)
Configured for client-facing capabilities (project `legallenz-ai`):
- `apiKey`: `AIzaSyDP0h5OEmXzv3J_ajF24gZ_p4hIrSf72U4`
- `authDomain`: `legallenz-ai.firebaseapp.com`
- `projectId`: `legallenz-ai`
- `storageBucket`: `legallenz-ai.firebasestorage.app`
- `messagingSenderId`: `10907545077`
- `appId`: `1:10907545077:web:5bc5044789a39859b444bc`
- `measurementId`: `G-ZZW2QYZ0NK`

*Note: The frontend does not initiate direct client Firestore queries; security rules remain `allow read, write: if false;` for direct client access.*

### Layer B: Firebase Admin SDK Server Credentials (Strictly Server-Only)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

These credentials reside exclusively in server environment variables (Vercel Project Settings) and are never exposed in client JavaScript, HTML, localStorage, or API responses.

---

## 5.2 One-Click Judge Demo Architecture (`POST /api/auth/demo`)

Evaluators can test the complete system with a single click:
1. Client sends `POST /api/auth/demo` with empty body (no password sent or received).
2. Server loads `DEMO_EMAIL` and `DEMO_PASSWORD` from private server environment.
3. Server executes `verifyDemoCredentials` in constant time (`crypto.timingSafeEqual`).
4. Server generates an authenticated session token, persists it into Firestore `sessions/{tokenHash}` with an HMAC-SHA256 salt, and emits an `HttpOnly` `SameSite=Lax` `Secure` session cookie.
5. Client receives `{ authenticated: true, user: ... }` and redirects to `/dashboard.html`.
6. Rate limiting is enforced under `authLimiter` (max 20 requests per 15 minutes).

---

## 6. Document Versioning Strategy

All persisted analysis and checklist documents contain an explicit `schemaVersion` attribute:

```json
{
  "schemaVersion": 1
}
```

This ensures that future revisions to the analysis structure (e.g. adding jurisdiction tags or risk scoring) can be migrated deterministically without breaking backwards compatibility.
