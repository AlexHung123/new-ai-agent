---
title: Least privilege
created: 2026-08-22
updated: 2026-08-22
type: concept
tags: [least-privilege, access-control, principle]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 9.1.8, 11.1.1, 11.2, 14.1.1, 16.2.2
confidence: high
contested: false
---

# Least privilege

B/Ds **shall** enforce the least-privilege principle when assigning resources and privileges of information systems to users (S17 s.11.1.1). Access to information shall not be allowed unless authorised by the relevant [[information-owner|information owners]] (s.11.1.2). Data access rights **shall** be granted on a **need-to-know** basis (s.11.2.2). The use of special privileges **shall** be restricted and controlled (s.11.2.3). See [[07-access-control]].

Need-to-know also applies to all [[classified-information]]: it should be provided only to persons who require it for the efficient discharge of their work and who have authorised access (S17 s.9.1.8).

## Lifecycle

User privileges and data access rights **shall** be clearly defined and reviewed periodically; review frequency defined and documented; approval and review records maintained (S17 s.11.2.4). All user privileges and data access rights **shall** be revoked after a pre-defined period of inactivity or when no longer required (s.11.2.5). Each user-ID **shall** uniquely identify only one user; shared or group IDs need explicit [[ditso|DITSO]] approval (s.11.2.6).

## Least functionality

B/Ds **shall** manage information systems using the principle of **least functionality** with all unnecessary services or components removed or restricted (S17 s.14.1.1). Documentation, program source code, and listings **shall** be restricted on a need-to-know basis (s.16.2.2).

Related split of duties: [[segregation-of-duties]].

## Related

[[07-access-control]] · [[segregation-of-duties]] · [[classified-information]] · [[information-owner]] · [[ditso]] · [[10-operations]]
