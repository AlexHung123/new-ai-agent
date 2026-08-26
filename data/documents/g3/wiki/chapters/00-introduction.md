---
title: Introduction — purpose, scope, and conventions
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, definition, cia, iso, policy]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 1-4, 21
confidence: high
contested: false
---

# Introduction — purpose, scope, and conventions

G3 ss.1–4 open the booklet: what it is, who must read it, where it sits in the government document stack, and how words are used. Contact details for the Digital Policy Office sit at G3 s.21. The 14 ISO-mapped control areas start at [[03-management]]. Force and amendment history sit on [[g3]].

## Section map

| G3 | Topic |
| --- | --- |
| s.1 | Purpose: implementation standard under Baseline IT Security Policy [S17] |
| s.2.1 | Applicability; 14 ISO-mapped areas; SDLC chart (image) |
| s.2.2 | Target audience |
| s.2.3 | Document stack: SR / S17 / G3 / practice guides / departmental policy |
| s.3 | Normative references |
| s.4.1 | Definitions: Tier 1/2/3, CIA, classified information, staff, malware, mobile, removable media, IoT |
| s.4.2 | Shall / should / may |
| s.21 | DPO contact |

## Purpose (G3 s.1)

G3 elaborates the policy requirements in Baseline IT Security Policy [S17], sets the **implementation standard** for those requirements, and gives implementation guidance. Materials are platform-independent. Bureaux and departments (B/Ds) **shall** comply with this guidance to implement security controls that satisfy the relevant requirements. B/Ds **may** customise measures to their circumstances **without prejudice to the security level**.

## Fourteen ISO-mapped areas (G3 s.2.1)

G3 adopts and adapts ISO/IEC 27001:2022 and ISO/IEC 27002:2022. It describes security considerations in these 14 areas:

| Area | G3 | Wiki |
| --- | --- | --- |
| Management responsibilities | s.7 | [[03-management]] |
| IT security policies | s.8 | [[04-policies]] |
| Human resource security | s.9 | [[05-human-resource]] |
| Asset management | s.10 | [[06-assets]] |
| Access control | s.11 | [[07-access-control]] |
| Cryptography | s.12 | [[08-cryptography]] |
| Physical and environmental security | s.13 | [[09-physical]] |
| Operations security | s.14 | [[10-operations]] |
| Communications security | s.15 | [[11-communications]] |
| System acquisition, development and maintenance | s.16 | [[12-development]] |
| Outsourcing security | s.17 | [[13-outsourcing]] |
| Security incident management | s.18 | [[14-incident]] |
| IT security aspects of business continuity management | s.19 | [[15-continuity]] |
| Compliance | s.20 | [[16-compliance]] |

These considerations should be taken into account in **all phases** of the System Development Life Cycle (SDLC). Specific areas that need extra attention in certain phases are highlighted in a chart captioned “Security Considerations Related to Different Phases of System Development Life Cycle”. **That chart is an image** in this conversion; do not invent missing boxes. Organisation ([[01-organisation]]) and core principles ([[02-principles]]) sit in front of the 14 areas.

## Target audience (G3 s.2.2)

The booklet is for **all levels of staff** acting in different roles in B/Ds — management, IT administrators, and general IT end users. **All staff** shall read it, understand it, and comply with it. It is also intended for vendors, contractors, and consultants who provide IT services to the Government.

## Document stack (G3 s.2.3)

B/Ds shall comply with Security Regulations (SR), Baseline IT Security Policy [S17], and G3, and shall follow implementation guidance in the relevant practice guides. Compare [[compare-documents]].

B/Ds shall adopt **all mandatory G3 requirements** for [[classified-protection|Tier 1]] information systems and the more stringent requirements in [[annex-classified-protection|Appendix C]] for Tier 2 and Tier 3, so that controls match the risk level of the system.

The relationship of the documents is shown in a **document-relationship diagram** (image in this conversion). Surrounding text, not reconstructed boxes:

| Instrument | Who / what it is |
| --- | --- |
| Security Regulations | Authorised by Security Bureau. Directives on what documents, material, and information need to be classified, and an adequate level of protection for government business (G3 s.2.3.1). |
| Baseline IT Security Policy [S17] | Top-level directive from the Digital Policy Office. Minimum standards of a security specification for all B/Ds; **mandatory** basic rules, with other desirable measures still possible (G3 s.2.3.2). |
| IT Security Guidelines [G3] | Elaborates S17 and sets the implementation standard. B/Ds **shall** comply (G3 s.2.3.2). |
| Practice guides | Supplementary to G3. Guidance on specific areas and emerging threats. Examples named in s.2.3.2: Internet Gateway Security; IT Security Risk Management; IT Security Threat Management; Security Risk Assessment & Audit; Information Security Incident Handling. Hosted on ITG InfoStation (IT Security Theme Page). |
| Departmental IT security policies, procedures and guidelines | B/Ds **shall** formulate their own, based on SR and the Government IT Security Policy and Guidelines (G3 s.2.3.3). |

S17 and G3 together are the Government IT Security Policy and Guidelines. They set minimum standards and give guidance to protect information assets and information systems, with reference to ISO/IEC 27001:2022 and 27002:2022.

## Normative references (G3 s.3)

- Security Regulations (HKSAR Government)
- Baseline IT Security Policy [S17]
- ISO/IEC 27001:2022 (25 October 2022) — information security management systems — requirements
- ISO/IEC 27002:2022 (15 February 2022) — information security controls
- GB/T 22239-2019 (10 May 2019) — information security technology — baseline for classified protection of cybersecurity
- The HKSARG Interoperability Framework [S18]
- General Circular No. 6/2024 — Strengthening the Governance and Security of IT Systems (6 August 2024)

Cite GC 6/2024 where G3 points to it; do not reconstruct the circular’s full text. It overlays Specified IT Systems, PPIC incident reports, and additional pre-rollout tests.

## Definitions (G3 s.4.1)

The conversion wraps the first definition as “Information A related set…”. Reconstruct as **Tier 1 Information Systems**.

| Term | Meaning |
| --- | --- |
| [[classified-protection\|Tier 1]] information systems | A related set of hardware and software organised for the collection, processing, storage, communication, or disposition of information, regardless of source of funding and project type |
| Tier 2 information systems | Tier 1 systems that are crucial to the operations of the Government or society, and whose failure or disruption will result in a serious impact on government operations or may cause public turmoil and catastrophes |
| Essential services | Services that are critical to the functioning and security of a society and its economy |
| Tier 3 information systems | Tier 2 systems that are directly related to the provision of the essential service concerned, and whose disruption or destruction may cause serious harm to the economy, people’s livelihood, public safety, etc. |
| Confidentiality | Only authorised persons and information systems may know or gain access to the information stored or processed |
| Integrity | Only authorised persons and information systems may change the information stored or processed |
| Availability | The information system is accessible and usable upon demand by authorised persons and information systems |
| IT security policy | Documented management instructions on proper use and management of computer and network resources, to protect those resources and the information stored or processed from unauthorised disclosure, modification, or destruction |
| [[classified-information\|Classified information]] | Categories of information classified in accordance with the Security Regulations |
| Staff | All personnel employed or whose service is acquired to work for the Government: public officers irrespective of period and terms, non-government secondees through employment agencies, and other term-contract personnel, etc. Accessibility to classified information and security vetting differ. Human-resource rules: S17 s.9 and [[05-human-resource]] |
| Data centre | Centralised data-processing facility that houses information systems and related equipment |
| Computer room | Dedicated room for housing computer equipment |
| [[malware\|Malware]] | Programs intended to perform an unauthorised process that will adversely affect CIA. Examples: computer viruses, worms, Trojan horses, spyware |
| Mobile devices | Portable computing and communication devices with storage and processing capability. Examples: portable computers, mobile phones, tablets, digital cameras, audio or video recording devices |
| Removable media | Portable electronic storage media (magnetic, optical, flash) that can be inserted into and removed from a computing device. Examples: external HDD/SSD, floppy disks, zip drives, optical disks, tapes, memory cards, flash drives, similar USB storage |
| Internet of Things (IoT) devices | Devices with network connectivity and computing capability that function autonomously to interact with the physical environment by sensing or actuation |

CIA together is the overlay for [[information-security]]. Tiering is [[classified-protection]].

## Conventions (G3 s.4.2)

| Word | Force |
| --- | --- |
| **Shall** | Mandatory requirement |
| **Should** | Best practice; implement whenever possible |
| **May** | Desirable best practice |

Compare [[compare-shall-should-may]].

## Contact (G3 s.21)

G3 is produced and maintained by the Digital Policy Office. Comments or suggestions:

| Channel | Address |
| --- | --- |
| Email | it_security@digitalpolicy.gov.hk |
| Lotus Notes mail | IT Security Team/DPO/HKSARG@DPO |
| CMMP email | IT Security Team/DPO |

Lotus Notes remains a listed contact path in the April 2025 (v10.2) snapshot.

## Related

[[compare-documents]] · [[classified-protection]] · [[information-security]] · [[compare-shall-should-may]] · [[01-organisation]] · [[03-management]] · [[g3]]
