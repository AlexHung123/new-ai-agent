---
title: Compare — document stack
created: 2026-08-21
updated: 2026-08-21
type: comparison
tags: [comparison, policy, guideline]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 1, 2.3, 3, 8.1, 21
confidence: high
contested: false
---

# Compare — document stack

B/Ds **shall comply** with Security Regulations (SR), Baseline IT Security Policy [S17], and IT Security Guidelines [G3], and **follow** the implementation guidance in the relevant practice guides (G3 s.2.3). G3 is **not** a volume of the Government Regulations. **G3 cannot waive SR.** See [[information-security]] and [[00-introduction]].

```
Security Regulations (Security Bureau)
        → Baseline IT Security Policy [S17]     (mandatory minimum)
        → IT Security Guidelines [G3]           (implementation standard)
        → Practice guides (ITG InfoStation)
        → Departmental IT security policy
        → system-specific procedures
```

## Instruments

| Instrument | Issuer | Force in G3’s words | What it is for |
| --- | --- | --- | --- |
| **Security Regulations (SR)** | [[security-bureau\|Security Bureau]] authorises SR (s.2.3.1). | Directives B/Ds shall comply with. | What documents, material, and information need to be **classified**, and that they receive an adequate level of protection in the conduct of government business. G3 defers the categories to SR; it does not reprint the four grades. |
| **Baseline IT Security Policy [S17]** | [[dpo\|Digital Policy Office]] (s.2.3.2). Successor to OGCIO as of G3 v10.1; do not treat OGCIO as the current issuer. | “A top-level directive statement that sets the **minimum standards** of a security specification for all B/Ds.” Basic rules which **shall** be observed as mandatory; other desirable measures may still enhance security. | What aspects are of paramount importance. [[itswg\|ITSWG]] monitors S17 compliance at B/Ds (s.5.1.2). |
| **IT Security Guidelines [G3]** | DPO. This compilation is **v10.2 (April 2025)** (s.21). | “Elaborates on the policy requirements and sets the **implementation standard** on the security requirements specified in” S17. **B/Ds shall comply** with G3. | How to implement. *Shall* / *should* / *may*: [[compare-shall-should-may]]. Ordinary systems take the body; Tier 2/3 add Appendix C ([[compare-tiers]]). B/Ds **may** customise measures **without prejudice to the security level** (s.1). |
| **Practice guides** | DPO; on ITG InfoStation under the IT Security Theme Page (s.2.3.2). | **Guidance** notes; B/Ds shall **follow** the implementation guidance. Not a substitute for G3 *shall*s. | Emerging technologies and threats. Named examples: Internet Gateway Security; IT Security Risk Management; IT Security Threat Management; Security Risk Assessment & Audit; Information Security Incident Handling. G3 also points to Security by Design, Cloud Computing Security, Use of Electronic Mail, Destruction and Disposal of Storage Media, Mobile Security, Penetration Testing. |
| **Departmental IT security policy** | Each B/D, based on SR + S17 + G3 (ss.2.3.3, 8.1(a)). Led by [[ditso\|DITSO]] (s.5.2.1). | Local adaptation of the government floor. Shall cover proper use of systems, data, network, services and facilities, and procedures to prevent and respond to incidents. | Must consider B/D requirements; prevailing government IT security requirements in s.2.3; Personal Data (Privacy) Ordinance; Code on Access to Information; record-management rules. Does **not** lower SR, S17, or G3. Sample end-user instructions: [[annex-end-user\|Appendix A]]. |

Normative references also include ISO/IEC 27001:2022, ISO/IEC 27002:2022, GB/T 22239-2019, HKSARG Interoperability Framework [S18], and **General Circular No. 6/2024** (governance and security of IT systems, 6 August 2024) (G3 s.3). GC 6/2024 overlays Specified IT Systems, PPIC/DITSO incident reports, and extra pre-rollout tests — cite the circular; G3 does not reprint it. G3 still names *OGCIO Circular No. 5/2023* for extra tests on DPO-selected large-scale public-facing systems (s.16.1(f)).

The document-relationship diagram in s.2.3 is an image; the stack above is the readable caption G3’s table supports.

## Related

[[dpo]] · [[security-bureau]] · [[information-security]] · [[compare-shall-should-may]] · [[compare-tiers]] · [[ditso]] · [[00-introduction]]
