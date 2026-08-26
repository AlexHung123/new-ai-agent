---
title: Segregation of duties
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [principle, access-control]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 5.2, 5.3.1, 7.1, 11.2, 16.1
confidence: high
contested: false
---

# Segregation of duties

Segregation of duties is dividing the steps in a function among different individuals so that a single individual cannot subvert a process. There **shall** be sufficient segregation of duties, with roles and responsibilities clearly defined, so as to minimise the chance that a single individual will have the authority to execute and control **all** security functions and/or crucial operations of an information system (G3 s.7.1(b)). See [[01-organisation]] and [[least-privilege]].

## Multiple roles (G3 s.5.2)

In a departmental IT security organisation, multiple roles should not be assigned to an individual unless there is a resource limitation. The sample organisation chart (image) is an example, not a mandated box list. Named splits include [[ditso|DITSO]], information security steering committee, [[dso|DSO]], [[isirt|ISIRT]] Commander, IT security management unit, IT Security Administrators, [[information-owner|Information Owners]], LAN/System Administrators, application development and maintenance, and users (G3 ss.5.2–5.3).

## IT Security Administrator ≠ System Administrator

IT Security Administrators provide security and risk-management support (vulnerabilities, [[patch-management|patching]], access controls and privileges, audit logs, threat intelligence, IDS/IPS). The IT Security Administrator **should not be the same person as the System Administrator**. There should be segregation of duties between those two posts (G3 s.5.3.1). IT Security Administrators manage audit logs but **should not tamper with or change** any audit log. B/Ds **may** appoint an IT Security Auditor to audit the IT Security Administrators.

Special privileges shall be granted on least privilege **and** segregation of duties, and on a user ID different from regular business activities (G3 s.11.2(b)).

## Compensating controls when it is not practicable

Where segregation of duties is not practicable (limited staff or technical limitations), compensating controls **should** be put in place to provide equivalent safeguards — for example, maintaining appropriate logging of critical operations together with random inspection and/or regular review of the log file by an appropriate level of authority (G3 s.7.1(b)).

## Development

Application design should divide critical functions into steps among different individuals (G3 s.16.1(c)). For risky and sensitive systems, programs dealing with very sensitive information may be split into modules assigned to several programmers so that a dishonest programmer does not control the whole program and units can be reviewed in greater detail (G3 s.16.1(e)). [[security-by-design|Program cataloguing]] further separates development staff from production libraries (G3 s.16.2(f)).

## Related

[[least-privilege]] · [[ditso]] · [[information-owner]] · [[password-management]] · [[01-organisation]] · [[03-management]]
