# LegalLens AI — API Specification

The LegalLens AI backend is an Express HTTP JSON API. All endpoints operate over HTTPS in production and return standardized JSON error and success envelopes.

---

## Global Standards

- **Base URL**: `/api`
- **Response Format**: `application/json; charset=utf-8`
- **Authentication**: Stateful HttpOnly cookie (`legallens_session`)
- **Error Format**:
  ```json
  {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable safe explanation."
    }
  }
  ```

---

## 1. System Endpoints

### `GET /api/health`
Returns public service status and liveness.

- **Auth**: Public
- **Rate Limit**: 20 req/min
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "service": "legallens-api",
    "version": "0.1.0",
    "timestamp": "2026-09-19T17:00:00.000Z"
  }
  ```

---

## 2. Authentication Endpoints

### `GET /api/auth/google`
Initiates Google OAuth 2.0 authorization flow.

- **Auth**: Public
- **Response `302 Found`**: Redirects to `accounts.google.com` with state parameter.

### `GET /api/auth/google/callback`
Consumes OAuth code and state, fetches Google profile, verifies email, creates user profile in Firestore, and sets HttpOnly session cookie.

- **Auth**: Public
- **Response `302 Found`**: Redirects to `/dashboard.html` or `/login.html?oauth=failed`.

### `POST /api/auth/login`
Authenticates evaluator using configured demo credentials.

- **Auth**: Public
- **Rate Limit**: 20 req / 15 min
- **Request Body**:
  ```json
  {
    "email": "judge@example.com",
    "password": "test-password"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "authenticated": true,
    "user": {
      "userId": "demo:7839bf021a8d94c1",
      "email": "judge@example.com",
      "role": "demo",
      "displayName": "Judge Demo User"
    }
  }
  ```

### `POST /api/auth/logout`
Destroys session and clears cookie.

- **Auth**: Public
- **Response `200 OK`**: `{"authenticated": false}`

### `GET /api/auth/session`
Returns verified active session metadata.

- **Auth**: Required (`requireAuth`)
- **Response `200 OK`**:
  ```json
  {
    "authenticated": true,
    "user": {
      "userId": "demo:7839bf021a8d94c1",
      "email": "judge@example.com",
      "role": "demo",
      "displayName": "Judge Demo User",
      "photoURL": null
    },
    "expiresAt": 1789830000000
  }
  ```

---

## 3. Analysis & Intelligence Endpoints

### `POST /api/analysis`
Executes context-aware legal document analysis via Groq AI, validates response against JSON schema, and persists structured results to Firestore.

- **Auth**: Required (`requireAuth`)
- **Rate Limit**: 10 req / hour
- **Request Body**:
  ```json
  {
    "persona": "employee",
    "intent": "understand_before_signing",
    "document": {
      "name": "Offer_Letter.txt",
      "text": "Full document plain text content..."
    }
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "analysisId": "8f3b4a2e-4b68-45d2-9d7a-1123456789ab",
    "persisted": true,
    "document": {
      "name": "Offer_Letter.txt",
      "documentType": "Employment Agreement",
      "duration": "Indefinite",
      "parties": [{"name": "Acme Corp", "role": "Employer"}]
    },
    "context": {
      "persona": "employee",
      "intent": "understand_before_signing"
    },
    "summary": [{"text": "Standard employment contract..."}],
    "attentionItems": [
      {
        "level": "high_attention",
        "title": "Non-compete clause",
        "explanation": "Restricts employment for 12 months post-departure.",
        "suggestedAction": "Clarify geographic scope."
      }
    ],
    "importantClauses": [
      {
        "title": "Intellectual Property",
        "attention": "review_carefully",
        "sourceText": "Employee agrees all inventions...",
        "explanation": "Transfers all rights to employer."
      }
    ],
    "obligations": [
      {"party": "Employee", "action": "Give 30 days notice"}
    ],
    "importantDates": [
      {"value": "2026-10-01", "label": "Effective Date", "event": "Start of employment"}
    ],
    "lawyerQuestions": [
      "Is the non-compete enforceable in my state?"
    ],
    "checklist": [
      {"task": "Verify notice window requirements", "completed": false}
    ],
    "disclaimer": "Informational assistance only. Not legal advice."
  }
  ```

---

## 4. Analysis History Endpoints (Firestore)

### `GET /api/analysis/history`
Returns previous analysis metadata for the authenticated user, sorted newest first.

- **Auth**: Required (`requireAuth`)
- **Rate Limit**: 20 req/min
- **Response `200 OK`**:
  ```json
  {
    "items": [
      {
        "id": "8f3b4a2e-4b68-45d2-9d7a-1123456789ab",
        "analysisId": "8f3b4a2e-4b68-45d2-9d7a-1123456789ab",
        "documentName": "Offer_Letter.txt",
        "documentType": "Employment Agreement",
        "persona": "employee",
        "intent": "understand_before_signing",
        "summaryPreview": "Standard employment contract...",
        "attentionCount": 1,
        "createdAt": "2026-09-19T17:00:00.000Z"
      }
    ]
  }
  ```

### `GET /api/analysis/history/:id`
Retrieves a specific past analysis result. User ownership is strictly verified.

- **Auth**: Required (`requireAuth`)
- **Response `200 OK`**:
  ```json
  {
    "item": {
      "analysisId": "8f3b4a2e-4b68-45d2-9d7a-1123456789ab",
      "document": { "name": "Offer_Letter.txt", "documentType": "Employment Agreement" },
      "context": { "persona": "employee", "intent": "understand_before_signing" },
      "summary": [...],
      "attentionItems": [...],
      "importantClauses": [...],
      "obligations": [...],
      "importantDates": [...],
      "lawyerQuestions": [...],
      "checklist": [...],
      "schemaVersion": 1,
      "createdAt": "2026-09-19T17:00:00.000Z"
    }
  }
  ```
- **Response `404 Not Found`**: Returned if analysis doesn't exist or belongs to another user.

---

## 5. Checklist Synchronization Endpoints

### `GET /api/checklists/:analysisId`
Retrieves interactive checklist completion state for an analysis.

- **Auth**: Required (`requireAuth`)
- **Response `200 OK`**:
  ```json
  {
    "checklist": {
      "analysisId": "8f3b4a2e-4b68-45d2-9d7a-1123456789ab",
      "documentName": "Offer_Letter.txt",
      "items": [
        {"index": 0, "task": "Verify notice window requirements", "completed": true}
      ],
      "updatedAt": "2026-09-19T17:05:00.000Z"
    }
  }
  ```

### `PATCH /api/checklists/:analysisId`
Updates checklist task completion. Verifies ownership.

- **Auth**: Required (`requireAuth`)
- **Request Body**:
  ```json
  {
    "index": 0,
    "completed": true
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "checklist": {
      "analysisId": "8f3b4a2e-4b68-45d2-9d7a-1123456789ab",
      "items": [
        {"index": 0, "task": "Verify notice window requirements", "completed": true}
      ],
      "updatedAt": "2026-09-19T17:05:01.000Z"
    }
  }
  ```

---

## 6. Synthetic Demo Documents

### `GET /api/demos`
Returns catalog of pre-configured synthetic agreements.

- **Auth**: Required (`requireAuth`)
- **Response `200 OK`**:
  ```json
  {
    "demos": [
      {"id": "employment-agreement", "title": "Employment Agreement", "label": "Full-time offer"},
      {"id": "mutual-nda", "title": "Mutual Non-Disclosure Agreement", "label": "Confidentiality"},
      {"id": "saas-terms", "title": "SaaS Terms of Service", "label": "B2B Subscription"},
      {"id": "consulting-agreement", "title": "Consulting Agreement", "label": "Independent contractor"}
    ]
  }
  ```

### `GET /api/demos/:id`
Returns synthetic text for chosen demo agreement.

---

## 7. Contact Endpoint

### `POST /api/contact`
Receives product inquiries, accessibility flags, and bug reports.

- **Auth**: Public
- **Rate Limit**: 5 req / hour
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "subject": "Accessibility Feedback",
    "inquiryType": "Accessibility",
    "message": "Suggested contrast enhancement on high-attention badges."
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Your message has been received. Thank you for contacting LegalLens AI."
  }
  ```
