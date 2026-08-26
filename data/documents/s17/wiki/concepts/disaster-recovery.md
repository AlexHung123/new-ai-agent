---
title: Disaster recovery
created: 2026-08-22
updated: 2026-08-22
type: concept
tags: [continuity, backup]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 5.2.4, 6, 14.3.5, 19
confidence: high
contested: false
---

# Disaster recovery

B/Ds **shall** ensure the availability of information systems and security considerations embedded in disaster recovery plans (S17 s.19). Hub: [[15-continuity]].

S17 does **not** split BCP from DRP. It requires DR plans **with security measures**, and resilience to meet availability requirements.

## DR plans (S17 s.19.1.1)

B/Ds **shall** plan, implement, and **regularly review** disaster recovery plans to ensure adequate security measures under such situations. The [[isirt|ISIRT]] Commander may trigger the departmental disaster-recovery procedure where appropriate, depending on the impact of the incident on business operation (S17 s.5.2.4). See [[incident-handling]].

## Resilience (S17 ss.6, 19.2.1)

B/Ds **shall** ensure adequate resilience to meet the availability requirements of IT services and facilities (s.19.2.1). Core principle: all **crucial** information systems **shall** be resilient to stand against major disruptive events, with measures in place to detect disruption, minimise damage, and rapidly respond and recover. Damage containment **shall** be considered in the resilience plan and implemented as appropriate, to limit the scope, magnitude, and impact of an incident for effective recovery (S17 s.6). “Crucial” tracks [[classified-protection|Tier 2]] language.

## Off-site disconnected backups (S17 s.14.3.5)

Backup media containing **business essential and/or crucial** information **shall** be sited at a **safe distance** from the main site in order to avoid damage arising from a disaster at the main site. A copy which is **disconnected from information systems** **shall** be stored in order to avoid corruption of backup data when an information system is compromised. Backup policy, review, and restoration tests: [[10-operations]] s.14.3.

Physical protection of data centres from disaster: S17 s.13.1.2 ([[09-physical]]).

## Related

[[15-continuity]] · [[classified-protection]] · [[10-operations]] · [[14-incident]] · [[isirt]] · [[09-physical]]
