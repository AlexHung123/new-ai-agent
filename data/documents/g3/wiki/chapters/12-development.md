---
title: Security by design, SDLC and test data
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, development, security-by-design, policy, guideline]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 16
confidence: high
contested: false
---

# Security by design, SDLC and test data

G3 s.16: security is an integral part of information systems across the life cycle. Isolate development, system testing, acceptance testing and live operation whenever possible. Concept: [[security-by-design]]. Pre-production check: [[security-risk-assessment]]. Data owner: [[information-owner]].

## Section map

| G3 | Topic |
| --- | --- |
| 16.1(a) | Security by design / shift-left; classify at project initiation; design-stage review; pre-production SRA verifies follow-up |
| 16.1(b) | Spec/design checks; threat model; PIA; Agile adaptations |
| 16.1(c) | Application design principles |
| 16.1(d–e) | Programming standard; divide sensitive programs |
| 16.1(f) | Testing; OGCIO Circular 5/2023; GC 6/2024 Specified IT Systems |
| 16.2 | Secure development environment; source control; separate environments; change control; program cataloguing |
| 16.3 | Test data: no production data; de-personalise |

## Security by design (s.16.1(a))

Introduce security and privacy early and throughout the SDLC. Use OS security facilities; add application measures by vulnerability, criticality and data sensitivity. **Shift-left** integrates security from the start — secure coding and design-stage security reviews.

B/Ds **shall** determine **classifications of information systems at project initiation** and should define IT security requirements in the design stage (new systems or enhancements). A design-stage **security review** should check business, legal (e.g. PDPO) and government requirements, and identify compliance issues and risks. Document identified risks and recommendations. Include a development-team role that assesses security risks and reviews design and code.

The pre-production SRA **should verify completion of follow-up** from the security review and the programming-code review before production rollout. (Appendix C raises this to a **shall** for Tier 2/3 — [[annex-classified-protection]].) Companion: *Practice Guide for Security by Design*. (Footnote 6 on Data Protection Principles in s.16.1(c) is **not** in this conversion.)

## Specification and design (s.16.1(b))

Checks should cover: accounting and application controls (authentication, authorisation, accountability) and legislation; a **threat model** with mitigations in all design/functional specs (a minimal model analyses high-risk entry points and data); user review of integrity loopholes; evaluation of loss of processing capability and a **contingency plan** (G3 s.19.1(a)); evaluation with the [[information-owner|Information Owner]] of data sensitivity (security level, source, access by grade, manipulation rights, auditability, retention, backup copies/frequency); and a **Privacy Impact Assessment** for systems with privacy implications (PCPD leaflet). Fold the user’s security statement into the functional specification.

Agile adaptations: document the security architecture; include a security-review role in the team; document security-related programming; conduct code review if necessary.

## Application design principles (s.16.1(c))

| Principle | Meaning |
| --- | --- |
| Secure architecture | Security in the basic design; mitigations for identified threats. Personal data: PDPO Data Protection Principles (footnote 6 missing). |
| [[least-privilege\|Least privilege]] | Run with the least system privilege needed. |
| Segregation of duties | Split critical functions so one person cannot subvert them. |
| Need-to-know | Documentation and listings: minimum access, authorised by the application owner. |
| Weakest link | Protect every area; attackers use neglected code. |
| AuthN / authZ | Enforce privileges; consider CAPTCHA on public web input. |
| Session management | Unpredictable IDs, secure channel, limited lifetime, encrypt sensitive session data, logout, idle timeout, filter invalid sessions. |
| Input validation | Strict validation of all input from outside the trust boundary. |
| Error handling | Useful messages; **no classified information** in errors. |
| Fail securely | Reject further execution on failure. |
| Configuration | Unused services off; secure settings. |
| Remove unnecessary items | Disable unused services/ports; strip banners, help databases, sample files from production. |
| Data confidentiality | Encrypt classified data in storage or transit; mask when displayed, printed or used for testing. |
| Authenticity / integrity | Maintain them during exchange. |
| Secure deployment | Prescriptive guide for each feature. |
| Logs | Audit trails for critical/sensitive events; no tampering; escalate exceptions. |

## Programming, division of labour, testing (s.16.1(d–f))

Programming controls **shall** ensure the program matches its specification with **no undocumented features**, adheres to the standard, and prevents/detects fraud. Establish a programming standard and enforce it.

For risky/sensitive systems, **divide** programs into modules assigned to several programmers so one person cannot plant faults alone and units can be reviewed in detail.

**UAT:** the user department prepares the plan and data and examines all outputs (valid/invalid combinations, rule violations, rounding/overflow, unexpected input). Also: **unit**, **interface**, **system**, **stress/load**, and **regression** tests. Document each test record and expected results; reuse the same files after change and accept only if there is no discrepancy.

Information systems supporting **large-scale public-facing digital services selected by DPO** are subject to extra tests under **OGCIO Circular No. 5/2023**. **Specified IT Systems** are subject to extra tests by **independent third parties** prior to rollout under **General Circular No. 6/2024**. Cite the circulars; this wiki does not reconstruct their full text.

## Development and support processes (s.16.2)

Assess per-application development risk (data sensitivity, regulations, existing controls, staff trustworthiness, outsourcing, environment segregation, access, change monitoring, off-site backups, data movement). Document the resulting procedures.

Documentation, **source code** (including scripts that run without compilation) and listings **shall** be need-to-know, authorised by the application owner, and suitably classified. Source libraries should **not** sit on a production system; log all access; apply strict change control.

Thoroughly test security measures before rollout, in proportion to criticality.

Maintain integrity with **version control** and **separated** development, system-test, UAT and live environments. Classified information **shall not** be copied to test unless the Information Owner approves **and** equivalent controls exist. Run development and operational software on different systems/domains; test changes in system and acceptance environments before go-live. Restrict Internet and other unnecessary connections from test/dev; avoid Internet-facing names that advertise a test environment. Restrict compilers on operational systems. Users should have **different accounts** for test and live.

Changes should go through a **change coordinator**, be authorised commensurate with extent, and not compromise security. Avoid modifying vendor packages; if unavoidable, consider integrity, vendor consent, standard updates, future maintenance, and compatibility.

**Program cataloguing (s.16.2(f)).** Development/support staff **shall not** access classified information in production unless the Information Owner approves. Staff of the development or maintenance team are **not** allowed to introduce source or object into the production library nor copy from it — a **control unit** does that. On amendment, production programs are copied to the development library under the control unit; the team then requests cataloguing. Keep **at least two generations** of software releases for fallback. **Harden** before rollout and use the hardened build as the baseline. Companion: *Guidelines on System Maintenance Cycle (G22)*.

## Test data (s.16.3)

Test data **shall** be selected, protected and controlled commensurate with its classification. **Production data shall not be used for testing.** Avoid operational databases containing personal or classified information. If unavoidable, review and document the process and obtain Information Owner approval. Then: **de-personalise** personal data; remove or modify classified information beyond recognition; **clear the data immediately after testing**.

## Related links

[[security-by-design]] · [[information-owner]] · [[security-risk-assessment]] · [[least-privilege]] · [[classified-information]] · [[segregation-of-duties]] · [[16-compliance]]
