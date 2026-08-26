---
title: Wireless, mobile, VPN and external parties
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, wireless, remote, network, encryption, policy, guideline]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 11.6, 19.6-19.8
confidence: high
contested: false
---

# Wireless, mobile, VPN and external parties

Part II s.11.6 is short (document, monitor, control; authenticate and encrypt). Part III ss.19.6–19.8 is the long how-to: WLAN, mobile, RFID, Bluetooth, remote/VPN/dial-up, VoIP, inter-departmental and external parties. Depth on air interfaces: [[wireless-security]]. Trusted vs un-trusted definition: [[06-network]]. Classification table: [[compare-classification-controls]].

## Section map

| DITSP | Topic |
| --- | --- |
| 11.6.1 | Document, monitor and control wireless nets linked to Government internal [A] |
| 11.6.2 | Authentication and encryption on those wireless nets [A] [U] |
| 19.6.1 | WLAN threats; WEP weak; WPA/WPA2 not sole; VPN if classified |
| 19.6.1.3 | TS/SECRET not on WLAN; CONF/RESTRICTED allowed with sufficient crypto |
| 19.6.2 | Mobile computing devices |
| 19.6.3–19.6.4 | RFID and Bluetooth (summarised; see [[wireless-security]]) |
| 19.7 | Un-trusted remote access; no cybercafé without VPN+2FA |
| 19.7.1–19.7.3 | Home/remote, dial-up, VPN (no split tunnelling) |
| 19.7.4 | VoIP (summarised) |
| 19.8.1–19.8.2 | Inter-departmental (S17; stronger provider wins); external parties un-trusted |

## Wireless LAN (s.11.6, 19.6.1)

CSB shall document, monitor and control wireless networks that connect to the Government internal network, and shall employ proper authentication and encryption (s.11.6). WLAN (IEEE 802.11 family; 802.1X / 802.11i) is an **un-trusted** net (s.19.1.2, s.19.6.1.3). Traffic between WLAN and an internal trusted net must be encrypted and authenticated; VPN is the stated end-to-end option.

Threats: bypass of firewalls; malware from a wireless device into the wired net; rogue APs and clients; interception of weak or missing crypto; DoS. **WEP is weak** — a moderately skilled attacker can break it. **WPA / WPA2 should be considered but must not be the sole protection**; new weaknesses may appear. If classified data will travel over wireless, deploy **VPN on top** (s.19.6.1.1).

Management: wireless security policy (what may be transmitted); regular search for rogue APs; SRA/audit; inventory of wireless NICs — if a device is missing, consider changing keys and SSID; physical security and user authentication; **do not install APs near windows or doors**.

Technical: change default SSID (must not reflect a CSB system or product name) and default AP settings; configure SSID, keys, SNMP community strings; change keys regularly; disable SSID broadcast and DHCP (static IPs); MAC filtering; firewall/router between AP and bureau net; IDS/IPS on the wireless net; VPN; segment coverage to limit DoS. Clients: personal firewall; turn off sharing; control PCMCIA/wireless cards (SSID/keys live on the card); enable wireless only when needed; AV per s.19.4.

### Classification on WLAN (s.19.6.1.3)

| Category | Wireless transmission |
| --- | --- |
| TOP SECRET | **Not allowed** |
| SECRET | **Not allowed** |
| CONFIDENTIAL | Allowed if authentication and encryption meet the CONFIDENTIAL bar; VPN recommended; key management and configuration policy |
| RESTRICTED | Allowed with sufficient auth+encrypt meeting the RESTRICTED bar; **recommend CONFIDENTIAL-level encryption** and similar key/config policy |
| Unclassified | Allowed with sufficient auth+encrypt where appropriate; same key/config discipline |

SR Chapter IX technical notes are cited; CCGO URLs in the 2008 text are historical.

## Mobile computing (s.19.6.2)

Laptops, tablets, PDAs and PDA phones: do **not** leave unattended without physical measures (e.g. cable lock). Inventory authorised devices; label with user identity; educate users; include mobiles in SRA.

Technical: password-protect; **encrypt classified data** in storage and before transmit over un-trusted nets (SR / [[encryption]]); AV with current signatures where feasible; **full system scan before joining Government networks**; personal firewall; **disable IR and Bluetooth when unused**; password prompt on sync; do not store other-system passwords without protection; consider biometrics / tamper-proof smart cards.

## RFID and Bluetooth (s.19.6.3–19.6.4)

Summaries only — full control lists on [[wireless-security]].

**RFID** (tag, reader, back-end database): tags are open to physical attack, counterfeiting, spoofing, eavesdropping and traffic analysis. Mitigations in the booklet: password on tag data; physical lock of tag memory; asymmetric crypto; reject anomalous reader timings/power; verify reader identity to the application server; detect unauthorised reads; PIN-protected “kill”; Faraday-cage shielding; firewall/AC/encrypt the back-end. No generic solution — cheap passive tags cannot do standard crypto; evaluate cost vs capability.

**Bluetooth** (IEEE 802.15 WPAN; Security Modes 1 non-secure / 2 service-level / 3 link-level). Connection of mobiles to Government networks is **business-only**. Apply s.19.6.2 plus: obfuscated device ID (must not reveal Government/bureau); pair only known devices; hard-to-guess PIN, never leave default `0000`; maximum encryption key size and a minimum for negotiation; non-discoverable; un-pair if lost/stolen; do not accept files from unknown entities; power-on password. (Footnote 11 on range is missing.)

## Remote access, dial-up, VPN (s.19.7)

Un-trusted examples and the trusted-network test are on [[06-network]] (s.19.1.2). Connection from a **public area** (cybercafé, shopping-mall WLAN) should be **avoided**. If business need exists, implement **VPN to encrypt traffic and two-factor authentication**. **pcAnywhere / VNC** (and similar remote-access software) is **not recommended** — it can back-door firewalls. If used, require logging and idle timeout.

**Remote / home office (s.19.7.1).** Connect via CSB-provided **VPN**. Users shall **never install their own modems or remote-access devices** unless [[ditso|Division DITSO]] permits. Remote hosts: personal firewall, AV (always on, current signatures), latest patches, full scan before joining the Government net. Minimise Government data stored locally; avoid sensitive documents and public printers in public places; password screen-saver; do not leave the machine unattended.

**Dial-up (s.19.7.2).** Authorised personnel only; keep an inventory of access points and modem lines; authenticate; change dial-up passwords regularly; two-factor may be needed. Callback (modem hangs up and dials a pre-registered number) helps but is **vulnerable to call forwarding** — combine with other controls (e.g. 2FA) for sensitive environments. Logs: date, time, duration, staff name, connected port; available to the supervisor.

**VPN (s.19.7.3).** Tunnel over un-trusted net (IPSEC, L2TP, PPTP; also SSL-VPN without a fat client). Required practice:

- Authenticate with one-time password/token **or** public/private key with a strong passphrase.
- **Idle disconnect**; user must log on again.
- **No split (dual) tunnelling** — only one network connection.
- Personal firewall + AV + current patches, all active.
- Log connections and unauthorised attempts; review regularly.
- Non-Government equipment must be configured to DITSP.
- Account holder is accountable; no sharing.
- Gateway firewall to limit VPN clients to authorised systems.

## VoIP (s.19.7.4)

Summarised. VoIP (H.323 or SIP, or proprietary) is more exposed than a PBX: voice packets traverse many hops; virus, DoS and man-in-the-middle apply. If used: logical separation of voice and data; at the PSTN voice gateway, disallow H.323/SIP from the data net; strong auth and AC on the gateway; firewall the VoIP traffic; IPSEC or SSH for remote management; encryption/tunnelling if needed; physical security of servers/gateways (traffic analysis even if encrypted); softphones get personal firewall, patches and AV (footnote 12 missing); **voice contingency** if VoIP fails.

## Other parties (s.19.8)

**Inter-departmental (s.19.8.1).** All Government IS and users still meet Baseline IT Security Policy **[S17]**. Where two bureaux differ:

- Provider **stronger** than the user’s home department → **provider wins**; the other B/D’s users follow.
- Provider **weaker** → provider runs an SRA. If it does not raise its bar, it reconciles (alternative access channel, or ask the stricter users to accommodate). If it does raise its bar and some users are still stricter, same reconciliation.

Incoming requests from other B/Ds are treated as from **un-trusted** networks. Do not assume those users will follow their own policy — e.g. auto session timeout.

**External parties (s.19.8.2)** — NGOs, Government-related organisations, outsourcers, third-party providers — are **un-trusted**. Apply DITSP and application-specific controls. See [[outsourcing-security]].

## Related links

[[wireless-security]] · [[06-network]] · [[encryption]] · [[classified-information]] · [[ditso]] · [[compare-classification-controls]] · [[malware]] · [[outsourcing-security]] · [[security-risk-assessment]]
