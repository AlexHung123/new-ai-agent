---
title: Contingency, disaster recovery and resilience
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, continuity, backup, policy, guideline]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 19
confidence: high
contested: false
---

# Contingency, disaster recovery and resilience

G3 s.19: availability of information systems, with security considerations **embedded** in disaster-recovery plans. Concept: [[disaster-recovery]]. Extra floors for higher-tier systems: [[classified-protection]] and [[annex-classified-protection]].

## Section map

| G3 | Topic |
| --- | --- |
| 19.1(a) | Contingency vs BCP vs DRP; assess security at the alternate site |
| 19.1(b) | DRP contents: backup, alternate site, degraded performance, contacts, tested recovery, failback |
| 19.1(c) | Plan security in the DRP; if no DRP, assume the **same** security requirements as normal |
| 19.2 | Resilience to meet availability; test failover; do not trade away integrity/confidentiality |

## Contingency, BCP and DRP (s.19.1(a))

**IT contingency planning** means **interim measures** to recover information systems and IT services after an emergency or disruption — relocating systems and operations to an **alternate site**, recovering with alternate equipment, or performing IT services by **manual methods**. Document the IT contingency plan and test it regularly. **Assess security risks at the business-continuity or alternate work site** so classified government data remains protected.

| Plan | Focus |
| --- | --- |
| **Business Continuity Plan (BCP)** | Sustaining the organisation’s **critical business processes** during and after a disruption. System owners on the business side assess criticality, conduct business-impact assessments, identify **RTO** and **RPO**, and define minimum service levels. |
| **Disaster Recovery Plan (DRP)** | Detailed procedures to recover **IT capabilities**. |

## Disaster recovery planning (s.19.1(b))

A DRP deals with a disaster to an information system and/or its primary site in which systems and data are **totally lost**. It should include:

- A detailed **backup** procedure
- A **recovery** procedure to an **alternate site**
- Assumption that the primary site may be unavailable for a **prolonged** period and that the alternate site will **not** run at optimal performance (degradation may be offset by manual procedures)
- Clear **responsibilities**, named persons for each function, and **contact** information
- A recovery strategy with **detailed, well-tested** procedures for data recovery and **verification** — define what is tested, how, and the expected result
- Materials and documents needed to recover data; telecommunication services at the alternate site arranged **in advance**
- A procedure to **fail back** data to the primary site once it is restored

Keep the DRP updated, especially when the primary-site system changes. A scheduled disaster-recovery drill tests accuracy and effectiveness; because a drill is time-consuming and may affect operations, B/Ds set frequency from their business environment.

## IT security continuity (s.19.1(c))

B/Ds **shall plan, implement, and regularly review** disaster recovery plans to ensure **adequate security measures under such situations**. Define roles, information-security requirements, and the **continuity of information security** in the DRP.

**If there is no disaster-recovery or contingency plan**, B/Ds should **assume that information-security requirements remain the same** as under normal operational conditions.

## Resilience (s.19.2)

Identify business requirements for **availability**. Implement **resilience sufficient to meet** those requirements. If the existing architecture cannot guarantee availability, consider resilient IT services and facilities. **Test** resilient systems so **component failover works as intended**.

When designing resilient systems, **address the risk to integrity or confidentiality** of associated information — do not buy availability by weakening those properties.

Appendix C raises this for higher tiers: Tier 2 **shall** have a documented, regularly tested IT contingency plan tied to the BCP; Tier 3 **shall** implement sufficient resilience for essential services and **test** it regularly ([[annex-classified-protection]]).

## Related links

[[disaster-recovery]] · [[classified-protection]] · [[annex-classified-protection]] · [[10-operations]] · [[14-incident]] · [[classified-information]]
