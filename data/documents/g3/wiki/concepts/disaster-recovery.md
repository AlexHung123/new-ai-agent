---
title: Disaster recovery
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [continuity]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 6, 19, App C
confidence: high
contested: false
---

# Disaster recovery

B/Ds shall ensure availability of information systems and embed security considerations in disaster recovery plans (G3 s.19). The [[isirt|ISIRT Commander]] triggers the departmental disaster-recovery procedure where appropriate, depending on business impact of an incident (G3 s.5.2.4). See [[15-continuity]] and [[incident-handling]].

## BCP vs DRP vs IT contingency (G3 s.19.1(a)–(b))

**IT contingency planning** means interim measures to recover information systems and IT services after an emergency or disruption: relocate to an alternate site, recover using alternate equipment, or perform services manually. The IT contingency plan should be fully documented and regularly tested. B/Ds should assess security risks at the business-continuity or alternate work site so classified data remains protected.

The two most common contingency-plan types:

| Plan | Focus |
| --- | --- |
| **Business Continuity Plan (BCP)** | Sustaining the organisation’s **critical business processes** during and after a disruption. System owners on the business side assess criticality, conduct business-impact assessments, identify recovery time and recovery point objectives, and define minimum service levels. |
| **Disaster Recovery Plan (DRP)** | Detailed procedures to **recover IT capabilities** when a disaster hits an information system and/or its primary site and systems and data are totally lost. Includes backup procedure, recovery to an alternate site (possibly degraded, supplemented by manual procedures), named responsibilities and contacts, tested data-recovery and verification, telecom arrangements at the alternate site, and a procedure to resume data back to the primary site when it is restored. |

DRP should be maintained when the primary-site system changes. A scheduled disaster-recovery drill tests accuracy and effectiveness; because a drill can be time-consuming, B/Ds determine frequency according to their business environment (G3 s.19.1(b)).

## Security continuity (G3 s.19.1(c))

B/Ds **shall** plan, implement, and regularly review disaster recovery plans to ensure adequate security measures under those situations. They should define roles and responsibilities, information-security requirements, and continuity of information security **in the DRPs**. **In the absence of disaster recovery and contingency plans, B/Ds should assume that information-security requirements remain the same in any situation compared to normal operational conditions.**

## Tier 2 plan SHALL; Tier 3 resilience (Appendix C)

**Tier 2:** an **IT contingency plan shall** be developed to enable sustained execution in a disastrous disruption (e.g. fire, floods) or emergency (e.g. terrorism, mass demonstrations, bomb threats requiring evacuation). Plans for disaster recovery **shall** be fully documented, regularly tested, and tied in with the business continuity plan.

**Tier 3:** **sufficient resilience shall** be implemented to prevent disruption of the essential services provisioned. Resilience **shall** be tested regularly to ensure component failover works as intended.

The body of G3 already says all information systems should be implemented with resilience sufficient to meet identified availability requirements; if architecture cannot guarantee availability, resilient IT services and facilities should be considered; resilient systems should be tested; design must address integrity and confidentiality risk of associated information (G3 s.19.2(a)). Core principle: all **crucial** information systems shall be resilient, with damage containment to limit scope and impact (G3 s.6).

## Related

[[isirt]] · [[incident-handling]] · [[classified-protection]] · [[compare-tiers]] · [[15-continuity]]
