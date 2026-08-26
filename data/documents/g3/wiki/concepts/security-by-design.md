---
title: Security by design
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [security-by-design, development]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 6, 16
confidence: high
contested: false
---

# Security by design

B/Ds shall ensure security is an integral part of information systems across the entire life cycle, and isolate development, system testing, acceptance testing, and live operation whenever possible (G3 s.16). The security-by-design approach **shall** be adopted to incorporate security requirements into the SDLC so systems and applications are implemented with appropriate security and data-protection measures. Security shall be considered throughout all phases to minimise rework. It is a software and hardware approach that seeks to minimise vulnerabilities and reduce attack surface by designing security into every phase — specifications in the design, continuous evaluation, best-practice adherence, and IT resiliency (G3 s.6). Practice Guide for Security by Design is on ITG InfoStation. See [[12-development]].

## Shift-left and design-stage review (G3 s.16.1(a))

The **security shift-left** approach integrates security early and throughout the SDLC. B/Ds **should** implement it, including secure coding practices and **security reviews in the system design stage**.

B/Ds **shall** determine [[classified-protection|system classifications]] at **project initiation** and **should** define IT security requirements in the **system design stage** for new systems or enhancements. A design-stage security review should assess requirements from business needs, legal and regulatory requirements (e.g. Personal Data (Privacy) Ordinance), and government security requirements, and review the design for compliance issues and risks. Identified risks and recommendations should be documented and addressed. The review should include a role in the development team for assessing security risks, proposing issues, and reviewing design and programming code.

[[classified-protection|Tier 2]] Appendix C turns shift-left (secure coding and design-stage security reviews as specified in s.16.1(a)) into a **shall**, and requires the pre-production SRA to verify follow-up of that review.

## Pre-production SRA verifies

The **pre-production [[security-risk-assessment|Security Risk Assessment]]** should verify completion of follow-up actions for the security review **and** the programming-code review so necessary measures are implemented before production rollout (G3 s.16.1(a)). SRA before rollout is also a s.20.2(a) **shall**. Specified IT Systems and DPO-selected large-scale public-facing services have additional independent/third-party tests under General Circular No. 6/2024 and OGCIO Circular No. 5/2023 as G3 cites them (G3 s.16.1(f)).

## Program cataloguing (G3 s.16.2(f))

Application development and system support staff **shall not** be permitted to access classified information in production systems unless approval from the [[information-owner|Information Owner]] is obtained. **Program cataloguing should be enforced** to restrict that access. Development or maintenance staff are not allowed to introduce any program source or object into the production library, nor to copy from it; a **control unit** performs those moves. On amendment, production programs are copied to the development library under the control unit; after amendment the project team requests cataloguing into production. Keep at least two generations of software releases for fallback. Harden before production rollout and use the hardened system as the baseline for further changes (Tier 2 Appendix C makes hardening before rollout a **shall**).

## Test-data rules (G3 s.16.3(a))

Test data shall be selected, protected, and controlled commensurate with its classification. **Production data shall not be used for testing.** Operational databases containing personal or classified information should be avoided for testing. If that cannot be avoided: review and document the process; **obtain Information Owner approval**; **de-personalise** personal data; **remove or modify classified information beyond recognition**; clear the data immediately after testing. Classified information shall not be copied to the testing environment unless the Information Owner approves **and** equivalent controls exist in the testing system (G3 s.16.2(d)).

Design principles in G3 s.16.1(c) include least privilege, segregation of duties, need to know, input validation, fail securely, encrypt classified data in storage or transit, and mask classified information when displayed, printed, or used for testing.

## Related

[[information-owner]] · [[classified-protection]] · [[security-risk-assessment]] · [[least-privilege]] · [[segregation-of-duties]] · [[12-development]]
