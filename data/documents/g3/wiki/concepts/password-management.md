---
title: Password management
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [password, access-control]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 11.3, 11.4
confidence: high
contested: false
---

# Password management

B/Ds shall define and document a password policy for each category of account (service accounts, B/D users, citizens) and enforce it on all information systems. The policy shall at least cover minimum length, initial assignment, restricted words and format, life cycle, selection rules, password history, account lockout, and regular change. Minimum length of **at least eight characters** shall be enforced unless technically infeasible or there is a genuine operational constraint (G3 s.11.4(b)). See [[07-access-control-passwords]] and [[ditso]].

## Strong password policy (classified systems)

The following **shall** be enforced on all information systems **containing classified data**, and on any system whose compromise could affect those systems (same network segment, or machines allowed to administer classified systems). All other systems **should** adopt it as far as possible. If any control cannot be implemented, **[[ditso|DITSO]] explicit approval** shall be obtained, and the adjusted policy plus rationale documented (G3 s.11.4(b)).

| Control | Setting |
| --- | --- |
| Complexity and length | At least **eight** characters with upper-case, lower-case, numbers, **and** special characters; **or** at least **ten** characters from at least three categories of characters (footnote body for the 10-character option is missing from this conversion). |
| Password history | At least eight passwords remembered |
| Account lockout | After five or fewer invalid logon attempts |
| Regular password change | Every **six months** or more frequent |

[[classified-protection|Tier 2]] Appendix C makes this strong policy a **shall** for Tier 2 systems and for any system whose compromise could affect them.

The six-month **shall** (classified / affecting systems) and the end-user **should** of changing every **90 days** (G3 s.11.4(f)) sit together: 90 days is a tighter recommended user practice; six months is the mandatory floor for the strong-policy set.

## Selection, sharing, storage

Selection DOs/DON’Ts are in G3 s.11.4(c): no login name, personal names, ID/licence/phone/birthday, repeated or consecutive characters, adjacent-keyboard strings, dictionary words or simple substitutions; do use passphrases, different passwords per system, and something memorable enough not to write down. Consecutive unsuccessful log-in trials shall be controlled (G3 s.11.4(a)).

Passwords shall not be shared or divulged unless user identification can still be determined. If sharing is needed (helpdesk, shared PC, shared files) and accountability cannot be enforced, **explicit DITSO approval** with reasons is required; shared passwords should be reset when no longer used and changed frequently if sharing is regular (G3 s.11.3(b)). Shared or group **user-IDs** likewise need DITSO exemption (G3 s.11.2(d)).

When held in storage, access control **and encryption** shall protect passwords. Passwords shall be encrypted when transmitted over an un-trusted network; if encryption is not implementable, change the password more frequently (G3 s.11.3(c)). Hashing of authentication passwords: at least SHA-2 or equivalent; SM3 may be used subject to operational needs; SHA-1 shall not be used unless for legacy systems (G3 s.12.1(a)).

Administrators: do not reset a password without verifying identity; do not leave the password file publicly readable; do not send passwords unencrypted; change vendor defaults; enforce immediate change of initial passwords; scramble with one-way functions and salting if possible (G3 s.11.4(e)). End users: do not write passwords down unless protected; do not tell them out; do not use “remember password” on sites holding personal particulars; change default/initial password at first log-in; change immediately on suspected compromise or after vendor maintenance (G3 s.11.4(f)).

## Related

[[ditso]] · [[least-privilege]] · [[encryption]] · [[classified-information]] · [[compare-shall-should-may]] · [[07-access-control-passwords]]
