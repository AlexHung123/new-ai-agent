---
title: WLAN threats and controls
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, wireless, network, encryption, classification]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 15.1(d-g)
confidence: high
contested: false
---

# WLAN threats and controls

G3 s.15.1(d–g) is the air-interface chapter. Perimeter and trusted-net test: [[11-communications]]. Encryption and SR grade: [[encryption]], [[compare-classification-controls]]. Concept: [[wireless-security]].

## Section map

| G3 | Topic |
| --- | --- |
| 15.1(d) | WLAN (IEEE 802.11); 802.1X / 802.11i; auth + transmission encryption required |
| 15.1(e) | Threats (rogue AP, interception, DoS, fake AP); do not rely solely on WPA3; VPN if classified over WLAN |
| 15.1(f) | Management, technical and end-user controls |
| 15.1(g) | Transmission table by SR grade |

## What WLAN is (s.15.1(d))

Wireless communication moves information without wires. **WLAN** (IEEE 802.11 family: 802.11a/b/g/n and later) is the common office/public wireless LAN. Related standards: **802.1X** (port-based network access control, Ethernet and wireless) and **802.11i** (wireless-specific security that operates with 802.1X).

Wireless communications **connected to the government internal network shall** use sufficient **authentication and transmission encryption**, plus proper security management.

Treat wireless access to internal systems as un-trusted; grant it only through a designated VPN gateway (G3 s.15.1(b) on [[11-communications]]).

## Threats (s.15.1(e))

A wireless signal fills the coverage area and can penetrate walls. WLAN risk = wired-network risk **plus** wireless-protocol weakness.

- Unauthorised access to the internal network through wireless, **bypassing firewalls**.
- Malware on a wireless device introduced into the wired network.
- **Rogue** client devices and access points used to gain access or modify information.
- Interception of classified information that is unencrypted or weakly encrypted.
- **Denial of service** against wireless connections or devices.
- A **fake access point** established to collect traffic.

Review Wi-Fi infrastructure periodically as standards change. **WPA3** should be considered, but **must not be the sole protection** — new weaknesses may appear. If classified data will travel over WLAN, deploy **VPN on top**.

## Controls (s.15.1(f))

Do not rely on technical measures alone. Distinctive items from the G3 lists (not exhaustive):

**Management.** Wireless security policy (what may be transmitted); coverage map of APs and SSIDs to avoid excessive coverage; patch hardware/software; search regularly for rogue APs; SRA/audit; inventory of wireless-interface devices — if one is missing, consider changing keys and SSID; physical security and user authentication; install APs **away from windows and doors**.

**Technical.** Change default SSID (must **not** reflect a B/D, system or product name) and default AP settings; disable unused management protocols; unique strong AP admin passwords; configure SSID, encryption keys and SNMP community strings; **disable SSID broadcast**; disable DHCP and use static IPs; MAC filtering; **do not join WLAN directly to wired networks** — put a firewall or ACL router between the AP and the B/D network; inactivity timeouts; remote logging; **WIDS/WIPS**; VPN on top of WLAN for departmental access; **client-side digital certificates** for mobiles with limited Wi-Fi defences; segment AP coverage to limit DoS; erase keys/certs/passwords on disposal; **disable uPnP** on APs so malware cannot bypass the firewall via connected devices.

**End-user.** Personal firewall on wireless clients; turn off sharing/tethering; do **not** attach a wireless client to the departmental network while it is on a third-party WLAN; VPN to departmental resources; control the wireless interface device (SSID/keys often live on the token); enable wireless only when needed; follow G3 s.14.2 (malware) and the Practice Guide for Mobile Security s.4.

## Transmission over wireless (s.15.1(g))

WLAN is generally **un-trusted** and **shall not** carry classified information without proper controls. Traffic between WLAN and an internal trusted network **shall** be encrypted and authenticated; VPN is the stated end-to-end option.

| Category | Wireless transmission |
| --- | --- |
| **Higher than CONFIDENTIAL** | **Not allowed** |
| **CONFIDENTIAL** | Allowed on a **designated device** with **Head of B/D approval**, sufficient authentication and transmission encryption that meets the CONFIDENTIAL bar, plus **VPN**. Establish key-management and configuration policy. **Wireless keyboards** do **not** need Head of B/D approval if they meet industry authentication/encryption standards **and** [[ditso\|DITSO]] confirms compliance. |
| **RESTRICTED** | Allowed with sufficient auth + encryption meeting the RESTRICTED bar. **Recommend CONFIDENTIAL-level encryption** and similar key/config policy. |
| **Unclassified** | Allowed. Sufficient authentication and transmission encryption **where appropriate**; same key/config discipline. |

## Related links

[[wireless-security]] · [[encryption]] · [[compare-classification-controls]] · [[ditso]] · [[11-communications]] · [[classified-information]]
