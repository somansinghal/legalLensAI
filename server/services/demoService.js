const demos = [
  {
    id: 'employment',
    title: 'Employment Agreement',
    label: 'Synthetic demo document — not a real legal agreement.',
    persona: 'employee',
    intent: 'understand_before_signing',
    description: 'Full-time standard software design employment agreement with compensation, IP assignment, non-solicitation, and termination notice clauses.',
    focus: 'Compensation details, 30-day written notice, 6-month non-solicitation restrictions, and IP assignment.',
    text: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is made effective as of 1 May 2026, by and between Northstar Labs India Private Limited ("Employer") and Jordan Lee ("Employee").

1. Position and Duties. The Employee shall serve as Senior Product Designer. The Employee agrees to perform all duties reasonably assigned and adhere to standard workplace policies, confidentiality standards, and internal codes of conduct.

2. Compensation and Benefits. The Employer agrees to pay the Employee a base salary of INR 85,000 per month, subject to standard statutory withholdings and deductions. Payment shall be disbursed on or before the last working day of each calendar month. The Employee is eligible for standard health insurance benefits following completion of 90 days of employment.

3. Proprietary Information and Inventions. All designs, workflows, software architectures, copyrights, and inventions developed during working hours or utilizing Employer property shall remain the exclusive intellectual property of the Employer. The Employee agrees to execute any documentation necessary to confirm ownership.

4. Termination of Employment. Either party may terminate this Agreement without cause by providing at least 30 (thirty) days written notice, or payment of salary in lieu thereof. The Employer reserves the right to terminate employment immediately without notice in cases of gross misconduct, fraud, or material breach of company policy.

5. Restrictive Covenants and Non-Solicitation. For a period of 6 (six) months following separation from Northstar Labs, the Employee shall not directly or indirectly solicit, induce, or attempt to divert any client or employee of the Employer with whom the Employee had material contact during the preceding 12 months. The parties recognize that the enforceability of post-termination restrictions is subject to applicable state and national labor laws.

6. Governing Law and Dispute Resolution. This Agreement shall be governed by and construed under the laws of India. Any legal dispute arising under this Agreement shall be referred exclusively to the competent courts of Jaipur, Rajasthan.

Signed by authorized representatives of Northstar Labs and Jordan Lee.`,
    source: 'synthetic'
  },
  {
    id: 'freelancer',
    title: 'Freelance Agreement',
    label: 'Synthetic demo document — not a real legal agreement.',
    persona: 'freelancer',
    intent: 'find_obligations',
    description: 'Independent contractor design package agreement detailing milestone payments, IP transfer upon full compensation, and 14-day notice.',
    focus: 'Two-stage milestone payment schedule, IP rights retention prior to final payment, and expense reimbursement timelines.',
    text: `FREELANCER SERVICES AGREEMENT

This Freelancer Services Agreement ("Agreement") is entered into as of 15 May 2026, between Bright Market Studio ("Client") and Aria Shah ("Freelancer").

1. Scope of Services. The Freelancer agrees to provide brand identity design, visual guidelines, and digital asset templates as outlined in Project Brief Alpha, with a final completion deadline of 30 June 2026.

2. Compensation and Payment Terms. The Client agrees to pay total project compensation of INR 120,000 in two installments:
   (a) First installment: INR 60,000 (50 percent) payable upon execution of this Agreement prior to project kickoff;
   (b) Second installment: INR 60,000 (50 percent) payable within 15 days of final deliverable approval.

3. Intellectual Property Rights. Upon receipt of full and final payment, the Freelancer transfers and assigns all copyrights in the final approved deliverables to the Client. All preliminary sketches, exploratory drafts, and working files remain the intellectual property of the Freelancer unless otherwise amended in writing.

4. Client Responsibilities and Feedback. The Client agrees to provide timely feedback within 5 business days of receiving milestone deliverables. Failure to provide timely feedback may result in proportionate adjustments to project deadlines.

5. Expense Reimbursement. Pre-approved out-of-pocket project expenses (e.g. licensed typography, third-party stock assets) shall be reimbursed by the Client within 30 days of submission of valid receipts.

6. Term and Termination. Either party may terminate this Agreement upon 14 days written notice. In the event of early termination, the Freelancer shall be compensated for all hours worked and milestones achieved through the effective date of termination.

Executed by Bright Market Studio and Aria Shah.`,
    source: 'synthetic'
  },
  {
    id: 'internship',
    title: 'Student/Internship Agreement',
    label: 'Synthetic demo document — not a real legal agreement.',
    persona: 'student',
    intent: 'understand_before_signing',
    description: 'Fixed-term summer research and machine learning internship with academic stipend, publication rights, and mentor check-ins.',
    focus: 'Fixed 12-week educational term, stipend disbursement, research publication approval process, and equipment return.',
    text: `STUDENT INTERNSHIP & RESEARCH AGREEMENT

This Student Internship Agreement ("Agreement") is dated 1 June 2026, between Horizon Innovation Labs ("Host Institution") and Rohan Patel ("Intern"), currently enrolled at Apex Institute of Technology.

1. Internship Program and Educational Goals. The Intern is admitted to a 12-week training program focused on Applied Natural Language Processing, running from 1 June 2026 through 24 August 2026. The program provides structured academic mentorship, weekly technical reviews, and practical industry experience.

2. Educational Stipend. The Host Institution will provide an educational learning stipend of INR 35,000 per month. The stipend is provided to support educational pursuits and does not establish a permanent employment relationship.

3. Academic Credits and Institutional Reporting. The Host Institution agrees to complete required academic evaluations and verify completed hours for the Intern's degree requirements upon satisfactory completion of program objectives.

4. Research Publications and Work Product. The Intern may use general academic learnings in academic theses or conference papers, provided that no proprietary company algorithms, unreleased benchmarks, or confidential datasets are disclosed without written authorization from the Research Director.

5. Confidentiality and Equipment Return. The Intern must maintain strict confidentiality regarding unreleased research. All laptops, hardware tokens, and laboratory badges provided by the Host Institution must be returned within 3 days of program completion.

6. Program Discontinuation. Either party may discontinue the internship with 7 days written notice if educational objectives or performance standards are not met.

Acknowledged by Horizon Innovation Labs and Rohan Patel.`,
    source: 'synthetic'
  },
  {
    id: 'nda',
    title: 'NDA / Confidentiality Agreement',
    label: 'Synthetic demo document — not a real legal agreement.',
    persona: 'business_owner',
    intent: 'understand_before_signing',
    description: 'Bilateral non-disclosure agreement for early-stage partnership discussions, defining proprietary assets, survival periods, and return obligations.',
    focus: 'Definition of Confidential Information, 2-year non-disclosure survival period, exclusion of public knowledge, and standard remedies.',
    text: `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of 10 June 2026, between Apex Logic Solutions ("First Party") and Catalyst Digital Systems ("Second Party").

1. Purpose. The parties wish to explore a potential strategic collaboration in document intelligence technology ("Purpose") and may disclose confidential business and technical information.

2. Definition of Confidential Information. "Confidential Information" refers to any proprietary data, trade secrets, software prototypes, financial forecasts, customer lists, or product roadmaps disclosed by one party ("Disclosing Party") to the other ("Receiving Party"), whether marked as confidential or reasonably understood to be confidential.

3. Standard of Care and Restrictions. The Receiving Party agrees:
   (a) To protect the Confidential Information using the same degree of care it uses for its own confidential information, but not less than a reasonable standard of care;
   (b) To use Confidential Information solely for the stated Purpose;
   (c) To restrict access to employees, legal counsel, and technical contractors who need to know and are bound by confidentiality obligations at least as restrictive as this Agreement.

4. Exclusions from Confidentiality. Confidential Information does not include information that:
   (a) is or becomes publicly available without breach of this Agreement;
   (b) was already known to the Receiving Party prior to disclosure;
   (c) is independently developed without reference to the Disclosing Party's information.

5. Term and Survival. This Agreement governs disclosures made within 1 (one) year from the effective date. The obligation to protect Confidential Information survives for a period of 2 (two) years following the date of disclosure.

6. Return or Destruction of Materials. Upon written request, the Receiving Party shall promptly return or certify destruction of all documents and digital media containing Confidential Information, with routine automated archival backups exempted.

7. Governing Law. This Agreement shall be governed by the laws of India, with jurisdiction in the courts of New Delhi.

Executed by Apex Logic Solutions and Catalyst Digital Systems.`,
    source: 'synthetic'
  },
  {
    id: 'service',
    title: 'Service Agreement',
    label: 'Synthetic demo document — not a real legal agreement.',
    persona: 'business_owner',
    intent: 'understand_termination',
    description: 'Enterprise cloud analytics SaaS agreement featuring monthly retainer billing, 99% SLA availability, 45-day auto-renewal notice, and liability cap.',
    focus: 'Monthly recurring fees, 99.0% uptime commitment, 45-day renewal cancellation window, and limitation of liability to 12 months fees.',
    text: `CLOUD SOFTWARE SERVICE AGREEMENT

This Cloud Software Service Agreement ("Agreement") is dated 1 July 2026, by and between Civic Cloud Technologies ("Provider") and Riverstone Retail ("Customer").

1. Hosted Services. The Provider will provide access to the hosted Cloud Inventory and Reporting Platform ("Service") commencing 1 July 2026 for an initial term of 12 (twelve) months.

2. Subscription Fees and Invoicing. The Customer agrees to pay a recurring fee of INR 25,000 per month. Invoices are issued on the first business day of each month and payable within 15 days of invoice date. Late payments may accrue interest at 1.5% per month.

3. Service Level Agreement (SLA). The Provider targets 99.0% monthly uptime for the core application, excluding scheduled maintenance announced with at least 48 hours notice. In the event of verified monthly uptime below 98%, Customer shall be eligible for a 10% credit against the following month's subscription.

4. Customer Data and Privacy. The Customer retains full ownership of all business records and transaction data submitted to the Service. The Provider will implement reasonable administrative and technical safeguards to protect data integrity.

5. Term, Renewal, and Termination. This Agreement automatically renews for successive 12-month periods unless either party delivers written notice of non-renewal at least 45 (forty-five) days prior to the expiration of the then-current term. Either party may terminate immediately for material breach uncured after 30 days written notice.

6. Limitation of Liability. To the maximum extent permitted by applicable law, neither party shall be liable for indirect, incidental, or consequential damages. Each party's aggregate monetary liability under this Agreement shall not exceed the total fees paid by Customer during the 12 months preceding the incident.

7. Jurisdiction. This Agreement is subject to the exclusive jurisdiction of the commercial courts of Mumbai, India.

Executed by authorized signatories of Civic Cloud Technologies and Riverstone Retail.`,
    source: 'synthetic'
  }
];

export function listDemos() {
  return demos.map(({ text, ...safe }) => safe);
}

export function getDemo(id) {
  return demos.find((demo) => demo.id === id) || null;
}
