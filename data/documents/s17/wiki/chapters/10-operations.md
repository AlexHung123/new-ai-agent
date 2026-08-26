---
title: Operations security — least functionality, malware, backup, logging, vulnerability
created: 2026-08-22
updated: 2026-08-22
type: chapter
tags: [chapter, malware, backup, logging, vulnerability, patch, threat, change]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 14
confidence: high
contested: false
---

# Operations security — least functionality, malware, backup, logging, vulnerability

S17 s.14: B/Ds **shall** ensure secure operations of information systems, protect the information systems from malware, log IT processes and events, monitor suspicious activities, and prevent exploitation of technical vulnerabilities. Depth: [[malware]], [[patch-management]], [[vulnerability-management]].

## Section map

| S17 | Topic |
| --- | --- |
| s.14.1 | Least functionality; changes affecting security; documented procedures |
| s.14.2 | [[malware]] protection, updates, unknown media, user duties, downloads |
| s.14.3 | Backup policy, review, restoration tests, off-site disconnected copy |
| s.14.4 | Logging policy, retention, no user-profiling except approved audit, NTP |
| s.14.5 | Controlled installation; change control |
| s.14.6 | Vulnerability management; risk-based [[patch-management]]; authorised software |
| s.14.7 | Threat identification, detection, monitoring; log integrity |

## Operational procedures (S17 s.14.1)

B/Ds **shall** manage information systems using the principle of **least functionality** with all unnecessary services or components removed or restricted (s.14.1.1). See [[least-privilege]]. Changes affecting existing security protection mechanisms **shall** be carefully considered (s.14.1.2). Operational and administrative procedures for information systems **shall** be properly documented, followed, and reviewed periodically (s.14.1.3).

## Protection from malware (S17 s.14.2)

Anti-malware protection **shall** be enabled on all local-area-network servers, personal computers, mobile devices, and computers connecting to the government internal network via a remote-access channel (s.14.2.1). B/Ds **shall** protect their information systems from malware. Malware definitions, as well as their detection and repair engines, **shall** be updated regularly and whenever necessary (s.14.2.2).

Storage media and files from unknown source or origin **shall not** be used unless the storage media and files have been checked and cleaned for malware (s.14.2.3). Users **shall not** intentionally write, generate, copy, propagate, execute, or involve in introducing malware (s.14.2.4). Computers and networks **shall** only run software that comes from trustworthy sources (s.14.2.5).

B/Ds **should** consider the value versus inconvenience of implementing technologies to block non-business websites (s.14.2.6). All software and files downloaded from the Internet **shall** be screened and verified with an anti-malware solution (s.14.2.7). Staff **should not** execute mobile code or software downloaded from the Internet unless the code is from a known and trusted source (s.14.2.8).

## Backup (S17 s.14.3)

Backups **shall** be carried out at regular intervals (s.14.3.1). B/Ds **shall** establish and implement backup and recovery policies for their information systems (s.14.3.2). Backup activities **shall** be reviewed regularly. Backup restoration tests **shall** be conducted regularly. The frequency of backup reviews and restoration tests **shall** be defined and documented (s.14.3.3).

Backup media **should** also be protected against unauthorised access, misuse, or corruption (s.14.3.4). Backup media containing **business essential and/or crucial** information **shall** be sited at a **safe distance** from the main site in order to avoid damage arising from a disaster at the main site. A copy which is **disconnected from information systems** **shall** be stored in order to avoid corruption of backup data when an information system is compromised (s.14.3.5). See [[disaster-recovery]].

## Logging (S17 s.14.4)

B/Ds **shall** define and document policies relating to the logging of activities of information systems under their control (including the retention period) according to the business needs and data classification (s.14.4.1). Any log kept **shall** provide sufficient information to support comprehensive audits of the effectiveness of and compliance with security measures (s.14.4.2). Logs **shall** be retained for a period commensurate with their usefulness as an audit tool. During this period, such logs **shall** be secured such that they cannot be modified and can only be read by authorised persons (s.14.4.3).

Logs **shall not** be used to profile the activity of a particular user unless it relates to a necessary audit activity as **approved by a directorate officer** (s.14.4.4). The clocks of information systems **shall** be synchronised to a trusted time source (s.14.4.5).

IT Security Administrators maintain and review audit logs but **should not tamper with or change** any audit log (S17 s.5.3.1). Incident tracing: [[14-incident]] s.18.1.2.

## Control of operational environment (S17 s.14.5)

Installation of all computer equipment and software **shall** be done under control and audit (s.14.5.1). Changes to information systems **shall** be controlled by the use of change-control procedures. Change records **shall** be maintained to keep track of the applied changes (s.14.5.2). Development change control: [[12-development]] s.16.2.5.

## Technical vulnerability management (S17 s.14.6)

B/Ds **shall** implement [[vulnerability-management]] processes, which include identifying, evaluating, mitigating, and tracking of vulnerabilities of their information systems (s.14.6.1).

Depending on the risk level, B/Ds **shall** determine the appropriate [[patch-management]] strategy, including patch checking and patching frequency. B/Ds **shall** adopt a risk-based approach to determine the patching schedule of each vulnerability by considering its potential impact and the possibility of being exploited. All servers and related devices deployed in **Internet-facing** information systems **shall** be subject to **stringent** patch management (s.14.6.2).

B/Ds **shall** protect their information systems from known vulnerabilities by applying the latest security patches recommended by the product vendors according to the patch-management strategy, or implementing other compensating security measures (s.14.6.3). Before security patches are applied, proper risk evaluation and testing **should** be conducted to minimise the undesirable effects on the information systems (s.14.6.4).

No unauthorised application software **shall** be loaded onto a government information system without prior approval from the officer as designated by the B/D (s.14.6.5).

## IT security threat management (S17 s.14.7)

B/Ds **shall** establish a threat identification, detection, and monitoring mechanism and review the mechanism regularly to ensure its effectiveness concerning the nature of information systems and technology advancements (s.14.7.1). Regular checking on log records, especially on systems/applications where classified information is processed/stored, **shall** be performed, not only on the completeness but also the **integrity** of the log records. All system and application errors which are suspected to be triggered as a result of security breaches **shall** be reported and logged (s.14.7.2). See [[incident-handling]].

## Related

[[malware]] · [[patch-management]] · [[vulnerability-management]] · [[least-privilege]] · [[disaster-recovery]] · [[classified-information]] · [[14-incident]] · [[12-development]]
