---
title: Segregation of duties
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [access-control, logging, policy]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 6.1.5, 14.1.5, 16.1
confidence: high
contested: false
---

# Segregation of duties

CSB shall apply **sufficient segregation of duties** so that a single individual does not execute **all** security functions of an Information System (DITSP s.6.1.5) [M – IS Owner]. The guideline is the practice: divide the steps of a critical function among different people so one person cannot subvert the process (s.14.1.5).

It sits with [[least-privilege]] as a governing principle of access control (s.16.1). Management hub: [[01-management]]. Logging when split is not practicable: [[03-access-control-logging]].

## What it is trying to stop (s.14.1.5)

The aim is **sufficient** segregation and **clear roles**, so far as possible, so that no one person has authority to run every security function on a system. Roles in the CSB framework already split executive, site, owner, and operator: [[dso]], [[ditso|Division DITSO]], [[information-system-owner|IS Owner]], IT Staff ([[compare-roles]]).

## If a split is not practicable

Where segregation cannot be done — limited staff, technical limits, or similar — **compensating controls** should give an equivalent safeguard (s.14.1.5). The booklet’s example is:

1. **Appropriate logging** of the critical operations the same staff member performs; and
2. **Random inspection or regular review** of that log by **senior management**.

That is a substitute, not a waiver of s.6.1.5. The policy statement remains a **shall**. The guideline tells you what to put in place when the shall cannot be met in the organisational chart.

Logs of classified systems shall at least capture user-IDs, log-in/log-off and key events (including supervisor accounts), configuration and access-right changes, user-account and password changes, and successful and rejected access attempts (s.8.8.2). Logs shall not be used to profile a particular user unless the Division DITSO supports a necessary audit (s.8.8.5). Clock sync keeps those logs usable ([[incident-handling]]).

s.6.1.5 is tagged **[M – IS Owner]**. The Owner documents roles in system procedures (s.14.1.1). IT Staff implement the split; they do not design it away ([[compare-roles]]).

## Related controls that assume a split

- Least privilege and role-based access (s.14.1.6, s.16.1).
- Special privileges restricted and controlled (s.8.5.4).
- Application developers and outsource contractors shall not access production information unless necessary (s.10.1.6).
- Separation of development, system testing, acceptance testing, and live operation (s.10.1.5; [[05-application]]).
- Backup media access via a Backup Operator as far as possible; operators, programmers, and contractors should not have free access to the media library (s.15.2.2; [[disaster-recovery]]).
- Visitor access to computer rooms only when accompanied; CSB ITMU keeps the authorised-personnel list (s.15.3).

## Related

[[least-privilege]] · [[01-management]] · [[03-access-control-logging]] · [[compare-roles]]
