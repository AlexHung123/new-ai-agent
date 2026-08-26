---
title: Access control — least privilege, authorisation, and user-IDs
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, access-control, least-privilege, policy]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 11.1-11.2
confidence: high
contested: false
---

# Access control — least privilege, authorisation, and user-IDs

G3 s.11: B/Ds shall prevent unauthorised user access and compromise of information systems, and allow only authorised computer resources to connect to the government internal network. This hub is **ss.11.1–11.2**. Passwords and authentication strength: [[07-access-control-passwords]]. Mobile, remote access, and IoT: [[07-access-control-mobile]].

## Section map

| G3 | Topic |
| --- | --- |
| 11.1(a) | [[least-privilege]] — minimum access and type of access |
| 11.1(b) | Access authorised by [[information-owner\|information owners]] |
| 11.1(c) | Classified access; MFA **shall** for CONFIDENTIAL+ systems; four logical-access elements |
| 11.2(a) | Need-to-know; annual (preferably twice-yearly) review; independent check of high-privilege accounts; lifecycle procedures |
| 11.2(b) | Special privileges on a separate user-ID; no email/web on admin accounts; MFA **should** for high-risk access |
| 11.2(c) | Revoke after inactivity and on exit; change passwords a departing staff member knew |
| 11.2(d) | Unique user-IDs; shared/group IDs prohibited unless [[ditso\|DITSO]] explicit approval |

## Least privilege (G3 s.11.1(a))

B/Ds shall follow [[least-privilege]] when assigning resources and privileges to users and to technical support staff. Restrict both **what** is accessible (data files, IT services and facilities, computer equipment) and **type** of access (read, write, execute, delete) to the minimum necessary to perform the duties.

## Authorisation by information owners (G3 s.11.1(b))

Access rights to information shall not be granted unless authorised by the relevant [[information-owner|information owners]]. Owners should determine access-control rules, rights, and restrictions for specific user roles. The level of detail and the restrictions should reflect the associated information-security risks.

## Classified information and logical access (G3 s.11.1(c))

Access to [[classified-information]] without appropriate authentication shall not be allowed. Authentication may use passwords, smart cards, tokens, biometrics, or one-time passwords. **Multi-factor authentication shall** be used for accessing an information system that stores information classified as CONFIDENTIAL or above.

Logical access control is control of IT resources other than physical location. Four elements:

| Element | Meaning |
| --- | --- |
| Users / groups | People registered and identified for access to the IT resources |
| Resources | Networks, files, directories, programs, databases |
| Authentication | Proof of identity — something you know (PIN or username/password), something you have (token or smart card), or something you are (biometrics: fingerprint, face, retina, voice). Combining **at least two** of these is multi-factor authentication |
| Authorisation | After authentication, map the user or group to the resources |

## Need-to-know, review, and lifecycle (G3 s.11.2(a))

Access rights shall be granted on a **need-to-know** basis and shall be clearly defined, documented, and reviewed periodically. All administrative privileges and data access rights, including temporary access, shall be regularly reviewed (**at least once annually, preferably twice per year**) to identify and revoke unnecessary or excessive privileges. The regular check/audit of some **high-privilege system accounts should be performed by an independent party** to confirm legitimate use. Records of access-rights approval and review shall be maintained so that processes are followed and rights are updated when personnel change.

Access to information-processing facilities (the physical premises where systems sit) should be managed on the same principle.

Formal procedures shall control allocation of access rights through the full lifecycle: initial registration of new users, password delivery, password reset, and final de-registration of users who no longer need access.

## Special privileges (G3 s.11.2(b))

For accounts with privileged access (administrator or system accounts):

- Identify the special privileges and data access rights of each system or application, and the users who need them.
- Grant them on [[least-privilege]] and [[segregation-of-duties]].
- Grant them to a **user-ID different from the ID used for regular business activities**.
- Regular business activities — including email reading, Internet browsing, and file downloading — **shall not** be performed by privileged accounts.
- Specific procedures should avoid unauthorised use of default administration user-IDs.
- Multi-factor authentication **should** be adopted for high-risk access.

## Removal of access rights (G3 s.11.2(c))

All user privileges and data access rights, including temporary and emergency access, **shall be revoked after a pre-defined period of inactivity**. Enforce this by automatic system/application checking or by periodic manual review (for example last-login time). G3 does not fix the inactivity period.

Privileges shall also be revoked when no longer required (termination or change of employment). Documentation shall be updated. If a departing staff member has known passwords for user-IDs that will remain active, those passwords **shall be changed** upon termination or change of employment.

Where rights are granted on a group basis (a group access list), B/Ds shall remove the departing staff from those lists and inform other parties not to share information with the departing staff.

## User identification (G3 s.11.2(d))

Individual accountability should be established so staff are responsible for their actions. For information systems this is done by identifying and authenticating users with a user-ID that uniquely identifies a **single individual**, so activity can be traced after an incident or a policy violation.

Unless it is unavoidable for business needs (for example demonstration systems) or cannot be implemented on the system, **shared or group user-IDs shall be prohibited**. Any exemption shall obtain **explicit approval from the [[ditso|DITSO]] with supporting reason**. The B/D shall justify shared accounts against the security risks the system may be exposed to, review the need periodically, and remove them when the justifications are no longer valid.

## Related

[[least-privilege]] · [[ditso]] · [[information-owner]] · [[classified-information]] · [[07-access-control-passwords]] · [[07-access-control-mobile]] · [[segregation-of-duties]]
