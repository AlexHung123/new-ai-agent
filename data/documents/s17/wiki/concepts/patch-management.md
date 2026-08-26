---
title: Patch management
created: 2026-08-22
updated: 2026-08-22
type: concept
tags: [patch, vulnerability]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 5.3.1, 14.6
confidence: high
contested: false
---

# Patch management

Depending on the risk level, B/Ds **shall** determine the appropriate patch-management strategy, including patch checking and patching frequency for their information systems (S17 s.14.6.2). B/Ds **shall** adopt a **risk-based** approach to determine the patching schedule of each vulnerability by considering its potential impact and the possibility of being exploited. All servers and related devices deployed in **Internet-facing** information systems **shall** be subject to **stringent** patch management.

S17 does **not** print G3’s “typically within a month” Internet-facing fix, nor the six-month EOS migration plan. Do not invent those clocks here. Parent process: [[vulnerability-management]]. Hub: [[10-operations]].

## Apply or compensate (S17 s.14.6.3–14.6.4)

B/Ds **shall** protect their information systems from known vulnerabilities by applying the latest security patches recommended by the product vendors according to the patch-management strategy, **or** implementing other compensating security measures (s.14.6.3). Before security patches are applied, proper risk evaluation and testing **should** be conducted to minimise the undesirable effects on the information systems (s.14.6.4).

No unauthorised application software **shall** be loaded onto a government information system without prior approval from the officer as designated by the B/D (s.14.6.5).

IT Security Administrators assist in the patch-management process (S17 s.5.3.1).

## Related

[[vulnerability-management]] · [[10-operations]] · [[malware]] · [[security-risk-assessment]] · [[compare-shall-should-may]]
