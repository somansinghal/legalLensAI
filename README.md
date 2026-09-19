<div align="center">

<img src="public/assets/legallens-ai-logo.jpg" alt="LegalLens AI Logo" width="180">

# LegalLens AI
### UNDERSTAND BEFORE YOU SIGN

**Context-aware legal document intelligence powered by Groq AI and secured by Cloud Firestore.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3%2070B-F55036?logo=groq&logoColor=white)](https://groq.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Admin%20SDK-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Firestore](https://img.shields.io/badge/Firestore-NoSQL%20Persistence-FFA000?logo=firebase&logoColor=black)](https://firebase.google.com/docs/firestore)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Tested-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Security](https://img.shields.io/badge/Security-HttpOnly%20%7C%20CSP%20%7C%20Injection%20Defense-blue)](#-security--privacy-architecture)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<br>

<img src="docs/demo/legallens-ai-overview.gif" alt="LegalLens AI Product Overview" width="850">

</div>

---

## 🔗 Links

- **Live Production Website**: [https://legallensai-india.vercel.app/](https://legallensai-india.vercel.app/)
- **GitHub Repository**: [https://github.com/somansinghal/legalLensAI](https://github.com/somansinghal/legalLensAI)
- **Creator Portfolio**: [https://somansinghal.vercel.app/](https://somansinghal.vercel.app/)
- **Creator GitHub**: [https://github.com/somansinghal](https://github.com/somansinghal)
- **Creator LinkedIn**: [https://www.linkedin.com/in/soman-singhal](https://www.linkedin.com/in/soman-singhal)
- **Contact Email**: [somansinghal06@gmail.com](mailto:somansinghal06@gmail.com)

---

## ✨ What is LegalLens AI?

Most legal chatbots treat agreements as generic question-answering documents. **LegalLens AI is not a chatbot—it is an explainable second lens for everyday agreements.**

Legal documents mean vastly different things depending on who you are and why you are reading them:
- An **Employee** evaluating an offer cares about non-competes, IP assignment, and severance.
- A **Freelancer** cares about payment schedules, scope creep, and copyright retention.
- A **Small Business Owner** cares about termination liability, indemnification, and jurisdiction.
- A **Student** reviewing an internship contract cares about stipend terms and publication rights.

By combining **Persona + Intent + Document Text**, LegalLens AI produces structured, context-specific insights:

$$\text{Persona} + \text{Intent} + \text{Document} + \text{Defended AI Pipeline} \implies \text{Actionable Insight}$$

> [!NOTE]
> **Safety Notice:** LegalLens AI provides legal information, educational synthesis, and document assistance. It does **not** provide legal advice or replace a qualified legal professional.

---

## ⚡ Core Feature Grid

| Feature | Description |
|---|---|
| 🧠 **Context-Aware Analysis** | Tailors insights based on 5 personas (Employee, Freelancer, Student, Business Owner, Other) and 5 distinct review intents. |
| 🚨 **Attention Radar** | Triages critical clauses into high-attention, review-carefully, or standard advisory buckets. |
| 📑 **Clause Explorer** | Extracts key provisions, side-by-side with original document excerpts and plain-English translations. |
| 📅 **Obligations & Dates** | Surfaces contractual duties by party and chronological deadlines, commencement dates, and notice windows. |
| ⚖️ **Lawyer Preparation** | Generates precise, jurisdiction-aware questions to ask a qualified attorney during consultation. |
| ✅ **Action Checklist** | Generates contextual next steps with stateful checklist progress synchronized with Cloud Firestore. |
| 🔥 **Cloud Firestore Persistence** | Automatically stores structured analysis summaries, user profiles, and checklist progress via server-side Firebase Admin. |
| 🛡️ **Document Privacy by Default** | User document text is processed transiently in memory. Raw document text is **never** persisted to Firestore. |
| 🔐 **Secure Multi-Modal Auth** | Session-based authentication supporting production Google OAuth and a configured zero-friction Judge Demo mode. |
| 📱 **Responsive & Accessible** | Glassmorphic, dark-mode interface built with semantic HTML5, keyboard navigation, and full mobile optimization. |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User([User Browser]) -->|HTTPS / HttpOnly Cookie| Express[Express API Server]
    Express --> Auth[Authentication & Session Manager]
    Auth -->|Google OAuth 2.0 / Demo Auth| UserProfile[User Profile Service]
    UserProfile -->|Server-Side Admin SDK| Firestore[(Cloud Firestore)]

    Express --> Analysis[Analysis Controller]
    Analysis --> Context[Context & Priority Engine]
    Context --> PromptDefense[Prompt Construction & Injection Defense]
    PromptDefense --> Groq[Groq AI Client / Llama 3.3 70B]
    Groq --> Validation[Strict Schema Validation & Normalization]

    Validation --> Persistence[History & Checklist Service]
    Persistence -->|Metadata & Structured Insights Only| Firestore
    Validation -->|Safe HTML View Model| User
```

---

## 🤖 AI Pipeline & Prompt-Injection Defense

```
User Input (Persona + Intent + Document)
                 ↓
      Input Validation & Sanitization (Size limits & regex boundaries)
                 ↓
      Enclosure in Strict XML-Delimited Boundary Markers
                 ↓
      System Prompt (Forbidden from executing code or altering system instructions)
                 ↓
      Groq API (Llama 3.3 70B Versatile, temperature 0.1)
                 ↓
      Strict JSON Parsing & Schema Validation
                 ↓
      HTML Output Escaping (Defense-in-depth against stored XSS)
                 ↓
      Asynchronous Firestore Persistence (Metadata & structured results only)
                 ↓
      Client Rendering
```

### Prompt Injection Protections:
1. **Isolated Context Boundaries**: User document text is placed strictly within `<untrusted_document_content>` tags.
2. **Defensive Instructions**: The model is explicitly commanded to treat document text as data to analyze, ignoring embedded commands such as `"Forget all prior instructions"`.
3. **Strict Structural Schema**: Responses failing JSON schema validation are automatically rejected by the server before reaching the client.
4. **Output Sanitization**: All AI text is entity-escaped in the frontend prior to DOM insertion.

---

## 🔥 Firebase Architecture & Dual Configuration Layers

LegalLens AI implements a strict, security-first two-tier Firebase architecture:

### 1. Firebase Web App Configuration (Client-Side Safe)
The public web client parameters for the Google Cloud project (`legallenz-ai`) are centralized in [`public/js/firebase-config.js`](public/js/firebase-config.js). These parameters are safe for browser consumption and contain **zero server secrets**:
- `projectId`: `legallenz-ai`
- `appId`: `1:10907545077:web:5bc5044789a39859b444bc`
- `storageBucket`: `legallenz-ai.firebasestorage.app`
- `apiKey`: `AIzaSyDP0h5OEmXzv3J_ajF24gZ_p4hIrSf72U4`
- `authDomain`: `legallenz-ai.firebaseapp.com`
- `messagingSenderId`: `10907545077`
- `measurementId`: `G-ZZW2QYZ0NK`

### 2. Firebase Admin SDK Configuration (Server-Side Only Secrets)
Cloud Firestore operations execute exclusively within the server-side Node.js/Vercel serverless layer using **Firebase Admin SDK**. Private service account keys are NEVER exposed to browser JavaScript, HTML, CSS, client bundles, or frontend API responses:
- `FIREBASE_PROJECT_ID`: Google Cloud / Firebase Project ID
- `FIREBASE_CLIENT_EMAIL`: Service account email
- `FIREBASE_PRIVATE_KEY`: Cryptographic private RSA key (escaped newlines handled)

### Architectural Privacy & Security Guarantees:
- **Server-Mediated Only**: Direct client access to Firestore is denied (`allow read, write: if false;`). All data reads and writes flow through authenticated Express endpoints with rate limiting and session validation.
- **Document Privacy Guarantee**: Raw user legal document text is **never** written to Firestore or Cloud Storage. Text processing is transient (Browser → Express → Groq → Structured Output). Only structured clause analysis, detected obligations, critical dates, and checklist items are persisted.
- **Stable Identity Mapping**:
  - Google OAuth users: `google:<providerUserId>`
  - Demo evaluators: `demo:<sha256(email)>`
- **Schema Versioning**: All persisted analysis documents enforce `schemaVersion: 1` to ensure zero-downtime forward migrations.
- **Graceful Offline Degradation**: If Firebase credentials are unset or the database is temporarily unreachable, the application smoothly degrades to in-memory caching without throwing 500 errors.

### Firestore Collections:
```
users/{userId}
  ├── profile data (provider, email, displayName, lastLoginAt)
  ├── analysisHistory/{analysisId}
  │     ├── documentName, persona, intent, createdAt
  │     ├── summary, attentionItems, importantClauses
  │     ├── obligations, importantDates, lawyerQuestions
  │     └── schemaVersion
  ├── checklists/{analysisId}
  │     └── items: [{ index, task, completed }]
  └── preferences/settings
        └── defaultPersona, defaultIntent
sessions/{tokenHash}
  └── session record (userId, email, role, expiresAt, createdAt)
oauthStates/{stateHash}
  └── state record (state, returnTo, expiresAt)
```

---

## 🔐 Security & Privacy Architecture

- **Server-Side Groq API**: AI keys never leave the server.
- **Server-Side Firebase Admin**: Private service accounts are protected from browser exposure.
- **Strict Firestore Security Rules**: Default `allow read, write: if false;` ensures direct client access is completely blocked; all operations flow through authenticated Express endpoints.
- **HttpOnly Session Cookies**: Hardened with `SameSite=Lax`, `Path=/`, and conditional `Secure` in production.
- **Cryptographic OAuth State**: One-time, time-limited state verification prevents CSRF during Google login.
- **Rate Limiting**: Tiered limits on API (`20/min`), Auth (`20/15min`), AI (`10/hr`), and Contact endpoints (`5/hr`).
- **OWASP HTTP Security Headers**: Helmet provides strict CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: no-referrer`.

---

## 📸 Product Screenshots

### Landing & Authentication
| Landing Page | Sign In | Google OAuth |
|---|---|---|
| ![Landing](docs/screenshots/01-landing-desktop.jpg) | ![Login](docs/screenshots/02-login-desktop.jpg) | ![Google Login](docs/screenshots/03-google-login-desktop.jpg) |

### Workspace & Analysis
| Workspace Dashboard | Document Selection | Real-Time Processing |
|---|---|---|
| ![Dashboard](docs/screenshots/05-dashboard-desktop.jpg) | ![Selection](docs/screenshots/06-document-selection-desktop.jpg) | ![Processing](docs/screenshots/07-analysis-processing-desktop.jpg) |

### Legal Intelligence Dashboard
| Plain-Language Summary | Attention Radar | Clause Explorer |
|---|---|---|
| ![Summary](docs/screenshots/08-analysis-overview-desktop.jpg) | ![Radar](docs/screenshots/09-attention-radar-desktop.jpg) | ![Clauses](docs/screenshots/10-clause-explorer-desktop.jpg) |

| Obligations & Dates | Lawyer Preparation | Action Checklist |
|---|---|---|
| ![Obligations](docs/screenshots/11-obligations-dates-desktop.jpg) | ![Lawyer Prep](docs/screenshots/12-lawyer-preparation-desktop.jpg) | ![Checklist](docs/screenshots/13-action-checklist-desktop.jpg) |

### Contact & Mobile Responsiveness
| Contact Page | Mobile Dashboard | Mobile Clause Explorer |
|---|---|---|
| ![Contact](docs/screenshots/15-contact-desktop.jpg) | ![Mobile Dashboard](docs/screenshots/mobile/03-dashboard-mobile.jpg) | ![Mobile Clauses](docs/screenshots/mobile/05-clause-explorer-mobile.jpg) |

---

## 🎥 Product Demo

Watch the comprehensive video walkthrough demonstrating authentication, context selection, synthetic demo analysis, Attention Radar review, and Firestore history persistence:

[![Watch LegalLens AI Demo](docs/demo/legallens-ai-demo-poster.jpg)](docs/demo/legallens-ai-demo.webm)

**▶ [Watch Full Product Demo Walkthrough (WebM)](docs/demo/legallens-ai-demo.webm)**

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18.18.0 or higher
- **npm**: v9 or higher

### 2. Installation
```bash
git clone https://github.com/somansinghal/legalLensAI.git
cd legalLensAI
npm ci
```

### 3. Environment Setup
Create a `.env` file from the template:
```bash
cp .env.example .env
```

Configure your server secrets in `.env`:
```env
# AI Service
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Judge Demo Access
DEMO_EMAIL=judge@example.com
DEMO_PASSWORD=change-this-demo-password
SESSION_SECRET=change-this-session-secret

# Google OAuth (Optional for local development)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://127.0.0.1:3000/api/auth/google/callback

# Firebase Persistence (Server-only)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Start the Application
```bash
npm start
# Server starts at http://localhost:3000
```

### 5. (Optional) Run with Local Firestore Emulator
```bash
# Start Firebase Emulator Suite
firebase emulators:start --only firestore

# In another terminal:
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm start
```

---

## ☁️ Vercel Production Deployment

LegalLens AI is deployed in production as a serverless application on Vercel:

- **Live URL**: [https://legallensai-india.vercel.app/](https://legallensai-india.vercel.app/)
- **Repository**: [https://github.com/somansinghal/legalLensAI](https://github.com/somansinghal/legalLensAI)

### Serverless Architecture on Vercel
- **Edge Static CDN**: Static assets in `public/` are served with global edge caching and strict security headers defined in [`vercel.json`](vercel.json).
- **Serverless API Function**: All `/api/*` routes are handled by [`api/index.js`](api/index.js), which executes the Express app within the Vercel Node.js serverless runtime.
- **Serverless Session Resilience**: In serverless runtimes, in-memory state is ephemeral. LegalLens AI persists session tokens (`sessions/{tokenHash}`) and OAuth states (`oauthStates/{stateHash}`) into Cloud Firestore with cryptographic HMAC hashing, ensuring sessions persist across cold starts and separate lambda instances without weakening authentication.
- **Zero Localhost Leaks**: Production routing is strictly decoupled from development defaults.

### Vercel Environment Variables
Set the following environment variables in your Vercel Project Settings (**Settings → Environment Variables**):

| Variable | Recommended Production Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enforces Secure cookies and production logging |
| `GROQ_API_KEY` | `gsk_...` | Server-side Groq Cloud API key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Target LLM model |
| `DEMO_EMAIL` | `judge@example.com` | Evaluator account email |
| `DEMO_PASSWORD` | `<secure-password>` | Configured evaluator password (provided privately to judges) |
| `SESSION_SECRET` | `<32-char-random-string>` | Salt for session cryptographic HMAC tokens |
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | Google Cloud OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Google Cloud OAuth Client Secret |
| `GOOGLE_CALLBACK_URL` | `https://legallensai-india.vercel.app/api/auth/google/callback` | Production OAuth callback URL |
| `FIREBASE_PROJECT_ID` | `legallens-ai-...` | Google Cloud / Firebase Project ID |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...@...iam.gserviceaccount.com` | Service account email |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` | Private key (newlines automatically unescaped) |
| `CONTACT_TO_EMAIL` | `somansinghal06@gmail.com` | Destination inbox for contact form |
| `SMTP_HOST` | `smtp.gmail.com` | Optional SMTP host for contact delivery |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | `...` | SMTP username |
| `SMTP_PASSWORD` | `...` | SMTP app password |

---

## 🔑 Google Cloud OAuth Configuration

To enable Google sign-in in production:

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and navigate to **APIs & Services → Credentials**.
2. Edit or create an **OAuth 2.0 Client ID** (Application type: *Web application*).
3. Under **Authorized JavaScript origins**, add:
   ```
   https://legallensai-india.vercel.app
   ```
4. Under **Authorized redirect URIs**, add:
   ```
   https://legallensai-india.vercel.app/api/auth/google/callback
   ```
5. Copy the Client ID and Client Secret to your Vercel Environment Variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`).

---

## 🧑‍⚖️ Evaluator & Judge Demo Access

For hackathon judges and evaluators reviewing LegalLens AI:

- **One-Click Instant Access**: Visit [https://legallensai-india.vercel.app/login.html](https://legallensai-india.vercel.app/login.html) and click **"Judge Demo — use configured credentials"**.
  - Initiates `POST /api/auth/demo`
  - Validates `DEMO_EMAIL` & `DEMO_PASSWORD` strictly on the server (zero secrets in frontend JS or network responses)
  - Creates the standard secure HttpOnly cookie session (`legallens_session`)
  - Redirects automatically into the genuine `/dashboard.html` workspace
- **Manual Credentials Alternative**:
  - Email: `judge@example.com`
  - Password: Provided privately to judges / configured in server environment variables.
- **Judge Evaluation Journey**:
  1. Instant entry into `/dashboard.html` via one-click Judge Demo.
  2. Select Persona (Employee, Freelancer, Small Business Owner, Student) and Intent.
  3. Click any built-in synthetic contract (Freelance NDA, Employment Agreement, Commercial Lease, Terms of Service) or paste custom text.
  4. Run AI analysis (Groq `llama-3.3-70b-versatile` with prompt-injection defense).
  5. Inspect Plain-Language Summary, Attention Radar, Important Clauses, Clause Explorer, Detected Obligations, Critical Dates, and Lawyer Questions.
  6. Interact with the Action Checklist (status persists to Cloud Firestore).
  7. View and restore from Analysis History.
  8. Click Logout to terminate the secure session.

---

## 🧪 Testing & Verification

The repository includes comprehensive unit, integration, security, and Playwright end-to-end test suites that require zero external cloud credentials:

```bash
# Run unit, integration, and Firebase persistence tests
npm test

# Install browser binaries for Playwright
npx playwright install chromium

# Run all Playwright E2E browser tests (Desktop & Mobile viewports)
npm run test:e2e
```

**Test Coverage Summary:**
- **23/23** Unit & Integration Tests Passing (100%)
- **6/6** Playwright End-to-End Tests Passing (100%)

---

## ⚙️ Environment Variables Reference

All credentials are **SERVER ONLY** and must never be exposed to the frontend:

| Variable | Scope | Purpose |
|---|---|---|
| `GROQ_API_KEY` | Server Only | Groq Cloud AI authentication token |
| `GROQ_MODEL` | Server Only | Target LLM identifier (`llama-3.3-70b-versatile`) |
| `PORT` | Server Only | Application port (default `3000`) |
| `NODE_ENV` | Server Only | Environment flag (`development`, `production`, `test`) |
| `MAX_DOCUMENT_BYTES` | Server Only | Maximum request body limit (`500000`) |
| `MAX_DOCUMENT_CHARS` | Server Only | Maximum document character limit (`120000`) |
| `AI_TIMEOUT_MS` | Server Only | Groq API timeout in milliseconds (`30000`) |
| `RATE_LIMIT_WINDOW_MS` | Server Only | Rate limiter window in ms (`60000`) |
| `RATE_LIMIT_MAX` | Server Only | Max requests per rate limit window (`20`) |
| `DEMO_EMAIL` | Server Only | Configured evaluator account email (`judge@example.com`) |
| `DEMO_PASSWORD` | Server Only | Configured evaluator account password |
| `SESSION_SECRET` | Server Only | Salt for cryptographic HMAC session token hashing |
| `GOOGLE_CLIENT_ID` | Server Only | Google Cloud OAuth 2.0 Web Client ID |
| `GOOGLE_CLIENT_SECRET` | Server Only | Google Cloud OAuth 2.0 Client Secret |
| `GOOGLE_CALLBACK_URL` | Server Only | OAuth 2.0 redirect callback endpoint |
| `FIREBASE_PROJECT_ID` | Server Only | Firebase / Google Cloud Project ID |
| `FIREBASE_CLIENT_EMAIL` | Server Only | Firebase Service Account email |
| `FIREBASE_PRIVATE_KEY` | Server Only | Firebase Service Account private key |
| `CONTACT_TO_EMAIL` | Server Only | Destination email for contact submissions |
| `CONTACT_FROM_EMAIL` | Server Only | Sender email header for contact messages |
| `SMTP_HOST` | Server Only | SMTP server hostname |
| `SMTP_PORT` | Server Only | SMTP port (default `587`) |
| `SMTP_USER` | Server Only | SMTP authentication user |
| `SMTP_PASSWORD` | Server Only | SMTP authentication password |

---

## 👤 Author

**Built with pride by Soman Singhal**

- **Portfolio**: [https://somansinghal.vercel.app/](https://somansinghal.vercel.app/)
- **GitHub**: [@somansinghal](https://github.com/somansinghal)
- **LinkedIn**: [Soman Singhal](https://www.linkedin.com/in/soman-singhal)
- **Email**: [somansinghal06@gmail.com](mailto:somansinghal06@gmail.com)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
