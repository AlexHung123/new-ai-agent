---
title: Compare — system tiers
created: 2026-08-21
updated: 2026-08-21
type: comparison
tags: [comparison, classification]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 2.3, 4.1, 7.2, App B, App C, App D
confidence: high
contested: false
---

# Compare — system tiers

Every government information system is Tier 1, 2, or 3 **regardless of funding** (G3 s.7.2(b)). The body of G3 is the Tier 1 floor. Tier 2 and Tier 3 **additionally** take [[annex-classified-protection|Appendix C]]; Tier 3 also takes every Tier 2 extra. Data grade under SR is a different fork ([[classified-information]], [[compare-classification-controls]]). Definitions: [[classified-protection]]. Assessment worksheet: [[annex-classification|Appendix B]].

## Definitions and who endorses

| | **Tier 1** | **Tier 2** | **Tier 3** |
| --- | --- | --- | --- |
| **Meaning** | An information system: hardware and software organised for collection, processing, storage, communication, or disposition of information (s.4.1(a), reconstructed). | Tier 1 systems **crucial** to Government or society operations; failure/disruption → **serious impact** on government operations or **public turmoil and catastrophes**. | **Tier 2 +** directly related to an **essential service**; disruption/destruction may cause **serious harm** to the economy, livelihood, public safety, etc. |
| **Controls** | All mandatory requirements in the **body of G3**. | Body **plus** Appendix C Tier 2 rows. | Body **plus** Appendix C Tier 2 **and** Tier 3 rows. |
| **When classified** | Project **initiation**; keep aligned across the life cycle (ss.7.2(b), 16.1(a)). | Same. | Same. |
| **Who endorses** | **Head of B/D** or **explicitly delegated directorate officer**. Document the assessment. | Same. | Same. |

Appendix B: if any assessed aspect is **High** impact, overall impact should be High → consider Tier 2. Essential-service sectors are examples only (aviation, banking and finance, broadcasting, communications, energy, healthcare, land transport, maritime, media, security and emergency services, water and sewerage, etc.). Consult [[dpo|DPO]] when in doubt.

## Compact Appendix C extras

**Tier 2 (also apply to Tier 3)**

- Privileged-account usage: independent-party check/audit **at least every six months**; compensating admin procedures if no technical limit on privileged data access.
- Strong [[password-management|password policy]] **shall**; MFA **shall** for interactive logon to privileged accounts where technically feasible.
- Local **and** off-site backups; capacity-management plan **shall** be documented.
- EOS **migration plan shall** be in place ≥ six months before end-of-support; associated measures **shall** be in place no later than EOS.
- Known vulnerabilities **shall** be fixed as soon as possible, typically within a month; if not, inform [[ditso|DITSO]] (rationale, risks, schedule) and give **monthly** updates until done.
- [[security-by-design|Shift-left]] **shall** (secure coding + design-stage reviews); pre-production SRA verifies follow-up; **hardening shall** before rollout, then used as baseline.
- **IT contingency plan shall**; DR plans fully documented, regularly tested, tied to BCP ([[disaster-recovery]]).
- Vulnerability **scanning** at least annually + pre-rollout + major change; **pentest** in every SRA; Internet-facing Tier 2 pentest **at least annually**.

**Tier 3 only**

- Information security **steering committee shall** (senior management + DITSO; regular meetings; outcomes and structure documented).
- At least one IT security management-unit member with a recognised certification (e.g. CISA, CISSP, CISP).
- Adopt the s.7.2(c) risk-management framework; **maintain risk registers** (identified risks, likelihood, severity, mitigation, monitoring).
- Formulate an IT security **training programme** (staff plus vendors/contractors/providers, or contractual training obligations).
- **24×7** information-security surveillance; SIEM to correlate sources (firewalls, IDS/IPS, EDR/NDR).
- **Sufficient resilience shall** to prevent disruption of essential services; failover tested regularly.
- [[security-risk-assessment|SRA]] **at least annually** + pre-rollout + major change, including scanning, pentest, configuration reviews, and source-code reviews; pentest by an independent accredited provider (examples: CISP-PTE, CREST CCT APP, GPEN, OSCP); DITSO **endorses** the reports.

## DPO list (Appendix D)

B/Ds **shall** submit the list of their Tier 2 systems, Tier 3 systems, and classification-assessment details, with Head of B/D or delegated directorate endorsement, to DPO. Notify DPO **within 30 days** of changes (including reclassification). DPO may require further information so the assessment aligns with s.7.2(b). Extra DPO inspection for **Tier 3**: IT security unit establishment; incident-response plan on request; SRA reports (including risk registers, scanning, pentest, rectification plans) within 30 days of completion; security-audit reports within 30 days, rectification plans 30 days after the audit report if non-compliant. All B/Ds: participate in DPO government-wide compliance audits; complete DPO security surveys.

## Related

[[classified-protection]] · [[annex-classification]] · [[annex-classified-protection]] · [[annex-compliance-mechanism]] · [[dpo]] · [[ditso]] · [[compare-shall-should-may]]
