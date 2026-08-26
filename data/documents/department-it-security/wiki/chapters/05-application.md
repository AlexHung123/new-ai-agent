---
title: Application development and change control
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, policy, guideline, outsourcing]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 10, 18
confidence: high
contested: false
---

# Application development and change control

Part II policy (DITSP s.10) and Part III guidelines (s.18). Security is a design requirement, not a go-live patch. [[information-system-owner|Information System Owners]] own the requirement; production data stays out of test. Broader third-party duties sit on [[01-management-outsourcing]].

## Section map

| DITSP | Topic |
| --- | --- |
| 10.1 | Development and maintenance: planning, documentation, testing, environments, NDA |
| 10.2 | Configuration management and change control |
| 18 | Design-stage security; G3 s.10 topics; G22 system maintenance cycle |
| 18.1 | Production data and library; no production data on test |

## Policy — development and maintenance (DITSP s.10.1)

Application development staff shall include security planning and implement the appropriate security measures and controls for a system under development according to the system's security requirements (s.10.1.1). Documentation and listings of applications shall be properly maintained and restricted on a need-to-know basis (s.10.1.2). Formal testing and review of the security controls shall be performed prior to implementation (s.10.1.3). System design and security features should be treated as [[classified-information|classified information]] (s.10.1.4).

The integrity of an application shall be maintained with appropriate security controls such as a version-control mechanism and **separation of environments** for development, system testing, acceptance testing, and live operation (s.10.1.5). Application development staff and outsource contractors shall **not be permitted to access production information unless necessary** (s.10.1.6). For a system developed and/or maintained by outsource contractors, all involved outsource staff should sign a **Non-Disclosure Agreement** to protect sensitive data in the system (s.10.1.7).

## Policy — configuration and change (DITSP s.10.2)

Change-control procedures for requesting and approving program/system changes shall be documented (s.10.2.1). Changes affecting existing security protection mechanisms shall be carefully considered (s.10.2.2). Installation of all computer equipment and software shall be done under control and audit (s.10.2.3). CSB shall ensure that staff are formally advised of the impact of security changes and usage on Information Systems (s.10.2.4) [M] [A].

## Guidelines — design and companion instruments (DITSP s.18)

Good application design provides a secured environment as well as a workable solution. Owners are responsible for incorporating security requirements in the **early design stage**. If development is outsourced, those requirements **must** be included in the contract and the Service Level Agreements. Owners should seek advice from the [[itmu-security-team|CSB ITMU Security Team]] before laying out the security requirements.

Application developers shall read and understand the major security issues related to system development and maintenance in **IT Security Guidelines [G3] section 10** (OGCIO). This wiki does not wikilink into the G3 wiki. Topics G3 s.10 covers, as listed here:

- System specification and design control
- Programming controls
- Program/system change control
- Program/system testing
- Program cataloguing
- Personnel control
- Web application security

For maintenance organisation, procedures and products, see **Guidelines on System Maintenance Cycle [G22]** (2008 ITG InfoStation / CCGO path under `itsecure/docs/Guidelines/Current/related/g22.pdf`).

## Application data protection (DITSP s.18.1)

Production information — including production source codes, binaries and data — shall not be accessible by application development team members unless necessary. There should be an established procedure for requesting and authorising program/system change. All changes made to the production library shall be authorised and shall be performed by a **control unit or independent coordinator** (example given: a network administrator who does not have access to the application system). Changes to the production library should be properly recorded and reviewed.

**Production data shall never be loaded to a testing/development platform.** The application development team should craft testing data according to the actual environment.

Least privilege and segregation of the development role from live operation are the same principles as on [[03-access-control]], [[least-privilege]] and [[segregation-of-duties]].

## Related

[[information-system-owner]] · [[itmu-security-team]] · [[01-management-outsourcing]] · [[classified-information]] · [[03-access-control]] · [[least-privilege]] · [[segregation-of-duties]] · [[04-data]]
