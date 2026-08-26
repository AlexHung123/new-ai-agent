---
title: Access control — passwords, selection, and handling
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, access-control, password]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 11.3-11.4
confidence: high
contested: false
---

# Access control — passwords, selection, and handling

G3 ss.11.3–11.4. Hub: [[07-access-control]]. Concept page: [[password-management]]. Hashing algorithms sit on [[08-cryptography]]. The **strong-policy six-month SHALL** (classified-data systems) and the **end-user 90-day SHOULD** are complementary, not a conflict: six months is the maximum interval under the strong policy; 90 days is an example of more frequent change for end users.

## Section map

| G3 | Topic |
| --- | --- |
| 11.3(a) | User accountability for all activity under the user-ID |
| 11.3(b) | Password sharing needs [[ditso\|DITSO]] approval |
| 11.3(c) | Encrypt passwords in storage and over un-trusted networks |
| 11.4(a) | Authentication commensurate with sensitivity; e-Authentication Framework; consecutive unsuccessful logins |
| 11.4(b) | Password policy per account category; strong password policy table |
| 11.4(c) | Selection DOs / DON'Ts |
| 11.4(d) | Compromising activities prohibited |
| 11.4(e)–(f) | Administrator vs end-user handling |

## Accountability and sharing (G3 s.11.3)

Users **shall** be responsible for all activities performed with their user-IDs and shall use those IDs only for authorised tasks. Shared user-IDs without approval are prohibited (G3 s.11.3(a); identification rules on [[07-access-control]]).

Password sharing defeats accountability and non-repudiation. Passwords **shall not** be shared or divulged unless there is a way to determine user identification. If they must be shared (helpdesk, shared PC, shared files) and accountability cannot be enforced, **explicit [[ditso|DITSO]] approval with supporting reasons** is required. Justify shared passwords against the system's security risks. Shared passwords should be reset immediately when no longer used, and changed frequently if sharing is regular (G3 s.11.3(b)).

When held in storage, access control **and encryption** shall protect passwords. Passwords **shall be encrypted** when transmitted over an un-trusted communication network. If encryption is not implementable, compensating controls shall be used — for example changing the password more frequently (G3 s.11.3(c)).

## Authentication commensurate with sensitivity (G3 s.11.4(a))

Systems shall implement authentication commensurate with security requirements and the sensitivity of the information. B/Ds should follow the government **e-Authentication Framework** as far as possible for e-government services (ITG InfoStation theme page). A password checker should be considered to enforce composition and avoid weak or already-compromised passwords. Multi-factor authentication (token plus password, smart card, one-time password) **should** be adopted for high-risk access such as remote access to internal networks, and should be treated as a standard for newly implemented or upgraded systems. Challenge-response may be used.

**Consecutive unsuccessful log-in trials shall be controlled.** Define and enforce the number of trials, lock-out duration, and lock-out timer reset: disable the account after a limited number of failures, or increase the delay between attempts. User-access log analytics with a central log server may support integrity, monitoring, and investigation.

## Password policy (G3 s.11.4(b))

B/Ds shall define and document a password policy **for each category of account** (service accounts, B/D users, citizens) and enforce it on all information systems. The policy shall at least cover minimum length, initial assignment, restricted words and format, life cycle, selection rules, password history, account lockout, and regular change. **Minimum length of at least eight characters shall be enforced** unless technically infeasible or there is a genuine operational constraint. Audit the policy regularly.

The **strong password policy shall** be enforced on all information systems containing classified data, **and** on any system that, if compromised, could affect those systems (same network segment, or machines allowed to administer classified-data systems). If any strong-policy control cannot be implemented, **[[ditso|DITSO]] explicit approval shall be obtained**, and the adjusted policy plus rationale documented. All other systems should adopt the strong policy as far as possible.

| Control | Setting |
| --- | --- |
| Complexity and length | At least **eight** characters with upper-case letters, lower-case letters, numbers **and** special characters; **or** at least **ten** characters from at least three categories of characters. (G3 footnote 4 on “categories” is not in this conversion.) |
| Password history | At least **eight** passwords remembered |
| Account lockout | After **five or fewer** invalid logon attempts |
| Regular password change | Every **six months or more frequent** |

## Selection — summarised (G3 s.11.4(c))

Distribute selection rules; if possible, make the password-setting software enforce them.

**Don't:** login name in any form; first/middle/last name or a spouse's or child's name; easily obtained personal data (ID card, licence plate, telephone, birth date, street); a repeated letter; consecutive letters or numbers; adjacent keyboard keys; a dictionary word in English or another language, or that word reversed; a well-known B/D or project abbreviation; a simple variation of any of the above (appending digits/symbols; substituting 3 for E, `$` for S, 0 for O); fewer than eight characters; recently used passwords.

**Do:** a lengthy, memorable passphrase (G3's example style: mixed words with numerals and symbols); different passwords for different systems according to security requirements and asset value; hard to guess but easy to remember so it is not written down; typeable quickly without looking at the keyboard.

Typical bad examples in the booklet: `password`; a login name or vendor name; a person's name; repeating or consecutive characters; keyboard walks (`qwertyui`); a dictionary word or a leetspeak/digit-appended variant of one; a fictional character's name.

## Compromising activities (G3 s.11.4(d))

B/Ds should remind staff that these are prohibited: interactive password guessing and brute-force attacks; obtaining passwords through social engineering or phishing; compromise through oversight, observation, or cameras; cracking through network-traffic eavesdropping.

## Administrators (G3 s.11.4(e))

**Don't** disclose or reset a password on a user's behalf unless identity is verified; don't allow the password file to be publicly readable; don't send passwords unencrypted, especially via email.

**Do** choose good, **different** initial passwords per account and force an immediate change; change all vendor-supplied default passwords, including service accounts, after installation; enforce periodic change and immediate change on compromise; encrypt on un-trusted networks; scramble with one-way functions and, if possible, **salt** so the same password yields different outputs; deactivate after multiple consecutive logon failures; remind users of their duties.

Desirable system features to enable: automatic suspend after invalid logons; reactivation only by administrator; block short or reused passwords. All accounts **shall** be revoked or disabled after a pre-defined inactivity period (automatic check or periodic last-login review).

## End users (G3 s.11.4(f))

**Don't** write a password down unless it is sufficiently protected; tell or give it out even for a “good reason”; display it on the monitor; send it unencrypted, especially via Internet email; use browser “remember password” on sites holding personal particulars (disable the feature); store it on media unless protected (access control or encryption); store encryption access codes (passwords, passphrases, PINs) in mobile devices.

**Do** change the password regularly, **for example every 90 days** (a SHOULD example — it is *more frequent* than the strong-policy six-month SHALL, not a rival clock); change the default or initial password at first log-in; change immediately if compromise is suspected, then notify the administrator; change immediately after vendor maintenance if the password was disclosed for support.

## Related

[[password-management]] · [[07-access-control]] · [[ditso]] · [[encryption]] · [[08-cryptography]] · [[07-access-control-mobile]]
