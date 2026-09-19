# LegalLens AI — Product Roadmap

## Phase 1: Core Intelligence & Persistence (Current — Completed ✅)

- [x] Context-aware persona selection (Employee, Freelancer, Student, Business Owner, Other)
- [x] Goal/intent prioritization (Understand before signing, Obligations, Termination, Dates, Lawyer prep)
- [x] Server-side Groq AI integration (`llama-3.3-70b-versatile`)
- [x] Defense-in-depth prompt injection shielding (`<untrusted_document_content>` XML delimiters)
- [x] Strict JSON schema validation and entity normalization
- [x] Attention Radar (clause risk triage)
- [x] Clause Explorer with side-by-side original excerpts and plain-language translations
- [x] Obligations & Important Dates extraction
- [x] Lawyer-preparation questionnaire generator
- [x] Interactive Action Checklist with state tracking
- [x] Server-side Google OAuth 2.0 with state verification
- [x] Zero-friction Judge Demo authentication
- [x] Firebase Admin SDK server-side persistence
- [x] Cloud Firestore user profile management (`users/{userId}`)
- [x] Cloud Firestore analysis history persistence (`users/{userId}/analysisHistory/{analysisId}`)
- [x] Cloud Firestore checklist synchronization (`users/{userId}/checklists/{analysisId}`)
- [x] Strict document privacy boundary (zero raw contract persistence)
- [x] Production technical SEO, Open Graph, Twitter cards, and JSON-LD schema
- [x] Playwright E2E and Node.js unit/integration test suites (100% pass rate)

---

## Phase 2: Enhanced Document Ingestion & Comparison (Planned 🚀)

- [ ] **Native Document Parsing**: Direct upload and text extraction for `.pdf`, `.docx`, and scanned images via OCR.
- [ ] **Two-Document Agreement Comparison**: Side-by-side redline diff and term comparison between draft versions or competitor agreements.
- [ ] **Opt-In Encrypted Document Vault**: Client-side encrypted document storage allowing users to optionally persist full document text in Firestore with zero-knowledge keys.
- [ ] **Exportable Intelligence Dossiers**: Downloadable PDF and Markdown reports with executive summaries for legal counsel consultations.

---

## Phase 3: Collaborative Intelligence & Team Workspaces (Future 🔮)

- [ ] **Shared Review Rooms**: Collaborative annotation and checklist completion for teams and co-founders.
- [ ] **Jurisdiction-Specific Legal Precedents**: Integration with open legal case law databases for jurisdiction-tailored clause benchmarks.
- [ ] **Multilingual Clause Translation**: Native multi-language contract ingestion and localized translation into Spanish, Hindi, French, and German.
