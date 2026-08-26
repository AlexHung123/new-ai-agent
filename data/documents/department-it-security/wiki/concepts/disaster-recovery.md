---
title: Disaster recovery
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [contingency, backup]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 6.3, 9.2, 14.3, 15.2.2, 17.2
confidence: high
contested: false
---

# Disaster recovery

Plans for emergency response and disaster recovery of **mission-critical** Information Systems shall be fully documented, regularly tested, and tied in with the Business Continuity Plan (DITSP s.6.3.1) [M] [A]. Guidelines: s.14.3 (BCP vs DRP) and s.15.2.2 / s.17.2 (off-site media and generations). Hubs: [[01-management-contingency]], [[04-data-backup]].

Disruptions range from a short power cut to fire or site loss. Management, operational, and technical controls reduce risk; they cannot eliminate it (s.14.3).

## BCP versus DRP (s.14.3)

| | Business Continuity Plan (BCP) | Disaster Recovery Plan (DRP) |
| --- | --- | --- |
| **Focus** | Sustaining the organisation’s **critical business processes** during and after a disruption | Recovering **IT capabilities** when a system and/or its primary site is lost |
| **Who drives it** | System owners on the business side: criticality, business impact, recovery-time objectives, minimum service levels | IT recovery: backup procedure, restore to an alternate site, network at that site, fail-back to the primary site |
| **In this booklet?** | BCP is **beyond the scope** of DITSP (s.14.3) | Elaborated in s.14.3.1 |

IT contingency planning is the interim measure: relocate systems, recover on alternate equipment, or fall back to manual methods (s.14.3).

## What a DRP contains (s.14.3.1)

A DRP deals with total loss of the system and/or primary site. It should include detailed backup and recovery to an **alternate site**, on the assumption that the primary site may be unavailable for a prolonged period and that the alternate site **will not run at optimal performance** (manual procedures may fill the gap).

Required pieces: a recovery strategy; detailed, **well-tested** procedures for data recovery and verification (define what is tested, how, and the expected result); materials and documents needed to recover; telecommunications at the alternate site arranged in advance; procedure to **resume data back to the primary site** when it is restored.

[[information-system-owner|Information System Owners]] judge whether their DRP is adequate, keep it current when the primary system changes, and set **drill frequency** against their business environment. Drills test accuracy and effectiveness; they are time-consuming and may affect operations, so owners choose how often.

**Disaster Recovery Centre (DRC).** Critical applications can use the DRC as their recovery centre. The 2008 pointer is the *Disaster Recovery Centre User Guide* on ITG InfoStation / CCGO — treat the URL as a snapshot.

## Off-site media shuttle (s.15.2.2)

Backup media with business-essential or mission-critical information shall be sited a safe distance from the main site (s.7.1.3, s.9.2.4). CSB’s 2008 off-site arrangement:

| Main site | Off-site location | Frequency |
| --- | --- | --- |
| CSB HQ | Q9 | 2 weeks |
| Q9 | CSB HQ | 2 weeks |
| OLD | CSB HQ | 2 weeks |
| CSTDI / SCSD | CSB HQ | 2 weeks |

Access via a Backup Operator as far as possible; operators, programmers, and contractors should not have free access to the media library ([[segregation-of-duties]]). Log movements in and out. Do not leave the computer room with media unless permitted. Carrying cases: shockproof, heatproof, water-resistant, able to withstand magnetic interference. Classified media at CONFIDENTIAL or above: handle strictly under SR; queries to the Departmental or Government Security Officer.

## Generations (s.17.2.1)

Backup and recovery procedures shall be documented, implemented, and tested periodically; backups at regular intervals; activities reviewed (s.9.2.1–9.2.3).

**Grandfather-father-son:** keep two sets — the last and the last-but-one — together with the current operational copy of data and programs, plus the updates needed to bring backups current. **At least three generations.** If backups are daily, it may be easier to retain six or seven (e.g. Monday’s copy kept until the following Monday). Month-end and year-end copies may be kept longer.

Each CSB site has a backup server for the site’s servers (s.17.2.3). This is a 2008 operational snapshot; confirm live shuttle and DRC use before relying on the table.

## Related

[[01-management-contingency]] · [[04-data-backup]] · [[information-system-owner]] · [[segregation-of-duties]]
