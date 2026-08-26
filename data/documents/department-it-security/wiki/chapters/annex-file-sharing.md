---
title: Appendix C — File sharing technologies
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, appendix, network, malware]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: Appendix C
confidence: high
contested: false
---

# Appendix C — File sharing technologies

Added in **v1.1 (May 2008)**. Pointer from DITSP s.19.5.1: use of file sharing technologies should be **avoided** in CSB; if a user wishes to deploy them, discuss with [[itmu-security-team|ITMU]] first. This appendix is the reference list of controls. Software/patch hub: [[06-network-malware-patch]]. Catalogue: [[annexes]].

**Not the incident-report form.** “Appendix C” of the *Information Security Management Framework for CSB* is the Preliminary Information Security Incident Report Form (DITSP s.21.3). That is a different document. See [[08-incident]].

## Approval

Take serious consideration before employing **peer-to-peer (P2P)** file sharing in business operations. If deployment is deemed necessary:

- put it under **strict control**;
- obtain [[ditso|Division DITSO]] approval **case by case**;
- perform a thorough [[security-risk-assessment|risk assessment]] before employing P2P on the departmental network.

## Control list

Applies to file sharing applications, **including but not limited to** P2P software:

| Control | Rule |
| --- | --- |
| Configuration | Install and configure with due care; examine **default settings** before use |
| Privileges | Remove all unnecessary user privileges and file/directory sharing on the workstation |
| Sensitive data | Do **not** share sensitive or personal data via the file-sharing application (inadvertent leak) |
| Firewall | Open only the **minimal** set of firewall ports for that traffic |
| AV / personal firewall | Install anti-virus and a personal firewall. Keep virus signatures, malicious-code definitions, and detection/repair engines updated regularly. See [[malware]] |
| Patches | Apply the latest security patches on the workstation regularly. See [[patch-management]] |
| When unused | **Close** the file-sharing application or connection when it is not in use |
| Content | Do **not** share obscene, indecent, or unauthorised copyright materials. See [[copyright-compliance]], [[annex-copyright]] |
| Downloads | Do **not** download files from untrustworthy or suspicious sources |

Further P2P threat notes and practices were pointed, in 2008, to the IT Security Theme Page on the government intranet: `http://itginfo.ccgo.hksarg/content/itsecure/techcorner_new/p2p.htm` (historical URL).

## See also

[[annexes]] · [[06-network-malware-patch]] · [[ditso]] · [[itmu-security-team]] · [[security-risk-assessment]] · [[malware]] · [[copyright-compliance]] · [[08-incident]]
