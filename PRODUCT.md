# Product Definition and Alignment

## Problem

People often face contracts without affordable, timely legal explanation. Generic chat interfaces lack context and can create false confidence. LegalLens AI focuses on a selected situation and goal, then connects outputs to document text and preparation for professional discussion.

## Personas

- **Employee** — wants to understand before signing, compensation, notice, confidentiality, restrictions, and termination.
- **Freelancer** — prioritizes payment, deliverables, deadlines, intellectual property, liability, and client obligations.
- **Student** — needs approachable explanations of housing, internship, education, or service agreements and deadlines.
- **Business owner** — reviews vendor, employment, client, and partnership terms, with attention to obligations, payment, liability, and exit terms.
- **Other/general user** — receives neutral extraction and is encouraged to seek professional help.

## Core journey

1. Welcome and legal-information disclaimer.
2. Select persona and intent.
3. Paste or upload a document; see privacy/data-processing notice.
4. Client validation and accessible loading state.
5. Dashboard: summary, Attention Radar, clauses, obligations, dates.
6. Open a clause to inspect source, explanation, implications, and questions.
7. Generate lawyer questions and an action checklist.
8. Optionally compare a second version.
9. Export/share is out of initial scope unless privacy and redaction are reviewed.

## User stories

- As an employee, I want termination and notice clauses prioritized before signing.
- As a freelancer, I want payment and IP terms explained in plain language.
- As a user, I want to see the document text behind an attention item.
- As a reviewer, I want added/removed/changed terms clearly labeled.
- As a user, I want questions to ask a lawyer, not a false legal verdict.
- As a keyboard or screen-reader user, I want every workflow operable and understandable.

## Product decisions

Attention is a review-priority signal, not a legal-risk verdict. Context changes prioritization, not facts. The interface is a workspace with evidence and actions, not a chat stream. The first release favors pasted text and a small allowlist of document formats to reduce security risk.

## Problem statement alignment matrix

| Challenge requirement | LegalLens AI feature | Implementation | Demonstration evidence |
|---|---|---|---|
| Simplify complex documents | Plain-language summary and clause explainer | Structured analysis response with source refs | Same clause shown beside explanation |
| Compare agreements | Comparison workspace | Deterministic diff plus cautious AI explanation | Added/removed/changed/unchanged labels |
| Highlight important clauses | Attention Radar | Context-aware bounded attention levels | Employee vs freelancer priority demo |
| Identify obligations | Obligations panel | Party/action/condition/deadline schema | Source-linked obligations |
| Answer document questions | Clause explainer | Selected text task endpoint | Original text and questions |
| Explain options/next steps | Checklist and lawyer preparation | Contextual action/question generation | Before-signing checklist |
| Summaries/checklists | Summary and action panels | Validated arrays and deterministic UI | Dashboard walkthrough |
| Prepare professional consultation | Lawyer Questions mode | Non-definitive, uncertainty-aware prompts | Question list with disclaimer |

## Evaluation alignment matrix

| Evaluation parameter | Implementation | How evaluator verifies |
|---|---|---|
| Code quality | Layered modules, contracts, small dependencies | Directory review and focused tests |
| Security | Server-only key, validation, safe renderer, limits, injection defense | Security fixtures, source inspection, headers |
| Efficiency | One narrow AI call per task, bounded text, no database | Request/latency behavior and code review |
| Testing | Unit, integration, security, edge, manual accessibility | Test report and reproducible fixtures |
| Accessibility | Semantic HTML, keyboard flow, labels, focus, contrast | Keyboard and screen-reader checklist |
| Problem alignment | Persona/intent-driven outputs and comparison | Guided demo against matrix above |

## Core product workflow

Authenticated users select a persona and intent, choose a clearly synthetic demo agreement or paste text, and submit one document to the backend. The analysis dashboard presents summary, document information, Attention Radar, important clauses, obligations, dates, lawyer questions, and a generated checklist. Changing persona changes the server-generated priority profile included in the analysis prompt. Outputs are informational and source-oriented.

## Judge workflow

A judge opens the public landing page, selects **Sign in**, enters deployment-configured demo credentials, and reaches the protected workspace. The workspace gives a four-step quick start and clearly labels synthetic demo documents as evaluation-only when those workflows are enabled. The current foundation does not fabricate analysis results; it demonstrates the real login boundary and prepares the actual product path.

## Out of scope for first release

Legal advice, legal validity judgments, jurisdiction-specific conclusions, persistent accounts, unreviewed document sharing, OCR, broad file-format support, autonomous actions, and authoritative legal research.
