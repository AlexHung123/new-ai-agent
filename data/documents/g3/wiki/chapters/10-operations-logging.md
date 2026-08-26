---
title: Operations — logging, retention, and clock sync
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, logging]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 14.4
confidence: high
contested: false
---

# Operations — logging, retention, and clock sync

G3 s.14.4. Hub: [[10-operations]]. Shared-account *approval* is on [[07-access-control]]; this page is the inventory and the CONFIDENTIAL+ audit trail. Clock and log integrity support incident investigation.

## Section map

| G3 | Topic |
| --- | --- |
| 14.4(a) | Documented logging policy; minimum events; no user profiling; email/Internet logs ≥6 months; endpoint upgrade plan; centralised log management; clock sync; shared-account inventory; CONFIDENTIAL+ and standalone-PC audit trails |

## Purpose and granularity (G3 s.14.4(a))

An audit trail shows day-to-day system use. Depending on configuration, logs may show a range of access attempts from which abnormal usage can be derived. More complicated applications should have their own auditing or tracing — essential for highly secure applications, because operating-system tracing may not be fine-grained enough. There is virtually no limit to recording individual access and updates, but logging routine use wastes resources and can hide irregularities in volume. Self-developed audit trails should therefore **focus on failed transactions and unauthorised-access attempts**.

Transaction logs can include unauthorised update/access; start/end date and time; user identification and sign-on/sign-off (for illegal logon); connection session or terminal; and computer services such as file copying and searching.

## Logging policy and minimum events

B/Ds **shall define and document** logging policies (including retention period) according to business needs and data classification. The policies **shall** include, but are not limited to, a requirement to log:

- Attempts to log in
- Attempts to change passwords
- Access attempts to **critical files** (software configuration files, password and key files, and similar)
- Use of **privileged rights** such as addition and deletion of user accounts
- Changes to user access rights
- Modification to **audit policy**
- Activation and de-activation of **protection systems** (anti-malware, intrusion detection, and similar)

Failure to log the above **shall be justified and documented**. Logged information should at minimum let the B/D audit the effectiveness of security measures (for example logical access control) if a policy violation is detected. Detail should be commensurate with business needs and classification.

**Logs shall not be used to profile the activity of a particular user** unless it relates to a necessary audit activity or incident handling **approved by a Directorate officer**.

## Email, Internet, removable media, printers

Logs of the **Approved Email System** and **Internet access service** centrally provided by DPO or B/Ds **shall** be recorded.

| Log | Fields that shall be included | Further fields that should be logged |
| --- | --- | --- |
| Email | Sending date/time, client IP address, sender and recipient addresses, total email size | Subject; attachment name and size; events such as read, delete, unauthorised access |
| Internet access | Access date/time, client IP address, website or URL | — |

Uncontrolled use of removable media and printers poses a data-leakage risk. B/Ds should prevent [[classified-information|classified data]] being transferred through printers or removable media for unauthorised use. Controls should include blocking unauthorised removable media (USB storage), and logging printing and file-transfer to removable media. Depending on system criticality, data sensitivity, and incident impact, B/Ds **shall have an upgrade plan** for endpoint-protection solutions on servers, workstations, and mobile devices — in particular crucial systems — if those controls cannot be implemented on existing systems.

## Retention, protection, centralisation

Logs **shall** be retained for a period commensurate with their usefulness as an audit tool, and sufficient to support investigation of a security breach. For the Approved Email System and Internet access service centrally provided by DPO or B/Ds, retention **shall be no less than six months**. During retention, logs **shall** be secured so they cannot be modified and can be read only by authorised persons. B/Ds should consider **centralised log management**. They **shall** regularly review retention period and storage capacity.

When defining and reviewing logging policies, consider:

- **Generation** — which equipment and components produce logs; event types; detail (username, source IP, timestamps); clock-synchronisation requirements.
- **Transmission** — which components send logs to central infrastructure; protocols; frequency (real-time, hourly, and similar).
- **Storage and disposal** — access control; space; rotation criteria; retention by system risk level.
- **Analysis** — roles; events that trigger alerts; events to analyse; review frequency; handling of suspicious and abnormal activity.

## Shared accounts and classified audit trails

If shared accounts are used, the system/security administrator should maintain and periodically update an **inventory** of shared/group accounts: system name, person who can share, shared user-ID, permissions, valid period, and reason for sharing — so an individual can be traced at a given time. Shared-ID *approval* remains with [[ditso|DITSO]] (G3 s.11.2(d)).

Systems containing information classified as **CONFIDENTIAL or above shall enable an audit trail on all shared access** to the data.

Audit trail and logging **shall** be enabled on a **standalone PC or workstation** when classified data is stored on its hard drive. Sufficient disk shall be available for log retention per the departmental policy.

## Clock synchronisation

Information systems **shall** synchronise their clock with a trusted time server periodically (**at least once per month**). B/Ds should use the clock-synchronisation service from **GNET** or the **Hong Kong Observatory** time server via NTP. Authentication in NTP can be considered. System time need not be identical on every machine; keep deviation within a reasonable limit for the system's precision. A synchronised clock gives audit trails a trusted timestamp, eases event correlation, and makes trails more credible in investigations.

GNET NTP: ITG InfoStation GNET value-added services. HKO: `https://www.hko.gov.hk/en/nts/ntime.htm`.

## Related

[[ditso]] · [[classified-information]] · [[10-operations]] · [[07-access-control]] · [[14-incident]]
