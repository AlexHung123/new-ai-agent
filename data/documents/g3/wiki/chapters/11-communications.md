---
title: Network protection, inter-B/D links and classified transmission
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, network, encryption, classification, policy, guideline]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 15.1(a-c), 15.2(a)
confidence: high
contested: false
---

# Network protection, inter-B/D links and classified transmission

G3 s.15 requires B/Ds to secure information transferred inside Government and with external parties. This page is the perimeter and classified-in-transit hub: s.15.1(a–c) and s.15.2(a). Wireless: [[11-communications-wireless]]. Internet, gateway and email: [[11-communications-internet-email]]. Encryption floors: [[encryption]] and [[classified-information]].

## Section map

| G3 | Topic |
| --- | --- |
| 15.1(a) | Keep the network simple; authorised traffic only; encrypt in transit; classify diagrams |
| 15.1(b) | No unauthorised (incl. privately owned / ESP) kit; two-tier firewall / DMZ; NIDS/NIPS; segment by trust; admin consoles; wireless via VPN gateway; no simultaneous internal + external without [[ditso\|DITSO]] |
| 15.1(c) | Inter-B/D: stronger side dominates if provider stronger; if weaker, SRA then reconcile; incoming from other B/Ds un-trusted |
| 15.2(a) | Higher than CONFIDENTIAL: isolated wired LAN only; C/R should encrypt on any net, **shall** encrypt on un-trusted; trusted-net test |

## General network protection (s.15.1(a))

On networked or distributed applications the interconnecting network is as important as the hosts, especially on public WANs. Weigh the risk of outside connections against the benefit; it may be desirable to limit outside links to hosts that do not store sensitive material and keep vital machines isolated.

- **Keep the network simple** — minimise interface points between the “secured” network and other networks.
- **Allow only authorised traffic** into the secured network.
- Use multiple authentication mechanisms (e.g. password plus pre-registered IP and/or MAC address).
- Encrypt with a **proven algorithm** before transmitting.
- Keep network diagrams, internal addresses and configurations **up to date**, **appropriately classified** and securely stored. Disclose only on a need-to-know basis with records. Do not release publicly without prior approval.

## Network security controls (s.15.1(b))

Users **shall never** connect unauthorised computer resources — including **privately owned** kit and kit owned by **external service providers** — to the government internal network unless [[ditso|DITSO]] approves for operational necessity. Approved kit **shall** then meet the same IT security requirements.

If a WAN connection is needed, restrict all access through a **dedicated gateway** acting as a firewall: rigorously controlled, password-protected, and configured to admit only legitimate external traffic. Compromise of that host can compromise everything behind it.

A **two-tier firewall** should further protect systems: an **external** firewall protects a DMZ from the Internet; an **internal** firewall protects internal networks. If DMZ servers are compromised, the internal firewall still stands.

B/Ds **shall** implement an intrusion-detection strategy by installing **NIDS or NIPS** at **critical nodes**. IDS watches packets and alerts; IPS can also stop or minimise the attack. Both need signature tuning to cut false alarms.

B/Ds have overall responsibility to protect data, systems and networks. Configure systems securely (unused services off); review configurations regularly. Enterprise-managed security software (central console for firewall, malware tools, etc.) should be used so policy, signatures and updates are standardised.

**Segment** networks into domains by trust (e.g. public-access, desktop, server), physically or logically (e.g. VPN). Cross-network connectivity should be need-based. Define each domain’s perimeter; control access at the perimeter with a gateway (firewall, filtering router). Segregation criteria and gateway access should follow G3 s.11 (access control) plus classification of the information processed, and the cost/performance of the gateway.

Mobile devices can become a breach point. Users **shall not** connect workstations or mobile devices to an **external** network **while they are also connected to a government internal network**, unless DITSO approves.

**Administrative consoles and management interfaces shall not be accessed directly from the Internet** where technically feasible.

Treat wireless access to classified information as **un-trusted**. Access to internal systems via wireless **shall** go only through a **designated gateway** (e.g. VPN gateway) with authentication, encryption, user-level network access control and logging. Detail: [[11-communications-wireless]].

## Communications with other networks (s.15.1(c))

A connection **shall not** compromise information processed on the other network, and vice versa. Agree security requirements with the other B/D or external party **before** connecting. Implement measures so the departmental system’s security level is **not downgraded**. If the two sides differ, **the stronger protection is adopted on both sides**.

When two B/Ds must inter-communicate with different requirements:

| Case | What happens |
| --- | --- |
| Provider **stronger** than users from other B/Ds | Provider’s requirements **dominate**. Other B/Ds follow. |
| Provider **weaker** than users from other B/Ds | Provider **should perform an SRA**. If no change is needed, reconcile: alternative access channels, or ask the higher-requirement users to accommodate the laxer bar. If the SRA says strengthen, implement the extra controls, then reconcile any remaining higher-requirement users the same way. |

When a B/D hosts a system for users of **other B/Ds**, treat incoming requests as coming from **un-trusted** networks. Apply application-specific controls; add measures for proper user behaviour (e.g. auto session timeout) instead of assuming other B/Ds’ users will follow their own policy.

## Transmission of classified information (s.15.2(a))

Information classified **higher than CONFIDENTIAL shall** be transmitted **only when encrypted and inside an isolated wired LAN** approved by the Government Security Officer with the technical endorsement of [[dpo|DPO]]. An **isolated LAN** is a LAN in a **single controlled environment** with **no** connection to any other network — including other government networks, the Internet, and remote access.

CONFIDENTIAL / RESTRICTED **should** be encrypted on **any** communication network. C/R **shall** be encrypted when transmitted over an **un-trusted** network. Examples of un-trusted networks (G3 s.15.2(a)):

- Internet
- A network that uses a public telecommunication line (e.g. leased line, dial-up)
- Wireless communication
- Metro Ethernet

A network is **trusted** only if it meets **all** of:

1. Protected within a **physically secured area** so data in transit cannot be accessed, modified or deleted by an unauthorised person.
2. **Secured from unauthorised tampering** (e.g. locking of network equipment, protection of LAN ports).
3. Equipped with a **well-defined IT security policy** controlling configuration and administration of network equipment and settings.

Anything that fails that test is un-trusted. Transmission over any network can be captured; B/Ds should SRA the trustworthiness of the network in use and consider encryption at data, application or network level.

## Related links

[[ditso]] · [[dpo]] · [[encryption]] · [[classified-information]] · [[11-communications-wireless]] · [[11-communications-internet-email]] · [[wireless-security]] · [[compare-classification-controls]]
