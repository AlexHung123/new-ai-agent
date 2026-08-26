---
title: Password management
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [password, access-control]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 8.6, 16.3
confidence: high
contested: true
contradictions: [03-access-control-passwords, compare-policy-guidelines]
---

# Password management

Password rules are the one live **Part II vs Part III vs Windows-table** split in this compilation. Do not collapse them. Policy is DITSP s.8.6 [M] [A] [U]; handling guidance is s.16.3; the Windows 2000 Group Policy snapshot is s.16.3.4. Hub: [[03-access-control-passwords]]. Compare the verb force at [[compare-shall-should-may]] and the Part II/III pairing at [[compare-policy-guidelines]].

This page is a **2008 snapshot**. Current OGCIO / Digital Policy Office baselines outrank it for a live system.

## The contested clocks

All three texts agree on **minimum length: 8 characters**. They disagree on age and complexity.

| Source | Age | Composition |
| --- | --- | --- |
| **s.8.6.1** (policy **shall**) | Change at least once every **3 months**; do not re-use | At least 8 characters; **characters and numbers**; difficult to guess |
| **s.16.3.2** (end-user DO) | Change at least every **90 days** | Selection rules in s.16.3.1: mix of mixed-case letters, numerals, **and special characters** |
| **s.16.3.4** (Windows table) | Maximum password age **135 days**; minimum age 0 days; history 6 | Complexity requirements **Disabled**; reversible encryption Disabled |

90 days is not the same sentence as 3 months, and 135 days is a third figure. Policy “shall” vs a guideline Windows snapshot. Record all three; do not pick one in this wiki.

Account lockout in the same Windows table (not contested with Part II in the same way): lockout duration 5 minutes; threshold 10 invalid logons; reset counter after 5 minutes.

## Sharing needs Division DITSO (s.8.6.2)

Passwords shall not be shared or divulged unless necessary (helpdesk, shared PC, shared files). Sharing raises the chance of compromise. If they **must** be shared, **explicit approval from the [[ditso|Division DITSO]]** is required. Change the shared password promptly when the need ends, and change it frequently if sharing is regular.

Users are accountable for activities under their user-ID (s.8.4.2). Shared/group user-IDs themselves need the same DITSO approval (s.8.4.1).

## Encrypt in storage and transit (s.8.6.3)

Passwords shall always be well protected / encrypted when held in storage. They shall be encrypted when transmitted over an un-trusted network. If encryption is not implementable, compensating controls shall reduce exposure to an acceptable level. Administrators: scramble with one-way functions; salt if possible so the same password does not produce the same hash (s.16.3.3). See [[encryption]].

## Change defaults and suspected compromise (s.8.6.5–8.6.6)

All vendor-supplied default passwords shall be changed before a system is put into operation. Change promptly if suspected of compromise, or if disclosed to vendors for maintenance. End users change the initial password at first log-on (s.16.3.2). Staff shall not capture passwords, decryption keys, or other access-control mechanisms that would permit unauthorised access (s.8.6.4).

## Selection and handling — summarised, not dumped (s.16.3.1–16.3.3)

**Do not** use login name, personal names, ID/phone/birthday/street, repeats (`aaaaaaaa`), consecutive letters or numbers, adjacent keyboard rows, dictionary words (including reverse or leetspeak variants), well-known bureau/project abbreviations, or anything shorter than eight characters. Do not reuse recently used passwords.

**Do** pick a mix that is hard to guess and fast to type without looking; use different passwords for different systems.

**Users do not** write passwords down unless protected; display them; send them unencrypted (especially Internet email); use browser “remember password” on sites holding personal particulars; or store them on media unless encrypted with an approved method.

**Administrators do not** reset a password without verifying identity, or leave the password file publicly readable. They do issue different good initial passwords, force an immediate change, deactivate after consecutive failures, and remind users of their duty.

## Related

[[03-access-control-passwords]] · [[compare-policy-guidelines]] · [[ditso]] · [[least-privilege]]
