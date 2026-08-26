---
title: Security risk assessment and audit
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, risk-assessment, audit, policy, guideline]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 12, 20
confidence: high
contested: false
---

# Security risk assessment and audit

Part II s.12 is the “shall”; Part III s.20 is the how. Concept page: [[security-risk-assessment]]. How-to for conducting an SRA or audit is **not** in DITSP — use OGCIO *Guidelines for Security Risk Assessment and Audit* **[G51]**. S17 requires the two-year cycle; DITSP assigns who does which flavour.

## Section map

| DITSP | Topic |
| --- | --- |
| 12.1.1 | SRA every **two years** and before major change [M] |
| 12.1.2 | Restrict SRA analysis tools [A] |
| 12.2.1 | Independent trusted-party evaluation every two years [M] |
| 12.2.2 | Periodic compliance auditing of computer and network security policy [A] |
| 12.2.3 | Restrict audit analysis tools [A] |
| 20 intro | Prefer external trusted third party; G51 |
| 20.1 | Bi-yearly SRA by **external contractors**; pre-change by [[itmu-security-team]] / IT Staff |
| 20.2 | Follow-up within **one month** unless [[dso]] excepts; audit within **one week** after |

## Two-year cycle and pre-change (s.12.1, 20.1)

Security risk assessments for information systems and production applications **shall** be performed **once every two years**. An SRA **shall also** be performed **prior to major enhancements and changes** associated with those systems or applications (DITSP s.12.1.1; restated against S17 in s.20.1). Division [[ditso|DITSO]] is responsible for ensuring the periodic assessment is carried out (s.20.1).

s.20.1 splits who performs it:

| Flavour | When | Who |
| --- | --- | --- |
| Bi-yearly SRA | Once every two years | **External contractors** |
| Pre-change SRA | Before major upgrade of software/hardware, computer-room relocation, etc. | **CSB ITMU Security Team or the IT Staff of the information system** (treated as the less complex case) |

s.20 intro recommends that SRA **and** audit be conducted by an external trusted third party. s.12.2.1 requires Information Systems to be evaluated once every two years by auditors of an **independent and trusted party** to determine the minimum set of controls that reduce risk to an acceptable level. Periodic compliance auditing of computer and network security policies is additional (s.12.2.2).

Use of software and programs for SRA analysis **and** for security-audit analysis shall be **restricted and controlled** (s.12.1.2, s.12.2.3).

## Follow-up (s.20.2)

A list of improvement actions is normally recommended in the SRA report. Those actions **should be performed within one month** after the assessment is completed **unless [[dso|DSO]] has endorsed the exception with reasons**. A **security audit should then follow within one week** to confirm the safeguards are properly implemented.

| Cycle | Who ensures follow-up |
| --- | --- |
| Bi-yearly SRA and audit | Division DITSO **and** CSB ITMU Security Team |
| Individual-system SRA/audit | Led by the [[information-system-owner|system owner]] |

Further s.20.2 steps:

- Present assessment/audit results and recommended safeguards to concerned parties (DSO, Information System Owners, support IT Staff, etc.).
- Seek DSO endorsement for revision of the IT security policy and supporting procedures, as necessary.
- Seek DSO endorsement for **bureau-level** (general) safeguards.
- Seek Information System Owner endorsement for **system-specific** safeguards.
- Evaluate the effectiveness of the implemented safeguard.

Aftermath of an incident may itself trigger an SRA/audit of the affected system (DITSP s.21.5). See [[08-incident]].

## Related links

[[security-risk-assessment]] · [[ditso]] · [[dso]] · [[itmu-security-team]] · [[information-system-owner]] · [[08-incident]] · [[compare-roles]] · [[06-network]]
