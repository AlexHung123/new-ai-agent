---
title: Asset management
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, classification, encryption, procedure]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 10
confidence: high
contested: false
---

# Asset management

G3 s.10 is the asset hub: inventory (including system classifications and Internet-facing services), protection of system information, return of assets, classification and labelling, encryption at rest for RESTRICTED and above, media handling, and erasure. Encryption methods: [[encryption]]. Data grades: [[classified-information]]. Data classification is an [[information-owner|Information Owner]] duty (G3 s.5.3.2).

## Section map

| G3 | Topic |
| --- | --- |
| s.10 intro | Protect hardware, software, and information assets |
| s.10.1(a) | Inventory; DITSO Internet-facing inventory |
| s.10.1(b) | Do not disclose nature, location, or controls except need-to-know authorised by DITSO; NDA |
| s.10.1(c) | Return of assets on exit |
| s.10.2(a) | Classification and labelling (email subject; removable media) |
| s.10.2(b) | Overall data confidentiality; encrypt stored RESTRICTED+ |
| s.10.3(a) | Equipment and media control |
| s.10.3(b) | Information erasure (overwrite, degauss, physical destroy; crypto-erase not alone) |

## Responsibility for assets (G3 s.10 intro, s.10.1)

B/Ds **shall** maintain appropriate protection of all hardware, software, and information assets, and ensure that information receives an appropriate level of protection.

### Inventory (G3 s.10.1(a))

Regardless of **source of funding**, an inventory **shall** be drawn up of all information systems — including infrastructure facilities and departmental shared IT services **(with their system classifications)** — hardware assets, software assets, valid warranties, service agreements, and legal/contractual documents (e.g. public domain-name registrations and related IP addresses, physical locations of data storage). Periodic review **shall** be conducted so assets are properly owned, kept, and maintained. To manage the software supply chain, B/Ds **should** gather as much information as possible about associated components (e.g. supplier, component name, version, dependency relation).

In particular, the [[ditso|DITSO]] **shall** maintain an up-to-date inventory of **all Internet-facing services** of the B/D. It **shall** be comprehensive and include **at least** the description, IP addresses, domain names, and **network ports opened** of services exposed to the Internet.

Asset ownership **shall** be assigned when assets are created or transferred. The asset owner **shall** ensure: assets are inventoried; appropriately classified and protected; access restrictions are defined and reviewed periodically; assets are handled properly for disposal or reuse.

### Protection of information about government information systems (G3 s.10.1(b))

Staff **shall not** disclose to any unauthorised persons the **nature and location** of information systems, the **information-system controls** in use, or the way they are implemented. Information about systems **shall not** be disclosed where it may compromise security — such as network diagrams with IP addresses and security audit reports — **except on a need-to-know basis and only if authorised by the DITSO**. Such information **shall** also be classified and protected according to its classification.

If there is a need to disclose the information to **external service providers**, a **non-disclosure agreement** or equivalent **shall** be used. The NDA **should** define the information protected against disclosure and how the parties are to handle it. If the NDA is at organisation level between a B/D and a provider, it **should** require the provider to bind its staff, directors, agents, associates or contractors, etc., to the same confidentiality obligations.

### Return of assets (G3 s.10.1(c))

When a member of staff is transferred or ceases to provide services to the Government, the outgoing officer or staff of external parties **shall** hand over and return computer resources and information. A **termination process shall** be developed to ensure return of all previously issued assets owned by the B/D. If the outgoing person possesses knowledge important to operations, that knowledge **should** be documented and transferred to the B/D.

## Information classification (G3 s.10.2)

### Classification and labelling (G3 s.10.2(a))

Before determining security measures, data to be protected needs to be identified and classified (e.g. data with monetary value, or whose loss can interrupt daily operation). Data **should** be classified by sensitivity.

B/Ds **should** develop procedures for labelling classified information and handling it according to classification. They **shall** observe and follow requirements of information classification and labelling — markings, regrading, and downgrading of documents. For classified information handled by information systems, B/Ds **shall** also observe:

- users given access **shall** be **alerted** of the type(s) of classified information they are accessing or going to access;
- the **Subject field of a classified electronic mail** **shall** include the classification category of the document;
- **removable media** storing classified information **shall** have clearly legible identification and conspicuous classification markings on labels **fixed firmly** to them **and** on their protective containers;
- removable media on which a **key** is stored and which is **not used for backup** need **not** have its classification marked on a fixed label.

### Overall data confidentiality (G3 s.10.2(b))

**All stored information classified as RESTRICTED or above shall be encrypted**, irrespective of the storage media. For implementation options, B/Ds are advised to adopt a risk-based approach. If a system contains both RESTRICTED and unclassified information, the requirement can be met whether the RESTRICTED information is encrypted by application or other means at **field, database, file, or disk-storage** level. Methods and key management: [[encryption]].

Some systems, such as **network devices** (e.g. firewall, router) and proprietary appliances, may not support encryption for configurations, rule sets, and log records that may be classified. If there is **no viable solution**, B/Ds **shall** implement **complementary measures** such as strengthened access control **and obtain approval from Heads of B/Ds**, taking this constraint into consideration.

Information **without** a security classification **should** still be protected for confidentiality and integrity. Release outside the Government **should** be controlled by the officer responsible for the specific subject, in line with the Code on Access to Information. Measures **should** preserve CIA while information is processed, in transit, and in storage. Similar protections **shall** apply to **interim material** produced in the course of processing. All government data and system disks **shall** be removed whenever computer equipment is no longer used.

Classified messages/data/documents in whatever form **shall** bear the same classification as the paper equivalent and **shall** be protected in accordance with government security requirements.

B/Ds **shall** advise business partners, contractors, or outsourced staff to comply with government security requirements in storing, processing, and transmitting government-owned data, and put in place a mechanism to check compliance.

## Storage media handling (G3 s.10.3)

### Equipment and media control (G3 s.10.3(a))

B/Ds **shall** manage the use and transportation of storage media containing classified information. To protect information during transportation, they **should**: provide sufficient packaging against physical damage; keep a record identifying contents, protection applied, times of transfer to transit custodians, and receipt at destination.

Storing classified information on **mobile devices and removable media should be avoided**. Staff **should** justify the need. B/D-provided devices **shall** be used. Staff **should** seek proper authorisation before storing the **minimum required** classified data. Only devices with **encryption features suitable** to protect classified data **should** be used. Staff **shall** remove classified information as soon as it no longer needs to be stored there, and **shall** ensure all classified data has been completely cleared or destroyed **before disposal or re-use**.

Some electronic office equipment (including multi-function printers and photocopiers) may have **embedded** storage whose existence is not obvious. B/Ds **should** review inventory and make suitable arrangements. Equipment **shall** be used and managed with care if classified information is likely to be stored or processed. Where necessary, file-storage features **should** be disabled.

All storage media containing classified information **shall** be handled strictly in accordance with government security requirements. In case of problems, advice from the [[dso|Departmental Security Officer]] or the Government Security Officer should be sought.

### Information erasure (G3 s.10.3(b))

All classified information **shall** be completely cleared or destroyed from media before disposal or reuse by **(a) sanitisation** or **(b) physical destruction**, so it cannot be recovered.

**Sanitisation** removes data so the original cannot be retrieved, by overwriting or degaussing.

**(i) Overwriting.** For any media used to store classified information, overwrite **ALL addressable locations** with a character, **its complement**, then a **random character**, and **verify**, before disposal or re-use. Every bit of storage space **shall** be overwritten. For flash memory (SSDs, flash drives), manufacturers normally provide built-in commands that destroy entire-drive data rather than only overwriting or erasing cryptographic keys; those functions **should** be used. (A conversion footnote is attached; its body is missing.) If it is **not possible to verify** effective sanitisation, alternative sanitisation or physical destruction that **can** be verified **shall** be used.

**(ii) Degaussing.** Acceptable for classified information on **magnetic** media (hard disks, floppy disks, magnetic tapes) if properly employed. For hard disks, **all shielding** (castings, cabinets, mounting brackets) that may interfere with the magnetic field **shall** be removed first. Platters **shall** be in the position or direction specified by the degausser. Checks and balances **shall** be in place: the individual who degausses **shall** certify completion; a **sample check** of degaussed media **shall** be performed by **another party**.

**Physical destruction.** Media that cannot be sanitised **shall** be physically destroyed by shredding, disintegration, or grinding.

| Media | Particle size / method |
| --- | --- |
| Flash memory | Shred or disintegrate to nominal edge dimensions of **2 mm or less** |
| Optical (CD, DVD, Blu-ray, MO), higher than CONFIDENTIAL | Nominal edge **0.5 mm or less** **and** surface area **0.25 mm² or less** |
| Optical, CONFIDENTIAL or RESTRICTED | Nominal edge **2 mm or less** |
| CD alternative | Grinding to remove the information-bearing surface |

For media used to store information **higher than CONFIDENTIAL**, besides sanitising, the media **should** also be **physically destroyed** before disposal.

Appropriate tools **shall** be used to overwrite the storage area where classified information was originally stored. Commercial secure-deletion software that writes over the area several times, including with different patterns, is available. **Whole-disk sanitisation should** be used instead of individual-file sanitisation for flash-based SSDs or USB flash drives, because completely overwriting a particular file may not be feasible.

**Cryptographic erasure** (overwriting the keys used to encrypt the data) **may** be considered as an alternative, but it is susceptible to vulnerable algorithms, undeleted backup keys, and sanitisation-assurance problems. B/Ds **shall** assess associated risks and impacts before implementing it. **Cryptographic erase shall not be used alone** as a sanitisation method for destruction of classified information. It can be used **in combination** with other sanitisation and physical-destruction methods.

A system of checks and balances **shall** be maintained to verify successful secure deletion. A sample check of the storage media **should** be performed by another party. Users **should** adopt erasure procedures similar to those for RESTRICTED if they believe media to be disposed of or re-used contains information that will cause data-privacy problems.

Further detail: *Practice Guide for Destruction and Disposal of Storage Media* (ITG InfoStation).

## Related

[[classified-information]] · [[encryption]] · [[ditso]] · [[information-owner]] · [[dso]] · [[classified-protection]] · [[05-human-resource]] · [[08-cryptography]]
