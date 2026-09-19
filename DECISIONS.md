# Architecture Decision Records

## ADR-001: Vanilla JavaScript frontend

**Decision:** Use HTML5, CSS3, and vanilla JavaScript initially.

**Reason:** The product can be implemented with a small, accessible component structure without a framework. This reduces repository size, build complexity, dependencies, and competition deployment risk.

**Trade-off:** State management and rendering conventions must be documented and tested manually.

## ADR-002: Node.js and Express backend

**Decision:** Use a single lightweight Node/Express service for static assets and API routes.

**Reason:** Familiar, deployable, sufficient for a stateless demo, and supports clean route/controller/service separation.

## ADR-003: Groq behind a backend boundary

**Decision:** The browser never calls Groq directly.

**Reason:** Protects API credentials, centralizes prompts, limits, logging, validation, and provider changes.

## ADR-004: No database in the first release

**Decision:** Process documents transiently and do not persist them.

**Reason:** No core requirement needs history or accounts; this reduces privacy risk, infrastructure, and repository/deployment complexity.

**Trade-off:** No cross-device history or analytics; future storage needs consent, encryption, retention, and a new review.

## ADR-005: Structured AI responses

**Decision:** Require bounded JSON validated by the server.

**Reason:** Enables reliable rendering, testing, explicit fields, and controlled failure instead of parsing prose.

## ADR-006: Informational attention levels

**Decision:** Use HIGH ATTENTION, REVIEW CAREFULLY, and INFORMATIONAL rather than legal-risk or enforceability claims.

**Reason:** Aligns with the product's legal-safety boundary and avoids presenting probabilistic model output as professional legal judgment.

## ADR-007: Deterministic comparison plus AI explanation

**Decision:** Detect text changes deterministically; use AI only to categorize and explain them.

**Reason:** Makes added/removed/changed evidence auditable and reduces hallucinated differences.

## ADR-008: Start with text/paste and a narrow file allowlist

**Decision:** Treat pasted text as the smallest secure baseline; add document formats only with tested parsers and limits.

**Reason:** File parsing is an avoidable attack surface and can undermine the repository/implementation-size constraint.

## ADR-009: In-memory demo authentication

**Decision:** Use a small server-side in-memory session store with an opaque random cookie for the competition demo.

**Reason:** It provides a real login/logout boundary and protected API example without introducing a database, identity provider, or extra dependency before the product requires persistent users.

**Security:** Credentials remain in environment variables; cookies are HttpOnly and SameSite; sessions expire and are invalidated on logout; the demo account has no administrative privilege.

**Trade-off:** Sessions disappear on restart, there is one configured demo account, and this is not suitable as production identity management. A production deployment requires a reviewed identity/session architecture.

## ADR-010: Use the supplied logo asset unchanged

**Decision:** Use the attached official JPEG directly, including as favicon/social image, with accessible alternative text.

**Reason:** Preserves the approved branding and avoids creating a replacement mark. The 272 KB asset is within the repository budget and is reused rather than duplicated.
