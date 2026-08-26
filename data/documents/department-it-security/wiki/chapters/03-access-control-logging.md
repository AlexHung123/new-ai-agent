---
title: Logging, audit policy, and system monitoring
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, access-control, logging, audit]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 8.8, 16.4-16.5
confidence: high
contested: false
---

# Logging, audit policy, and system monitoring

Part II policy (DITSP s.8.8) and Part III guidelines (ss.16.4–16.5). Logging follows business need and data classification. Passwords and lockout sit on [[03-access-control-passwords]]; the hub is [[03-access-control]]. Windows rows below are a **2008** snapshot (Windows 2000 Group Policy).

## Section map

| DITSP | Topic |
| --- | --- |
| 8.8.1–8.8.3 | When to log; minimum contents for classified systems; audit usefulness |
| 8.8.4 | Retention and protection of logs |
| 8.8.5 | No user profiling unless [[ditso|Division DITSO]]-supported audit |
| 8.8.6 | Regular completeness and integrity checks |
| 8.8.7 / 16.4 | Clock synchronisation |
| 16.4 | Audit trails, shared-account inventory, SR Chapter IX shared access |
| 16.4.1 | Windows Audit Policy table |
| 16.5 | System-software monitoring; vary the schedule |

## What must be logged (DITSP ss.8.8, 16.4)

Logging of activities shall be conducted according to business needs and data classification (s.8.8.1) [M] [A]. For an IT system where [[classified-information|classified information]] is processed or stored, logs shall at least contain the following wherever technically feasible (s.8.8.2) [M] [A]:

- User IDs
- Dates and times of log-in and log-off and other key events (e.g. use of supervisor accounts)
- Any changes of system configuration and access rights allocated
- Any changes in user accounts and passwords
- Records of successful and rejected system access attempts
- Records of successful and rejected information and resource access attempts

Any log kept shall provide sufficient information to support comprehensive audits of the effectiveness of, and compliance with, security measures (s.8.8.3). [[information-system-owner|Information System Owners]] define audit policies covering, at minimum, successful and unsuccessful log-in attempts, privileged user-ID activity, changes to user access rights, password changes, and modification to software (s.16.4).

For more complicated applications, the application should have its own tracing: operating-system logs may not be fine enough. Self-developed audit trails should focus on failed transactions and unauthorised object access so that volume does not hide irregularities. Transaction logs may include unauthorised update/access, start/end date and time, user identification and sign-on/off for illegal logon, connect session or terminal, and services such as file copying or searching.

## Retention, protection, and profiling (DITSP ss.8.8.4–8.8.6)

Logs shall be retained for a period commensurate with their usefulness as an audit tool. During that period they shall be secured so they cannot be modified and can be read only by authorised persons (s.8.8.4, s.16.4).

Logs **shall not be used to profile** the activity of a particular user unless it relates to a necessary audit activity supported by the Division DITSO (s.8.8.5) [A] [U].

Regular checking of log records — especially on systems or applications where classified information is processed or stored — shall cover completeness **and** integrity. All system and application errors suspected to be triggered by security breaches shall be reported and logged (s.8.8.6) [M] [A] [U]. Irregularities must be reported and investigated if necessary. Manual review of huge trails is impractical; administrators should develop simple log analysers to summarise trends and spot anomalies (s.16.4).

## Shared accounts and CONFIDENTIAL+ (DITSP s.16.4)

If shared accounts are used, the System/Security Administrator should maintain and periodically update an inventory: system name, persons who can share, shared user-ID, permissions, valid period, and reason. The list traces who had shared access at a given time. Shared IDs themselves need Division DITSO approval — see [[03-access-control]].

In accordance with **Security Regulations Chapter IX**, systems containing information classified as **CONFIDENTIAL or above** require a **mandatory audit trail on all shared access** to the data. Audit trail and logging features should be enabled on a standalone PC or workstation when classified data is stored on its hard drive (s.16.4). Compare [[compare-classification-controls]].

## Clock synchronisation (DITSP ss.8.8.7, 16.4)

Clock synchronisation should be configured to keep Information Systems in sync (s.8.8.7). Systems shall synchronise with a trusted time server periodically (**at least once per month**). They should use the GNET clock-synchronisation service, erect a trusted time server, or use the Hong Kong Observatory time server. A trusted timestamp makes event correlation and incident investigation credible.

System time for all machines need not be identical. A deviation within a reasonable limit, **say 5 minutes**, is considered acceptable. Manual or automatic synchronisation (NTP) is possible; authentication in NTP can be considered. 2008 pointers: GNET Network Time Service on ITG InfoStation / CCGO; HKO `http://www.hko.gov.hk/nts/ntimec.htm`.

## Windows Audit Policy (DITSP s.16.4.1)

Recommended security settings for CSB Windows systems (Windows 2000 or above), via Local Security Policy or Domain-level Group Policy:

| Audit Policy | Recommended setting |
| --- | --- |
| Audit account logon events | Success, Failure |
| Audit account management | Success, Failure |
| Audit directory service access | Success, Failure |
| Audit logon events | Success, Failure |
| Audit object access | Success, Failure |
| Audit policy change | Success, Failure |
| Audit privilege use | **No Auditing** |
| Audit process tracking | **No Auditing** |
| Audit system events | Success, Failure |

Most categories are Success, Failure. Privilege use and process tracking are **No Auditing**.

## Security of system software (DITSP s.16.5)

All unauthorised accesses shall be reported. The security violation report should be checked, preferably daily. Tight change control for system software is required.

**Monitor** on a regular basis: system logs (e.g. Windows Event Logs); application logs (web access/error, mail traffic); firewall and IDS/IPS logs; general trend of log volume and growth; general trend of network usage. Clues to unauthorised use include logons outside the account's normal hours, unusual accounting records, a large number of failed logins in a short period, and unexpected processes. Off-line checklists of file ownership and permissions, compared periodically, may show unauthorised modification.

A host-based IDS consults kernel, system, server, network and firewall logs against known-attack signatures and can checksum sensitive files (the 2008 text cites `md5sum` or `sha1sum`). MD5 must not be used in **new** systems — see [[04-data]].

Regular monitoring is not a guarantee. Intruders may disable logging. **Vary the monitoring schedule** and run commands more frequently and at different times of day so actions are hard to predict (s.16.5.3).

## Related

[[03-access-control]] · [[ditso]] · [[information-system-owner]] · [[classified-information]] · [[compare-classification-controls]] · [[04-data]]
