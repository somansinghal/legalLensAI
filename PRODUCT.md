# LegalLens AI — Product Specification

## 1. Product Vision

Legal documents are intentionally written in dense legal terminology that creates an information asymmetry between individuals and institutional drafters. **LegalLens AI empowers everyday people to understand before they sign.**

Rather than providing open-ended chatbot dialogue that may hallucinate legal assertions, LegalLens AI delivers structured, context-specific document intelligence anchored to the user's specific role and goals.

---

## 2. Core User Experience

### 1. Context Selection
Users begin by specifying their perspective:
- **Persona**: Employee, Freelancer, Student, Business Owner, or Other.
- **Intent**: Understand before signing, Find obligations, Understand termination, Find deadlines, or Prepare lawyer questions.

### 2. Document Input
- **Synthetic Demos**: Instantly test pre-configured agreements (Employment Agreement, Mutual NDA, SaaS Terms of Service, Consulting Agreement).
- **Custom Input**: Paste proprietary agreements directly into the secure document buffer.

### 3. Structured Intelligence Modules
1. **Plain-Language Summary**: Executive overview of core terms, duration, and parties.
2. **Attention Radar**: Triages clauses into high attention (urgent review needed), review carefully, or standard provisions.
3. **Clause Explorer**: Side-by-side display of original document excerpts alongside clear, plain-language translations.
4. **Obligations**: Actionable breakdown of responsibilities categorized by party.
5. **Important Dates**: Chronological timeline of effective dates, renewals, and notice periods.
6. **Questions for a Legal Professional**: Prepares high-leverage questions to optimize time and expense during legal consultations.
7. **Action Checklist**: Interactive, persistent next steps synchronized to Cloud Firestore.
8. **Analysis History**: Access previous analyses at any time without re-running Groq AI.

---

## 3. Data Privacy & Compliance

- **No Raw Document Storage**: The user's contract text is processed transiently and discarded immediately after analysis.
- **Structured History**: Only non-sensitive metadata, summaries, and clause explanations are saved to Cloud Firestore for user convenience.
- **Clear Legal Boundaries**: Prominently displays safety notices clarifying that LegalLens AI provides educational document assistance, not legal advice or attorney representation.
