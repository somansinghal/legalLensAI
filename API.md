# API Contract (planned)

The API is server-side only. It is intentionally stateless for the initial demo. All endpoints are HTTPS in deployment and return JSON. Browser clients must not receive provider credentials.

## Common rules

- `Content-Type: application/json` for pasted text and clause requests.
- Multipart upload may be added only for explicitly allowlisted formats.
- Maximum normalized document length and raw request size are configuration values, documented in deployment configuration; reject before AI invocation.
- Persona and intent are enum values, not arbitrary prompt text.
- Every response includes an opaque `requestId` when available.
- Responses contain an informational disclaimer.

## `GET /api/health`

Returns process health without configuration, prompt, or provider secrets.

```json
{"status":"ok","service":"legallens-api","version":"1.0.0"}
```

## `POST /api/analysis`

Analyzes one document.

Request:

```json
{
  "persona":"employee",
  "intent":"understand_before_signing",
  "document":{"mode":"text","name":"contract.txt","text":"..."}
}
```

Allowed personas: `employee`, `freelancer`, `student`, `business_owner`, `other`.

Allowed intents: `understand_before_signing`, `find_obligations`, `understand_termination`, `find_deadlines`, `prepare_lawyer_questions`.

Response: `200 AnalysisResponse` as defined in [ARCHITECTURE.md](ARCHITECTURE.md). The server, not the model, adds `requestId` and the legal disclaimer.

## `POST /api/clauses/explain`

Explains a selected clause in the context of the original request. The client sends the selected text and a short source reference; the server revalidates bounds and treats the text as untrusted document content.

```json
{
  "persona":"freelancer",
  "intent":"understand_before_signing",
  "clause":{"text":"...","sourceRef":"section-4"}
}
```

Response: original text, plain-language explanation, obligations, potential implications stated cautiously, questions to consider, source reference, disclaimer.

## `POST /api/comparison`

Compares two documents or versions.

```json
{
  "persona":"business_owner",
  "intent":"compare_agreements",
  "documents":{
    "a":{"name":"old.txt","text":"..."},
    "b":{"name":"new.txt","text":"..."}
  }
}
```

Response:

```json
{
  "requestId":"opaque-id",
  "status":"complete",
  "changes":[
    {"status":"changed","category":"payment","title":"Payment terms","before":"...","after":"...","whyItMayMatter":"...","sourceRefs":["a:section-2","b:section-2"]}
  ],
  "unchangedAreas":["..."],
  "questionsForLawyer":["..."],
  "disclaimer":"..."
}
```

Statuses are exactly `unchanged`, `added`, `removed`, or `changed`. Deterministic text diff is the source of change detection; AI supplies cautious categorization/explanation.

## Validation and errors

```json
{
  "error": {
    "code":"DOCUMENT_TOO_LARGE",
    "message":"The document is too large to process. Please provide a shorter document.",
    "requestId":"opaque-id"
  }
}
```

Codes: `INVALID_REQUEST` (400), `UNSUPPORTED_MEDIA_TYPE` (415), `DOCUMENT_TOO_LARGE` (413), `EMPTY_DOCUMENT` (422), `RATE_LIMITED` (429), `AI_TIMEOUT` (504), `AI_UNAVAILABLE` (503), `AI_RESPONSE_INVALID` (502), `INTERNAL_ERROR` (500). User messages never contain stack traces, keys, prompts, provider internals, or raw uploaded content.

## OAuth endpoints

`GET /api/auth/google` starts Google OpenID Connect only when `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` are configured. It generates a cryptographically random state and requests only `openid email profile`. `GET /api/auth/google/callback` validates state, exchanges the code server-side, verifies the Google profile email, creates the existing application session, and redirects to a safe internal path. OAuth failures redirect generically to login and never expose tokens or provider details.

## Contact endpoint

`POST /api/contact` validates name, email, subject, inquiry type, consent at the UI layer, and message length. It sends plain-text mail through server-side SMTP variables when configured. Without SMTP configuration it returns `503 CONTACT_UNAVAILABLE`; it never falsely reports delivery.

## Analysis and demo endpoints

`GET /api/demos` and `GET /api/demos/:id` require authentication and expose only small synthetic evaluation documents. `POST /api/analysis` requires authentication and accepts `{ persona, intent, document: { name, text } }`. The backend validates the context, normalizes transient text, builds a separated prompt, calls Groq server-side, parses and validates structured JSON, and returns a safe analysis response. Missing provider configuration returns `503 AI_UNAVAILABLE`; malformed model output returns `502 AI_RESPONSE_INVALID`. Test mode can use a deterministic fixture but production never does.

## Authentication endpoints

`POST /api/auth/login` accepts `{ "email": "...", "password": "..." }` and sets a server-managed `HttpOnly`, `SameSite=Lax` session cookie. Invalid credentials return the same generic `401 INVALID_CREDENTIALS` response. `GET /api/auth/session` returns the limited demo user profile only when authenticated. `POST /api/auth/logout` invalidates the server-side session and clears the cookie. `GET /api/protected/workspace` demonstrates authenticated API protection and returns `401 UNAUTHORIZED` without a valid session.

Authentication is intentionally limited to the configured competition demo account; there is no account creation or admin surface.

## Security assumptions

No end-user authentication is required for the competition demo, so rate limiting and abuse controls are important. If deployed publicly, add platform-level bot protection and revisit authentication before persistent or sensitive features. CORS should be same-origin by default; if separated, use an explicit allowlist.

## Environment

- `GROQ_API_KEY` — required server secret, never exposed
- `GROQ_MODEL` — configurable model identifier, validated against deployment policy
- `PORT` — server port
- `MAX_DOCUMENT_BYTES`, `MAX_DOCUMENT_CHARS`, `AI_TIMEOUT_MS`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` — bounded operational settings
- `NODE_ENV` — runtime mode
