---
title: Least privilege
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [least-privilege, access-control, principle]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 11.1, 11.2, 14.1, 16.1
confidence: high
contested: false
---

# Least privilege

B/Ds shall ensure that the **least privilege principle** is followed when assigning resources and privileges of information systems to users **and** technical support staff. That means restricting a user’s access (for example to data files, IT services and facilities, or computer equipment) **or type of access** (read, write, execute, delete) to the **minimum necessary to perform his or her duties** (G3 s.11.1(a)). See [[07-access-control]] and [[segregation-of-duties]].

Access rights to information are not granted unless authorised by the relevant [[information-owner|information owner]] (G3 s.11.1(b)). Access rights shall be granted on a need-to-know basis, clearly defined, documented, and reviewed periodically. All administrative privileges and data access rights, including temporary access, shall be reviewed regularly (e.g. at least once annually, preferably twice per year) to revoke unnecessary or excessive privileges (G3 s.11.2(a)). Classified information uses the same “need to know” rule; doubts go to the [[dso|DSO]] (G3 s.9.1(d)).

## Privileged IDs separate from daily work (G3 s.11.2(b))

For accounts with privileged access rights (administrator or system account):

- special privileges and data access rights associated with each system or application, and the users who need them, shall be identified;
- they shall be granted based on least privilege **and** [[segregation-of-duties]];
- they shall be granted to a **user ID different from those used for regular business activities**;
- regular business activities (including email reading, Internet browsing, and file downloading) **shall not** be performed by privileged accounts;
- multi-factor authentication should be adopted for high-risk access.

[[classified-protection|Tier 2]] Appendix C additionally requires independent-party check/audit of privileged-account usage at least every six months, compensating administrative procedures if there is no technical limit on privileged data access, and MFA for interactive logon to privileged accounts where technically feasible.

## Least functionality (G3 s.14.1(a))

Information systems should be configured to provide only essential capabilities and specifically prohibit or restrict functions, ports, protocols, and/or services. Unused or unnecessary physical and logical ports and protocols (e.g. USB, FTP, SSH) should be disabled to prevent unauthorised connection of devices, transfer of information, or tunnelling.

**Both** least functionality and least privilege **shall** be adopted when performing system hardening, assigning resources and privileges, and accessing networks or network services. Application design should run with the least amount of system privilege necessary (G3 s.16.1(c)). IoT user access rights are granted on the same pair of principles (G3 s.11.6(c)). Technical-compliance accounts used for scanning or pentest should be dedicated, least-privilege, and removed or password-reset immediately after the exercise (G3 s.20.2(c)).

## Related

[[segregation-of-duties]] · [[information-owner]] · [[password-management]] · [[ditso]] · [[07-access-control]] · [[10-operations]]
