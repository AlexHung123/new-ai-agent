---
title: Information security
created: 2026-08-22
updated: 2026-08-22
type: concept
tags: [definition, cia, iso]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 1, 2.1, 2.3, 4.1, 4.2, 6, 7.2
confidence: high
contested: false
---

# Information security

S17 outlines the **mandatory minimum** security requirements for the protection of all HKSAR government information systems and data assets. B/Ds shall develop, document, implement, maintain, and review appropriate measures; they shall also apply **enhanced** measures commensurate with determined risks (S17 ss.1, 2.1). The document is technology-neutral. Target audience is all staff acting in any role in a B/D, plus vendors, contractors, and consultants who provide IT services to the Government (S17 s.2.2). See [[compare-documents]] and [[compare-shall-should-may]].

## CIA triad (S17 s.4.1)

| Term | Definition |
| --- | --- |
| **Confidentiality** | Only authorised persons and information systems are allowed to know or gain access to the information stored or processed by information systems in any aspect. |
| **Integrity** | Only authorised persons and information systems are allowed to make changes to the information stored or processed by information systems in any aspect. |
| **Availability** | The information system is accessible and usable upon demand by authorised persons and information systems. |

The same three objectives are restated as a core principle: security policies and measures shall be developed and implemented according to Confidentiality, Integrity, and Availability (S17 s.6). Security measures shall consider information while it is processed, in transit, and in storage.

## Shall / should / may (S17 s.4.2)

| Word | Force |
| --- | --- |
| **Shall** | A mandatory requirement. |
| **Should** | A best practice, which should be implemented whenever possible. |
| **May** | A desirable best practice. |

Worked examples: [[compare-shall-should-may]]. G3 may raise neighbouring *shoulds* for Tier 2/3; those extras are not in this file.

## ISO overlay and fourteen areas

S17 adopts and adapts ISO/IEC 27001:2022 and ISO/IEC 27002:2022 (S17 s.2.1; normative references s.3). It also cites GB/T 22239-2019 (classified protection of cybersecurity), Security Regulations, Civil Service Regulations, and General Circular No. 6/2024.

Fourteen security areas (S17 ss.7–20): management responsibilities; IT security policies; human resource security; asset management; access control; cryptography; physical and environmental security; operations security; communications security; system acquisition, development and maintenance; outsourcing security; security incident management; IT security aspects of business continuity; compliance.

“IT security policy” is defined as a documented list of management instructions on proper use and management of computer and network resources, to protect those resources and the information stored or processed from unauthorised disclosure, modifications, or destruction (S17 s.4.1(h)).

## Information system versus Tier 1

The conversion wraps the heading of S17 s.4.1(a). Reconstructed: a **Tier 1 information system** is “a related set of hardware and software organised for the collection, processing, storage, communication, or disposition of information, regardless of the source of funding and project type.” That is S17’s definition of an information system. Every government information system is at least Tier 1. Classifications of **all** systems shall be assessed, documented, and endorsed by the Head of B/D or an explicitly delegated directorate officer (S17 s.7.2.2). Detail: [[classified-protection]], [[compare-tiers]].

Core principles that sit on top of CIA: risk-based approach; [[security-by-design]]; prevention / detection / response / recovery; protection in process, transit, and storage; assumption of insecurity about external systems; resilience for crucial systems; auditability and accountability; continual improvement (S17 s.6).

## Related

[[classified-protection]] · [[compare-shall-should-may]] · [[compare-documents]] · [[compare-tiers]] · [[security-by-design]] · [[00-introduction]] · [[02-principles]]
