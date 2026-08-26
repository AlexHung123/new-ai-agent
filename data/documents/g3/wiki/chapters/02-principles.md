---
title: Core security principles
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, principle, cia, security-by-design]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 6
confidence: high
contested: false
---

# Core security principles

G3 s.6 states generally accepted, high-level principles that rarely change. B/Ds **shall** observe them when developing, implementing, and understanding security policies. The list is **not exhaustive**. Detail on CIA sits on [[information-security]]; design practice on [[security-by-design]]; tiered controls on [[classified-protection]]; recovery on [[disaster-recovery]].

## Section map

| Principle | G3 s.6 block |
| --- | --- |
| Information system security objectives (CIA) | first |
| Risk-based approach | second |
| Security-by-design approach | third |
| Prevention, detection, response and recovery (including protection while processed, in transit, and in storage) | fourth |
| Assumption of insecurity about external systems | fifth |
| Resilience for crucial information systems | sixth |
| Auditability and accountability | seventh |
| Continual improvement | eighth |

The conversion glues “Protection of Information while being Processed, in Transit, and in Storage” to the PDRR block. Treat it as part of that principle, not a ninth heading.

## Information system security objectives

[[information-security|Information system security]] objectives are described as three overall goals: **Confidentiality, Integrity, and Availability**. Security policies and measures **shall** be developed and implemented according to these objectives. They guide standards, procedures, and controls in all aspects of security design and solutions.

In short: only **authorised users** shall be allowed to know, gain access, change, or delete information stored or processed by the system. The system **shall** also be accessible and usable upon demand by authorised users.

## Risk-based approach

A **risk-based approach shall** be adopted to identify, prioritise, and address security risks of information systems in a consistent and effective manner. Proper measures **shall** be implemented according to [[classified-protection|classified protection of IT security]] (G3 s.7.2(b)) to protect assets and systems and mitigate risks to an acceptable level.

Risk assessment and risk treatment can sit inside project, vulnerability, incident, or problem management, or be run ad hoc for a specific topic.

**Risk assessment** involves: (a) establishing and maintaining risk-acceptance criteria and criteria for performing the assessment; (b) identifying risk owners and risks associated with loss of CIA; (c) analysing risks by impact and likelihood; (d) evaluating risks against the criteria and prioritising them for treatment.

**Risk treatment shall** select appropriate options and the controls needed to implement them. The process **shall** ensure all necessary controls are included, formulate a risk treatment plan, and obtain the **risk owner’s** approval of the plan and acceptance of residual information security risks. A risk owner is responsible for assessment, management, and monitoring of an identified risk, and for implementing selected controls.

## Security-by-design approach

The [[security-by-design]] approach **shall** be adopted to incorporate security requirements into the SDLC, so systems and applications are implemented with appropriate security and data-protection measures. Security **shall** be considered and introduced throughout **all phases** of development to minimise rework.

The approach seeks to minimise vulnerabilities and reduce the attack surface by designing and building security in every SDLC phase: security specifications in the design, continuous security evaluation at each phase, and adherence to best practices. For IT security it addresses protection throughout the lifecycle, including design to strengthen **IT resiliency**. B/Ds **shall** adopt it **as far as possible**.

## Prevention, detection, response and recovery

Information security is a combination of preventive, detective, response, and recovery measures:

| Kind | Meaning |
| --- | --- |
| Preventive | Avoid or deter an undesirable event |
| Detective | Identify that an undesirable event has occurred |
| Response | Coordinated actions to contain damage when an incident occurs |
| Recovery | Restore CIA of information systems to their expected state |

Prevention is the first line of defence. Proper protection reduces incident risk. When those safeguards are defeated, B/Ds **shall** be able to detect rapidly and respond quickly to contain damage. Systems and data **shall** be recovered in a timely manner. B/Ds **shall** designate appropriate personnel to manage IT security and plan for information security incident handling ([[14-incident]]).

**Protection while processed, in transit, and in storage.** Security measures **shall** be considered and implemented as appropriate to preserve CIA of information while it is being processed, in transit, and in storage. Example given: unprotected wireless communication is vulnerable; measures **shall** be adopted when transmitting [[classified-information|classified information]]. When formulating measures, B/Ds **shall** assess the risk of unauthorised modification, destruction or disclosure, and denial of access, in different states. (A conversion footnote is attached to this sentence; its body is missing.)

## Assumption of insecurity about external systems

In general, an **external system shall be assumed to be insecure**. When B/D information assets or systems connect with external systems, B/Ds **shall** implement security measures, by physical or logical means, according to business requirements and associated risk levels.

External systems may not have been designed, developed, and maintained to government security requirements. B/Ds **shall** consider **multi-level defence** on those connections. Treat data received from an external system, including user input, as a potential source of attack. Systems **shall** be partitioned or segregated accordingly, and different access controls and levels of protection **should** be applied commensurate with the required security level.

## Resilience for crucial information systems

All **crucial** information systems **shall** be resilient against major disruptive events, with measures to detect disruption, minimise damage, and rapidly respond and recover. **Damage containment** shall be considered in the resilience plan and implemented as appropriate, to limit scope, magnitude, and impact for effective recovery.

Damage containment means controls that limit the impact of a security incident. Resilience is the ability to continue to operate under adverse conditions or stress — even in a degraded or debilitated state — while maintaining essential operational capabilities, and to recover to an effective operational posture in a time frame consistent with business needs. Continuity and DR: [[disaster-recovery]], [[15-continuity]].

## Auditability and accountability

Security **shall** require auditability and accountability.

| Term | Meaning |
| --- | --- |
| Auditability | Ability to verify activities in an information system. Evidence may be audit trails, system logs, alarms, or other notifications. Helps reconstruct behavioural history and investigate incidents |
| Accountability | Ability to audit the actions of all parties and processes that interact with information systems. Often by uniquely identifying an individual so activities can be traced |

Roles and responsibilities **shall** be clearly defined, identified, and authorised at a level commensurate with the sensitivity of information.

## Continual improvement

To stay responsive and adaptive, a **continual improvement** process **shall** be implemented for monitoring, reviewing, and improving the effectiveness and efficiency of IT security management. Performance of security measures **shall** be evaluated periodically against IT security objectives.

B/Ds **shall** identify the information security processes and controls to be monitored and measured, and determine methods for monitoring, measuring, and evaluating results. Regular reviews **shall** be performed on security measures for continuing suitability, adequacy, and effectiveness. Review output **shall** include decisions on continual-improvement opportunities and any need for changes.

## Related

[[information-security]] · [[security-by-design]] · [[classified-protection]] · [[disaster-recovery]] · [[03-management]] · [[12-development]] · [[14-incident]] · [[15-continuity]]
