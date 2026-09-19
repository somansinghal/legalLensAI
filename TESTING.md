# LegalLens AI — Testing Strategy & Verification Guide

## 1. Testing Philosophy

The test suite is designed for 100% deterministic local execution without requiring production API keys, live OAuth credentials, or remote cloud databases.

### Core Testing Tenets:
1. **Zero External Flakiness**: All cloud dependencies (Groq, Google OAuth, Firebase Firestore, SMTP) feature clean in-memory mocks or offline test modes.
2. **Speed & Efficiency**: The entire unit and integration test suite runs in under 3 seconds using Node.js's native test runner (`node --test`).
3. **Cross-Browser & Responsive E2E**: Playwright tests validate critical user journeys on both desktop (1440x900) and mobile (iPhone 13 viewport).
4. **Security & Boundary Enforcement**: Tests explicitly verify authorization boundaries, payload limits, rate limiting, and cross-user data isolation.

---

## 2. Test Architecture

```text
tests/
  unit/
    ai-pipeline.test.js          Prompt delimiters, JSON parsing, and schema normalization
    firebase.test.js             Firebase Admin initialization, instance reuse, and unconfigured handling
    state.test.js                Frontend UI state immutability and readiness flags
  integration/
    auth.test.js                 Demo credential verification, session creation, and route guarding
    contact-oauth.test.js        Contact form validation and OAuth error handling
    firestore-persistence.test.js User profile, analysis history, checklist sync, and cross-user isolation
    health.test.js               Health endpoint contract and payload size limits
    oauth-success.test.js        Verified Google OpenID callback with mocked token exchange
  security/
    security.test.js             HTTP security headers, CSP directives, and server header removal
  e2e/
    auth-flow.spec.js            Login, protected workspace access, and logout
    contact.spec.js              Contact form validation and responsive rendering
    judge-demo-flow.spec.js      Full product journey: login -> document selection -> analysis -> results -> logout
    landing.spec.js              Landing page structure, logo, disclaimer, and creator attribution
    mobile.spec.js               Responsive mobile layout on iPhone 13 viewport
```

---

## 3. Running the Test Suite

### Unit & Integration Tests:
```bash
npm test
```
*Executes all 25 unit & integration tests with zero external configuration (including one-click Judge Demo authentication and Firestore session persistence).*

### Playwright End-to-End Tests:
```bash
# First time: install Chromium
npx playwright install chromium

# Run all E2E tests headless
npm run test:e2e

# Run with headed browser for visual inspection
npm run test:e2e:headed

# Open last Playwright test report
npm run test:e2e:report
```

---

## 4. Firebase Firestore Mock Architecture

To test persistence deterministically in CI and local machines without a live Google Cloud project:
- Tests utilize `tests/integration/firestore-persistence.test.js`, which injects an in-memory mock store via `setFirestoreDbForTests()`.
- The mock store mirrors Firestore document and subcollection semantics (`doc.get()`, `doc.set()`, `orderBy()`, `limit()`).
- Tests verify:
  - User profile creation without sensitive tokens
  - Analysis history storage without raw document text
  - Schema versioning (`schemaVersion: 1`)
  - Cross-user isolation (User B is prevented from reading or writing User A's analyses or checklists)
  - Graceful fallback when database operations encounter errors
