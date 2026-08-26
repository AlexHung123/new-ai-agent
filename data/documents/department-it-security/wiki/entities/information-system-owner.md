---
title: Information System Owner
created: 2026-08-21
updated: 2026-08-21
type: entity
tags: [role]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 5.4, 6.1.4, 6.1.5, 6.1.6, 6.1.7, 6.2, 14.1, 14.2, 14.3.1, 18, 20.2, 21.5
confidence: high
contested: false
---

# Information System Owner

Information System Owners are the collators and owners of information stored in databases and data files. Their primary duty in the CSB Information Security Management Framework is to determine the **security requirements, classifications, usage, and protection** of that information, and to lead establishment of IT security procedures for their system (DITSP s.5.4). See [[compare-roles]], [[classified-information]], and [[01-management]].

## Policy-tagged duties (DITSP s.6.1)

Tagged **[M – IS Owner]**:

- keep an inventory of hardware assets, software assets, valid warranties, and maintenance agreements (s.6.1.4);
- apply [[segregation-of-duties]] so no single person executes all security functions of a system (s.6.1.5);
- enforce [[least-privilege]] when assigning resources and privileges, including type of access (s.6.1.6, s.14.1.6);
- ensure confidentiality, integrity, and availability — and all other security aspects — of systems under their control, **including outsourced systems** (s.6.1.7);
- select staff who use or have unescorted access, notify them of authorisation, and apply the same security duties to consultants, contractors, and temporary staff (ss.6.1.12, 6.2.3).

Outsourcing does not move residual ownership. Third parties observe DITSP; overall responsibility remains under CSB (ss.6.2, 14.2). See [[outsourcing-security]].

## System policy and procedures

For a system with higher security requirements, the owner establishes a system-specific IT security policy, with technical help from the [[itmu-security-team|CSB ITMU Security Team]] and IT support staff, and **submits it to the [[ditso|Division DITSO]]** for approval against DITSP (s.14.1.1). Owners lead working-level procedures (account management, passwords, configuration, backup, incident response) and **are authorised to endorse** those procedures. Users must have read and understood the policy and procedures before access is granted. Dissemination and acknowledgement of system-specific policy belong in the operation manual (s.14.1.2). Security requirements belong in early design and, if development is outsourced, in the contract and SLA (s.18). Shared or group IDs, if the Division DITSO excepts them, still need the owner’s justification against the risk (s.16.1).

Owners determine whether the [[disaster-recovery|DRP]] is adequate, keep it current, and set drill frequency (s.14.3.1). They review system-specific policy regularly and **lead follow-up** for their systems after SRA/audit and after incidents (ss.14.1.3, 20.2). They prepare the Post-Incident Report; for minor incidents they work with the Division DITSO on aftermath (s.21.5). See [[security-risk-assessment]] and [[incident-handling]].

## Related

[[ditso]] · [[dso]] · [[itmu-security-team]] · [[classified-information]] · [[outsourcing-security]] · [[compare-roles]]
