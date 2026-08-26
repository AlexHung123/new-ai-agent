---
title: System acquisition, development and maintenance
created: 2026-08-22
updated: 2026-08-22
type: chapter
tags: [chapter, development, security-by-design, change]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 16
confidence: high
contested: false
---

# System acquisition, development and maintenance

S17 s.16: B/Ds **shall** ensure that security is an integral part of information systems across the entire life cycle and isolate the development, system testing, acceptance testing, and live operation environments whenever possible. Principle: [[security-by-design]]. Owners: [[information-owner]].

## Section map

| S17 | Topic |
| --- | --- |
| s.16.1.1 | Security planning and implementation according to the system’s security requirements |
| s.16.2.1 | Secure development environments covering the entire SDLC |
| s.16.2.2 | Documentation, source code, and listings restricted need-to-know |
| s.16.2.3 | Formal testing and review of security measures prior to implementation |
| s.16.2.4 | Integrity: version control; split of development / system test / acceptance / live |
| s.16.2.5 | Documented change-control procedures for program/system changes |
| s.16.2.6 | Staff formally advised of the impact of security changes and usage |
| s.16.2.7 | Dev/support staff not permitted production classified access unless Owner approves |
| s.16.3.1 | Test data protected; production classified data only with Owner approval |

## Security requirements (S17 s.16.1)

Security planning and implementation of appropriate security measures and controls for systems under development according to the systems’ security requirements **shall** be included (s.16.1.1). S17 does **not** time system-tier classification at “project initiation” in this clause; that timing is a G3 overlay. S17 s.7.2.2 still requires all systems to be classified and endorsed. See [[classified-protection]].

## Security in development and support (S17 s.16.2)

B/Ds **shall** establish and appropriately secure development environments for system development and integration efforts that cover the entire system development life cycle (s.16.2.1). Documentation, program source code, and listings of applications **shall** be properly maintained and restricted for access on a **need-to-know** basis (s.16.2.2).

Formal testing and review of security measures **shall** be performed **prior to implementation** (s.16.2.3). The integrity of an application **shall** be maintained with appropriate security measures such as a version-control mechanism and **separation of environments** for development, system testing, acceptance testing, and live operation (s.16.2.4).

Change-control procedures for requesting and approving program/system changes **shall** be documented (s.16.2.5). Operational change control: [[10-operations]] s.14.5.2. B/Ds **shall** ensure that staff are formally advised of the impact of security changes and usage on information systems (s.16.2.6).

Application development and system support staff **shall not** be permitted to access classified information in the **production** systems unless approval from the [[information-owner|Information Owner]] is obtained (s.16.2.7).

## Test data (S17 s.16.3)

Test data **shall** be carefully selected, protected, and controlled commensurate with its classification. If the use of classified data from production is genuinely required, the process **shall** be reviewed, documented, and approved by the Information Owner (s.16.3.1).

Pre-rollout [[security-risk-assessment]] and privacy impact assessment: S17 s.20.2.1.

## Related

[[security-by-design]] · [[information-owner]] · [[classified-information]] · [[classified-protection]] · [[10-operations]] · [[16-compliance]]
