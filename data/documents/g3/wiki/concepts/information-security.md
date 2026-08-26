---
title: Information security
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [definition, cia, iso]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 1, 2.1, 2.3, 4.1, 4.2, 6, 7.2
confidence: high
contested: false
---

# Information security

G3 elaborates Baseline IT Security Policy [S17], sets the implementation standard, and gives implementation guidance. B/Ds shall comply; they may customise measures without lowering the security level (G3 s.1). The document is platform-agnostic. Target audience is all staff acting in any role in a B/D, plus vendors, contractors, and consultants who provide IT services to the Government (G3 s.2.2). See [[compare-documents]] and [[compare-shall-should-may]].

## CIA triad (G3 s.4.1)

| Term | Definition |
| --- | --- |
| **Confidentiality** | Only authorised persons and information systems are allowed to know or gain access to the information stored or processed by information systems in any aspect. |
| **Integrity** | Only authorised persons and information systems are allowed to make changes to the information stored or processed by information systems in any aspect. |
| **Availability** | The information system is accessible and usable upon demand by authorised persons and information systems. |

The same three objectives are restated as a core principle: only authorised users shall be allowed to know, gain access, make changes to, or delete information stored or processed by the system, and the system shall be accessible and usable upon demand (G3 s.6). Security measures shall consider information while it is processed, in transit, and in storage.

## Shall / should / may (G3 s.4.2)

| Word | Force |
| --- | --- |
| **Shall** | A mandatory requirement. |
| **Should** | A best practice, which should be implemented whenever possible. |
| **May** | A desirable best practice. |

[[annex-classified-protection|Appendix C]] turns selected *should* items in the body into *shall* for [[classified-protection|Tier 2 / Tier 3]] systems. Worked examples: [[compare-shall-should-may]].

## ISO overlay and fourteen areas

G3 adopts and adapts ISO/IEC 27001:2022 and ISO/IEC 27002:2022 (G3 s.2.1; normative references s.3). It also cites GB/T 22239-2019 (classified protection of cybersecurity), the HKSARG Interoperability Framework [S18], Security Regulations, S17, and General Circular No. 6/2024.

Fourteen security areas (G3 ss.7–20): management responsibilities; IT security policies; human resource security; asset management; access control; cryptography; physical and environmental security; operations security; communications security; system acquisition, development and maintenance; outsourcing security; security incident management; IT security aspects of business continuity; compliance. These considerations should be taken into account in all SDLC phases; G3 prints a chart of phase-specific highlights (image; caption “Security Considerations Related to Different Phases of System Development Life Cycle”).

## Information system versus Tier 1

The conversion wraps the heading of G3 s.4.1(a). Reconstructed: a **Tier 1 information system** is “a related set of hardware and software organised for the collection, processing, storage, communication, or disposition of information, regardless of the source of funding and project type.” That is G3’s definition of an information system. Every government information system is at least Tier 1. **Ordinary / Tier 1 systems** take the mandatory requirements in the body of G3; Tier 2 and Tier 3 **additionally** take Appendix C (G3 ss.2.3, 7.2(b)). Classifications are assessed at project initiation and endorsed by the Head of B/D or an explicitly delegated directorate officer. Detail: [[classified-protection]], [[compare-tiers]].

Core principles that sit on top of CIA: risk-based approach; [[security-by-design]]; prevention / detection / response / recovery; protection in process, transit, and storage; assumption of insecurity about external systems; resilience for crucial systems; auditability and accountability; continual improvement (G3 s.6).

## Related

[[classified-protection]] · [[compare-shall-should-may]] · [[compare-documents]] · [[compare-tiers]] · [[security-by-design]] · [[00-introduction]] · [[02-principles]]
