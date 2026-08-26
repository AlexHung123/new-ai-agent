---
title: Access control — mobile computing, remote access, and IoT
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, access-control, remote, iot]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 11.5-11.6
confidence: high
contested: false
---

# Access control — mobile computing, remote access, and IoT

G3 ss.11.5–11.6. Hub: [[07-access-control]]. Passwords and MFA strength: [[07-access-control-passwords]]. Physical handling of equipment off-site: [[09-physical]]. The **internal-network remote-desktop** paragraph is a v10.2 (April 2025) update.

## Section map

| G3 | Topic |
| --- | --- |
| 11.5(a) | Formal mobile and remote-access policy; MFA for remote access to internal systems |
| 11.5(b) | Home office / remote access; no direct Internet remote-desktop; VPN and internal email MFA **shall**; privately-owned kit and VDI |
| 11.6 | IoT inventory, usage policy, deployment, unattended classified devices |

## Mobile and remote policy (G3 s.11.5(a))

A formal usage policy and procedures **shall** be in place, with security measures against the risks of mobile computing and communication facilities in unprotected environments. The policy should cover physical protection, access controls, cryptographic techniques, backups, and malware protection, plus rules for connecting mobile facilities to networks and using them in public areas.

Policy, operational plans, and procedures **shall** also be developed for remote access. B/Ds **shall** authorise remote access only if appropriate security arrangements are in place. Protection includes physical protection against theft, access controls against unauthorised disclosure, and **multi-factor authentication for remote access to the B/D's internal systems**. Users should be briefed on threats and accept their responsibilities with explicit acknowledgement.

## Direct remote-access software (G3 s.11.5(b))

Remote or home-office working improves productivity but introduces risk because it is on non-government premises.

B/Ds **should not** use remote-access software to connect **directly** to a departmental server or user workstation — that path can be a backdoor past firewall or router protection. If there is a business need, proper controls **shall** be in place, including: a secured end-to-end channel (for example VPN with encryption and personal certificate/key protection); restricted network access control; network management, segmentation, and monitoring; idle timeout; logging and monitoring of access logs for brute-force activity; latest patches; a whitelist of registered users and endpoints with proper authentication; communication requirements of G3 s.15.1(c); and regular review to remove remote access that is no longer needed.

**Notwithstanding those controls, B/Ds shall not allow direct access to government resources by remote-access software (for example remote-desktop software) through the Internet.**

For remote access to the B/D's **internal network via VPN**, or to the B/D's **internal email systems via the Internet**, **multi-factor authentication shall** be implemented.

Remote-desktop software **inside** the government internal network also poses significant risk (including unauthorised lateral movement). Its use should be carefully planned. Where operational necessity justifies it, B/Ds should assess the risks and implement compensating measures: network segmentation, strong password policy, restricted access to designated users or IP addresses, multi-factor authentication, and similar. This internal-network remote-desktop paragraph is a **v10.2** alignment.

## Remote computers and classified data (G3 s.11.5(b))

Remote computers should run a personal firewall, anti-malware software, and malware detection and repair, all activated, with latest signatures. Latest security patches **shall** be applied. A **full system scan** should be performed before connecting to the government internal network.

Users should minimise storing government information on remote or portable computers. **[[classified-information|Classified information]] shall not be stored or processed** in any computer, IoT device, mobile device, or removable media that is **owned privately**.

Viewing or interacting with **RESTRICTED** information on privately-owned IT equipment through **virtual desktop infrastructure (VDI)** should generally **not** be allowed — those devices are not subject to government requirements. For exceptions, B/Ds **shall** assess the risks, obtain approval from the **Heads of B/Ds**, and regularly review access. Robust controls **shall** be implemented on such privately-owned devices: effective antivirus, automatic system updates, and strong password policies. The VDI **shall** sit in **separate network segments outside the B/Ds' internal network** and be accessed with **multi-factor authentication**. Restriction of screen capture and paste-out from VDI should be applied; terms of use can forbid screenshots or photographs. Provide a secured end-to-end channel (VPN with personal certificate/key) for VDI access, and implement Mobile Device Management if feasible.

In public areas, avoid working on sensitive documents and avoid public printers (pick up printouts quickly if printing is necessary). Protect remote computers with password-enabled screen savers and never leave them unattended. For remote access to a system containing classified information, log the access and review regularly. Mobile-device physical practice is on [[09-physical]] (G3 s.13.2). PCPD work-from-home guidance for organisations and employees is cited in G3 for personal-data hygiene.

## IoT devices (G3 s.11.6)

Take an end-to-end, risk-based view (asset management, authentication, network, software, backend, device and physical security). B/Ds **shall** maintain and review an **inventory of IoT devices** that handle sensitive data or connect to internal/external networks, and arrange handling in accordance with government security requirements (G3 s.11.6(a)).

A formal **usage policy and procedures shall** be in place. They should cover physical protection, access controls, network segmentation, cryptographic protection, log management, device management (patches and firmware), malware detection and prevention, and data protection (in particular personal data), plus rules for connecting IoT to government networks securely and avoiding malicious control (G3 s.11.6(b)).

**Deployment (G3 s.11.6(c)).** Mobile-device security requirements in G3 **shall** be followed similarly for IoT **unless technically infeasible**. Classified information **shall not** be stored or processed in privately-owned IoT devices. **Unnecessary functionalities shall be disabled** to avoid collecting sensitive information and connecting to unauthorised devices or networks.

Access and management controls should include: change default username and password; strong passwords and periodic change; disable unnecessary connections or ports; restrict device connection on a need basis; enable MFA if available; **encrypt classified data at rest and in transit**; manage cryptographic keys properly (avoid a common encryption key for multiple endpoints); install latest vendor patches; grant access on [[least-privilege]] and [[segregation-of-duties]]; enforce secure boot.

Avoid collecting and storing classified information in IoT. If business needs require processing it, the data **shall** be encrypted and transmitted to secured backend storage that meets government requirements. If it is unavoidable to store classified information on **unattended** IoT, **proper physical protection** plus compensating measures such as **data wiping and network disconnection shall** be implemented when a break-in of that physical protection is detected and confirmed.

## Related

[[07-access-control]] · [[07-access-control-passwords]] · [[classified-information]] · [[least-privilege]] · [[09-physical]] · [[ditso]]
