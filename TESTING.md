# Testing Strategy

## Running the current foundation tests

```bash
npm test
```

The current suite uses Node's built-in test runner and requires no API key or live Groq call.

## Principles

Tests must be fast, deterministic, privacy-safe, and mostly independent of Groq. Use mocked provider responses for application tests and reserve a small opt-in smoke test for a configured development key.

## Unit tests

- Persona/intent allowlists and priority mapping
- Request, text, byte, and file validation
- Normalization, section references, and chunk boundaries
- Prompt construction and delimiter/injection fixtures
- JSON parsing and response schema validation
- Attention-level enum and cautious-language rules
- Deterministic comparison: unchanged, added, removed, changed
- Date/obligation normalization where deterministic helpers exist
- Error-code mapping and redaction

## Integration tests

- `POST /api/analysis` with mocked Groq success
- Browser/API contract with invalid and valid requests
- Clause explanation flow
- Comparison flow with two synthetic documents
- Provider timeout, failure, malformed JSON, schema mismatch
- Rate limit and request-size handling
- Safe response headers and no secret leakage

## Security tests

- Prompt injection in document, clause, persona-shaped input, and comparison text
- XSS payloads in document names, source text, and model strings
- Oversized body, deeply nested JSON, invalid UTF-8, unsupported type
- Macro/archive/executable rejection if uploads are enabled
- Missing API key and provider error paths
- Logs do not contain keys, full document text, prompts, or stack traces
- Model attempts to output HTML, scripts, unsupported claims, or extra fields

## Edge cases

Empty/whitespace-only document, very short text, maximum permitted text, no dates, no obvious clauses, contradictory terms, non-English content if unsupported, duplicate sections, two identical versions, completely different versions, network failure, AI timeout, malformed response, and user cancellation.

## Accessibility and manual checklist

- Complete persona-to-dashboard flow with keyboard only.
- Visible focus at every interactive element; no keyboard trap.
- Labels and error messages associated with controls.
- Loading state announced without excessive motion.
- Status conveys words, not color alone.
- Contrast checked in dark theme; zoom/reflow tested on mobile widths.
- Headings and landmarks form a logical outline.
- Screen reader can identify source references, tables, dialogs, and expandable clauses.
- Reduced-motion preference is respected.

## Performance checks

Verify client-side rejection before upload, bounded server memory, one AI invocation for one analysis, timeout behavior, static asset size, and acceptable rendering for the largest permitted response. Do not benchmark with real private documents.

## Google OAuth and Contact tests

OAuth tests cover missing configuration and callback state/error handling without calling Google. A successful provider exchange should be covered with a mocked fetch in deployment-specific CI. Contact tests cover malformed email and no-provider behavior; SMTP delivery requires an explicitly configured test mailbox and is not run by default.

## Playwright E2E and visual QA

Playwright runs against the local Express server through `playwright.config.js`. It uses Chromium, a consistent 1440×900 desktop viewport, a mobile viewport check, screenshots for meaningful states, and video for the authenticated judge journey. Outputs go to ignored `artifacts/` directories. The E2E suite uses configured demo credentials only through environment variables and never embeds passwords in source.

```bash
npx playwright install chromium
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:report
```

Production Groq calls are not required for browser tests. The currently implemented foundation stops at the authenticated workspace; analysis, clause, comparison, and lawyer-preparation flows remain explicit future E2E milestones rather than mocked claims.

## Authentication and SEO tests

Authentication tests cover valid demo login, generic invalid credentials, protected API rejection, and session-cookie security. Before release, add session persistence/expiry and logout integration coverage. SEO checks should verify the home-page title, description, canonical placeholder, robots, sitemap, JSON-LD parseability, and official logo references. Manual checks should verify keyboard login, focus/error announcements, responsive auth layout, and logo alternative text.

## Release gate

All unit/integration/security tests pass; no secrets or generated artifacts tracked; dependency audit reviewed; manual accessibility checklist complete; prompt-injection fixtures pass; error messages are user-safe; repository size remains below 10 MB; deployment smoke test succeeds.
