---
title: Appendix A — Extracts from the Security Regulations
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, appendix, classification, encryption, physical]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: Appendix A
confidence: high
contested: false
---

# Appendix A — Extracts from the Security Regulations

DITSP Appendix A is an **extract**, not the full Security Regulations (Volume 5). Live SR outranks this 2008 snapshot. DITSP s.17.1 points here for Chapters III, IV and IX. Handling table: [[04-data]], [[compare-classification-controls]], [[classified-information]].

OCR in the conversion (reconstructed in this page; verify against printed SR / DITSP): “collect dail” (SR 227), “must not b used” (SR 377), “should also b dealt” (SR 382). Also “Officers ar personally” (SR 372).

**Cited in this extract but not printed here** (do not invent the text): SR 194, 195, 196, 197 (removable-media safekeeping), SR 331, 333, 334 (investigation / compromise). The extract skips from 161 to 198, 198 to 210, 210 to 227, 227 to 350.

## Chapter III — Four classifications (SR 160–161)

SR 160: TOP SECRET, SECRET, CONFIDENTIAL, RESTRICTED.

| Class | Unauthorised disclosure would | Properly used for (SR 161) |
| --- | --- | --- |
| **TOP SECRET** | Cause **exceptionally grave damage** to the HKSAR Government or the Central People’s Government | (i) plans for the defence of vital strategic areas; (ii) key information about major scientific and technical developments of vital defence significance; (iii) information relating to vital international negotiations; (iv) other information of vital importance to defence and intelligence |
| **SECRET** | Cause **serious injury** to the interests of the HKSAR Government or the CPG | (i) vital military information relating to important defence establishments and installations; (ii) information provided by intelligence sources; (iii) information about the supply of vital strategic materials; (iv) major Government proposals whose premature disclosure would defeat their effectiveness and thereby cause serious injury |
| **CONFIDENTIAL** | Be **prejudicial** to the interests of the HKSAR Government or the CPG | (i) political, economic and military reports of some delicacy; (ii) briefs and reports on delicate or sensitive negotiations; (iii) civil contingency planning only where disclosure would prejudice effective implementation; (iv) certain Government proposals, draft bills and other legislative instruments whose premature disclosure would defeat their effectiveness |
| **RESTRICTED** | Be **undesirable** in the interests of the HKSAR Government (CPG not in this definition) | Information that needs some protection but not a higher class. In many departments, adequate for the bulk of documents requiring protection. (i) routine reports of little value to any other country; (ii) documents and correspondence on the award of Government contracts during tender or consultants-selection stage, and sensitive contract dispute / litigation / claims; (iii) matters relating to an individual (staff reports; personal data in a tax return or travel-document application). **Remark:** depending on the personal data, a higher classification and measures may be required to comply with Principle 4 in Schedule 1 to the Personal Data (Privacy) Ordinance (Cap. 486) |

### RESTRICTED suffixes (SR 161)

| Suffix | Use |
| --- | --- |
| **RESTRICTED (ADMIN)** | Administrative plans and proposals; only staff handling those matters |
| **RESTRICTED (APPOINTMENT)** | Actual or potential appointments to public boards and committees, before announcement |
| **RESTRICTED (MEDICAL)** | Personal medical reports and material relating to them |
| **RESTRICTED (STAFF)** | References to named or identifiable officers which should not be seen by them; or personal confidences entrusted by staff to management, which there is a duty to report and protect |
| **RESTRICTED (TENDER)** | Tenders under consideration and the terms of tenders accepted |
| **RESTRICTED (CONTRACT)** | Sensitive communications leading to the award of consultancy agreements and the settlement of contract claims and disputes |

## Chapter IV — Documents, copying, waste (SR 198, 210, 227)

| SR | Rule |
| --- | --- |
| **198** | Materials or things used to record, or which have a record of, classified information **must be treated as classified documents**. Examples: shorthand notebooks, carbon papers, typewriter ribbons, stencils, cylinders, disks, tapes, cartridges, wires, flash memory devices |
| **210** | Access to photocopying, duplicating, filming, word processing and facsimile equipment must be strictly controlled. Immobilise outside working hours and when not attended by a designated officer, by locking the power supply or the room |
| **227** | Classified waste (documents no longer required, and materials used to produce them) is destroyed by **burning or shredding**. If a shredder is available, material suitable for shredding is disposed of **daily**. Material for burning is collected **daily** (OCR: “collect dail”) and stored under secure conditions appropriate to the **highest** grade stored. In line with government green policy and the closing of incinerator facilities, burning is not the method unless in a very exceptional case |

## Chapter IX — Information systems (SR 350–383)

### Definitions (SR 350)

| Term | Meaning |
| --- | --- |
| **Information System** | Electronic system that processes data electronically through IT, including computer systems, servers, workstations, terminals, storage media, communication devices and network resources |
| **Hard drive** | A hard drive designed or intended to be used permanently, installed inside the computer casing during use |
| **Key** | A code used in respect of classified information for (i) authentication, (ii) decryption, or (iii) generation of a digital signature |

Logical access control and the [[encryption]] method and procedures must comply with requirements specified from time to time by [[ogcio|OGCIO]]. Logical access control is access control other than physical; physical control may still use digital means (smart cards, biometrics). Physical-access requirements are specified by the [[government-security-officer]] of the Security Bureau (SR 350).

### Storage, processing, transmission by class

| Control | TOP SECRET / SECRET (351–357) | CONFIDENTIAL (358–365) | RESTRICTED (366–369) |
| --- | --- | --- | --- |
| **Encrypt in storage** | Mandatory during storage **and** transmission (351) | Stored information must be encrypted (358) | *(not in this extract; DITSP s.17.1 table: recommended)* |
| **Removable media when unattended / not in use** | Keep per SR **194 and 195** (352(a)) | Keep per SR **196** (359(a)) | Keep per SR **197** (366(a)) |
| **Stand-alone portable/desktop HD** | Attended, **or** physically secure environment **approved by the Government Security Officer** (352(b)) | Attended, or a physically secure environment (359(b)) | Attended, or locked room or cabinet — stand-alone **or networked** portable/desktop, or server (366(b)) |
| **Networked local HD** | Isolated LAN approved by GSO, technical endorsement of OGCIO (352(c)) | Attended, or physically secure environment (359(c)) | Same as 366(b) |
| **Server HD** | Isolated LAN, GSO + OGCIO, room **Level 3 Security** (352(d)) | Room **Level 2 Security**, or a location GSO considers equivalent or satisfactory (359(d)) | Same as 366(b) |
| **Shared access (persons)** | On 352(b)–(c): prohibited except among persons authorised to see **all** information stored (353) | Same pattern on 359(b)–(c) (360) | *(not in this extract)* |
| **Shared access (tracking)** | On 352(b)–(d): prohibited unless all activity on TS/SECRET is tracked by audit trail and logical access control software (354) | Same on 359(b)–(d) (361) | *(not in this extract)* |
| **Logical access control** | Required for any IS on which or through which TS/SECRET may be accessed (355) | Required for CONFIDENTIAL (362) | *(not in this extract)* |
| **Processing** | Only on an IS that complies with 352(b)–(d), 354 and 355 (356) | Only 359(b)–(d), 361 and 362 (363) | Only 366(b) (367) |
| **Transmission** | Must **not** be transmitted from a 352(b) computer, or outside the isolated LAN under 352(c) or (d) (357) | Encrypt over an **un-trusted** network — e.g. general-purpose LAN, leased or public telecom, wireless (364) | Same encryption-in-transit rule (368) |
| **Email** | *(covered by 357: no exit from stand-alone / isolated LAN)* | Only on an IS approved by GSO subject to OGCIO technical endorsement (365) | Same email-system rule (369) |

CSB’s departmental network is a general-purpose LAN (un-trusted). See [[encryption]] and [[compare-classification-controls]].

### Keys (SR 370–372)

| SR | Rule |
| --- | --- |
| **370** | A key has the **same classification** as the classified information in respect of which it is used |
| **371** | Keys used for **CONFIDENTIAL or above** must be stored **separately** from the corresponding encrypted information |
| **372** | Safeguard at all times. Keys on Information Systems must be properly controlled and protected. For keys issued to individual officers (e.g. smartcards, floppy disks), the officer is **personally responsible** for safe custody and must prevent theft or copying. If a key has been left unattended and there is reason to believe an unauthorised person had access, it is **assumed compromised**. Report the facts to the Departmental IT Security Officer (in this booklet: [[ditso|Division DITSO]]), who arranges immediate replacement and advises the [[government-security-officer]]. Officers are personally responsible for any costs arising from loss, damage or possible compromise of keys in their custody |

### Classification reminder (SR 373–376)

| SR | Rule |
| --- | --- |
| **373** | Users given access to classified information on Information Systems should be alerted to the type(s) they are accessing or about to access |
| **374** | The **Subject** field of a classified electronic mail document must include the classification category |
| **375** | Removable media storing classified information must have clearly legible identification and conspicuous classification markings on labels fixed firmly to them **and** on their protective containers |
| **376** | Removable media that store a **key** and are **not** used for backup need not have the classification marked on a fixed label |

### Destruction of IS classified information (SR 377–378)

All classified information shall be **completely cleared** from media before disposal or re-use. Any method that only temporarily erases the information or allows alternative recovery **must not be used** (OCR: “must not b used”) (377). If it cannot be completely cleared, the media unit must be **physically destroyed** so as to prevent recovery (378).

### Physical (SR 379–380)

Access to every office, computer room or work area where an Information System containing classified information is located shall be physically restricted (379). Display screens on which classified information can be viewed shall be positioned so that unauthorised persons cannot readily view them (380).

### Breaches of security on Information Systems (SR 381–383)

In addition to Chapter VIII breaches, IS breaches may be (381):

- **Losses** — Information Systems that process or store classified information are missing, or there is reason to believe an IS has been compromised, or destroyed without authorisation.
- **Unavailability** — classified information is not accessible when needed, or is accessible only with undue delay, as a result of unauthorised activities.

Investigate initially in the Bureau or Department with the objectives in SR **331**, following incident-handling requirements specified by [[ogcio|OGCIO]]. Breaches that may involve compromise of classified information should also be dealt with under SR **333 and 334** (OCR: “should also b dealt”) (382). CSB procedure: [[08-incident]].

Examples (383): (a) unauthorised access of classified information on an IS; (b) an IS key or authentication device left unattended where an unauthorised person might access it; (c) tampering of classified information during transmission; (d) loss or apparent loss, temporary or permanent, of a portable computer or any removable media (e.g. compact disks, floppy diskettes) that contain classified information.

## See also

[[annexes]] · [[annex-portable-devices]] · [[classified-information]] · [[compare-classification-controls]] · [[encryption]] · [[04-data]] · [[08-incident]] · [[government-security-officer]] · [[ogcio]]
