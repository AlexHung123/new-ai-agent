---
title: Backup and recovery
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, backup]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 9.2, 15.2.2, 17.2
confidence: high
contested: false
---

# Backup and recovery

Part II policy (DITSP s.9.2) and Part III guidelines (s.17.2), plus the CSB off-site shuttle in physical guidelines s.15.2.2. Classified handling, encryption and disposal stay on [[04-data]]. Off-site copies are a [[disaster-recovery]] control, not only an operations habit.

## Section map

| DITSP | Topic |
| --- | --- |
| 9.2 | Documented, regular, reviewed backups; remote integrity copies |
| 17.2.1 | General guidelines; generations (grandfather-father-son) |
| 17.2.2 | Devices and media (tape, CD/RW, MO) |
| 17.2.3–17.2.4 | Server backup; workstation local vs copy-to-server |
| 15.2.2 | Backup Operator; CSB off-site table; transport and library |

## Policy (DITSP s.9.2)

Backup and recovery procedures shall be well documented, properly implemented, and tested periodically (s.9.2.1). Backups shall be carried out at regular intervals (s.9.2.2). Backup activities shall be reviewed regularly (s.9.2.3). Integrity copies of backups shall be stored at a remote distance from the system and be protected. Backup media should also be protected against unauthorised access, misuse or corruption during transportation (s.9.2.4).

## Why backup (DITSP s.17.2)

File-system backups protect against hardware failure and accidental deletion, and against unauthorised changes by an intruder: a daily copy makes it easier to revert to the last secured state. Old backups can also show when a system was first penetrated; files an intruder later deleted may still sit on media.

## General guidelines (DITSP s.17.2.1)

- Maintain backup copies of all operational data so they can be reconstructed if destroyed or lost.
- Take copies at regular intervals so recovery to the most up-to-date state is possible.
- Establish backup and recovery procedures and, wherever possible, test their effectiveness in real-life situations.
- Server backup software should be server-based (faster transfer, no extra network traffic) and should allow unattended scheduling in non-office hours.
- Store copies at a safe, secure location remote from the systems so data can be reconstructed elsewhere after a total-site disaster.
- If software updates as well as data copies are needed to recover an application, store the updates (or their backups) together with the data backup.
- Maintain **multiple generations**. A **grandfather-father-son** scheme should be considered so two sets — the last and the last but one — are always kept with the current operational copy; updates needed to bring backups current must be stored with them.
- Keep **at least three** generations. If daily backups are taken it may be easier to retain **six or seven** (e.g. Monday's daily kept until the following Monday). Month-end and year-end copies may be retained longer as required.
- Test magnetic tapes, diskettes or cartridges periodically to ensure they can be restored.
- An auto tape changer lengthens delivery turnaround to off-site storage because tapes are not relocated immediately. Strike a balance between operational convenience and availability, especially for mission-critical information.

## Devices and media (DITSP s.17.2.2)

Named media: floppy diskettes, CD-Recordable/Rewritable, magneto-optical discs, digital data storage tapes. For servers in this environment the most common medium is **tape** (capacity versus cost). A tape magazine or automatic tape changer may be used when a session spans multiple tapes; backup software must have the changer option. Workstation backups are generally smaller; tape remains relatively cheapest for large volumes; most workstation applications also support CD/RW, MO or JAZ.

Clean tape-drive heads regularly (environment and run frequency; some drives signal after a number of runs). Label media, keep them in protective boxes with the write-protect tab in the protect position, keep them away from magnetic/electromagnetic fields and heat, and follow the manufacturer's storage environment.

## Server and workstation backup (DITSP ss.17.2.3–17.2.4)

Because backup plant is expensive, it is more cost-effective to use a centralised backup server with a tape library. **In CSB, each site is equipped with a backup server** to back up all servers at that site (s.17.2.3).

Two workstation mechanisms (s.17.2.4):

1. **Local backup device.** Users back up as often as required, or a scheduler writes to a local device (e.g. tape drive) at intervals.
2. **Central network backup.** Vital workstation data is copied to a server and picked up on the server's regular schedule — by the user or by a scheduler timed to the server job.

## Off-site media (DITSP s.15.2.2)

Backup media containing business-essential and/or mission-critical information should be stored at a secure, safe location remote from the equipment. Access should be via a **Backup Operator** as far as possible. Other staff — including operators, programmers and contractors — should not have free access to the media library or off-site storage room under normal circumstances.

Offline backup media should be moved to remote sites regularly. CSB Divisions' off-site storage arrangement:

| Main site | Off-site location | Frequency |
| --- | --- | --- |
| CSB HQ | Q9 | 2 weeks |
| Q9 | CSB HQ | 2 weeks |
| OLD | CSB HQ | 2 weeks |
| CSTDI / SCSD | CSB HQ | 2 weeks |

Log movement of media in and out of a library or off-site store. Unless permission is granted, staff should not leave the computer room with any media. Mark vacant rack slots so loss is visible; periodic inventory is required.

Transportation to and from off-site must be properly handled. The carrying case should be shockproof, heatproof and water-resistant and able to withstand magnetic interference.

Media containing classified information — the conversion’s phrase “or any grading higher than ‘CONFIDENTIAL” is incomplete; **verify against printed DITSP** — must be handled strictly under the Security Regulations. Queries can go to the Departmental or [[government-security-officer|Government Security Officer]]. Physical handling of the shuttle (cases, fire rating, write-permit rings) is also on [[02-physical]]. See [[classified-information]] and [[04-data]].

The external media library should have the same fireproof rating as the computer room. The fireproof safe for vital media should meet the standard for keeping magnetic media. Remove write-permit rings from tapes on the racks so contents are not erased if a tape is accidentally mounted.

Physical rooms, fire and kit disposal: [[02-physical]].

## Related

[[04-data]] · [[disaster-recovery]] · [[classified-information]] · [[02-physical]] · [[01-management-contingency]] · [[government-security-officer]]
