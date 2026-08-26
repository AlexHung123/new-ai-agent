---
title: Password management
created: 2026-08-22
updated: 2026-08-22
type: concept
tags: [password, access-control]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 11.2-11.4
confidence: high
contested: false
---

# Password management

S17 requires a **strict password policy**, unique user-IDs, and DITSO approval before sharing. It does **not** print G3’s length/complexity table, 6-month *shall*, or 90-day end-user *should*. Do not invent those numbers here. Hub: [[07-access-control]].

## Policy content (S17 s.11.4.3)

B/Ds **shall** define a strict password policy that details at least:

- minimum password length;
- initial assignment;
- restricted words and format;
- password life cycle; and
- guidelines on suitable systems and user password selection.

Authentication **shall** be performed in a manner commensurate with the sensitivity of the information to be accessed (s.11.4.1). Consecutive unsuccessful log-in trials **shall** be controlled (s.11.4.2).

## Unique IDs and sharing

Each user-ID **shall** uniquely identify only one user. Shared or group user-IDs **shall not** be permitted unless explicitly approved by the [[ditso|DITSO]] (S17 s.11.2.6). Users **shall** be responsible for all activities performed with their user-IDs (s.11.3.1).

Passwords **shall not** be shared or divulged unless necessary (e.g. helpdesk assistance, shared PC, and shared files). If passwords must be shared, **explicit approval from the DITSO shall be obtained**. Shared passwords **should** be changed promptly when the need no longer exists and **should** be changed frequently if sharing is required on a regular basis (s.11.3.2).

## Storage, transit, defaults, compromise

Passwords **shall** always be well protected when held in storage. Passwords **shall** be encrypted when transmitted over an un-trusted communication network. Compensating controls **shall** be applied if encryption is not implementable (S17 s.11.3.3). See [[encryption]].

Staff are prohibited from capturing or otherwise obtaining passwords, decryption keys, or any other access-control mechanism which could permit unauthorised access (s.11.4.4). All vendor-supplied **default passwords shall be changed** before any information system is put into operation (s.11.4.5). All passwords **shall** be promptly changed if they are suspected of / are being compromised, or disclosed to vendors for maintenance and support (s.11.4.6).

Procedures for password delivery and password reset **shall** be documented as part of user-access management (s.11.2.1).

## Related

[[07-access-control]] · [[ditso]] · [[encryption]] · [[least-privilege]] · [[compare-shall-should-may]]
