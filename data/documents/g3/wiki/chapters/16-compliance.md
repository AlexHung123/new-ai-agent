---
title: Legal, IPR, SRA, audit and technical review
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, compliance, risk-assessment, audit, policy, guideline]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 20
confidence: high
contested: false
---

# Legal, IPR, SRA, audit and technical review

G3 s.20: avoid breaches of legal, statutory, regulatory or contractual security obligations, and operate measures in accordance with those requirements. Cycle and method: [[security-risk-assessment]]. DPO mechanism: [[annex-compliance-mechanism]]. Higher-tier extras: [[annex-classified-protection]]. Issuer: [[dpo]].

## Section map

| G3 | Topic |
| --- | --- |
| 20.1(a) | Identify applicable law and contracts |
| 20.1(b) | IPR: licensed software only; annual licence audit |
| 20.1(c) | Documented evidence of compliance |
| 20.1(d) | Data leakage prevention; personal data = RESTRICTED or above; PDPO DPP4 |
| 20.2(a) | SRA + PIA (if personal data) ≥ every 2 years **and** before production / major change |
| 20.2(b) | Security audit ≥ every 2 years; CISA/CISSP/CISP; no self-audit; rotate auditors |
| 20.2(c) | Vuln scan Internet-facing ≥ annually + pre-rollout + major change; pentest in SRA for all Internet-facing; config/source reviews should |
| 20.2(d) | Appendix D mechanism |

## Legal and contractual (s.20.1(a–c))

B/Ds **shall** explicitly **identify, document and keep up to date** all relevant statutory, regulatory and contractual requirements applicable to each information system, and define the controls and individual responsibilities to meet them. Review systems against security policies; audit against implementation standards and documented controls.

**Intellectual property.** Respect copyright. Only **approved software and hardware with purchased licences** may be installed, following the licence. Unauthorised copying, modification or unlicensed use **shall be strictly prohibited**. Audit the inventory of installed software against licence agreements regularly (**e.g. once a year**). Store licences, manuals and procurement documentation securely; maintain the inventory. Acquire software only from an authorised dealer/supplier. Freeware licences may not cover business use. Investigate unapproved software or unauthorised amendments to production files.

**Documented records.** B/Ds **shall** keep records that evidence compliance and support audits of effective implementation. Protect that information from loss and unauthorised access. A sample list of evidence is in the *Practice Guide for Security Risk Assessment & Audit*.

## Data protection (s.20.1(d))

Identify possible avenues of data breach and consider **data leakage prevention** for classified data at rest, in use at the endpoint, or in transit with external communications. Be aware of other-economy frameworks (e.g. GDPR, PIPL) where applicable.

**All personal data should be classified as RESTRICTED or above.** Higher classification and measures may be required depending on nature, sensitivity and harm. B/Ds **shall** comply with the Personal Data (Privacy) Ordinance, particularly **Data Protection Principle 4** (security of personal data).

For systems that may involve personal data, across the lifecycle: **minimise** collection and processing to what is relevant and necessary; **anonymise** (remove or mask identity); **erase** when no longer necessary. When designing such systems: technical and organisational measures against unauthorised or accidental access, processing, erasure or other use; PIA; limit collection/processing to the identified purpose; staff awareness of consequences of a personal-data breach. PCPD companions: *Guide to Data Protection by Design for ICT Systems*; Privacy Management Programme.

## Security risk assessment (s.20.2(a))

SRA identifies risks by source (threats, vulnerabilities) and event (incident scenarios), rates impact and likelihood, and prioritises treatment. Vulnerability identification (scanning, pentest) aids that. Outstanding unaddressed risks go in the system **risk register**. A **PIA** evaluates impact on personal-data privacy.

SRA for information systems and production applications, **and PIA** for those involving personal data, **shall** be performed **at least once every two years**. Interval is measured **commencement-to-commencement** (after funding approval) **or report-to-report**, and **shall not be longer than two years**. **Time spent remediating identified risks is not included** in the interval. SRA, and PIA if personal data is involved, **shall also** be performed **before production rollout** and **prior to major enhancements and changes**.

SRA and PIA should be performed by **qualified security experts independent of the area under review**. Agree scope, methodology and report format before commencement. Follow industry best practices. SRA **shall include on-site review** (inspection of IT infrastructure and interviews with key personnel). PIA follows PCPD’s prevailing guidelines. Document all assessment details.

Hold regular checkpoint meetings with the provider. Oversee quality against the service agreement. **Self-assessment checklists are not a substitute** for thorough, unbiased SRA/PIA. B/Ds may perform these assessments internally if independent and of quality. More frequent cycles may be needed at higher risk. Companion: *Practice Guide for Security Risk Assessment & Audit*.

## Security audit (s.20.2(b))

A security audit uses policy or standards to determine the state of existing protection and whether it has been performed properly. It **shall** be performed **at least once every two years**. Keep process documentation current.

Choose an **independent and trusted** party. Auditors **shall not audit their own work**. Avoid engaging the **same** security auditor for a **prolonged** period. The audit **shall** be conducted by independent auditors who possess **CISA, CISSP or CISP** (examples given), with relevant experience, accompanied by system administrators.

The audit evaluates compliance with government information-security requirements and the B/D’s own policies. It is **not** a verification of SRA-recommended rectification. It **shall** include interviews and reviews of settings, logs, policies, procedures and other documents.

On non-compliance: determine causes; evaluate and implement action; review effectiveness; document results; check whether similar issues apply to other systems.

## Technical compliance review (s.20.2(c))

Restrict and control SRA/audit tools; put their use under change management. Assign dedicated least-privilege accounts for scanning, pentest, configuration and source-code reviews; **remove or reset** those accounts immediately after.

| Activity | Internet-facing systems |
| --- | --- |
| **Vulnerability scanning** | **Shall**, at least **annually**, **before production rollout**, and **prior to major enhancements/changes**. Should also sit in SRA risk identification. |
| **Penetration testing** | **Shall** be included in the SRA for **all Internet-facing** systems. |
| **Configuration and source-code reviews** | **Should**, regularly, before production rollout, and prior to major change. |

Evaluate and address identified issues **before** live-run. Plan and exercise these activities with caution; they can themselves compromise the system. Scanning, pentest and source-code reviews should be carried out only by competent authorised persons or under their supervision. Technical vulnerability management: G3 s.14.6.

Appendix C **adds** floors: Tier 2 annual vuln scan (all T2, not only Internet-facing) and pentest in every T2 SRA, with Internet-facing T2 pentest **at least annually**; Tier 3 **annual** SRA including scan/pentest/config/source by an accredited independent pentester, reports endorsed by DITSO ([[annex-classified-protection]]).

## DPO mechanism (s.20.2(d))

B/Ds **shall** follow the government Information Security Compliance Monitoring and Audit mechanism in **Appendix D** ([[annex-compliance-mechanism]]). Pointer: IT Security Theme Page on ITG InfoStation.

## Related links

[[security-risk-assessment]] · [[annex-compliance-mechanism]] · [[annex-classified-protection]] · [[dpo]] · [[classified-information]] · [[compare-tiers]] · [[12-development]]
