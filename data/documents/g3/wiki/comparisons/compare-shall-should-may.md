---
title: Compare — shall, should, may
created: 2026-08-21
updated: 2026-08-21
type: comparison
tags: [comparison, policy]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 4.2, 5.2.2, 8.1, 10.2, App C
confidence: high
contested: false
---

# Compare — shall, should, may

G3 s.4.2 conventions:

| Word | Force |
| --- | --- |
| **Shall** | A **mandatory** requirement. |
| **Should** | A **best practice**, which should be implemented **whenever possible**. |
| **May** | A **desirable** best practice. |

S17 remains the top-level mandatory policy; G3 is the implementation standard B/Ds **shall** comply with (G3 s.2.3.2). B/Ds **may** customise measures without prejudice to the security level (G3 s.1). G3 cannot waive Security Regulations. Document stack: [[compare-documents]].

## Worked examples from G3

| Force | Example | Citation |
| --- | --- | --- |
| **Shall** | All stored information classified as RESTRICTED or above **shall** be encrypted irrespective of the storage media. | s.10.2(b); [[encryption]] |
| **Shall** | Head of B/D **shall** appoint a D3 (or highest directorate) [[ditso\|DITSO]]. | s.5.2.1 |
| **Shall** | Phone [[giro\|GIRO]] Standing Office within 60 minutes; Preliminary Form within 48 hours. | s.18.1(b); [[incident-handling]] |
| **Should** | Senior management **should** consider setting up an information security **steering committee** which reports to DITSO, or putting information security on regular management meetings. If none is set up, DITSO should undertake the committee’s responsibilities. | s.5.2.2 |
| **Should** | End users: change your password regularly, for example, every **90 days**. | s.11.4(f) |
| **May** | B/Ds **may** consider hiring external qualified IT security auditors or consultants to review or assist in development of information-security documents. | s.8.1(b) |
| **May** | B/Ds **may** appoint an IT Security Auditor to audit IT Security Administrators. | s.5.3.1 |

“Should” is not optional colour: it is best practice to implement whenever possible. Recording a deviation is not a waiver of a *shall*.

## Appendix C turns some shoulds into shalls

The body of G3 is the [[classified-protection|Tier 1]] floor. [[annex-classified-protection|Appendix C]] **adds** floors for Tier 2 and Tier 3; it does not relax the body. Several body *should* items become *shall* for those tiers (G3 Appendix C):

| Body text | Appendix C |
| --- | --- |
| Steering committee *should* (s.5.2.2) | Tier 3: steering committee with senior management and DITSO **shall** be set up; regular meetings; outcomes documented. |
| Strong [[password-management\|password policy]] *shall* on classified systems, *should* on others (s.11.4(b)) | Tier 2: strong password policy **shall** be enforced (and on systems whose compromise could affect Tier 2). |
| MFA *should* for high-risk / privileged access (s.11.2(b), s.11.4(a)) | Tier 2: MFA **shall** for interactive logon to privileged accounts where technically feasible. |
| EOS migration plan *should* be in place six months before (s.14.6(g)) | Tier 2: migration plan **shall** be in place at least six months before EOS. |
| Internet-facing vulns *should* be fixed within a month (s.14.6(g)) | Tier 2: known vulnerabilities **shall** be fixed as soon as possible, typically within a month; else inform DITSO monthly. |
| Shift-left *should* (s.16.1(a)) | Tier 2: shift-left (secure coding + design-stage security reviews) **shall** be adopted. |
| IT contingency / DR *should* be documented and tested (s.19.1) | Tier 2: IT contingency plan **shall** be developed; DR plans **shall** be documented, regularly tested, tied to BCP. |
| Resilience *should* meet availability requirements (s.19.2(a)) | Tier 3: sufficient resilience **shall** be implemented and tested regularly. |
| SRA at least every two years (s.20.2(a) *shall* already) | Tier 3: SRA **shall** be at least **annually**, with scanning, pentest, config and source-code review. |

When answering “is this mandatory?”, read the body *shall*, then check whether Appendix C raises a neighbouring *should* for the system’s tier. Overlay, do not collapse. See [[compare-tiers]].

## Related

[[information-security]] · [[classified-protection]] · [[ditso]] · [[compare-documents]] · [[compare-tiers]] · [[annex-classified-protection]]
