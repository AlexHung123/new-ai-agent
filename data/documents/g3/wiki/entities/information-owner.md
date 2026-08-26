---
title: Information Owner
created: 2026-08-21
updated: 2026-08-21
type: entity
tags: [role]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 5.3.2, 11.1, 16.1, 16.2, 16.3
confidence: high
contested: false
---

# Information Owner

Information Owners are the collators and owners of information stored in information systems (G3 s.5.3.2). Their primary responsibility is to determine:

- the data classifications;
- the authorised data usage;
- the corresponding security requirements for protection of the information.

Access rights to information are not granted unless authorised by the relevant information owners. Owners should determine access-control rules, access rights, and restrictions for specific user roles; the level of detail should reflect the associated information-security risks (G3 s.11.1(b)). See [[classified-information]], [[least-privilege]], and [[compare-roles]].

G3 names this role **Information Owners**, not “Information System Owners”. Application development and maintenance teams liaise with the Information Owner to define and implement system security requirements during development and maintenance (G3 s.5.3.4).

## Production data, testing, and cataloguing

In system specification and design, the Information Owner is the counterpart for evaluating data sensitivity: security level, origin of data, which grades of staff may access or manipulate which fields, auditability, volumes, backup copies, and backup/archive frequency (G3 s.16.1(b)).

**Production data shall not be used for testing.** Operational databases containing personal or classified information should be avoided for testing. If that cannot be avoided, the process shall be reviewed and documented, and **proper approval shall be obtained from the Information Owner**. Personal data shall be de-personalised before use; classified information shall be removed or modified beyond recognition; the data should be cleared immediately after testing (G3 s.16.3(a)).

**Program cataloguing:** application development and system support staff shall not access classified information in production systems unless **approval from the Information Owner** is obtained. Cataloguing should be enforced so development or maintenance staff cannot introduce source or object into the production library, or copy from it; a control unit performs those moves (G3 s.16.2(f)). See [[security-by-design]].

Classified information shall not be copied to the testing environment unless approved by the Information Owner **and** equivalent security controls are implemented in the testing system (G3 s.16.2(d)).

## Related

[[classified-information]] · [[ditso]] · [[security-by-design]] · [[least-privilege]] · [[compare-roles]] · [[12-development]]
