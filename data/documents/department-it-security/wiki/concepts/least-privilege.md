---
title: Least privilege
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [access-control, policy]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 6.1.6, 8.1, 14.1.6, 16.1
confidence: high
contested: false
---

# Least privilege

CSB shall enforce the **least privilege** principle when assigning resources and privileges of Information Systems to users (DITSP s.6.1.6) [M – IS Owner]. The guideline restates it for users **and** technical support staff: restrict a user’s access (to data files, processing capability, or peripherals) **and** the type of access (read, write, execute, delete) to the **minimum necessary** to perform the duty (s.14.1.6).

Need-to-know and role-based access control sit beside it. Pair with [[segregation-of-duties]]. Operational detail: [[03-access-control]].

## Need-to-know (s.8.1, s.16.1)

Access to information is not allowed unless authorised by the relevant information owner (s.8.1.1). Data access rights **shall** be granted on a need-to-know basis, clearly defined, and reviewed periodically (s.8.1.2–8.1.3). [[information-system-owner|Information System Owners]] should not grant rights until the owner has authorised them, and should document what was granted (s.16.1).

The same principle covers **physical** access to the premises that house the systems (s.16.1). CONFIDENTIAL-or-above systems shall use logical access control (s.8.1.4). Authentication shall match the sensitivity of the information (s.8.2.2). Special privileges shall be restricted and controlled (s.8.5.4). Accounts shall be revoked after a predefined period of inactivity — normally **three consecutive months**, shorter if the [[ditso|Division DITSO]] so directs (s.8.5.1). On transfer or cessation of service, privileges shall be terminated promptly (s.8.5.3).

## Role-based access control (s.16.1)

Access control should be governed by least privilege **and** [[segregation-of-duties]]. **Role-based access control** should be adopted to reduce security risks and improve compliance by giving a systematic framework for controlling users’ access (s.16.1). Encryption and authentication are the primary controls for classified information on PCs and portable devices; Divisions follow SR for the method that matches the grade ([[classified-information]], [[annex-portable-devices]]).

Database views and user profiles give finer grain: a user sees only the fields and functions authorised (s.17.3). Shared or group user-IDs are not permitted unless the Division DITSO explicitly approves (s.8.4.1). Documentation and listings of applications shall be restricted on a need-to-know basis (s.10.1.2). System design and security features should be treated as classified information (s.10.1.4).

## Lifecycle of a privilege (s.8.5, s.6.1.12)

Staff who use or have unescorted access to systems shall be selected carefully, told their duties, and **formally notified of their authorisation** (s.6.1.12). User privileges shall be reviewed periodically (s.8.5.2). On transfer or cessation of service, privileges shall be terminated promptly; the outgoing officer hands computer resources to the supervisor or incoming officer (s.8.5.3). Special privileges shall be restricted and controlled (s.8.5.4). File-sharing / P2P, if used at all, requires removing unnecessary privileges on the workstation ([[annex-file-sharing]]).

## What “minimum” covers (s.14.1.6)

| Limit | Example |
| --- | --- |
| **What** the user can reach | Data files, processing capability, peripherals |
| **Type** of access | Read, write, execute, delete |

IS Owners lead user-account procedures (privilege assignment and endorsement) as working-level documents they may endorse themselves (s.14.1.1). Users remain accountable for every activity under their user-ID (s.8.4.2; [[compare-roles]]).

## Related

[[segregation-of-duties]] · [[03-access-control]] · [[information-system-owner]] · [[password-management]]
