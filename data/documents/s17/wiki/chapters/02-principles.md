---
title: Core security principles
created: 2026-08-22
updated: 2026-08-22
type: chapter
tags: [chapter, principle, cia, security-by-design]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 6
confidence: high
contested: false
---

# Core security principles

S17 s.6 introduces generally accepted principles that address information security from a high-level viewpoint. They are fundamental and rarely change. B/Ds **shall** observe them when developing, implementing, and understanding security policies. The list is “by no means exhaustive.” CIA as definitions: [[information-security]].

## The principles

**Information system security objectives.** Goals are described in terms of three overall objectives: Confidentiality, Integrity, and Availability. Security policies and measures **shall** be developed and implemented according to these objectives.

**Risk-based approach.** A risk-based approach **shall** be adopted to identify, prioritise, and address the security risks of information systems in a consistent and effective manner. Proper security measures **shall** be implemented according to the classified protection of IT security in S17 s.7.2 to protect information assets and systems and mitigate security risks to an acceptable level. See [[classified-protection]] and [[security-risk-assessment]].

**Security by design.** Security by design **shall** be adopted to incorporate security requirements into the system development lifecycle (SDLC), ensuring that information systems and applications are implemented with appropriate security and data-protection measures. Security **shall** be considered and introduced throughout all phases of the development process in order to minimise rework. See [[security-by-design]] and [[12-development]].

**Prevent, detect, respond, and recover.** Information security is a combination of preventive, detective, response, and recovery measures. Preventive measures avoid or deter an undesirable event. Detective measures identify it. Response measures are coordinated actions to contain damage when an incident occurs. Recovery measures restore CIA to the expected state. Incident path: [[incident-handling]]. Continuity: [[disaster-recovery]].

**Protection while processed, in transit, and in storage.** Security measures **shall** be considered and implemented as appropriate to preserve CIA of information while it is being processed, in transit, and in storage. Example given: wireless communication without protection is vulnerable; security measures **shall** be adopted when transmitting classified information. See [[encryption]], [[wireless-security]], [[classified-information]].

**External systems are assumed to be insecure.** In general, an external system **shall** be assumed to be insecure. When B/Ds’ information assets or information systems connect with external systems, B/Ds **shall** implement security measures, using either physical or logical means, according to the business requirements and the associated risk levels. See [[11-communications]] and [[outsourcing-security]].

**Resilience for crucial information systems.** All crucial information systems **shall** be resilient to stand against major disruptive events, with measures in place to detect disruption, minimise damage, and rapidly respond and recover. Damage containment **shall** be considered in the resilience plan and implemented as appropriate, to limit the scope, magnitude, and impact of an incident for effective recovery. See [[15-continuity]].

**Auditability and accountability.** Security **shall** require auditability and accountability. Auditability is the ability to verify activities in an information system (audit trails, system logs, alarms, or other notifications). Accountability is the ability to audit the actions of all parties and processes which interact with information systems. Roles and responsibilities **shall** be clearly defined, identified, and authorised at a level commensurate with the sensitivity of information. B/Ds **shall** keep records to evidence compliance with security requirements and support audits of effective implementation. See [[10-operations]] and [[16-compliance]].

**Continual improvement.** To be responsive and adaptive to changing environments and technologies, a continual improvement process **shall** be implemented for monitoring, reviewing, and improving the effectiveness and efficiency of IT security management. Performance of security measures **shall** be evaluated periodically to determine whether IT security objectives are met.

## Related

[[information-security]] · [[classified-protection]] · [[security-by-design]] · [[encryption]] · [[incident-handling]] · [[disaster-recovery]] · [[03-management]]
