---
title: Access control — IDs, authentication, and privileges
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, access-control, policy, guideline]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 8.1-8.5, 8.7, 16.1-16.2
confidence: high
contested: false
---

# Access control — IDs, authentication, and privileges

Part II policy (DITSP ss.8.1–8.5, 8.7) and Part III guidelines (ss.16.1–16.2). Access is authorised, unique, and commensurate with sensitivity. Passwords are on [[03-access-control-passwords]]; logs and monitoring on [[03-access-control-logging]]. Role tags on Part II statements: **[M]** management, **[A]** administrator, **[U]** user.

## Section map

| DITSP | Topic |
| --- | --- |
| 8.1 / 16.1 | Data access: authorisation, need-to-know, least privilege, role-based control |
| 8.2 / 16.2 | Authentication commensurate with sensitivity; unsuccessful logins |
| 8.3 | Privacy: management examination under PDPO |
| 8.4 / 16.2 | Unique user-IDs; shared IDs only with [[ditso|Division DITSO]] approval |
| 8.5 | Inactivity, reviews, handover, special privileges |
| 8.7 | Inter-departmental connections |

## Data access (DITSP ss.8.1, 16.1)

Access shall not be allowed unless authorised by the relevant information owners, and rights shall be granted on a **need-to-know** basis (s.8.1.1–8.1.2). Rights shall be clearly defined and **reviewed** periodically (s.8.1.3). An Information System holding [[classified-information|CONFIDENTIAL or above]] shall be restricted by logical access control (s.8.1.4).

[[information-system-owner|Information System Owners]] should ensure those grants are documented. Access control should be governed by [[least-privilege]] and [[segregation-of-duties]]. **Role-based access control** should be adopted to reduce risk and improve compliance (s.16.1; added at v1.1). The same principle applies to physical premises that house systems.

Encryption and authentication are the primary controls for classified information on personal computers and portable devices. Divisions should follow the Security Regulations and choose protection commensurate with sensitivity (s.16.1). See [[encryption]] and [[annex-portable-devices]].

## Authentication and identification (DITSP ss.8.2, 16.2)

Access to classified information without appropriate authentication shall not be allowed (s.8.2.1). Authentication shall be performed in a manner commensurate with the sensitivity of the information (s.8.2.2). **Consecutive unsuccessful log-in trials shall be controlled** (s.8.2.3): disable the account after a limited number of failures, or increase the delay between attempts. Windows lockout figures sit on [[03-access-control-passwords]] (s.16.3.4).

Identification requires a unique user identity; conventional authentication is a password. Stronger options include smart-card tokens, biometrics (iris, retina, fingerprint), two-factor (something possessed plus something known), and challenge-response. A password checker can enforce composition rules. Weak mechanisms (passwords) reveal a secret; strong mechanisms (e.g. asymmetric cryptosystems) do not (s.16.2).

Identity management covers who gets which access, provisioning, change, termination, and compliance monitoring. Single sign-on means one compromised credential opens every authorised system: enforce a strong password policy and frequent changes, consider biometrics or two-factor, implement re-authentication where a further level of authorisation is required, and time out idle logged-on sessions (s.16.2).

Owners should follow the government *e-Authentication Framework* as far as possible for e-government transactions (2008 ITG InfoStation / CCGO theme page). Accountability is established by identifying and authenticating users so that activity can be traced after an incident or a policy violation.

## Privacy (DITSP s.8.3)

Management reserves the right to examine all information stored in or transmitted by Government Information Systems in accordance with the Personal Data (Privacy) Ordinance (s.8.3.1) [M] [U].

## User-IDs (DITSP ss.8.4, 16.2)

Each user-ID shall uniquely identify only one user. Shared or group user-IDs are not permitted unless explicitly approved by the [[ditso|Division DITSO]] (s.8.4.1). Users are responsible for all activities performed with their user-IDs (s.8.4.2).

Guidelines add: unless it is unavoidable for business reasons (e.g. demonstration systems) or cannot be implemented on the system, shared IDs are prohibited. Any exemption needs explicit Division DITSO approval **with supporting reason**. Owners should justify shared accounts against the security risks CSB may be exposed to (s.16.2). Shared-account inventory and audit trail for CONFIDENTIAL+ shared access are on [[03-access-control-logging]].

## Privileges (DITSP s.8.5)

All accounts shall be revoked after a pre-defined period of inactivity. The period is **normally 3 consecutive months** and can be shortened if the situation warrants, as directed by the Division DITSO (s.8.5.1). User privileges shall be reviewed periodically (s.8.5.2).

When a member of staff is transferred or ceases to provide services to the Government, all related Information Systems privileges shall be promptly terminated. The outgoing officer is responsible for handing over computer resources to the supervisor or the incoming officer for business continuity (s.8.5.3) [M] [A] [U]. The use of special privileges shall be restricted and controlled (s.8.5.4).

## Inter-departmental connections (DITSP s.8.7)

Prior approval from the Division DITSO is required to connect a departmental Information System with another Information System under the control of another bureau/department. The security level of the system being connected **shall not be downgraded** (s.8.7.1). Network protection detail is on [[06-network]].

## Related

[[03-access-control-passwords]] · [[03-access-control-logging]] · [[ditso]] · [[information-system-owner]] · [[least-privilege]] · [[segregation-of-duties]] · [[classified-information]] · [[password-management]]
