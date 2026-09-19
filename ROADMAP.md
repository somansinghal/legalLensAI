# Implementation Roadmap (future work)

This document is intentionally a plan. No application implementation is included in this architecture phase.

## Phase 0 — Architecture and documentation
- **Objective:** Review contracts, safety boundary, data model, diagrams, and acceptance criteria.
- **Files:** Markdown documentation, `.env.example`, `.gitignore`.
- **Dependencies:** None.
- **Acceptance:** Stakeholders approve scope, schemas, legal disclaimer, privacy assumptions, and threat model.
- **Tests:** Documentation consistency and secret scan.

## Phase 1 — Project scaffolding
- **Objective:** Create Node/Express skeleton, static entry point, scripts, environment loading, and module boundaries.
- **Files:** `package.json`, `server/`, `public/`, test harness.
- **Dependencies:** Phase 0.
- **Acceptance:** Health endpoint and static page run locally; no secrets committed.
- **Tests:** Bootstrap, health, lint/format, dependency audit.

## Phase 2 — Frontend foundation
- **Objective:** Build accessible welcome, context, intake, loading, error, disclaimer, and empty states.
- **Files:** `public/index.html`, `public/css/`, `public/js/`.
- **Dependencies:** Phase 1.
- **Acceptance:** Keyboard-complete flow; client validation; responsive dark workspace shell.
- **Tests:** DOM behavior, keyboard/manual accessibility, XSS rendering fixtures.

## Phase 3 — Backend foundation
- **Objective:** Add routes, controllers, validation, limits, request IDs, error middleware, and text document service.
- **Files:** `server/routes/`, `controllers/`, `validators/`, `middleware/`, `services/documentService.js`.
- **Dependencies:** Phase 1.
- **Acceptance:** Invalid/oversized/empty inputs fail with safe, documented errors.
- **Tests:** Unit and endpoint validation tests.

## Phase 4 — Groq integration
- **Objective:** Implement provider adapter, configurable model, timeout, redacted diagnostics, and structured response validation.
- **Files:** `server/ai/`, environment configuration.
- **Dependencies:** Phases 0 and 3.
- **Acceptance:** Mock provider and opt-in real smoke test produce validated DTOs; key never reaches client.
- **Tests:** Mock success, timeout, provider failure, malformed JSON, schema mismatch.

## Phase 5 — Context-aware analysis
- **Objective:** Map persona and intent to explicit priorities and generate summary, clauses, obligations, dates, and questions.
- **Files:** context, analysis, prompt, schema, dashboard renderers.
- **Dependencies:** Phase 4.
- **Acceptance:** Same synthetic contract yields visibly different employee/freelancer priorities without changing facts.
- **Tests:** Priority mapping and prompt contract tests.

## Phase 6 — Attention Radar
- **Objective:** Add bounded attention levels, source references, explanations, uncertainty, and suggested action.
- **Files:** analysis schema, radar renderer, safety rules.
- **Dependencies:** Phase 5.
- **Acceptance:** No definitive legal labels; status is not conveyed by color alone.
- **Tests:** Enum, language-safety, source-reference, and accessibility tests.

## Phase 7 — Clause explorer
- **Objective:** Select a clause and request a focused explanation.
- **Files:** clause route/service, detail view, API client.
- **Dependencies:** Phase 6.
- **Acceptance:** Original text, explanation, implications, obligations, and questions are visible together.
- **Tests:** Selection bounds, injection, network failure, keyboard dialog/panel flow.

## Phase 8 — Contract comparison
- **Objective:** Add deterministic diff and cautious contextual explanation.
- **Files:** comparison service, diff view, schemas.
- **Dependencies:** Phases 3–5.
- **Acceptance:** Added/removed/changed/unchanged states are explicit and evidence-linked.
- **Tests:** Identical, empty, reordered, added, removed, modified, and maximum-size versions.

## Phase 9 — Lawyer preparation mode
- **Objective:** Generate questions and action checklist without advice claims.
- **Files:** checklist/question service and UI.
- **Dependencies:** Phase 5.
- **Acceptance:** Questions are actionable, document-grounded, and accompanied by disclaimer.
- **Tests:** Missing information, persona variation, unsafe-claim regression tests.

## Phase 10 — Security hardening
- **Objective:** Apply headers, strict rendering, rate limits, parser restrictions, logging redaction, and abuse controls.
- **Files:** middleware, deployment configuration, security tests.
- **Dependencies:** All feature paths.
- **Acceptance:** Threat-model controls are demonstrable; no content or secrets in logs.
- **Tests:** Full security suite, dependency audit, manual source review.

## Phase 11 — Testing
- **Objective:** Complete automated unit/integration/security/edge coverage with mocked AI.
- **Files:** `tests/` and CI configuration.
- **Dependencies:** Feature-complete code.
- **Acceptance:** Release gate in `TESTING.md` passes.
- **Tests:** The phase is the test execution and defect-fix cycle.

## Phase 12 — Accessibility
- **Objective:** Complete semantic, keyboard, screen-reader, contrast, zoom, mobile, and reduced-motion audit.
- **Files:** HTML/CSS/JS and accessible test fixtures.
- **Dependencies:** Stable UI.
- **Acceptance:** Manual checklist complete with no critical blockers.
- **Tests:** Keyboard and assistive technology manual checks plus automated checks where available.

## Phase 13 — Deployment
- **Objective:** Deploy one Node service with TLS, secret injection, health check, and bounded configuration.
- **Files:** start configuration and deployment documentation.
- **Dependencies:** Security and testing gates.
- **Acceptance:** Public demo works without exposing key; health and failure states verified.
- **Tests:** Deployment smoke test and rate-limit/provider-failure checks.

## Phase 14 — Final competition audit
- **Objective:** Verify evaluator evidence and repository hygiene.
- **Files:** README, screenshots/demo script if approved, all docs.
- **Dependencies:** Phases 0–13.
- **Acceptance:** Public single-branch repository, under 10 MB, no secrets/generated artifacts, complete docs, reproducible demo.
- **Tests:** Fresh-clone setup, repository size check, secret scan, requirements/evaluation matrix walkthrough.

## Milestones

- **M1:** Approved architecture and contracts (Phase 0)
- **M2:** Running secure skeleton (Phases 1–3)
- **M3:** Validated context-aware analysis (Phases 4–6)
- **M4:** Complete product workflows (Phases 7–9)
- **M5:** Release candidate with security and tests (Phases 10–12)
- **M6:** Deployable competition submission (Phases 13–14)

## Principal risks and mitigations

- **Model inconsistency:** strict schemas, bounded prompts, mocks, regression fixtures.
- **Prompt injection:** untrusted-data delimiters, fixed policies, adversarial tests, no tool execution.
- **Privacy expectations:** transient processing, clear provider disclosure, no content logs, future formal privacy review.
- **Public API abuse:** rate/concurrency limits, size limits, timeouts, platform protection.
- **Over-scoping:** text-first baseline, no database, no OCR or broad formats until core path is stable.
- **False legal confidence:** wording rules, source visibility, uncertainty, lawyer-preparation framing.
- **Accessibility regressions:** acceptance criteria from Phase 2 and a dedicated Phase 12 audit.
