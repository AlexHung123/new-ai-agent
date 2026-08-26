---
title: Appendix C — extra controls for Tier 2 / 3
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, appendix, classification, policy]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: App C
confidence: high
contested: false
---

# Appendix C — extra controls for Tier 2 / 3

G3 Appendix C: **more stringent** security controls **shall** be adopted by Tier 2 and Tier 3 information systems according to classification. **Tier 3 inherits all Tier 2 controls.** The body of G3 remains the Tier 1 floor; this appendix **adds** *shalls*, it does not relax them. Concept: [[classified-protection]]. Assessment: [[annex-classification]]. Comparison: [[compare-tiers]].

The source table is large; this page **summarises by area**. Do not treat the summary as a waiver of any cell in printed G3.

## Extra *shalls* by area

| Area (G3 section) | Who | Extra floor |
| --- | --- | --- |
| **Organisation (s.5)** | **T3** | **Information security steering committee** with senior management and [[ditso\|DITSO]] is **mandatory**; regular meetings; document outcomes (including management directive) and the committee’s structure and roles. At least one member of the **IT security management unit** shall hold an industry-recognised IT security certification (e.g. CISA, CISSP, CISP). |
| **Management (s.7)** | **T3** | Adopt the IT security **risk-management framework** in **s.7.2(c)**. Maintain **risk registers** for T3 systems (identified risks, likelihood, severity, mitigation, monitoring). |
| **Human resource (s.9)** | **T3** | Formulate an IT security **training programme** (targeted, structured awareness). Personnel supporting T3 systems — including vendors, contractors and service providers — shall be familiar with requirements and prevailing threats. If training those parties is infeasible, impose **contractual** training obligations. |
| **Access control (s.11)** | **T2** | **Independent** check/audit of **privileged-account** usage **at least every six months**. If no technical limit on privileged access to data, use admin procedures (e.g. password from a sealed envelope held by another person; **split-password** login by two staff). **Strong password policy** in s.11.4(b) **shall** be enforced — including on systems that, if compromised, could affect T2 (same network segment, or machines allowed to administer T2). **MFA shall** be implemented for any **interactive logon to privileged accounts** of T2 systems **where technically feasible**. |
| **Operations (s.14)** | **T2** | **Local and off-site** backups; off-site at a secure location remote from the equipment. **Capacity-management plan** documented. **EOS migration plan** in place **at least six months** before end-of-support; associated security measures no later than EOS. Known vulnerabilities **typically within a month** of patch release; document the risk assessment of approach and schedule. If not mitigated within one month, **inform DITSO** of rationale, risks, approach and schedule, and give **monthly interim updates** until mitigated. |
| **Operations (s.14)** | **T3** | **24×7** information-security surveillance; consolidate sources (firewall, IDS/IPS, EDR/NDR); continuous threat detection and incident response, including **SIEM** to analyse and correlate events. |
| **Development (s.16)** | **T2** | **Shift-left** (secure coding and design-stage security reviews per s.16.1(a)) **shall** be adopted. Pre-production SRA **shall** verify follow-up of the security review. **Harden** before rollout; use the hardened system as the baseline. |
| **Continuity (s.19)** | **T2** | **IT contingency plan** for disastrous disruption or emergency (fire, flood, terrorism, mass demonstrations, bomb threats requiring evacuation). DR plans **fully documented, regularly tested, and tied to the BCP**. |
| **Continuity (s.19)** | **T3** | Sufficient **resilience** to prevent disruption of essential services; **test** regularly so component failover works as intended. |
| **Compliance (s.20)** | **T2** | **Vulnerability scanning** at least **once a year**, before production rollout, and prior to major enhancements/changes. **Penetration testing** in the SRA for **all** T2 systems. For **Internet-facing** T2, pentest **at least once a year**. |
| **Compliance (s.20)** | **T3** | **SRA at least annually**, before production rollout, and prior to major enhancements/changes. The SRA **shall** include vulnerability scanning, pentest, **configuration reviews** and **source-code reviews**. Pentest by an **independent** provider with professional accreditation (examples: CISP-PTE, CREST CCT APP, GIAC GPEN, OSCP). On completion, SRA reports — including risk registers, scan reports, pentest reports and rectification plans — **shall be endorsed by DITSO**. |

Body-of-G3 cycles (SRA every two years; Internet-facing pentest inside the SRA) remain; this table is the **higher** floor for T2/T3.

## Related links

[[classified-protection]] · [[compare-tiers]] · [[ditso]] · [[annex-classification]] · [[annex-compliance-mechanism]] · [[16-compliance]] · [[12-development]] · [[15-continuity]] · [[07-access-control-passwords]]
