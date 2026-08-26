---
title: Outsourcing security
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [outsourcing, policy]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 6.2, 10.1.6-10.1.7, 14.1.7, 14.2
confidence: high
contested: false
---

# Outsourcing security

Outsourcing does not move residual ownership. Third parties **shall observe** DITSP and other Government information-security requirements (DITSP s.6.2.1) [M – IS Owner]. External consultants, contractors, outsourced staff, and temporary staff **shall be subject to the same information security requirements, and have the same information security responsibilities, as Government staff** (s.6.2.3, s.14.2). Hub: [[01-management-outsourcing]].

CSB shall monitor and review with those providers so that security operations are managed properly (s.6.2.2).

## Same duties as staff (s.14.1.7, s.14.2)

All security policies, procedures, and checks and balances adopted for in-house staff should also apply to external consultants, contractors, and temporary staff (s.14.1.7). Access to CSB information and systems **shall not be provided** until appropriate controls are in place **and** a contract (or other agreement) has been signed defining the terms of connection or access.

[[information-system-owner|Information System Owners]] shall ensure controls administer that third-party access. Security requirements that result from third-party access or from internal controls **shall** be reflected in the contract.

Developers and outsource contractors shall not access production information unless necessary (s.10.1.6). For systems developed or maintained by contractors, involved outsource staff should sign an NDA (s.10.1.7).

## What the contract should carry (s.14.2)

When preparing the outsourcing contract, the **project owner** of the outsourced service should define the security requirements of the systems to be outsourced and seek advice from the [[itmu-security-team|CSB ITMU Security Team]] for the latest requirements. Those requirements should form the basis of tendering and of performance metrics.

| Instrument | Purpose |
| --- | --- |
| **NDA** | Staff of the third-party provider sign to protect sensitive data |
| **SLA** | Expected performance of each required security control; measurable outcomes; remedies and response requirements for non-compliance |
| **Escalation process** | Problem resolution and incident response on a pre-defined path, to minimise impact on CSB |
| **Right to audit** | CSB must reserve the right to audit responsibilities defined in the SLA, to have those audits carried out by an independent third party, and to enumerate the statutory rights of auditors |

CSB should also ensure the provider’s contingency plan and backup process are adequate, and should monitor security-control compliance of providers and users actively and periodically.

## Residual CSB ownership (s.14.2 last)

Security roles of the provider, CSB, and end users for the outsourced system should be clearly defined and documented. **Although an information system can be outsourced, the overall responsibility of the information system remains under CSB.** That is the sentence that matters. IS Owners still ensure CIA of systems under their control including outsourced ones (s.6.1.7).

Network communication with external parties (NGOs, Government-related organisations, outsourcers) is treated as **un-trusted** (s.19.8.2).

## Remove unauthorised materials (v1.1 → s.14.2)

Project owners should check and remind outsourcing contractors to ensure that **any unauthorised materials are removed from their government computers**. This sentence was added in revision 1.1 (May 2008). It sits with the unauthorised-software ban ([[copyright-compliance]]) and with contractor patching ([[patch-management]]).

## Related

[[01-management-outsourcing]] · [[information-system-owner]] · [[copyright-compliance]] · [[compare-roles]]
