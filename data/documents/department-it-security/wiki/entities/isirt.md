---
title: CSB Information Security Incident Response Team
created: 2026-08-21
updated: 2026-08-21
type: entity
tags: [role]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 13.2.3, 21.2, 21.3, 21.4, 21.5
confidence: medium
contested: false
---

# CSB Information Security Incident Response Team

The CSB [[isirt|ISIRT]] is the focal point for all information security incidents in CSB (DITSP s.21.2). Network or systems software malfunctions, information security alerts, warnings, suspected vulnerabilities, and suspected network security problems shall be reported immediately **only to the CSB ISIRT**, following the CSB *Information Security Incident Response Procedure* (s.13.2.3). See [[incident-handling]] and [[08-incident]].

## Composition (DITSP s.21.2)

The CSB ISIRT comprises:

- the [[dso|Departmental Security Officer]];
- “Bureau Information,” (source comma; title not reconstructed — verify against printed DITSP);
- the [[itmu-security-team|CSB ITMU Security Team]];
- the three **Division ISIRTs**: Headquarters & Others, OLD, and CSTDI.

Each Division ISIRT has a Division ISIRT Commander (ISIRTC), an Incident Response Manager (IRM), and IT System Support Officers.

Detail of the roles is in s.9.2 of the separate *Information Security Management Framework for CSB*. DITSP does not describe those roles further; this page does not invent them. Figures 21.1 (incident-response workflow) and 21.2 (ISIRT information flow) are images; the names above are taken from the surrounding caption, not from reconstructed boxes.

## Reporting and escalation

Symptoms, time, affected system, and screen messages should be recorded for the Support Officer / IRM. The IT System Support Officer records the incident on the Preliminary Information Security Incident Report Form (Appendix C of the ISMF, not of this booklet). Disclosure to outside parties is need-to-know, and only after approval from the Division ISIRTC or the DSO (DITSP s.21.3). Preferred contact: in person, then phone/mobile, then encrypted email, with fax as a supplement.

If the immediate escalation point cannot be reached, the next party should be contacted within the defined timeframe (s.21.4).

**Serious / public-aware:** Support Officer → IRM in **15 minutes**, Division ISIRTC in **30**, ITMU / DSO / [[giro]] in **60**, then every 30 minutes. Computer crime goes to [[tcd]] only after DSO advice and endorsement, with GIRO copied. Public dissemination is a DSO decision.

**Other incidents:** Support Officer → IRM in 60 minutes, then every two hours to the Division ISIRTC; after recovery, subject to ISIRTC decision, email CSB ITMU and GIRO.

Aftermath starts within one week of recovery (s.21.5, G54): minor cases — Division [[ditso|DITSO]] with the Information System Owner; serious cases escalated to the DSO — ITMU leads and coordinates the three divisions.

## Related

[[dso]] · [[ditso]] · [[itmu-security-team]] · [[giro]] · [[tcd]] · [[incident-handling]] · [[08-incident]]
