---
title: Segregation of duties
created: 2026-08-22
updated: 2026-08-22
type: concept
tags: [least-privilege, role, audit]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 5.2, 5.3.1, 7.1.3, 16.2.4, 16.2.7, 20.2.2
confidence: high
contested: false
---

# Segregation of duties

B/Ds **shall** apply sufficient segregation of duties to avoid the execution of **all** security functions of an information system by a **single individual** (S17 s.7.1.3). In the departmental organisation, **multiple roles should not be assigned to an individual** unless there is a resource limitation (S17 s.5.2). See [[01-organisation]] and [[compare-roles]].

## Security Administrator versus System Administrator

The IT Security Administrator **should not** be the same person as the System Administrator. There **should** be a segregation of duties between the two (S17 s.5.3.1). Although IT Security Administrators are responsible for managing the audit logs, they **should not tamper with or change** any audit log. B/Ds **may** appoint an IT Security Auditor to audit the work of the IT Security Administrators.

LAN/System Administrators implement mechanisms according to procedures established by [[ditso|DITSO]] (S17 s.5.3.3). They are the day-to-day operators, not the policy endorsers.

## Development versus production

The integrity of an application **shall** be maintained with version control and **separation of environments** for development, system testing, acceptance testing, and live operation (S17 s.16.2.4). Application development and system support staff **shall not** be permitted to access classified information in the production systems unless approval from the [[information-owner|Information Owner]] is obtained (s.16.2.7). See [[12-development]].

## Auditors shall not audit their own work

The selection of auditors and conduct of audits **shall** ensure objectivity and impartiality. **Auditors shall not audit their own work** (S17 s.20.2.2). See [[16-compliance]].

## Related

[[least-privilege]] · [[ditso]] · [[01-organisation]] · [[compare-roles]] · [[12-development]] · [[16-compliance]]
