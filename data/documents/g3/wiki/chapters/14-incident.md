---
title: Incident monitoring, reporting clocks and response plan
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, incident, procedure, policy, guideline]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 18
confidence: high
contested: false
---

# Incident monitoring, reporting clocks and response plan

G3 s.18: a consistent, effective approach to information-security incidents. Concept: [[incident-handling]]. Team: [[isirt]]. Government-wide recording: [[giro]]. GC 6/2024 overlay via [[ditso]] or PPIC. (Footnote 7 on PCPD is **not** in this conversion.)

## Section map

| G3 | Topic |
| --- | --- |
| 18.1(a) | Monitoring mix |
| 18.1(b) | Documented reporting; ISIRT Commander only authority to share; 60 min / 48 h; post-incident clocks; GC 6/2024 |
| 18.1(c) | Response plan contents; review ≥ every 2 years; drills ≥ every 2 years (preferably annually); two 7×24 contacts |
| 18.1(d) | Training; DPO-designated drills |
| 18.1(e) | Need-to-know disclosure; do not publicise methods/locations |

## Monitoring (s.18.1(a))

Implement a sufficient level of incident monitoring and detection for normal operation **and** potential incidents. Depth depends on importance, sensitivity and function. Typical mix:

- Firewall plus authentication and access control
- Intrusion-detection tools
- Anti-malware / malware detection and repair
- Periodic scanning against policy (gap analysis)
- Content filtering of email and web
- System and network audit logging
- Scripts for suspicious activity, integrity and log analysis

## Reporting (s.18.1(b))

A reporting procedure **shall** be established and **documented**: steps, parties, and comprehensive contacts (office / non-office / mobile, email, fax). Advice from the GIRO Standing Office is welcome on suspected abnormalities.

The procedure should have a clear point of contact, simple well-defined steps, publication to concerned staff, a standard reporting form, and (if needed) a separate non-office-hours path. Disclose incident information **only on a need-to-know basis**. **Only the ISIRT Commander** has the authority to share, or authorise others to share, information about security incidents.

**Upon becoming aware** of an information security incident — a reasonable degree of certainty that an event has harmed CIA of government systems or data, or compromised their operations — the departmental ISIRT **shall**:

| Clock | Action |
| --- | --- |
| **60 minutes** | Report to the **GIRO Standing Office by phone** |
| **48 hours** | Submit the completed **Preliminary Information Security Incident Reporting Form** |
| When available | If the incident involves **critical e-government services**, has **significant** security implications, or **might attract media**: type/scope/damage/impact; containment and rectification actions; line-to-take; media enquiries and suggested responses |
| **Daily** | Recovery updates for affected **critical e-government** services until resumed |
| As it happens | Notify GIRO of any report to **HKPF**, **PCPD**, or **media organisations** |

A **post-incident report** should go to GIRO **no later than one week** after the incident is resolved. If investigation will take longer, the departmental ISIRT **shall** submit interim reports:

- **First interim ≤ 14 days** after the incident was first reported
- Then **every three months** until the case is closed

**General Circular No. 6/2024.** If the **Director of Bureau** considers an IT security incident has **embarrassed the Government** or undermined the image of its monitoring role: the **Project Person-In-Charge (PPIC)** (Specified IT System) or the **DITSO** (all other systems) **shall** submit an **initial** government IT security incident report to the Director of Bureau **within two calendar days** from onset, then a **full** report in **seven calendar days**. The full report, with recommended follow-up and Director of Bureau endorsement, **shall** go to [[dpo|DPO]] for record, monitoring and technical advice. Refer to the circular and its thematic site; this wiki does not reconstruct the circular.

## Response plan (s.18.1(c))

A security incident response plan **shall** be established and documented, covering at least:

- Structure of the incident response team and roles
- Reporting procedures as in s.18.1(b)
- Mitigating impact, preserving evidence, investigating cause and impact
- Recovery plan
- Communication plan with stakeholders and the public
- Post-incident review procedures

**Review** the plan **at least once every two years**, or on any **material change** in the operating environment. Make it known to all staff including management. **Test and update** regularly. **Drills shall** be conducted **at least once every two years, preferably annually**; incident-response team members **shall** participate.

Record all incidents, actions and results throughout (system events/audit logs; actions with date, time and personnel; external correspondence with date, time, content and parties). An incident reference number may be assigned.

B/Ds **shall appoint two 7×24 contact points** for emergency IT-security calls, capable of handling incidents or relaying messages in time.

Companion: *Practice Guide for Information Security Incident Handling* (ITG InfoStation).

## Training and disclosure (s.18.1(d–e))

Staff **shall** observe the plan. Organise handling drills regularly. B/Ds **shall** also participate in security drills **designated by DPO**. Train operation and support staff on precautions.

Staff **shall not** disclose information about individuals, B/Ds or specific systems that have suffered computer crime or abuse, or the **specific methods** used to exploit vulnerabilities, to anyone other than those handling the incident, those responsible for the security of those systems, or authorised investigators. Publicising methods, physical location or operating system may invite copy-cat intrusion and may affect Police forensic and prosecution processes.

## Related links

[[isirt]] · [[giro]] · [[ditso]] · [[incident-handling]] · [[dpo]] · [[govcert]] · [[10-operations-logging]]
