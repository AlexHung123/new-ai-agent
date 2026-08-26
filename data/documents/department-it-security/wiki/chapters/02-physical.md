---
title: Physical security
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, physical, classification]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 7, 15
confidence: high
contested: false
---

# Physical security

DITSP ss.7 and 15: data rooms, equipment, visitors, fire, and disposal of kit. Classification of the system in the room drives the physical standard ([[classified-information]], [[compare-classification-controls]]). Backup *generations* are on [[04-data-backup]]; this page keeps the **physical** media rules, including the CSB off-site table (s.15.2.2).

## Section map

| DITSP | Topic |
| --- | --- |
| 7.1 / 15.1 | Site and data-room environment; Level II / III |
| 7.2 / 15.2.1 | Equipment; laptops not left unattended |
| 7.1.3, 15.2.2 | Off-site backup media |
| 15.2.3 | Disposal / reuse of computers |
| 7.3 / 15.3 | Authorised list, visitors escorted, screens, lock offices |
| 15.4.1 | Fire fighting |

## Environment and data rooms (DITSP ss.7.1, 15.1)

Careful site selection and accommodation planning for a purpose-built computer installation **shall** be conducted; use the security specifications for construction of a special installation or office as the standard (s.7.1.1). Data centres and computer rooms **shall** have good physical security and strong protection from disaster and other threats, to minimise loss and disruption (s.7.1.2).

**Classification of the room (s.7.1.4).** Data centres and computer rooms **shall** conform to **Level II** security if the system handles **CONFIDENTIAL** information, and to **Level III** for **TOP SECRET / SECRET**. Footnote bodies for those Level II / III citations are **missing** from this conversion — do not reconstruct the definitions here; use Security Regulations / Security Bureau physical standards (including the RESTRICTED *Guidelines for Security Provisions in Government Office Buildings* cited at s.15.1). Queries on classified media: [[dso|Departmental Security Officer]] or [[government-security-officer]].

Site preparation should cover (s.15.1):

| Aspect | Recommended safeguards |
| --- | --- |
| Power | UPS, surge protector (usually with the UPS), backup generator |
| Air conditioning / ventilation | **24-hour** air-conditioner; temperature and humidity detectors |
| Fire | Sprinkler, portable extinguisher, fire / smoke detector |
| Water / flood | Waterproof cabinet, water detector |
| Physical entry | Locked cabinet, door lock, electronic access card, visitor log, CCTV |

Detail: [[ogcio|OGCIO]] *Data Centre Site Preparation Guidelines* [G36] and *LAN Site Preparation Guidelines* [G41].

## Equipment (DITSP ss.7.2, 15.2.1)

All Information Systems **shall** sit in a secure environment or be attended, to prevent unauthorised access (s.7.2.1). Staff with laptops, portable computers, PDAs, or other mobile devices for business **shall** safeguard them and **shall not leave the equipment unattended** without proper security measures (s.7.2.2). IT equipment **shall not** be taken off-site without proper control (s.7.2.3).

For non-fixture kit (laptops, mobile devices), CSB should keep an **authorised equipment list** and check inventory periodically. Staff taking kit off-site should not leave it unattended in public places (s.15.2.1).

## Backup media (DITSP ss.7.1.3, 15.2.2)

Backup media holding business-essential or mission-critical information **shall** be sited at a **safe distance** from the main site so a disaster there does not destroy the copies (s.7.1.3). Store them at a secure remote location. Access should be via a **Backup Operator** as far as possible; operators, programmers, and contractors should not have free access to the media library or off-site room in normal circumstances.

CSB off-site shuttle (s.15.2.2):

| Main site | Off-site location | Frequency |
| --- | --- | --- |
| CSB HQ | Q9 | 2 weeks |
| Q9 | CSB HQ | 2 weeks |
| OLD | CSB HQ | 2 weeks |
| CSTDI / SCSD | CSB HQ | 2 weeks |

Log movement in and out of a library or off-site store. Staff should not leave the computer room with media unless permission is granted. Mark vacant rack slots so loss is visible; inventory periodically. Carrying cases for transport must be shockproof, heatproof, water-resistant, and able to withstand magnetic interference. An external media library should have the same fireproof rating as the computer room; a fireproof safe for vital media should meet the standard for magnetic media. Remove write-permit rings from tapes on the racks so a tape cannot be erased if mounted by accident.

Media containing classified information — the conversion’s phrase “or any grading higher than ‘CONFIDENTIAL” is incomplete; **verify against printed DITSP** — must be handled under Security Regulations. See also [[disaster-recovery]] and [[04-data-backup]].

## Disposal (DITSP s.15.2.3)

Before disposal or reuse: check whether [[classified-information]] was processed or kept (if in doubt, assume it was); use appropriate **secure deletion** software to erase it; CSB should maintain checks and balances that the deletion completed. Destruction, overwriting, or reformatting of media must be approved and done with appropriate facilities; procedures must comply with SR. Detail: DITSP s.17.7 ([[04-data]]) and SR Chapter IX FAQ (2008 ITG InfoStation / CCGO pointer).

## Physical access (DITSP ss.7.3, 15.3)

Keep an **up-to-date, periodically reviewed list** of persons authorised to enter data centres, computer rooms, or other areas supporting critical activities (s.7.3.1). [[itmu-security-team|CSB ITMU]] maintains the authorised list for computer rooms (s.15.3).

**Visitors shall be monitored at all times** by an authorised Government staff member (s.7.3.3). They must not enter the computer room unless **accompanied** by authorised staff. Keep a **visitor log** (who, when, why) (s.15.3).

Physically secure access keys, cards, and passwords for computer systems and networks, or apply well-defined, strictly enforced procedures (s.7.3.2). Identify protected areas with conspicuous warning notices. The passage between computer room and data-control office, if any, should not be publicly accessible. Lock protected areas and check them periodically (bolting, cipher, electronic, or biometric door locks are listed as acceptable examples) (s.15.3).

Safekeeping of classified materials must follow Security Regulations. Examples in DITSP: TOP SECRET documents in a combination-lock safe inside a strong room; SECRET documents in a combination-lock safe, or a steel cabinet with locking bar and padlock, inside a strong room (s.15.3).

**Workstations.** Automatic protection (password-protected screensaver, keyboard lock) should activate after a predefined idle period; alternatively terminate the logon session. Switch the workstation off before leaving for the day or a long idle period, if appropriate (s.7.3.4). Staff with personal offices that open from a public area and contain an Information System should **lock the doors** when the office is not in use (s.7.3.5). Position display screens so that unauthorised persons cannot readily view [[classified-information]] (s.7.3.6).

## Fire fighting (DITSP s.15.4.1)

Organise a fire-fighting party on each operating shift with defined responsibilities. Regular fire drills **must** be carried out. Operators who are not in the party must be taught to operate detection/prevention systems and portable extinguishers. Keep hazardous or combustible materials at a safe distance; do not store bulk stationery in the computer room. Place hand-held extinguishers at strategic locations, tag them for inspection, and inspect at least annually.

## Related

[[classified-information]] · [[disaster-recovery]] · [[04-data-backup]] · [[government-security-officer]] · [[itmu-security-team]] · [[01-management-contingency]]
