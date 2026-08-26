---
title: Network protection — general controls
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, network, encryption, classification, policy, guideline]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 11.1, 19.1
confidence: high
contested: false
---

# Network protection — general controls

Part II s.11.1 is the “shall”; Part III s.19.1 is the how. The architectural fact is that the **CSB Departmental Network is un-trusted** (DITSP s.19.1.2). CONFIDENTIAL / RESTRICTED in transit over it must be encrypted. TOP SECRET / SECRET may move only encrypted **inside an isolated LAN** approved by the [[government-security-officer]] with [[ogcio]] technical endorsement (DITSP s.11.1.9–11.1.10; SR Chapter IX). Internet, email, malware and wireless/remote are split pages.

## Section map

| DITSP | Topic |
| --- | --- |
| 11.1.1 | Internal addresses not public without [[ditso|Division DITSO]] [A] |
| 11.1.2 | Protect links to other Government or public networks [A] |
| 11.1.3 | Prevent unauthorised remote access [A] |
| 11.1.4 | No simultaneous external + LAN connection without DITSO [U] |
| 11.1.5 | No unauthorised device on a Government IS [U] |
| 11.1.6 | Configuration reviewed regularly [A] |
| 11.1.7 | Links shall not compromise the other network [A] |
| 11.1.8 | Privately owned kit on internal net needs DITSO [U] |
| 11.1.9 | CONFIDENTIAL / RESTRICTED encrypted on un-trusted nets [A] [U] |
| 11.1.10 | TOP SECRET / SECRET encrypted inside isolated LAN only [A] [U] |
| 19.1 | Simple perimeter; authorised traffic; layered auth; NMS; proven crypto |
| 19.1.1 | Two-tier firewall / DMZ; IDS/IPS; enterprise-managed security software |
| 19.1.2 | Trusted vs un-trusted; CSB departmental network is un-trusted |

## Connection and device rules (s.11.1.1–11.1.8)

Internal network addresses, configurations and related system or network information shall not be publicly released without Division DITSO approval (DITSP s.11.1.1).

Staff shall not connect a workstation to an external network (dial-up modem, wireless interface, broadband) **while that workstation is also connected to a LAN or other internal network**, unless Division DITSO approves (s.11.1.4). The same officer approves any unauthorised Information System device (s.11.1.5) and any privately owned computer resource on the Government internal network; personal kit must then conform to DITSP (s.11.1.8).

Internal networks that connect to other Government networks or publicly accessible networks shall be properly protected (s.11.1.2). Measures shall prevent unauthorised remote access to systems and data (s.11.1.3). Configuration and administration shall be reviewed regularly (s.11.1.6). A connection shall not compromise information processed on the other network, and vice versa (s.11.1.7).

## Firewall, IDS/IPS, enterprise management (s.19.1.1)

If a wide-area connection is needed, restrict access through a single rigorously controlled, password-protected host acting as a firewall. Compromise of that host can compromise everything behind it.

A **two-tier firewall** should further protect mission-critical systems: an external firewall protects a DMZ from the Internet; an internal firewall protects internal networks. If DMZ servers are compromised, the internal firewall still stands. (Footnote 8 on DMZ is not in this conversion.)

**IDS** watches packets and alerts IT administrators of break-in or denial-of-service attempts. **IPS** does the same and can stop the source. Both need signature tuning to cut false alarms.

When buying personal firewall or malicious-code software, prefer products that support **enterprise management** (central console: remote update, policy enforcement, status, reports). Enterprise management does not move residual duty: the data owner still protects data, systems and network.

Design heuristics (s.19.1): keep the network simple (minimise interface points between “secured” and “non-secured”); allow only authorised traffic; use multiple authentication mechanisms (e.g. password plus pre-registered IP/IPX plus MAC/terminal); manage with a network management system; encrypt with a proven algorithm before transmit.

## Trusted vs un-trusted; classified transmission (s.11.1.9–11.1.10, 19.1.2)

Per Security Regulations, TOP SECRET / SECRET shall be transmitted **only when encrypted and inside an isolated LAN** approved by the Government Security Officer subject to OGCIO technical endorsement. An **isolated LAN** is a LAN in a single controlled environment with **no** connection to any other network — including other government networks, the Internet, and remote access (DITSP s.19.1.2).

CONFIDENTIAL / RESTRICTED **must** be encrypted when transmitted over an **un-trusted** communication network. Examples of un-trusted networks (s.19.1.2):

- General purpose local area network (footnote 9 missing)
- Internet
- Leased line
- Public telecommunication line
- Dial-up
- Third-party managed network
- Wireless network
- Metro Ethernet

**The CSB Departmental Network is un-trusted**, because it serves all CSB users for daily general-purpose use.

A **trusted** communication network (SR Chapter IX FAQ, restated s.19.1.2) must meet **all** of:

1. Protected within a physically secured area so data in transit cannot be accessed, modified or deleted by an unauthorised person.
2. Well secured from unauthorised tampering (e.g. locking of network equipment, Software Asset Management, protection of LAN ports).
3. Equipped with a well-defined security policy controlling configuration and administration of network equipment and settings.

Classification branching for email, wireless and storage: [[compare-classification-controls]] and [[encryption]]. Remote and wireless use of un-trusted nets: [[06-network-wireless-remote]].

## Related links

[[06-network-internet-email]] · [[06-network-malware-patch]] · [[06-network-wireless-remote]] · [[ditso]] · [[classified-information]] · [[encryption]] · [[government-security-officer]] · [[ogcio]] · [[compare-classification-controls]]
