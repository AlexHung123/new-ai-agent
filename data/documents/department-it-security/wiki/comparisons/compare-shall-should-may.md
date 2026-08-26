---
title: Compare — shall / should / may
created: 2026-08-21
updated: 2026-08-21
type: comparison
tags: [comparison, policy, definition]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 4.2, Part II intro
confidence: high
contested: false
---

# Compare — shall / should / may

Two finding aids sit on top of Part II: the **verb** (s.4.2) and the **role tag** (Part II intro). Neither is a licence to skip the rest of the policy. **All CSB staff shall read through the entire IT Security Policy** and follow it (Part II intro). Definitions: [[information-security]]. Who the tags name: [[compare-roles]]. Part II versus Part III: [[compare-policy-guidelines]].

## Verb force (s.4.2)

| | Shall | Should | May |
| --- | --- | --- | --- |
| **Meaning** | Mandatory requirement | Good practice; follow **whenever possible** | Desirable requirement |
| **Where it lives** | Almost every Part II statement | Mix of Part II (a few lines) and most of Part III | Sparse; mostly guideline options |
| **If you cannot comply** | You need an authorised exception (e.g. DSO on SRA follow-up, Division DITSO on shared IDs) — not a silent skip | Record why it was not possible; put compensating controls where the booklet gives them (e.g. [[segregation-of-duties]]) | Optional; still subject to classification and SR |

### Shall — examples

- CSB **shall** apply sufficient segregation of duties so one person does not run all security functions (s.6.1.5).
- Stored information classified CONFIDENTIAL or above **shall** be encrypted (s.9.1.4).
- Anti-virus software **shall always be enabled** on LAN servers, PCs, and remote-access machines (s.11.4.1).
- Incidents **shall be reported immediately only to the CSB ISIRT** (s.13.2.3).

s.8.6.1 is also a **shall** (password length, change cycle). Treat its “every 3 months” as contested against s.16.3 — see [[password-management]].

### Should — examples

- Automatic protection (screensaver, keyboard lock) **should** activate after inactivity; workstations **should** be switched off before leaving (s.7.3.4).
- Staff **should** observe OGCIO Circular 7/2005 on acceptable Internet use (s.11.2.2).
- Emails from suspicious sources **should not** be opened or forwarded (s.11.3.6).
- Role-based access control **should** be adopted (s.16.1).

### May — examples

- A challenge-response scheme **may** be chosen for log-on (s.16.2).
- Month-end and year-end backup copies **may** be retained longer than the daily rotation (s.17.2.1).
- For obsolete products, CSB **may** consider other security measures or migrate to other proprietary or open-source software if that averts the risk (s.17.8).
- Subject to [[dso]] decision, the Bureau Information Officer **may** disseminate to the public after DSO approval (s.21.4).

## Role tags [M] [A] [U] (Part II intro)

Each policy statement carries one or more tags so readers can find lines of most concern to their role. **Multiple tags on one statement are allowed.**

| Tag | Role named in the intro | Typical actors |
| --- | --- | --- |
| **[M]** | Management | [[dso]], [[ditso|Division DITSO]], [[information-system-owner|IS Owners]] |
| **[A]** | Administrator | IT Staff: CSB [[itmu-security-team|ITMU]], IT security administrators, network administrators, system administrators, application development and maintenance |
| **[U]** | User | All users of Information Systems |

### [M] — examples

- Review of policies, standards, guidelines, and procedures shall be conducted periodically (s.6.1.1) [M – DITSO].
- Segregation of duties and least privilege (s.6.1.5–6.1.6) [M – IS Owner].
- SRA every two years and before major change (s.12.1.1) [M].
- Establish a security-incident handling procedure (s.13.2.1) [M].

### [A] — examples

- Logs shall be secured against modification and readable only by authorised persons (s.8.8.4) [A].
- Backup and recovery procedures shall be documented, implemented, and tested (s.9.2.1) [A].
- Internal networks with connections to other Government or public networks shall be properly protected (s.11.1.2) [A].
- Use of SRA/audit analysis software shall be restricted and controlled (s.12.1.2, s.12.2.3) [A].

### [U] — examples

- Safeguard laptops and mobile devices; do not leave them unattended without security measures (s.7.2.2) [U].
- Users are responsible for all activities performed with their user-IDs (s.8.4.2) [U].
- Do not intentionally introduce viruses or malicious codes (s.11.4.4) [U].
- Email transmission of classified information only on a GSO-approved system (CMS); TOP SECRET/SECRET also follow s.11.1.10 (s.11.3.5) [U].

Shared-tag example: password policy s.8.6.1 is **[M] [A] [U]**; SR Chapter IX compliance s.9.1.5 is **[M] [A] [U]**. Everyone still reads both.

## Related

[[information-security]] · [[compare-policy-guidelines]] · [[compare-roles]] · [[00-introduction]]
