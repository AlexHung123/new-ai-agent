---
title: Access control — least privilege, passwords, mobile, IoT
created: 2026-08-22
updated: 2026-08-22
type: chapter
tags: [chapter, access-control, least-privilege, password, remote, iot]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 11
confidence: high
contested: false
---

# Access control — least privilege, passwords, mobile, IoT

S17 s.11: B/Ds **shall** prevent unauthorised user access and compromise of information systems and assets, and allow only authorised computer resources to connect to the government internal network. Depth: [[least-privilege]], [[password-management]].

## Section map

| S17 | Topic |
| --- | --- |
| s.11.1.1 | [[least-privilege]] when assigning resources and privileges |
| s.11.1.2 | Access authorised by [[information-owner\|information owners]] |
| s.11.1.3 | Logical access control for systems containing classified information |
| s.11.1.4 | No classified access without appropriate authentication |
| s.11.2.1–11.2.6 | User registration, need-to-know, special privileges, review, revoke, unique IDs |
| s.11.3.1–11.3.3 | User accountability; password sharing; protect passwords in storage and transit |
| s.11.4.1–11.4.6 | Authentication strength, failed logins, password policy, no capture, change defaults |
| s.11.5.1–11.5.2 | Mobile computing and remote access |
| s.11.6.1–11.6.2 | IoT; privately-owned IoT shall not store or process classified |

## Business requirements (S17 s.11.1)

B/Ds **shall** enforce the [[least-privilege]] principle when assigning resources and privileges of information systems to users (s.11.1.1). Access to information **shall not** be allowed unless authorised by the relevant [[information-owner|information owners]] (s.11.1.2). Access to information systems containing [[classified-information]] **shall** be restricted by means of logical access control (s.11.1.3). Access to classified information without appropriate authentication **shall not** be allowed (s.11.1.4).

S17 does **not** print a multi-factor-authentication *shall* by SR grade. Authentication “shall be performed in a manner commensurate with the sensitivity of the information to be accessed” (s.11.4.1).

## User access management (S17 s.11.2)

Procedures for approving, granting, and managing user access — including user registration/de-registration, password delivery, and password reset — **shall** be documented (s.11.2.1). Data access rights **shall** be granted to users based on a **need-to-know** basis (s.11.2.2). The use of special privileges **shall** be restricted and controlled (s.11.2.3).

User privileges and data access rights **shall** be clearly defined and reviewed **periodically**. The review frequency **shall** be defined and documented. Records for access-rights approval and review **shall** be maintained (s.11.2.4).

All user privileges and data access rights **shall** be revoked after a pre-defined period of inactivity or when no longer required. The period of inactivity and the corresponding review frequency **shall** be defined and documented (s.11.2.5).

Each user identity (user-ID) **shall** uniquely identify only one user. Shared or group user-IDs **shall not** be permitted unless **explicitly approved by the DITSO** (s.11.2.6).

## User responsibilities (S17 s.11.3)

Users **shall** be responsible for all activities performed with their user-IDs (s.11.3.1). Passwords **shall not** be shared or divulged unless necessary (e.g. helpdesk assistance, shared PC, and shared files). If passwords must be shared, **explicit approval from the DITSO shall be obtained**. Shared passwords **should** be changed promptly when the need no longer exists and **should** be changed frequently if sharing is required on a regular basis (s.11.3.2).

Passwords **shall** always be well protected when held in storage. Passwords **shall** be encrypted when transmitted over an un-trusted communication network. Compensating controls **shall** be applied to reduce the risk exposure to an acceptable level if encryption is not implementable (s.11.3.3). See [[encryption]] and [[password-management]].

## System and application access control (S17 s.11.4)

Authentication **shall** be performed in a manner commensurate with the sensitivity of the information to be accessed (s.11.4.1). Consecutive unsuccessful log-in trials **shall** be controlled (s.11.4.2).

B/Ds **shall** define a **strict password policy** that details at least minimum password length, initial assignment, restricted words and format, and password life cycle, and include guidelines on suitable systems and user password selection (s.11.4.3). S17 does not print the G3 length/complexity table.

Staff are **prohibited** from capturing or otherwise obtaining passwords, decryption keys, or any other access-control mechanism which could permit unauthorised access (s.11.4.4). All vendor-supplied **default passwords shall be changed** before any information system is put into operation (s.11.4.5). All passwords **shall** be promptly changed if they are suspected of / are being compromised, or disclosed to vendors for maintenance and support (s.11.4.6).

## Mobile computing and remote access (S17 s.11.5)

B/Ds **shall** define appropriate usage policies and procedures specifying the security requirements when using mobile computing and remote access. Appropriate security measures **shall** be adopted to avoid unauthorised access to or disclosure of the information stored and processed by these facilities. Authorised users **should** be briefed on the security threats and accept their security responsibilities with **explicit acknowledgement** (s.11.5.1).

Security measures **shall** be in place to prevent unauthorised remote access to government information systems and data (s.11.5.2). Simultaneous internal-plus-external connection: [[11-communications]] s.15.1.10. Equipment in possession: [[09-physical]] s.13.2.2.

## IoT devices (S17 s.11.6)

B/Ds **shall** define and implement proper security measures to ensure the security of IoT devices and data is commensurate with the classification of the information (s.11.6.1). The security requirements for mobile devices laid out in this document **shall** be followed similarly for IoT devices unless it is not technically feasible. **Classified information shall not be stored or processed in privately-owned IoT devices** (s.11.6.2). IoT definition: S17 s.4.1(p).

## Related

[[least-privilege]] · [[password-management]] · [[information-owner]] · [[ditso]] · [[classified-information]] · [[encryption]] · [[11-communications]] · [[09-physical]]
