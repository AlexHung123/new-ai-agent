---
title: Contingency management
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, contingency]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 6.3, 14.3
confidence: high
contested: false
---

# Contingency management

DITSP ss.6.3 and 14.3: document, test, and tie disaster recovery to the business continuity plan. **BCP is out of scope** of this booklet. Hub: [[01-management]]. Concept page: [[disaster-recovery]]. Physical handling of backup media, including the CSB HQ / Q9 off-site table, is on [[02-physical]] (s.15.2.2). Backup generations live on [[04-data-backup]].

## Section map

| DITSP | Topic |
| --- | --- |
| 6.3.1 | Emergency-response and DR plans for mission-critical systems: documented, tested, tied to BCP |
| 14.3 | IT contingency planning; BCP vs DRP; BCP beyond this document |
| 14.3.1 | DRP contents, alternate site, drills; Disaster Recovery Centre pointer |

## Policy (DITSP s.6.3)

Tagged **[M] [A]**. Plans for emergency response and disaster recovery of **mission-critical** Information Systems **shall** be fully documented, regularly tested, and tied in with the Business Continuity Plan (s.6.3.1).

## BCP versus DRP (DITSP s.14.3)

Systems are vulnerable to disruptions from mild (short power outage, disk failure) to severe (equipment destruction, fire, natural disaster). Management, operational, and technical controls can reduce many of those risks; they cannot eliminate all of them.

CSB should develop an **IT contingency plan** so mission-critical processes and systems can continue after a disastrous disruption. IT contingency planning means **interim measures** to recover IT services after an emergency or system disruption — relocating systems and operations to an alternate site, recovering with alternate equipment, or performing IT services by manual methods.

| Plan | Focus | In DITSP? |
| --- | --- | --- |
| **Business Continuity Plan (BCP)** | Sustaining the organisation’s **critical business processes** during and after a disruption. System owners on the business side assess criticality, run a business-impact assessment, identify recovery-time objectives, and define minimum service levels. BCP says how critical functions operate with **minimal IT support**. | **Beyond the scope** of this booklet |
| **Disaster Recovery Plan (DRP)** | Detailed procedures to recover **IT capabilities** | s.14.3.1 |

## Disaster recovery planning (DITSP s.14.3.1)

A DRP deals with a disaster to a system and/or its primary site in which systems and data are **totally lost**. It should include a detailed **backup** procedure and a **recovery** procedure to an **alternate site**. Assume the primary site may be unavailable for a prolonged period, and that the alternate site will not run at optimal performance (degradation may be offset by manual procedures).

The plan should include a recovery strategy with detailed, **well-tested** procedures for data recovery and verification. Tests exist to raise confidence in accuracy and effectiveness: define what is tested, how, and the expected result. Prepare the materials and documents needed to recover data. Arrange telecommunication services at the alternate site in advance. Include the procedure to **resume data back to the primary site** once it is restored.

[[information-system-owner|Information System Owners]] should decide whether the DRP for their system is adequate. Keep it updated, especially when the primary-site system changes. A scheduled disaster-recovery drill is a good test; because a drill is time-consuming and may affect normal operations, IS Owners determine **frequency** from their business environment.

**Disaster Recovery Centre (DRC).** Critical applications can use the DRC as their disaster recovery centre. The booklet points to the *Disaster Recovery Centre User Guide* on ITG InfoStation / CCGO (2008 URLs; the CCGO line is truncated in this conversion). Treat that pointer as historical.

Off-site backup media (distance from the main site, who may enter the library, CSB HQ ↔ Q9 / OLD / CSTDI shuttle): [[02-physical]] and [[04-data-backup]]. Do not treat those physical rules as a substitute for a DRP.

## Related

[[disaster-recovery]] · [[information-system-owner]] · [[02-physical]] · [[04-data-backup]] · [[01-management]] · [[01-management-outsourcing]]
