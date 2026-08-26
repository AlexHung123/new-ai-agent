---
title: Compare — roles
created: 2026-08-21
updated: 2026-08-21
type: comparison
tags: [comparison, role]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 5, 10.1, 11.1-11.4, 15.1, 16.2-16.3, 18.1
confidence: high
contested: false
---

# Compare — roles

Government-wide bodies sit in the Information Security Management Framework (G3 s.5.1). Departmental posts sit under Head of B/D (G3 ss.5.2–5.3). Tagging of statements: [[compare-shall-should-may]]. Organisation narrative: [[01-organisation]].

## Government-wide

| | Who | Mandate | Typical approvals / outputs | Incident role |
| --- | --- | --- | --- | --- |
| **[[ismc\|ISMC]]** | Central committee, Apr 2000. Core: [[dpo\|DPO]] + [[security-bureau\|Security Bureau]]; other B/Ds co-opted as needed (s.5.1.1). | Oversee IT security in the whole Government. Review and endorse changes to regulations, policies, guidelines; define IT-security roles; guide B/Ds **through** ITSWG. | Endorses government-wide instrument changes. Does not issue S17/G3 (DPO does). | None day-to-day. |
| **[[itswg\|ITSWG]]** | Executive arm of ISMC, May 2000. Core: DPO, SB, HKPF, CSO (s.5.1.2). | Co-ordinate B/D guidance; **monitor S17 compliance**; define/review IT-security documents; promote awareness. | Drafts and reviews the document stack that ISMC endorses. | None; incidents go to GIRO. |
| **[[giro\|GIRO]]** | Central office + **Standing Office** (executive arm). Core: DPO, SB, HKPF (s.5.1.3). | Central inventory of all government incidents; statistics; co-ordinate **multi-point** attacks; sharing among departmental ISIRTs. | Not a B/D approver. Receives the 60-minute / 48-hour / post-incident clocks ([[incident-handling]]). | Receiving end of every B/D ISIRT report. |
| **[[govcert\|GovCERT.HK]]** | CERT, Apr 2015 (s.5.1.4). | Alerts to B/Ds; bridge to HKCERT and other CSIRTs; threat intel; collaborates with GIRO Standing Office. | Technology Centre **scanning facilities** for Internet-facing websites (s.14.6(b)). | Alert feed and CERT-community liaison, not the GIRO inventory. |
| **[[dpo\|DPO]]** | Issuer of S17, G3, and practice guides (s.2.3.2). Core member of ISMC, ITSWG, GIRO. Successor to OGCIO (v10.1). | Implementation standard; ITG InfoStation; Appendix D monitoring; DITSO training with SB. | Reviews B/D submissions; technical endorsement of GSO-approved isolated LAN (s.15.2(a)); receives GC 6/2024 full incident reports. | CCC Helpdesk for suspected [[malware]] (s.14.2(c)). |
| **[[security-bureau\|Security Bureau]]** | Authorises Security Regulations (s.2.3.1). Core member of ISMC, ITSWG, GIRO. | Classification of information (SR). Co-trains DITSOs. | **Government Security Officer** (SB post, not [[dso\|DSO]]): isolated LAN; classified-email system (s.15.2). | Via GIRO membership. |

## Departmental

| | Who | Mandate | Typical approvals | Incident role |
| --- | --- | --- | --- | --- |
| **[[ditso\|DITSO]]** | Head of B/D appoints D3 or above (or highest directorate) (s.5.2.1). Shall attend SB/DPO training. | Protection programme; governance; senior discussions; policy; oversee ops, audits, awareness; co-ordinate B/Ds; risk/PIA; GIRO-alert dissemination; investigation and reports to Director of Bureau. | Shared IDs; shared passwords; strong-password exceptions; unauthorised devices on internal net; simultaneous LAN+external; Internet-facing inventory; system-info disclosure. GC 6/2024 reports for **non-Specified** systems. | Informed to classify malware event vs incident; consulted if not patching. |
| **[[dso\|DSO]]** | Head of B/D designates (s.5.2.3). May also be DITSO. | All aspects of (physical/personnel) security; advise on security policy. | Consulted on need-to-know / classified-access doubts (s.9.1(d)); storage-media problems (s.10.3(a)). | Not the ISIRT Commander unless so designated. |
| **[[isirt\|ISIRT]] Commander** | Senior-management officer designated by Head of B/D (s.5.2.4). | Focal point for all incidents in the B/D. | **Only** the Commander authorises sharing of incident information (s.18.1(b)). Endorses resources and line-to-take. | Damage containment, recovery, external parties, trigger DR, GIRO reporting, internal sharing. |
| **[[information-owner\|Information Owner]]** | Collators/owners of information in systems (s.5.3.2). | Determine data classifications, authorised usage, corresponding security requirements. | Authorise access (s.11.1(b)); production data in test (s.16.3(a)); program-cataloguing access to production classified (s.16.2(f)). | Not a GIRO reporter. |
| **IT Security Administrator** | Security/risk support (s.5.3.1). **Should not** be the System Administrator ([[segregation-of-duties]]). | Vulnerabilities, patching, access controls, logs (no tampering), threat intel, IDS/IPS. | Operational, not policy endorsement. | Supports detection; does not authorise external sharing. |
| **LAN/System Administrator** | Day-to-day admin of systems and networks (s.5.3.3). | Implement mechanisms per DITSO procedures. | None of policy. | Malware first-line; patching. |
| **Users** | Staff authorised to access information (s.5.3.5). | Attend training; apply available mechanisms; prevent leakage; safekeep devices. Accountable for all activities under their IDs. | None. Shared IDs/passwords still need DITSO. | Report suspected malware and incidents via the published procedure. |

Head of B/D (or explicitly delegated directorate officer) endorses [[classified-protection|system classifications]] and, under Appendix D, the Tier 2/3 list sent to DPO. Head of B/D also approves CONFIDENTIAL wireless (except DITSO-confirmed wireless keyboards) (s.15.1(g)).

## Related

[[ditso]] · [[dso]] · [[isirt]] · [[giro]] · [[dpo]] · [[incident-handling]] · [[01-organisation]]
