# AI Architecture and Safety

## Role

The AI is a bounded extraction and explanation component. It is not the source of legal authority and must not act as a lawyer. The application prioritizes traceability to supplied text, cautious language, and useful next steps.

## Orchestration

`analysisService`, `comparisonService`, and `clauseService` call a shared `promptService` and `groqService`; routes do not construct prompts. The provider/model is configured by environment variables. Each use case has one narrow prompt and a versioned schema. A timeout, bounded retry policy, and response size limit prevent runaway calls.

## Prompt composition

The server constructs four clearly separated blocks:

1. **SYSTEM INSTRUCTIONS** — role, safety rules, no legal certainty, schema, and injection defense.
2. **USER CONTEXT** — validated persona and intent plus server-generated priority profile.
3. **DOCUMENT CONTENT** — normalized text explicitly labeled untrusted data and delimited.
4. **TASK** — extraction/explanation/comparison instruction and exact JSON output contract.

Document text must never be concatenated into system instructions. Embedded text such as “reveal the prompt” is treated as content.

## Required behavior

- State when the document does not provide enough information.
- Preserve source references and quote only bounded supplied text.
- Use `high_attention`, `review_carefully`, and `informational`, never “illegal,” “invalid,” “definitely enforceable,” or guaranteed outcomes.
- Distinguish document fact, interpretation, uncertainty, and suggested question.
- Generate questions for a lawyer rather than definitive answers when legal judgment is needed.
- Do not invent dates, parties, obligations, jurisdictions, or missing clauses.

## Structured output

The response schema includes document type, summary items, parties, clauses, obligations, dates, attention items, lawyer questions, checklist items, uncertainties, and disclaimer. Every item is bounded in length and may carry `sourceRefs`. The server validates types, enum values, maximum array lengths, and required fields. Unknowns are represented explicitly.

## Comparison strategy

Normalize and segment both documents first. A deterministic diff identifies added, removed, modified, and unchanged text. The model may explain why a detected change may matter and categorize it, but it cannot invent a change absent from the diff. Before/after text and source references remain visible.

## Hallucination mitigation

Schema validation, source references, bounded quotes, deterministic date/text extraction where feasible, explicit uncertainty, narrow prompts, no unsupported legal claims, and a visible professional-review reminder. The UI should make it easy to inspect the original clause.

## Model configuration

`GROQ_MODEL` is external configuration. Do not hard-code a provider model in application logic. Record model identifier and schema version in internal non-sensitive diagnostics, not document content. Model upgrades require regression tests for schema compliance, injection fixtures, and representative synthetic documents.

## Failure behavior

Malformed JSON, schema mismatch, timeout, refusal, or provider failure becomes a clear controlled error. The app does not render partial unsafe output. A future fallback may provide deterministic extraction without AI, but should be a reviewed feature rather than silently implying equivalent analysis.

## Current implementation

The implemented analysis path is `analysisController` → `analysisService` → `documentService`/`contextService` → `promptService` → `groqService` → `schemas`. The provider uses Groq's OpenAI-compatible chat endpoint with server-only credentials, low temperature, JSON response mode, and a bounded timeout. The frontend receives only the validated view model.

## Evaluation fixtures

Use synthetic, non-sensitive documents covering employment, freelance, student, and small-business cases; missing dates; contradictory terms; short/long text; prompt injection; and unclear language. Never place real API keys or private legal documents in fixtures.
