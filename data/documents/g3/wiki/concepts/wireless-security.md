---
title: Wireless security
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [wireless, network]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 15.1
confidence: high
contested: false
---

# Wireless security

Wireless communications connecting to the government internal network shall be used with sufficient authentication and transmission encryption, complemented by proper security management (G3 s.15.1(d)). Treat **all wireless access as un-trusted**. Access to internal systems via wireless **shall** be granted only through a designated gateway (e.g. VPN gateway) with authentication, encryption, user-level network access control, and logging (G3 s.15.1(b)). WLAN is generally considered an un-trusted network and **shall not** be used to transmit [[classified-information]] without proper security controls; traffic between the WLAN and the internal trusted network **shall** be encrypted and authenticated. VPN is a viable end-to-end option (G3 s.15.1(g)). See [[11-communications-wireless]] and [[encryption]].

## WPA3 is not sufficient alone

WLAN risks equal wired-network risks **plus** wireless-protocol weaknesses: unauthorised access bypassing firewalls; malware moving from wireless devices onto wired networks; rogue equipment; interception of unencrypted or poorly encrypted classified traffic; DoS; fake access points (G3 s.15.1(e)).

B/Ds shall review Wi-Fi infrastructure periodically against newly found protocol vulnerabilities. Protection by a stronger wireless security protocol such as **Wi-Fi Protected Access 3 (WPA3) should be considered, but by no means should such a protocol be solely relied upon** to protect confidentiality and integrity — new weaknesses may be discovered. B/Ds **should deploy VPN on top of WLANs** if classified data is to be communicated over WLANs (G3 s.15.1(e)).

## Classification table (G3 s.15.1(g))

| Category of information | Wireless transmission |
| --- | --- |
| **Higher than CONFIDENTIAL** | **Not allowed** |
| **CONFIDENTIAL** | Allowed if transmitted using a **designated device** with **Head of B/D approval**, sufficient authentication and transmission encryption at the CONFIDENTIAL level. VPN should provide a strong authentication and encryption tunnel. Proper key management and configuration policies should complement the technical solution. **Wireless keyboards** do not need Head of B/D approval if they meet industry authentication and encryption standards **and [[ditso|DITSO]] confirms** compliance. |
| **RESTRICTED** | Allowed with sufficient authentication and transmission encryption at the RESTRICTED level. Recommend CONFIDENTIAL-level encryption and similar key-management/configuration policies. |
| **Unclassified** | Allowed. Sufficient authentication and transmission encryption where appropriate; similar key-management and configuration policies. |

## Controls worth naming

Management: wireless security policy; coverage map (access points, SSID) to avoid excessive coverage; patch hardware/software; search for rogue APs; inventory wireless-interface devices; physical placement of APs away from windows/doors (G3 s.15.1(f)).

Technical: change default SSID (must not reflect B/D, system, or product name); unique admin passwords; disable SSID broadcast and unused management protocols; MAC filtering; **do not directly connect WLAN and wired networks** (firewall or ACL router between AP and B/D network); WIDS/WIPS; deploy VPN; disable uPnP. End users: client firewall; no tethering; do not attach a wireless client to the departmental network while it is on a third-party WLAN; enable wireless only when needed.

Simultaneous internal-network and external-network connection of a workstation or mobile device needs **DITSO approval** (G3 s.15.1(b)).

## Related

[[classified-information]] · [[encryption]] · [[compare-classification-controls]] · [[ditso]] · [[11-communications-wireless]]
