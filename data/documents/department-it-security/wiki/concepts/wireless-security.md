---
title: Wireless security
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [wireless, network]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 11.6, 19.6
confidence: high
contested: false
---

# Wireless security

CSB shall document, monitor, and control wireless networks that connect to the Government internal network (DITSP s.11.6.1) [A]. Proper **authentication and encryption** shall protect data communication on those wireless networks (s.11.6.2) [A] [U]. Guidelines: s.19.6. Hub: [[06-network-wireless-remote]]. Grade matrix: [[compare-classification-controls]]. WLAN is an un-trusted network ([[classified-information]], s.19.1.2).

This page is a **2008 snapshot** (802.11a/b/g, WEP/WPA, PCMCIA cards). Current Digital Policy Office / SR Chapter IX texts outrank it.

## WLAN threats (s.19.6.1.1)

Wireless signal fills the coverage area and can pass walls. WLAN risk equals wired-network risk **plus** wireless-protocol weakness. Listed threats:

- unauthorised access that bypasses firewalls;
- malware on a wireless device then introduced to the wired network;
- rogue client devices and access points;
- interception of unencrypted (or weakly encrypted) traffic;
- denial-of-service against the wireless link or device.

**WEP is weak.** It was meant to match wired equivalent privacy; attackers with modest tools can break it. Stronger protocols (WPA or WPA v2 in this compilation) should be considered, but **must not be solely relied on** — new weaknesses may appear. If classified data will move over wireless, CSB should deploy **VPN on top of the wireless network**.

## Classification table (s.19.6.1.3)

| Grade | Wireless transmission |
| --- | --- |
| **TOP SECRET** | **Not allowed** |
| **SECRET** | **Not allowed** |
| **CONFIDENTIAL** | Allowed if authentication and transmission encryption meet the CONFIDENTIAL bar; **VPN recommended**; key management and configuration policy required |
| **RESTRICTED** | Allowed if authentication and encryption meet the RESTRICTED bar; **recommend CONFIDENTIAL-level encryption** and similar key/configuration policy |
| Unclassified | Allowed with sufficient authentication and encryption where appropriate; same key/configuration discipline |

Network traffic between WLAN and the internal trusted network must be encrypted and authenticated (s.19.6.1.3). Policy s.11.1.9–11.1.10 still governs transit: CONFIDENTIAL/RESTRICTED encrypted on un-trusted; TOP SECRET/SECRET isolated LAN only ([[encryption]]).

Headline WLAN controls (s.19.6.1.2): wireless usage policy; hunt rogue APs; inventory wireless NICs and change keys/SSID if a device is lost; do not place APs near windows/doors; change default SSID and AP settings; disable SSID broadcast and DHCP if using static IPs; MAC filtering; firewall between AP and bureau network; IDS/IPS; personal firewall on clients; disable wireless when not in use.

## Mobile computing devices (s.19.6.2)

Laptops, tablets, PDAs, PDA phones: portable, easy to steal, and a path onto Government networks. Safeguard; do not leave unattended; cable locks. Management: authorised-device list and inventory; label with user identity; cover mobile use in SRA. Technical: password-protect; encrypt classified data at rest and in transit per SR; AV with current signatures; full scan before connecting to Government networks; personal firewall; disable unused IR/Bluetooth; prompt for password on synchronisation; do not store other systems’ passwords without protection. Appendix B applies when classified data is on the device ([[annex-portable-devices]]).

## RFID and Bluetooth — short (s.19.6.3–19.6.4)

**RFID.** Tag, reader, back-end database. Unprotected tags are open to physical attack, counterfeiting, spoofing, eavesdropping, traffic analysis. Mitigations in the booklet: password on tag data; physical lock of tag memory; encrypt tag data; reject anomalous reader replies; verify reader identity; detect unauthorised reads; PIN-protected “kill”; Faraday cage; firewall/access control/encryption on the back-end. No generic solution — cheap passive tags cannot do standard crypto.

**Bluetooth** (IEEE 802.15, short-range). Use to connect a mobile device to Government networks is **restricted to business purposes**. Modes 1–3 (non-secure / service-level / link-level). Controls: obfuscated device ID; authenticate to known devices only; hard-to-guess PIN, change default `0000`; maximum encryption key size; non-discoverable; un-pair if lost; do not accept files from unknown entities; power-on password.

## Related

[[06-network-wireless-remote]] · [[compare-classification-controls]] · [[encryption]] · [[annex-portable-devices]]
