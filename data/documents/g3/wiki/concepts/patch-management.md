---
title: Patch management
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [patch]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 14.6
confidence: high
contested: false
---

# Patch management

Patch management is installing software updates and fixes in a timely manner to address vulnerabilities and resolve issues. It is a vulnerability-mitigation component (G3 s.14.6(g)). LAN/system administrators **shall** apply the latest security patches/hot-fixes released by product vendors to information systems — operating systems, database software, programming libraries, and applications — or implement other compensating measures. See [[vulnerability-management]] and [[10-operations-vulnerability]].

## Lifecycle (G3 s.14.6(g))

1. **Patch acquisition** — select and download appropriate patches; prepare for deployment.
2. **Testing** — check conflict with other patches, key applications, or environment baselines.
3. **Risk assessment** — impacts of installing (functionality, reboot, availability) versus the vulnerability.
4. **Deployment** — install only on machines that need the patch.
5. **Compliance** — verify machines function and comply with related policies.

Patches shall be tested and evaluated before installation and applied through an established change-control process. If installing a patch is not feasible, plan an upgrade or implement and document alternate controls.

## Internet-facing: about one month

B/Ds shall adopt a risk-based patching schedule per vulnerability (impact and exploitability). All servers and related devices in **Internet-facing** information systems shall have stringent patch management. All known vulnerabilities of Internet-facing systems **should be fixed within a month** after the release of security patches. High-risk systems first. B/Ds shall follow [[govcert|GovCERT.HK]] security-alert recommendations (G3 s.14.6(g)).

[[classified-protection|Tier 2]] Appendix C raises this: all known vulnerabilities **shall** be fixed as soon as possible, typically within a month; if not, inform [[ditso|DITSO]] of rationale, risks, and schedule, and provide **monthly** interim updates until mitigated.

## End-of-support: six-month migration plan

For end-of-support software, security updates will no longer be available. If such software must still be used, B/Ds **shall** assess the risks and implement appropriate measures. The **migration plan should be in place at least six months before** the end-of-support date, and associated security measures **should** be in place no later than that date. The plan should include risk assessment, planned replacement date, and measures (physical isolation from the departmental network, whitelist applications and USB devices) (G3 s.14.6(g)).

Tier 2 Appendix C turns the six-month migration plan and “measures no later than EOS” into **shall**.

## DITSO if not patching

When evaluating a patch, compare the risk of the vulnerability with the risk of installing the patch. If a B/D decides **not** to apply a patch, or if **no patch is available**, **DITSO should be consulted** and the case **shall** be properly documented. Compensating controls include turning off related services, adapting or adding access controls, and increased monitoring (G3 s.14.6(g)).

Supporting hygiene: inventory of hardware/software and versions; defined roles; standardised configuration; monitor IT security resources; define a timeline to react to advisories; review process effectiveness; uninstall or upgrade EOS products; educate users; regular vulnerability identification; consider a patch-management system with its own security measures.

## Related

[[vulnerability-management]] · [[ditso]] · [[govcert]] · [[classified-protection]] · [[10-operations-vulnerability]]
