---
title: Introduction — purpose, scope, and conventions
created: 2026-08-22
updated: 2026-08-22
type: chapter
tags: [chapter, definition, cia, iso, policy]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 1-4, 21
confidence: high
contested: false
---

# Introduction — purpose, scope, and conventions

S17 ss.1–4 open the booklet: what it is, who must read it, where it sits in the government document stack, and how words are used. Contact details for the Digital Policy Office sit at S17 s.21. The 14 ISO-mapped control areas start at [[03-management]]. Force and amendment history sit on [[s17]].

## Section map

| S17 | Topic |
| --- | --- |
| s.1 | Purpose: mandatory minimum for all HKSAR government information systems and data |
| s.2.1 | Applicability; 14 ISO-mapped areas; enhanced measures commensurate with risk |
| s.2.2 | Target audience |
| s.2.3 | Document stack: SR / S17 / G3 / practice guides / departmental policy |
| s.3 | Normative references |
| s.4.1 | Definitions: Tier 1/2/3, CIA, classified information, staff, malware, mobile, removable media, IoT |
| s.4.2 | Shall / should / may |
| s.21 | DPO contact |

## Purpose (S17 s.1)

With Internet services and the general adoption of cloud and mobile computing, the security and survivability of information systems are essential. Increasing dependence on IT for office work and public-service delivery means key systems and data have to be secure and actively protected for the smooth operations of all government bureaux and departments (B/Ds). Public confidence, security, and privacy are fundamental to the effective, efficient, and safe conduct of government business.

This document outlines the **mandatory minimum** security requirements for the protection of **all** HKSAR government information systems and data assets. B/Ds shall develop, document, implement, maintain, and review appropriate security measures by:

- establishing appropriate IT security policy, planning, and governance within the B/D in line with this document, including adopting all frameworks and requirements;
- ensuring appropriate security measures are implemented as detailed in this document;
- ensuring regular review of continuing suitability, adequacy, and effectiveness of the security measures; and
- improving the suitability, adequacy, and effectiveness of the security measures.

The security requirements are **technology-neutral**. They focus on the fundamental objectives and controls to protect information during processing, storage, and transmission.

## Fourteen ISO-mapped areas (S17 s.2.1)

S17 adopts and adapts ISO/IEC 27001:2022 and ISO/IEC 27002:2022. It addresses the mandatory security considerations in these 14 areas:

| Area | S17 | Wiki |
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

This document sets the **minimum**. B/Ds need to apply **enhanced** security measures, appropriate to their circumstances and commensurate with the determined risks. Organisation ([[01-organisation]]) and core principles ([[02-principles]]) sit in front of the 14 areas.

## Target audience (S17 s.2.2)

The policy statements are for **all levels of staff** acting in different roles in B/Ds — management, IT administrators, and general IT end users. It is the responsibility of **ALL staff** to read through the entire document to understand and comply. It is also intended for reference by vendors, contractors, and consultants who provide IT services to the Government.

## Document stack (S17 s.2.3)

The Government has promulgated a set of security regulations and government IT security policy and guidelines to assist B/Ds. B/Ds **shall comply** with the policy requirements in the Security Regulations (SR), S17, and the IT Security Guidelines (G3), and **follow** the implementation guidance in the relevant practice guides. Compare [[compare-documents]].

The relationship of the documents is shown in a **document-relationship diagram** (image in this conversion). Surrounding text, not reconstructed boxes:

| Instrument | Who / what it is |
| --- | --- |
| Security Regulations | Authorised by Security Bureau. Directives on what documents, material, and information need to be classified, and an adequate level of protection for government business (S17 s.2.3.1). |
| Baseline IT Security Policy [S17] | Top-level directive from the Digital Policy Office. Minimum standards of a security specification for all B/Ds; **mandatory** basic rules, with other desirable measures still possible (S17 s.2.3.2). |
| IT Security Guidelines [G3] | Elaborates S17 and sets the implementation standard. B/Ds **shall** comply (S17 s.2.3.2). |
| Practice guides | Supplementary to G3. Guidance on specific areas and emerging threats. Hosted on ITG InfoStation (IT Security Theme Page: `https://itginfo.ccgo.hksarg/content/itsecure/techcorner/practices.shtml`). |
| Departmental IT security policies, procedures and guidelines | B/Ds **shall** formulate their own, based on SR and the Government IT Security Policy and Guidelines (S17 s.2.3.3). |

S17 and G3 together are the Government IT Security Policy and Guidelines. They set minimum standards and give guidance to protect information assets and information systems, with reference to ISO/IEC 27001:2022 and 27002:2022.

## Normative references (S17 s.3)

- Security Regulations (HKSAR Government)
- Civil Service Regulations (Civil Service Bureau)
- ISO/IEC 27001:2022 (25 October 2022)
- ISO/IEC 27002:2022 (15 February 2022)
- GB/T 22239-2019 — Baseline for classified protection of cybersecurity (10 May 2019)
- General Circular No. 6/2024 — Strengthening the Governance and Security of IT Systems (6 August 2024)

## Definitions (S17 s.4.1)

The conversion wraps the heading of s.4.1(a). Reconstructed labels:

| Term | Definition |
| --- | --- |
| **Tier 1 information systems** | A related set of hardware and software organised for the collection, processing, storage, communication, or disposition of information, regardless of the source of funding and project type. |
| **Tier 2 information systems** | Tier 1 systems which are **crucial** to the operations of the Government or society and whose failure or disruption will result in a **serious impact** on government operations or may cause **public turmoil and catastrophes**. |
| **Essential services** | Services that are critical to the functioning and security of a society and its economy. |
| **Tier 3 information systems** | Tier 2 systems which are **directly related** to the provision of the essential service concerned and whose disruption or destruction may cause **serious harm** to the economy, people’s livelihood, public safety, etc. |
| **Confidentiality / Integrity / Availability** | Only authorised persons and systems may know/access, or make changes; the system is accessible and usable upon demand. See [[information-security]]. |
| **IT security policy** | A documented list of management instructions on proper use and management of computer and network resources, to protect those resources and the information stored or processed from unauthorised disclosure, modification, or destruction. |
| **Classified information** | Categories classified in accordance with the Security Regulations. See [[classified-information]]. |
| **Staff** | All personnel employed or whose service is acquired to work for the Government — public officers irrespective of employment period and terms, non-government secondees through employment agencies, and other term-contract services personnel — who may have different accessibility to classified information and different security-vetting requirements. Human-resource security: [[05-human-resource]]. |
| **Data centre / computer room** | Centralised data-processing facility housing systems and related equipment; dedicated room for computer equipment. |
| **Malware** | Programs intended to perform an unauthorised process that will adversely impact CIA. Examples: viruses, worms, Trojan horses, spyware. See [[malware]]. |
| **Mobile devices** | Portable computing and communication devices with storage and processing capability. Examples: portable computers, mobile phones, tablets, digital cameras, audio/video recorders. |
| **Removable media** | Portable electronic storage (magnetic, optical, flash) that can be inserted into and removed from a computing device. Examples: external HDD/SSD, floppy disks, zip drives, optical disks, tapes, memory cards, flash drives, similar USB storage. |
| **IoT devices** | Devices with network connectivity and computing capabilities that function autonomously to interact with the physical environment by sensing or actuation. |

Tiers in use: [[classified-protection]], [[compare-tiers]].

## Shall / should / may (S17 s.4.2)

| Word | Force |
| --- | --- |
| **Shall** | A mandatory requirement. |
| **Should** | A best practice, which should be implemented whenever possible. |
| **May** | A desirable best practice. |

Worked examples: [[compare-shall-should-may]].

## Contact (S17 s.21)

Produced and maintained by [[dpo|DPO]]. Comments: `it_security@digitalpolicy.gov.hk`; Lotus Notes `IT Security Team/DPO/HKSARG@DPO`; CMMP `IT Security Team/DPO`.

## Related

[[s17]] · [[information-security]] · [[classified-protection]] · [[compare-documents]] · [[compare-shall-should-may]] · [[dpo]]
