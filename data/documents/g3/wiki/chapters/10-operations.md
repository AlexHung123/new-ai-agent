---
title: Operations — least functionality, change, malware, and backup
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, malware, backup, change]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 14.1-14.3, 14.5
confidence: high
contested: false
---

# Operations — least functionality, change, malware, and backup

G3 s.14 chapeau: B/Ds shall ensure secure operations, protect against malware, record events, monitor suspicious activities, and prevent exploitation of technical vulnerabilities. This hub is **ss.14.1–14.3 and 14.5**. Logs: [[10-operations-logging]]. Vulnerability, patch, authorised software, and threat: [[10-operations-vulnerability]]. Concepts: [[malware]], [[least-privilege]], [[disaster-recovery]].

## Section map

| G3 | Topic |
| --- | --- |
| 14.1(a) | Least functionality — disable unused ports/protocols |
| 14.1(b), 14.5(b) | Change management |
| 14.1(c)–(d) | Documented ops procedures; baseline configs; capacity plan |
| 14.2 | Malware — users, administrators, detection/recovery, content filtering |
| 14.3 | Backup, generations, disconnected copy, off-site transport (v10.2) |
| 14.5(a) | Installation only by authorised staff |

## Least functionality (G3 s.14.1(a))

Information systems should provide only essential capabilities and specifically prohibit or restrict unused functions, ports, protocols, and/or services. Review functions and services for elimination. Administrators should disable unused physical and logical ports and protocols (USB, FTP, SSH, and similar) to prevent unauthorised device connection, information transfer, or tunnelling. **Least functionality and [[least-privilege]] shall both** be adopted when hardening systems, assigning resources and privileges, and accessing networks or network services.

## Change management (G3 ss.14.1(b), 14.5(b))

Changes affecting existing security mechanisms **shall** be carefully considered. Operational systems and application software should be under strict change control: identify and record significant changes; plan and test; assess potential impacts including security; formal approval; communicate details to relevant parties; fallback (abort and recover from unsuccessful changes and unforeseen events); and an **emergency change process** for quick, controlled implementation to resolve an incident.

Changes to facilities, information systems, and business and security processes that affect IT security **shall** be controlled. Define procedures and roles; maintain change records. Development, testing, and [[disaster-recovery]] environments should also have adequate change control (G3 s.14.5(b)).

## Procedures, baseline, capacity (G3 s.14.1(c)–(d))

Operational and administrative procedures **shall** be documented, followed, maintained, reviewed regularly, and made available to users who need them. Document start-up and shut-down, backup, equipment maintenance, media handling, computer-room management, and similar. B/Ds should develop, maintain, and regularly review **baseline configuration** of their information systems.

Monitor resource use. Identify capacity from business requirements. A capacity-management plan should outline monitoring, analysis, and adjustment over time so infrastructure can handle current and planned workloads; budgeting staff should take the plan into account.

## Malware — users (G3 s.14.2(a))

Users should run malware detection and recovery on workstations and mobile devices. They **shall** regularly update malware definitions and detection/repair engines. Updates should be **automatic, at least daily**. If automatic updates are not possible (mobile devices not often on networks), update **manually at least once a week**. In an ad-hoc outbreak, follow instructions and update immediately.

Enable **real-time detection** of active processes, executables, and document files; schedule full-system scans to operational needs. Check storage media and network files before use; avoid opening suspicious messages and un-trusted URL links; check attachments and downloads before use. Before installing software, verify integrity (for example checksum) and obtain **prior approval from the officer designated by the B/D** for any executable, including those received by message or download. Boot from the primary hard disk; do not boot from removable devices without permission. Do not use unknown-origin media or files unless checked and cleaned. Back up per G3 s.14.3(a). Users **shall not** intentionally write, generate, copy, propagate, execute, or introduce malware.

## Malware — administrators (G3 s.14.2(b))

LAN/system administrators **shall** ensure servers, workstations, and mobile devices have malware detection and recovery. Definition updates should be automatic and at least daily; if not possible, manual at least weekly and whenever necessary. Prefer **enterprise management**. Enable anti-malware on all LAN servers, PCs, mobile devices, and computers connecting via remote access; scan **all incoming Internet traffic** at the gateway (stop, quarantine/drop, and log). Apply the same considerations to development and test kit. **Full-system scan** staff, contractor, or outsourced machines **before** they connect to government networks. Request vendors to scan with latest definitions after new install, maintenance, or software install.

Server practice: boot from the primary hard drive; scan removable media before any boot from it; application directories read-only; write/modify on need-to-have under [[least-privilege]]; consider a document-management solution for shared documents; scan newly installed software before public release; preferably full-system scan immediately after file-server start-up. Subscribe to advisories; **disseminate promptly the security alert issued by DPO** to all end users; educate users that the apparent sender of infected mail can be forged.

## Detection, recovery, content filtering (G3 s.14.2(c)–(d))

Symptoms: programs slower than usual; sudden drop in memory or disk; unknown files/programs/processes; pop-ups or ads; abnormal restart/shutdown; rise in network use. If infection is suspected: **stop all activity**, report immediately to management and the LAN/system administrator. Inform [[ditso|DITSO]] if needed to distinguish a security event from an incident. The **DPO Central Computer Centre Helpdesk** (`ccc_hd@digitalpolicy.gov.hk`) can assist. Cleaning does not restore deleted files — restore from original copies / backup. After removal, perform a **complete scan** of the computer and other storage media so malware does not resurrect.

Content filtering: consider blocking non-business sites. A **whitelist** of allowed websites is a strong method; a **blacklist** (or a vendor categorisation database) is the alternative. Research a solution that fits business needs.

## Backup (G3 s.14.3)

B/Ds **shall** back up at regular intervals and establish backup and recovery policies. Users should back up workstations, mobile devices, and removable media; frequency follows impact of loss of availability. **Backup restoration tests shall** be conducted regularly; frequency of reviews and tests **shall** be defined and documented.

Keep copies of all operational data; take them regularly enough to recover to the most up-to-date state; review backup activity; test effectiveness in real-life situations, combining media, tools, procedures, and restoration time. Server backup software should be server-based and allow unattended off-hours scheduling. Store copies at a safe location remote from the systems ([[disaster-recovery]]). Store software updates needed for recovery together with the data backup.

Use a **grandfather-father-son** scheme so the last and last-but-one copies sit with the current operational copy (and the updates to bring backups current). Keep **at least three generations**; if daily backups are taken it may be easier to retain six or seven. Test media periodically. Balance auto tape-changer convenience against off-site turnaround for crucial information.

If external hard-disk recovery is required: prefer on-site service; escort the contractor; sanitise residual data on recovery tools; obtain a non-disclosure agreement; observe outsourcing-security requirements.

**Disconnected copy (G3 s.14.3(b)).** Store a copy **disconnected** from information systems so backup is not corrupted when the production system is compromised. If physical disconnection is not possible, consider logical means: disable the network port; use a tape library with autoloader; or keep a non-updatable backup copy that malware (for example ransomware) cannot access. Label media, write-protect, keep away from magnetic fields and heat. Access only via authorised persons; no unauthorised access to the media library or off-site room.

**Off-site transport (v10.2).** Physical transport of backup media risks theft, loss, and unauthorised access. Where off-site storage is required, B/Ds **should consider secure network data transfer** instead. If physical transport is necessary, assess the risks: secure containers onto escort personnel to maintain constant custody; comprehensive **chain-of-custody** logs; tracking; shock-/heat-/water-proof cases that withstand magnetic interference; **encrypt** the data. Log movement IN/OUT of a library or off-site store. Staff shall not leave the data centre or computer room with media unless permission is granted. Mark vacant rack slots; **periodic inventory checks shall** be conducted.

## Installation (G3 s.14.5(a))

Installation of computer equipment and software **shall only** be done by **authorised staff**, after approval from the system owner or responsible manager, and only if it does not compromise existing security controls. Document and test all changes; maintain an audit trail of installations and upgrades.

## Related

[[malware]] · [[least-privilege]] · [[disaster-recovery]] · [[10-operations-logging]] · [[10-operations-vulnerability]] · [[ditso]]
