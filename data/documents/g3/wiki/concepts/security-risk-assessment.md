---
title: Security risk assessment
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [risk-assessment]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 7.2, 16.1, 20.2, App C, App D
confidence: high
contested: false
---

# Security risk assessment

Security risk assessments identify IT security risks by source (threats, vulnerabilities) and event (incident scenarios), determine level from impact and likelihood, and prioritise treatment. Vulnerability-identification activities (scanning, pentest) aid that identification. Outstanding risks go into the system’s risk register. A **privacy impact assessment (PIA)** evaluates impact on personal-data privacy with the objective of avoiding or minimising adverse impacts (G3 s.20.2(a)). See [[16-compliance]] and [[classified-protection]].

## Interval: at least every two years

SRA for information systems and production applications, **and** PIA for those involving personal data, **shall** be performed **at least once every two years** (G3 s.20.2(a)). For the avoidance of doubt:

- the interval between two consecutive exercises is the period between either (i) the **commencement dates** of the two exercises after funding approval **or** (ii) the **release dates of the reports** of the two assessments on the identified risks, and that interval **shall not be longer than two years**;
- time spent **implementing** protection against identified risks is **not** included in the interval.

SRA (and PIA where personal data is involved) **shall also** be performed **before production rollout** and **prior to major enhancements and changes**. Design-stage security review is a separate, earlier checkpoint; the pre-production SRA verifies follow-up of that review and of programming-code review ([[security-by-design]], G3 s.16.1(a)).

B/Ds should consider more frequent SRA/PIA according to risk level. They may perform assessments internally if done independently and to quality. Security **audit** is a different exercise, also at least every two years, and is **not** a verification of SRA rectification (G3 s.20.2(b)).

## On-site; independent experts; PIA; self-checklist is not a substitute

Because of the expert knowledge required, SRA and PIA **should** be performed by **qualified security expert(s) independent of the area under review**. Scope, methodology, and report format **shall** be agreed before commencement. SRA **shall** include **on-site review** — thorough inspection of IT infrastructure and interviews with key personnel — not only off-site review. PIA **shall** follow PCPD’s prevailing guidelines. Checkpoint meetings with the service provider **shall** be held; B/Ds **shall** oversee quality against the service agreement.

**Self-assessment checklists** can support ongoing monitoring but **are not sufficient** to be considered thorough and unbiased SRA/PIA and **shall not** be used as a substitute (G3 s.20.2(a)).

[[ditso|DITSO]] oversees satisfactory completion of SRA and PIA and subsequent rectification (G3 s.5.2.1). Appendix D: DITSOs submit documentation, results, and rectification status to [[dpo|DPO]] on regular request.

## Tier 3: annual (Appendix C)

For Tier 3 systems, SRA **shall** be conducted **at least annually**, before production rollout, and prior to major enhancements/changes. That SRA **shall** include vulnerability scanning, penetration testing, configuration reviews, and source-code reviews. Pentest shall be by an independent service provider with professional accreditations (examples: CISP-PTE, CREST CCT APP, GPEN, OSCP). On completion, SRA reports — including risk registers, scanning reports, pentest reports, and rectification plans — **shall be endorsed by DITSO** and, under Appendix D, submitted to DPO within 30 days.

Internet-facing systems (all tiers): annual scanning plus pre-rollout and major change; pentest included in the SRA (G3 s.20.2(c)). Practice Guide for Security Risk Assessment & Audit is on ITG InfoStation.

## Related

[[ditso]] · [[classified-protection]] · [[security-by-design]] · [[vulnerability-management]] · [[compare-tiers]] · [[16-compliance]]
