---
title: Internet, gateway, email and external parties
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, internet, email, network, malware, policy, guideline]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 15.1(h-j), 15.2(b-d)
confidence: high
contested: false
---

# Internet, gateway, email and external parties

G3 s.15.1(h–j) and s.15.2(b–d). Perimeter and classified-in-transit: [[11-communications]]. Malware screening: [[malware]]. Classification path: [[classified-information]].

## Section map

| G3 | Topic |
| --- | --- |
| 15.1(h) | DNSSEC; SPF/DKIM/DMARC; HTTPS; personal webmail / public cloud / web IM |
| 15.1(i) | Centrally arranged or B/D gateway; no direct dial-up ISP; standalone broadband; simultaneous broadband + internal; block malicious IPs/sites |
| 15.1(j) | Personal firewalls; browser hardening |
| 15.2(b) | Formal account request; classified mail encrypted; CMS / CMSG / MCMS / CMMP; Internet mail ≠ CMS |
| 15.2(c) | Server/client; no auto-forward of official mail unless security assured |
| 15.2(d) | External parties un-trusted; need-to-know; transfer agreement |

## Internet security (s.15.1(h))

The Internet was not designed to be very secure. TCP/IP services are open to eavesdropping and spoofing; messages, passwords and file transfers can be captured with readily available software.

To enforce authenticity of government Internet resources, resource records of government Internet domains **shall** be protected by **DNSSEC**. All government Internet mails to the public **shall** be protected by prevailing authenticity standards: **SPF, DKIM or DMARC**. **HTTPS shall** be implemented for **all** Internet services, including informational websites. Internet enquiry or transaction processing requires user authentication; one-time password and multi-factor authentication may be required; audit and backup of authentication information may be required.

Promote staff awareness. Improper Internet use can harm government IT and reputation; staff should follow the terms of Government-provided Internet services.

**Personal webmail, public cloud storage and web instant-messaging** introduce significant disclosure and in-transit breach risk. B/Ds **shall critically review** the necessity of access regularly. Grant access **only** for genuine, legitimate need with approval of the **Head of B/D or an explicitly delegated directorate officer**, and revoke promptly when no longer required. Use technical controls such as **web content filtering** to block unauthorised access to those services.

Do not subscribe to online services with a government email address **and** a password reused from a government system. Remind users: unique strong passwords, caution with personal information, MFA if available, vigilance against phishing, and an **email alias** for online-service subscriptions.

## Gateway-level protection (s.15.1(i))

Any B/D that supports Internet facilities **shall** protect its information from unauthorised access or public break-ins. **All Internet access from the departmental network shall** go through **centrally arranged Internet gateways or the B/D’s own Internet gateway**. The gateway should **deny all Internet services unless specifically enabled**. Disable unused configurations, services, ports and unnecessary traffic (e.g. daytime service, incoming/outgoing ICMP). **A direct dial-up connection to an ISP should not be established.** Technical detail: *Practice Guide for Internet Gateway Security* (ITG InfoStation).

Standalone computers **not** on the government or departmental network may have broadband without those gateways **if** firewall, anti-malware and user-permission restriction are in place, plus an approval/control mechanism at the appropriate level.

Computers that can **simultaneously** access broadband Internet **and** an internal network **shall be strictly prohibited** except with proper safeguard **and** [[ditso|DITSO]] approval.

B/Ds **shall block** user access to any IP address or website **known or suspected to be malicious**.

## Client-level protection (s.15.1(j))

LAN/system administrators **shall** install **personal firewalls** on computers that may connect directly to un-trusted networks (Internet, third-party). Prefer centrally managed agents.

Browser hardening (should): disable active content (Java, JavaScript, ActiveX) except to a trusted source; keep the browser patched; disable password auto-complete; enable pop-up blocking except trusted sites; clear cache regularly; disable automatic plug-in/add-on install. Train users.

## Electronic messaging (s.15.2(b))

A **formal request shall** be made for an email account. Authentication, encryption and digital signature should be available on Internet and internal mail. Messaging containing classified information **shall** be encrypted during **transmission or storage**.

Use of **public email** should be restricted unless unavoidable for business. Email transmission of classified information **shall** go only on an information system **approved by the Government Security Officer**. For internal communication, **CMS, CMSG, MCMS, and approved CMMP sub-systems** are the designated systems for **CONFIDENTIAL** mail and documents **within the government network**. Exchange over the **Internet**, whether signed or encrypted, **shall not be assumed equivalent** to CMS or CMMP. Configuration pointers: CCGO CMS and ITG InfoStation CMMP sites (historical URLs in the conversion).

## Email server and client (s.15.2(c))

Configure servers and clients before connecting to the Internet. Standard SMTP has no integrity checking; Internet addresses are easily spoofed; delivery is not guaranteed. If feasible, avoid internal-system detail in headers. Consider audit trails of mail access; establish a documented process for recording, retention and destruction of messages and logs; protect the user address list. Password-authenticate workstations and mail accounts.

Clients should **not** auto-process attachments. Keep anti-malware auto-protection on ([[malware]] / G3 s.14.2). Do not open or forward mail from unknown or suspicious sources; report suspected malware mail; verify sender identity by an alternate channel if in doubt.

Users **should not auto-forward official emails to external email systems** unless the security of that system can be assured. Unencrypted classified content auto-forwarded would violate classified-transmission rules. Mail systems not under Government control add storage risk. Companion: *Practice Guide on the Use of Electronic Mail*.

## Communication with external parties (s.15.2(d))

Treat network communication with NGOs, government-related organisations, outsourcers or ESPs as **un-trusted**. Apply application-specific controls. Pass information **only on a need-to-know basis**. Protection of classified information should comply as far as possible with Government standards.

A **documented agreement** on secure transfer of classified information **shall** be established. It should cover at least: obligation not to disclose to third parties (or indemnity); cryptography and access-control measures; incident liabilities (e.g. data leakage); technical standards for recording or reading the information. Policies for information and physical media in transit should be referenced in the agreement.

## Related links

[[dpo]] · [[classified-information]] · [[malware]] · [[ditso]] · [[11-communications]] · [[encryption]] · [[compare-classification-controls]]
