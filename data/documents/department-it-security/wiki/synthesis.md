---
title: Synthesis — what DITSP is actually regulating
created: 2026-08-21
updated: 2026-08-21
type: synthesis
tags: [chapter]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
confidence: high
---

# Synthesis — what DITSP is actually regulating

DITSP is not a second Security Regulations and not a waiver of S17. It is CSB’s **departmental overlay**: eight control families, written twice (policy then guidelines), tagged by role, and pinned to a 2008 CSB organisation of three division sites plus a central [[itmu-security-team]]. The wiki’s job is to make that overlay readable against SR and the government baseline, not to replace them.

## 1. Three documents, not one

Part I cites Security Regulations, Baseline IT Security Policy [S17] v2.3, IT Security Guidelines [G3] v4.3, G51, G54, and the CSB Information Security Management Framework (DITSP s.3). DITSP Part II “constitutes the IT Security Policy that all users in CSB shall observe” and is adapted from S17 after a CSB security risk assessment (Part II intro). Where SR Chapter IX is stricter — isolated LAN, CMS, Level II/III rooms — DITSP repeats it rather than relaxing it (DITSP s.9.1.5, s.17.1). A live decision that quotes only DITSP is incomplete.

## 2. Classification is the real architecture

The eight area headings look like an ISO-style catalogue. In practice, [[classified-information]] rewrites almost every control: room level (II vs III vs locked cabinet), encryption in storage (mandatory at CONFIDENTIAL+), encryption in transit (mandatory on un-trusted networks at RESTRICTED+; TOP SECRET/SECRET **prohibited** off an isolated LAN), email path (CMS vs GCN/PKI), shared-access tracking, and wireless (not allowed for SECRET and above). The CSB departmental network is explicitly un-trusted (DITSP s.19.1.2). Ask “what classification?” before “which section?”. See [[compare-classification-controls]].

## 3. “Division DITSO” is the operational bottleneck

S17 requires a Departmental IT Security Officer. CSB splits that role across **three site-specific Division DITSOs**; when DITSP says “DITSO”, it means them (DITSP s.5.3 note). Shared user-IDs, password sharing, inter-departmental connections, privately owned kit on the LAN, unauthorised software, IM, and P2P all need Division DITSO approval. [[dso]] is the executive who endorses the booklet and owns serious-incident escalation; [[information-system-owner|IS Owners]] own classification and system procedures. Compare [[compare-roles]].

## 4. Part II and Part III sometimes disagree on the same control

Two live tensions in this compilation, both marked `contested` on the detail pages:

- **Password age.** DITSP s.8.6.1: change at least every **3 months**. DITSP s.16.3.2: at least every **90 days**. DITSP s.16.3.4 Windows table: maximum password age **135 days**, complexity **Disabled**. Policy “shall” vs guideline Windows snapshot.
- **Internet path.** DITSP s.11.2.1: all Internet access from the CSB departmental network **shall** go through the Central Internet Gateway. DITSP s.19.2.1: through the **departmental Internet gateway or** CIG.

Do not collapse these. See [[password-management]] and [[06-network-internet-email]].

## 5. Residual ownership survives outsourcing

Contractors “shall observe” DITSP (s.6.2.1) and “have the same information security responsibilities as Government staff” (s.6.2.3, s.14.2). NDAs, SLAs, escalation, and the right to audit sit in the contract. The sentence that matters is s.14.2 last: **although a system can be outsourced, overall responsibility remains under CSB**. Project owners must also have unauthorised materials removed from government computers (v1.1 addition). See [[outsourcing-security]].

## 6. Incident handling is a clock, not a narrative

Serious / public-aware incidents: Support Officer → IRM in **15 minutes**, Division ISIRTC in **30**, [[itmu-security-team|ITMU]] / [[dso]] / [[giro]] in **60**, then every 30 minutes (DITSP s.21.4). Other incidents: 60 minutes, then every 2 hours. Aftermath starts within **one week** of recovery (s.21.5, G54). Computer crime goes to [[tcd]] only after DSO approval, with GIRO copied. Figures 21.1–21.2 are images; role names are in the caption, not a reconstructed org chart. See [[incident-handling]] and [[isirt]].

## 7. The compilation is a 2008 snapshot

v1.2 (July 2008) adds Appendix D (Copyright Ordinance / OGCIO Circular 3/2008). The technical furniture is of its year: Windows 2000 Group Policy, Symantec Antivirus Corporate Edition, Microsoft SMS, Lotus Notes, Confidential Mail System, CIG, WEP/WPA, pcAnywhere/VNC, ICQ/MSN. Footnote bodies are missing. Title page prints “HKSKAR”. For a live CSB system in 2026, current Digital Policy Office baselines, current SR Chapter IX, and current CSB ISMF outrank this wiki.

## Worth asking next

- Current S17 / G3 clause numbers versus this v2.3 / v4.3 baseline.
- Whether CSB still has three Division DITSOs (HQ & Others, OLD, CSTDI) and the Q9 / HQ two-week media shuttle (DITSP s.15.2.2).
- Live password and CIG rules after later OGCIO circulars.
- The CSB *Information Security Incident Response Procedure* and ISMF (cited, not in this file) — Figures 21.1–21.2 and ISIRT role descriptions live there.
- Whether SM2 remains Intellectual Property Compliance Officer for software (Appendix D).

File those as query pages. Do not guess them into chapter hubs.
