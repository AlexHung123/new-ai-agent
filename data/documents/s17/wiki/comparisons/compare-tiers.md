---
title: Compare — system tiers
created: 2026-08-22
updated: 2026-08-22
type: comparison
tags: [comparison, classification]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 4.1, 6, 7.2.2, 13.1.3
confidence: high
contested: false
---

# Compare — system tiers

Every government information system is Tier 1, 2, or 3 **regardless of funding** (S17 s.7.2.2). S17 **defines** the three tiers and requires documented assessment plus Head of B/D (or delegated directorate) endorsement. It does **not** reprint G3 Appendix B/C/D extra *shalls*. Data grade under SR is a different fork ([[classified-information]], [[compare-classification-controls]]). Definitions: [[classified-protection]].

## Definitions and who endorses

| | **Tier 1** | **Tier 2** | **Tier 3** |
| --- | --- | --- | --- |
| **Meaning** | An information system: hardware and software organised for collection, processing, storage, communication, or disposition of information (s.4.1(a), reconstructed). | Tier 1 systems **crucial** to Government or society operations; failure/disruption → **serious impact** on government operations or **public turmoil and catastrophes**. | **Tier 2 +** directly related to an **essential service**; disruption/destruction may cause **serious harm** to the economy, livelihood, public safety, etc. |
| **Controls in this file** | The body of S17 is the mandatory **minimum** for all systems (s.1). B/Ds need to apply **enhanced** measures commensurate with determined risks (s.2.1). | Same S17 floor, plus enhanced measures matching criticality. Core principle: all **crucial** systems **shall** be resilient (s.6). | Same, with essential-service criticality. S17 does not add a separate control table. |
| **Who endorses** | **Head of B/D** or **explicitly delegated directorate officer**. Document the assessment of **all** systems, including infrastructure and departmental shared IT services (s.7.2.2). | Same. | Same. |

**Essential services** (s.4.1(c)): services that are critical to the functioning and security of a society and its economy. S17 does not list sectors.

Physical security of data centres and computer rooms **shall** comply with government requirements according to the classification of the **information system housed** (s.13.1.3). Off-site disconnected backups for **business essential and/or crucial** information: s.14.3.5.

## What S17 does not decide

G3 elaborates implementation and adds Appendix C extras (steering-committee *shall* at Tier 3, 24×7/SIEM, annual SRA, privileged-account MFA, and so on). Those are **not** S17 clauses. When answering “what extra controls does this tier require?”, this wiki can only point at S17’s minimum plus the duty to enhance commensurate with risk. Implementation colour lives in G3.

## Related

[[classified-protection]] · [[classified-information]] · [[disaster-recovery]] · [[03-management]] · [[compare-shall-should-may]] · [[compare-documents]]
