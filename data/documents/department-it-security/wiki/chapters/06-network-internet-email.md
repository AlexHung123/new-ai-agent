---
title: Internet gateway, email, spam and phishing
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, internet, email, network, policy, guideline]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 11.2-11.3, 19.2-19.3
confidence: high
contested: true
contradictions: [compare-policy-guidelines]
---

# Internet gateway, email, spam and phishing

Part II ss.11.2–11.3 and Part III ss.19.2–19.3 cover Internet path, acceptable use, email, CMS, spam and phishing. General perimeter and classified-in-transit rules sit on [[06-network]]. Malware screening of downloads is also [[06-network-malware-patch]] / [[malware]].

## Contested — Internet path (July 2008 v1.2)

Keep both live clauses. Do not collapse them.

- **DITSP s.11.2.1 [A] (Part II policy):** all Internet access from the CSB departmental network **shall** be made through the **Central Internet Gateway (CIG)**.
- **DITSP s.19.2.1 (Part III guidelines):** all Internet access from the departmental network **must** be made through the **departmental Internet gateway or** CIG.

Same compilation, same date. Policy “shall” is CIG-only; the guideline allows a departmental gateway as an alternative. See [[compare-policy-guidelines]]. For a live system, current [[ogcio]] / Digital Policy Office texts outrank this 2008 snapshot.

## Section map

| DITSP | Topic |
| --- | --- |
| 11.2.1 | Internet via CIG (contested with 19.2.1) [A] |
| 11.2.2 | OGCIO Circular 7/2005 acceptable use [U] |
| 11.2.3 | Screen/verify downloads with AV [A] [U] |
| 11.2.4 | No untrusted mobile code [U] |
| 11.3.1 | Email for business only [U] |
| 11.3.2 | Record, retain, destroy mail and logs [A] |
| 11.3.3 | Screen incoming/outgoing mail for viruses [A] [U] |
| 11.3.4 | Protect internal address lists [A] |
| 11.3.5 | Classified mail only on CMS; TS/SECRET also s.11.1.10 [U] |
| 11.3.6 | Do not open or forward mail from suspicious sources [U] |
| 19.2.1 | Gateway-level protection; departmental gateway **or** CIG |
| 19.2.2 | Personal firewall; browser hardening |
| 19.2.3 | Authorised official use; IM not recommended |
| 19.3 | CMS vs Internet mail; Lotus Notes snapshot |
| 19.3.1–19.3.2 | Server/client; phishing |
| 19.3.3 | Spam; CIG prefix `[Possible SPAM]` |

## Gateway and client (s.11.2, 19.2.1–19.2.2)

The gateway (whichever clause is applied) provides screening routers, firewall or equivalent. It should **deny all Internet services unless specifically enabled**. Unused configurations, services, ports and unnecessary traffic (e.g. daytime service, incoming/outgoing ICMP) should be disabled or blocked. Direct dial-up to an ISP should not be established. Technical detail: OGCIO Internet Gateway Security Guidelines [G50].

Machines that can **simultaneously** use broadband Internet and an internal network are **strictly prohibited** except with proper safeguard and [[ditso|Division DITSO]] approval (s.19.2.1; policy s.11.1.4). Standalone machines (not on the Government or departmental network) that need broadband without CIG/departmental gateway should run personal firewall, anti-virus and user-permission restriction.

Personal / desktop firewalls are recommended on hosts that may connect directly to un-trusted nets (Internet, third-party). Prefer centrally managed agents. Browser hardening (s.19.2.2): disable active content (Java, JavaScript, ActiveX) except to a trusted source; keep the browser patched; disable password auto-complete; enable pop-up blocking except trusted sites; clear cache regularly; disable automatic plug-in install.

Internet services need stronger authentication; one-time password and two-factor authentication may be required for Internet dial-up (s.19.2).

## Acceptable use and instant messaging (s.11.2.2, 19.2.3)

Staff should be authorised to use Government Internet access only if it assists official duties, and should follow OGCIO Circular 7/2005 (*Guidelines on the Acceptable Use of Internet Services*). CSB-specific reminders: comply with SR when transmitting [[classified-information]]; disable password-remembering on web pages; disable Internet connection when not in use; use only personal addresses/identities in public forums; do not visit or download from doubtful sites; follow s.19.4 virus practice.

**Instant messaging** (ICQ, MSN Messenger, Yahoo Messenger, Google Talk — 2008 names) is **not recommended**. Risks: disclosure of sensitive information, malware via IM, monitoring/retention difficulty, unverifiable identity. Business use requires Division DITSO approval. If IM must be used: written usage policy; prefer an enterprise IM solution over public clients; IM gateway to monitor, filter and log; users disable IM network services, enable incoming-file notifications, disable resource sharing and remote mic/camera.

## Email and CMS (s.11.3, 19.3)

CSB email should be used for **business-related purposes only** (s.11.3.1). Formal request is required for an account. Authentication, encryption and digital signature should be available on Internet and internal mail; mail containing sensitive information should be encrypted in transit or storage (s.19.3). Internal product snapshot: Lotus Notes on the Government internal network.

Classified email shall be transmitted **only** on an Information System approved by the [[government-security-officer]] subject to [[ogcio]] technical endorsement — i.e. the **Confidential Mail System**. TOP SECRET / SECRET also follow s.11.1.10 (encrypted inside an isolated LAN) (s.11.3.5). **Internet email, whether signed or encrypted, is not equivalent to CMS**: Internet mail is an open system whose handling and storage among ISPs may be below CMS standard (s.19.3; SR on internal communication).

Administrators shall maintain a systematic process for recording, retention and destruction of electronic mail and accompanying logs (s.11.3.2). Incoming and outgoing mail shall be screened for viruses and malicious code (s.11.3.3). Internal address lists of authorised users or Government sites shall be protected from unauthorised access and modification (s.11.3.4). Mail from suspicious sources should not be opened or forwarded (s.11.3.6).

Server notes (s.19.3.1): standard SMTP has no integrity checking; Internet addresses are easily spoofed; no delivery guarantee. Avoid revealing internal system detail in headers if feasible. Follow the government *Guideline on the Management of Electronic Mail*. Client notes (s.19.3.2): password-protect workstations and mail accounts; ignore or delete chain mail and spam; do not let other programs read the personal address book without authorisation; web-mail browsers must not auto-process attachments. GOA default: automatic virus-signature update; keep auto-protection on.

## Phishing (s.19.3.2)

Phishing is mass fraudulent mail branded as banks, insurers, retailers or card companies, aimed at usernames, passwords, card numbers and similar. **Do not follow URL links from un-trusted or suspicious messages.** Type the URL or use an existing bookmark. For TLS/SSL sites, check the padlock and verify the organisation in the server certificate. Suspect virus or phishing: report to management and LAN/System Administrator and follow [[incident-handling]] / [[08-incident]].

## Spam (s.19.3.3)

Spam is bulk unsolicited electronic messages (email, fax, SMS) sent without consent. Administrators may install a spam-filtering gateway, keep blacklists current, and retain audit logs. Countermeasures: prevent address harvesting; stop third-party relay and open web proxy; DNS blacklists; whitelists; subject/content/heuristic filters.

Users: treat office addresses carefully on web forms; do not publish them as web links; use a separate address for public newsgroups/chat; **never mail-bomb or take vigilante action**; **do not reply to spam** (return addresses are often fake; a reply validates the address). Client-side filters may help. CIG anti-spam: on detection, the Central Internet System prefixes the subject **`[Possible SPAM]`**.

## Related links

[[06-network]] · [[06-network-malware-patch]] · [[ditso]] · [[ogcio]] · [[classified-information]] · [[encryption]] · [[government-security-officer]] · [[malware]] · [[08-incident]] · [[compare-policy-guidelines]] · [[compare-classification-controls]]
