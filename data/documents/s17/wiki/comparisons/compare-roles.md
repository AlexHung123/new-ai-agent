---
title: Compare — roles
created: 2026-08-22
updated: 2026-08-22
type: comparison
tags: [comparison, role]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 5, 10.1, 11.1-11.3, 15.1, 16.2-16.3, 18.1
confidence: high
contested: false
---

# Compare — roles

Government-wide bodies sit in the Information Security Management Framework (S17 s.5.1). Departmental posts sit under Head of B/D (S17 ss.5.2–5.3). Tagging of statements: [[compare-shall-should-may]]. Organisation narrative: [[01-organisation]].

## Government-wide

| | Who | Mandate | Typical approvals / outputs | Incident role |
| --- | --- | --- | --- | --- |
| **[[ismc\|ISMC]]** | Central committee, Apr 2000. Core: [[dpo\|DPO]] + [[security-bureau\|Security Bureau]]; other B/Ds co-opted as needed (s.5.1.1). | Oversee IT security in the whole Government. Review and endorse changes to regulations, policies, guidelines; define IT-security roles; guide B/Ds **through** ITSWG. | Endorses government-wide instrument changes. Does not issue S17/G3 (DPO does). | None day-to-day. |
| **[[itswg\|ITSWG]]** | Executive arm of ISMC, May 2000. Core: DPO, SB, HKPF, CSO (s.5.1.2). | Co-ordinate B/D guidance; **monitor S17 compliance**; define/review IT-security documents; promote awareness. | Drafts and reviews the document stack that ISMC endorses. | None; incidents go to GIRO. |
| **[[giro\|GIRO]]** | Central office + **Standing Office** (executive arm). Core: DPO, SB, HKPF (s.5.1.3). | Central inventory of all government incidents; statistics; co-ordinate **multi-point** attacks; sharing among departmental ISIRTs. | Not a B/D approver. | Receiving end of B/D ISIRT reports. S17 does not print a 60-minute clock. |
| **[[govcert\|GovCERT.HK]]** | CERT, Apr 2015 (s.5.1.4). | Alerts to B/Ds; bridge to HKCERT and other CSIRTs; threat intel; collaborates with GIRO Standing Office. | Alert feed. | CERT-community liaison, not the GIRO inventory. |
| **[[dpo\|DPO]]** | Issuer of S17, G3, and practice guides (s.2.3.2). Core member of ISMC, ITSWG, GIRO. Successor to OGCIO (v8.1). | Mandatory minimum (S17); implementation standard (G3); ITG InfoStation; DITSO training with SB. | Reviews B/D submissions; technical endorsement of GSO-approved isolated LAN and classified-email system (ss.15.2.1, 15.2.3). | Via GIRO membership; DITSO disseminates GIRO alerts. |
| **[[security-bureau\|Security Bureau]]** | Authorises Security Regulations (s.2.3.1). Core member of ISMC, ITSWG, GIRO. | Classification of information (SR). Co-trains DITSOs. | **Government Security Officer** (SB post, not [[dso\|DSO]]): isolated LAN; classified-email system (s.15.2). | Via GIRO membership. |

## Departmental

| | Who | Mandate | Typical approvals | Incident role |
| --- | --- | --- | --- | --- |
| **[[ditso\|DITSO]]** | Head of B/D appoints D3 or above (or highest directorate) (s.5.2.1). Shall attend SB/DPO training. | Protection programme; governance; senior discussions; policy; oversee ops, audits, awareness; co-ordinate B/Ds; risk/PIA; GIRO-alert dissemination; investigation and reports to Director of Bureau. | Shared IDs (s.11.2.6); shared passwords (s.11.3.2); unauthorised devices on internal net (s.15.1.6); simultaneous LAN+external (s.15.1.10); system-info disclosure (s.10.1.2). | Initiates investigation and rectification; coordinates reports to Director of Bureau. |
| **[[dso\|DSO]]** | Head of B/D designates (s.5.2.3). May also be DITSO. | All aspects of (physical/personnel) security; advise on security policy. | Consulted on need-to-know / classified-access doubts (s.9.1.8). | Not the ISIRT Commander unless so designated. |
| **[[isirt\|ISIRT]] Commander** | Senior-management officer **should** be designated by Head of B/D (s.5.2.4). | Focal point for all incidents in the B/D. | Endorses resources and line-to-take. | Damage containment, recovery, external parties, trigger DR, GIRO reporting, internal sharing. |
| **[[information-owner\|Information Owner]]** | Collators/owners of information in systems (s.5.3.2). | Determine data classifications, authorised usage, corresponding security requirements. | Authorise access (s.11.1.2); production classified access for dev/support (s.16.2.7); production classified as test data (s.16.3.1). | Not a GIRO reporter. |
| **IT Security Administrator** | Security/risk support (s.5.3.1). **Should not** be the System Administrator ([[segregation-of-duties]]). | Vulnerabilities, patching, access controls, logs (no tampering), threat intel, IDS/IPS. | Operational, not policy endorsement. | Supports detection. |
| **LAN/System Administrator** | Day-to-day admin of systems and networks (s.5.3.3). | Implement mechanisms per DITSO procedures. | None of policy. | Operational first-line. |
| **Users** | Staff authorised to access information (s.5.3.5). | Attend training; apply available mechanisms; prevent leakage; safekeep devices. Accountable for all activities under their IDs. | None. Shared IDs/passwords still need DITSO. | Report suspected incidents via the published procedure (s.18.1.5). |

Head of B/D (or explicitly delegated directorate officer) endorses [[classified-protection|system classifications]] (s.7.2.2). Head of B/D also appoints DITSO and designates DSO.

IT security management unit **shall** be established and reports to DITSO (s.5.2.5). Information security steering committee **should** be considered; if none, DITSO should take the committee’s job (s.5.2.2).

## Related

[[ditso]] · [[dso]] · [[isirt]] · [[giro]] · [[dpo]] · [[incident-handling]] · [[01-organisation]]
