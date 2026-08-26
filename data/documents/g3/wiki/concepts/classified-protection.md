---
title: Classified protection of IT security
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [classification, policy]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 2.3, 4.1, 7.2, App B, App C, App D
confidence: high
contested: false
---

# Classified protection of IT security

Classified protection means assessing **every** information system — including infrastructure facilities and departmental shared IT services, **regardless of funding** — as Tier 1, Tier 2, or Tier 3, and applying security controls commensurate with that tier (G3 s.7.2(b)). B/Ds shall adopt **all mandatory requirements in the body of G3** for ordinary (Tier 1) systems, and **additionally** the more stringent requirements in [[annex-classified-protection|Appendix C]] for Tier 2 and Tier 3 (G3 ss.2.3, 7.2(b)). Security controls for Tier 2 **shall also** be adopted by Tier 3. Compact extras: [[compare-tiers]].

This is a **system** classification. Data classification under Security Regulations is a different fork ([[classified-information]]).

## Definitions (G3 s.4.1; reconstructed from the wrapped s.4.1(a) heading)

| Tier | Definition |
| --- | --- |
| **Tier 1** | A related set of hardware and software organised for the collection, processing, storage, communication, or disposition of information, regardless of the source of funding and project type. This is G3’s definition of an information system; every government information system is at least Tier 1. |
| **Tier 2** | Tier 1 systems which are **crucial** to the operations of the Government or society and whose failure or disruption will result in a **serious impact** on government operations or may cause **public turmoil and catastrophes**. |
| **Tier 3** | Tier 2 systems which are **directly related to the provision of an essential service** and whose disruption or destruction may cause **serious harm** to the economy, people’s livelihood, public safety, etc. |
| **Essential services** | Services that are critical to the functioning and security of a society and its economy. |

B/Ds should consider data classification and consequences of service disruption when determining criticality. Aspects named in G3 s.7.2(b): defence/security risks; financial implications; government image; interdependency. Assessment should cover scope (users affected), severity, downtime tolerance, and the largest potential business impact. Appendix B adds High/Medium/Low impact scoring and lists essential-service sectors as examples (aviation, banking and finance, broadcasting, communications, energy, healthcare, land transport, maritime, media, security and emergency services, water and sewerage, etc.). When in doubt, consult [[dpo|DPO]].

## When and who endorses

B/Ds shall determine classifications **during the project initiation stage** (G3 ss.7.2(b), 16.1(a)) and keep them aligned with business objectives across the life cycle. Assessment details of **all** information systems shall be documented. Classifications shall be endorsed by the **Heads of B/Ds or their explicitly delegated officer at directorate level** (G3 s.7.2(b)).

## Appendices

- **[[annex-classification|Appendix B]]** — guidance on classification assessment (impact table; how to identify Tier 3 from essential services).
- **[[annex-classified-protection|Appendix C]]** — extra *shall* controls for Tier 2 and Tier 3 (organisation, passwords, MFA, backup, patching, shift-left, contingency, scanning/pentest, annual SRA for Tier 3, 24×7 monitoring, resilience).
- **[[annex-compliance-mechanism|Appendix D]]** — B/Ds shall submit the list of Tier 2 and Tier 3 systems and the assessment details, with Head of B/D or delegated directorate endorsement, to DPO; notify DPO within 30 days of changes. DPO may require further information so the assessment aligns with s.7.2(b). Tier 3 attracts extra DPO inspection (IT security unit establishment, SRA/audit reports, incident-response plan on request).

## Related

[[compare-tiers]] · [[classified-information]] · [[information-security]] · [[annex-classification]] · [[annex-classified-protection]] · [[annex-compliance-mechanism]] · [[dpo]] · [[03-management]]
