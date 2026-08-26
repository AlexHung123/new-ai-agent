---
title: Incident handling
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [incident]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 4.1, 13, 21
confidence: high
contested: false
---

# Incident handling

A **security incident** is any event or vulnerability that could pose a threat to the availability, integrity, and confidentiality of an information system or of information resources (DITSP s.4.1(h)). Policy: s.13. Guidelines: s.21. Hub: [[08-incident]]. Role pages: [[isirt]], [[giro]], [[tcd]], [[dso]].

CSB shall establish detection and monitoring, keep logs for proof and tracing, document a handling/reporting procedure, make staff aware of it, and record actions (s.13.1–13.2). Figures 21.1–21.2 are images; role names come from the captions, not invented boxes.

## Report only to CSB ISIRT (s.13.2.3)

All network or systems software malfunctions, information-security alerts, warnings, suspected vulnerabilities, and suspected network security problems **shall be reported immediately only to the CSB [[isirt|ISIRT]]**, according to the CSB *Information Security Incident Response Procedure* [A] [U]. That separate procedure (and the ISMF s.9 formation text) is **not in this file**.

Do not brief outsiders on a need-to-know basis until the Division ISIRT Commander or DSO has approved (s.21.3). Staff shall not disclose who was hit, the method of exploit, or the nature and location of systems except to those handling the incident, those responsible for the system, or authorised investigators (s.9.1.2–9.1.3).

[[isirt|CSB ISIRT]] is the focal point: [[dso]], Bureau Information Officer (s.21.4; the s.21.2 caption reads “Bureau Information,” — verify against printed DITSP), [[itmu-security-team|CSB ITMU Security Team]], and three Division ISIRTs (Headquarters & Others, OLD, CSTDI). Each Division ISIRT has a Commander (ISIRTC), Incident Response Manager (IRM), and IT System Support Officers.

Examples of IS breaches (s.21.2 / SR 383): unauthorised access to classified information on a system; a key or authentication device left unattended; tampering in transit; loss of a portable computer or removable media holding classified information.

## Clocks — 15 / 30 / 60 (s.21.4)

If the immediate escalation point cannot be reached, contact the **next** party within the same timeframe.

**Serious incidents and public-aware incidents** (service interruptions or hacking that may be noticed by the public, and/or that hit critical components):

| Clock | Action |
| --- | --- |
| **15 minutes** | Support Officer informs Division IRM, information owner, technical maintenance team, and supporting vendors |
| **30 minutes** | IRM notifies Division ISIRTC |
| **60 minutes** | IRM notifies CSB ITMU, [[dso]], and [[giro]] after Division ISIRTC approval. ITMU advises DSO. DSO notifies senior management |
| **Every 30 minutes** thereafter | IRM (or authorised officer) reports status to Division ISIRTC, ITMU, and GIRO |
| After recovery | Division ISIRTC informs ITMU and GIRO that the case is closed |

As necessary: Division ISIRTC informs DSO directly when sensitive information is involved; computer crime goes to [[tcd]] **only after DSO approval**, with GIRO copied; Bureau Information Officer may brief the public only after DSO approval; ITMU notifies IRMs of other CSB divisions.

**Other incidents** (interruptions and minor breaches that may not be public): Support Officer → IRM / owner / maintainers / vendors within **60 minutes**; status to Division ISIRTC **every 2 hours**; after recovery, IRM reports ITMU and GIRO if the Division ISIRTC so decides.

Report to [[giro]] when the incident hits any of: human life and safety; a public-facing system whose failure interrupts service; systems handling sensitive data (e.g. CMS); mission-critical systems; or highly undesirable impact (e.g. website defacement).

Prefer in-person or phone. Email only if those fail, and encrypt. Fax is a supplement; handle it so the incident is not disclosed (s.21.3).

## Aftermath — one week (s.13.3, s.21.5)

Post-incident follow-up shall be performed within a defined period after the affected system is recovered (s.13.3.1). Per G54, the Aftermath phase should start **within one week** of recovery.

- **Minor** incidents: [[ditso|Division DITSO]] with the relevant [[information-system-owner|IS Owner]].
- **Serious** incidents escalated to DSO: [[itmu-security-team]] leads and coordinates the three divisions.

Follow-up: lesson-learnt meeting; Post-Incident Report (IS Owner); Post-Incident Analysis (IT support and ITMU); SRA/audit of the affected system if necessary; improve safeguards; investigation and prosecution if it is computer crime.

## Related

[[08-incident]] · [[isirt]] · [[giro]] · [[tcd]] · [[dso]]
