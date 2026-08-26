---
title: Security incident monitoring, response and aftermath
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, incident, policy, guideline, procedure]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 13, 21
confidence: high
contested: false
---

# Security incident monitoring, response and aftermath

Part II s.13 is the “shall”; Part III s.21 is the clock. Concept: [[incident-handling]]. Team: [[isirt]]. Government-wide recording: [[giro]]. **Do not invent boxes** for Figures 21.1–21.2 — they are images. Role names below are from captions and surrounding prose only.

The detailed CSB handling process and ISIRT formation live in a **separate** document: *Information Security Management Framework for CSB* (ISMF) s.9, plus *Information Security Incident Response Procedure*. Those files are not in this wiki.

## Section map

| DITSP | Topic |
| --- | --- |
| 13.1.1 | Detection and monitoring mechanism [M] |
| 13.1.2 | Review system logs regularly [A] |
| 13.1.3 | Retain logs and supporting information for proof and tracing [A] |
| 13.2.1–13.2.2 | Documented handling/reporting procedure; staff shall follow it [M] |
| 13.2.3 | Report **only** to CSB ISIRT per the CSB Incident Response Procedure [A] [U] |
| 13.2.4 | Immediate response on suspected intrusion [A] |
| 13.2.5 | Record incident information and actions [A] |
| 13.3.1 | Post-incident follow-up within a defined period after recovery [M] [A] |
| 21.1 | Monitoring mix; logs **at least one month** |
| 21.2 | ISIRT composition; breach examples; Figures 21.1–21.2 |
| 21.3 | Reporting; Preliminary form = **ISMF Appendix C** (not DITSP App. C) |
| 21.4 | Escalation clocks; GIRO criteria; [[tcd]] after [[dso]] |
| 21.5 | Aftermath within **one week** of recovery (G54) |

## Monitoring (s.13.1, 21.1)

CSB shall establish an incident detection and monitoring mechanism to detect, contain and ultimately prevent incidents; review system logs regularly; retain logs and supporting information for proof and tracing (s.13.1). Depth of measures depends on importance, sensitivity and function (s.21.1). Recommended mix: firewall plus authentication/AC; intrusion detection; AV and malicious-code tools; periodic scanning against policy; content filtering of email/web; system and network audit logging; scripts for suspicious activity, integrity and log analysis.

Audit logs of monitoring devices are evidence. Tune retention so **at least one month** of past activity is kept (s.21.1).

## Who is told, and what is a breach (s.13.2, 21.2)

All network or systems software malfunctions, information security alerts, warnings, suspected vulnerabilities, and suspected network security problems **shall be reported immediately only to the CSB ISIRT** according to the CSB *Information Security Incident Response Procedure* (s.13.2.3). Immediate response on suspected intrusion; record information and actions (s.13.2.4–13.2.5).

**Figure 21.1** caption: *The Incident response workflow for CSB*. The figure itself is an image — not reconstructed here.

**Figure 21.2** caption: *The information flow of the CSB Information Security Incident Response Team*. Surrounding prose: CSB ISIRT is the focal point for all CSB information-security incidents. As printed it comprises the [[dso|Departmental Security Officer]], Bureau Information, the [[itmu-security-team|CSB ITMU Security Team]], and Division ISIRTs for three CSB Divisions (Headquarters & Others, OLD and CSTDI). Each Division ISIRT has a Division ISIRT Commander, Incident Response Manager (IRM), and IT System Support Officers. The conversion prints “Bureau Information,” (stray comma); s.21.4 later names a **Bureau Information Officer**. Role detail is ISMF s.9.2, not this booklet.

Examples of IS security breaches (s.21.2, added v1.1):

- Unauthorised access of classified information on an Information System.
- An Information System key or authentication device left unattended where an unauthorised person might access it.
- Tampering of classified information during transmission.
- Loss or apparent loss (temporary or permanent) of a portable computer or removable media (CDs, floppies) that contain classified information.

## Reporting (s.21.3)

Record symptoms (crashes, unusual errors) and facts (time, affected system, screen message) for Support Officer / IRM. The IT System Support Officer records the incident on the **Preliminary Information Security Incident Report Form** — **Appendix C of the ISMF**, **not** [[annex-file-sharing|DITSP Appendix C]] (that appendix is file sharing). Disclose to outside parties only on need-to-know, and only after Division ISIRT Commander or DSO approval.

Contact preference: **in person** if close; **phone/mobile** (convenient, but lines busy in a serious outbreak); **email only if those fail**, and encrypt (the report may be sensitive); **fax** as a supplement to phone — handle to prevent disclosure.

## Escalation (s.21.4)

If the immediate point cannot be reached, contact the **next** party within the same timeframe.

### Serious incidents and public-aware incidents

Service interruptions or hacking that the public may notice, and/or that hit critical system components.

| Clock | Action |
| --- | --- |
| **15 min** | IT System Support Officer informs Division IRM, information owner, technical maintenance team and supporting vendors |
| **30 min** | IRM notifies Division ISIRTC |
| **60 min** | IRM notifies CSB ITMU, DSO and [[giro|GIRO]] **after Division ISIRTC approval**. ITMU advises DSO if needed. DSO notifies Senior Management |
| **Every 30 min** thereafter | IRM (or authorised officer) reports status to Division ISIRTC, CSB ITMU and GIRO |
| As necessary | Division ISIRTC informs DSO directly if sensitive information is involved. Computer crime: authorised ISIRT officer reports to [[tcd|TCD]] **only after DSO approval**, and **copies GIRO**. Bureau Information Officer may brief the public **only after DSO approval**. CSB ITMU notifies IRMs of other CSB divisions |
| After recovery | Division ISIRTC informs CSB ITMU and GIRO to record the closed case (email) |

**Report to GIRO** when an incident hits any of (not limited to): human life and safety; public-facing systems whose failure interrupts service (e.g. DoS on a Government Internet site); systems handling sensitive data (e.g. CMS); mission-critical systems; high undesirable impact (e.g. Government website defacement).

**TCD** (HKPF Commercial Crime Bureau, Technology Crime Division) is contacted if ISIRT suspects computer crime. Seek DSO advice and endorsement **before** reporting. Copy GIRO for central recording and coordination.

### Other incidents

Service interruptions and minor breaches or hacking that may not be known to the public.

| Clock | Action |
| --- | --- |
| **60 min** | Support Officer informs Division IRM, information owner, maintenance team and vendors |
| **Every 2 hours** | IRM (or authorised officer) reports status to Division ISIRTC |
| After recovery | Subject to Division ISIRTC’s decision, IRM reports CSB ITMU and GIRO for recording (email) |

Status reports should cover, where possible: what/when/how and duration; whether the system is under attack; whether the attacker is still active; whether the source is local; recovery status.

## Aftermath (s.13.3, 21.5)

Post-incident follow-up shall be performed within a defined period after recovery (s.13.3.1). Per G54, the Aftermath phase **should start within one week** after the system is recovered (s.21.5).

- **Minor** incidents: [[ditso|Division DITSO]] collaborates with the relevant [[information-system-owner|Information System Owner]] to lead Aftermath.
- **Serious** incidents escalated to DSO: **CSB ITMU Security Team** leads and coordinates across the three CSB Divisions.

Follow-up: lessons-learnt meeting; Post-Incident Report by the IS Owner; Post-Incident Analysis by IT support and ITMU; SRA/audit of the affected system if necessary ([[07-risk-audit]]); improve safeguards to eradicate the cause; lead investigation and prosecution if computer crime.

## Related links

[[incident-handling]] · [[isirt]] · [[giro]] · [[dso]] · [[ditso]] · [[itmu-security-team]] · [[tcd]] · [[information-system-owner]] · [[07-risk-audit]] · [[malware]] · [[classified-information]]
