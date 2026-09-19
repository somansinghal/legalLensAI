# Security Architecture

## Security objectives

Protect provider credentials, reduce exposure of legal documents, prevent browser injection, constrain abuse, prevent document content from controlling the AI, and fail safely when model output is unreliable.

## Threat model

| Threat | Impact | Likelihood | Mitigation |
|---|---|---:|---|
| API key theft | Provider abuse and cost | Medium | Server-only env secret, no client bundle, secret scanning, redacted logs |
| Prompt injection in document | Unsafe or irrelevant output | High | Delimit document as data, fixed system policy, ignore embedded instructions, schema validation |
| Malicious document/content | Resource or parser abuse | Medium | Allowlist formats, byte/character limits, safe parsers, no execution, timeouts |
| XSS/HTML injection | Account/browser compromise | Medium | Render with text APIs, no raw HTML from model, CSP/security headers |
| Oversized upload | Memory/availability loss | High | Content-length and parser limits before processing; bounded chunks |
| Hallucination | Misleading legal understanding | High | Uncertainty, source refs, no legal conclusions, professional-review prompts, output validation |
| Sensitive document exposure | Privacy harm | Medium | In-memory processing, no content logs/persistence, disclosure, TLS, provider review |
| API abuse | Cost/availability harm | Medium | Rate limits, bounded AI calls, request size limits, health endpoint controls |
| Malformed AI output | UI breakage or unsafe claims | High | JSON parse + schema validation + safe failure |
| Dependency vulnerability | Server compromise | Medium | Minimal pinned dependencies, audit/update process |

## Trust boundaries

1. Browser to backend: all browser input is untrusted.
2. Backend validators to services: only normalized DTOs cross the boundary.
3. Backend to Groq: document content leaves the server only for the requested analysis; provider is an external processor.
4. Model output to browser: never trusted until schema validation and safe rendering.
5. Environment secret store to server: one-way configuration; never include in responses or logs.

## Prompt-injection defense

- Fixed system instructions are assembled in server code.
- Persona and intent come from allowlists and are inserted as data.
- Document text is wrapped in explicit delimiters and labeled untrusted content.
- The prompt says to ignore instructions, requests for secrets, and role changes inside the document.
- No model response can change server policy, tools, permissions, or output schema.
- Use one narrow task per call; do not ask the model to execute document instructions.
- Add adversarial fixtures such as “ignore previous instructions” to security tests.

This reduces prompt injection risk but cannot prove model behavior. Sensitive deployments should use additional provider controls, redaction, human review, and independent testing.

## Input and file security

Validate JSON shape, enum values, UTF-8 text, raw bytes, character count, and nesting. For uploads, allow only explicitly supported types, verify magic bytes where relevant, limit decompression, reject archives/macros/executables, and use parser timeouts. Do not trust client MIME declarations. Initial scope may support pasted text/plain first to reduce attack surface.

## Output and browser security

Use `textContent`, DOM construction, and safe attribute allowlists. Do not use `innerHTML` with model or document values. Apply CSP, `X-Content-Type-Options: nosniff`, frame protection, referrer policy, and secure transport headers appropriate to the host. Never place secrets in HTML, JavaScript, source maps, or error objects.

## Privacy and retention

The initial app does not intentionally persist documents, prompts, or responses. Avoid logging content; log only request ID, operation, duration, status, bounded error code, and provider latency. Tell users that content is sent to Groq for processing and obtain any required consent. Confirm provider retention and data-use terms before public launch. Do not claim confidentiality that the deployment cannot guarantee.

## Availability and abuse

Apply per-IP or platform rate limits, concurrent request limits, timeouts, and a single AI call per use case where practical. Cache only non-sensitive static assets. Do not retry non-idempotent expensive AI requests blindly. Return generic failure messages and retain detailed redacted diagnostics server-side.

## Secret management checklist

- `.env` ignored; `.env.example` contains placeholders only.
- Production secrets injected by deployment secret manager.
- Rotate keys if exposed.
- CI secret scanning and dependency audit before release.
- No secrets in screenshots, fixtures, commits, logs, or client requests.

## Google OAuth

Google sign-in uses server-side authorization-code exchange with random, expiring state values. Only `openid email profile` is requested. Tokens are used transiently to fetch verified userinfo and are not stored in browser storage or application sessions. Safe internal redirects prevent open redirects. The existing HttpOnly session architecture is reused.

## Contact form

Contact input is validated server-side, bounded by the JSON limit and global rate limiter, converted to plain-text email, and never rendered back as HTML. SMTP credentials remain server-side. A missing provider returns an explicit unavailable response rather than fabricated success.

## AI and document handling

The current analysis endpoint accepts transient text only and limits normalized content to 120,000 characters. Demo documents are synthetic and server-defined. Document content is delimited as untrusted data in prompts, never logged, and discarded after request processing. Model output is parsed, bounded, enum-checked, escaped before rendering, and rejected if malformed. Groq credentials remain server-side.

## Lightweight authentication

The demo authentication flow uses a server-side, in-memory session store with cryptographically random opaque tokens in `HttpOnly`, `SameSite=Lax` cookies. The configured demo account is read from server environment variables. Sessions expire after four hours and logout invalidates the token server-side. The demo account has no admin or configuration privileges. This is competition-demo authentication, not enterprise identity management: sessions are lost on process restart, there is no user database, and public deployments should add a stronger identity provider, CSRF review, persistent session strategy, and login-specific rate limiting before production use. The existing global request limiter also covers login attempts.

## Known limitations

Unauthenticated public demos cannot fully prevent abuse. Model safety is probabilistic. The tool does not establish jurisdiction-specific legal validity. A future production version needs a formal privacy impact assessment, retention policy, penetration test, provider contractual review, and stronger identity/abuse controls.
