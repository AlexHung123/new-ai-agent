---
title: Password selection and handling
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, access-control, password]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 8.6, 16.3
confidence: high
contested: true
contradictions: [password-management]
---

# Password selection and handling

Part II policy (DITSP s.8.6) and Part III guidelines (s.16.3). Password is the usual authentication mechanism; all users protect theirs under this sub-section. Hub: [[03-access-control]]. Concept page: [[password-management]]. This compilation is a **July 2008** snapshot (Windows 2000 Group Policy). **Do not collapse** the age and complexity figures below.

## Section map

| DITSP | Topic |
| --- | --- |
| 8.6.1 | Length, composition, change, reuse (tagged shall; inner verb should) |
| 8.6.2 | Sharing only with [[ditso|Division DITSO]] approval |
| 8.6.3 | Encrypt in storage; encrypt on un-trusted transit |
| 8.6.4–8.6.6 | No capture; change vendor defaults; change if compromised |
| 16.3.1 | Selection DOs / DON'Ts and bad examples |
| 16.3.2 | End-user handling; change at least every 90 days |
| 16.3.3 | System/security administrator handling |
| 16.3.4 | Windows 2000+ recommended Account Policy |

## Live tensions (do not collapse)

| Source | Age / history | Composition |
| --- | --- | --- |
| s.8.6.1 | Change at least once every **3 months**; should not be re-used. Clause tagged **shall** [M] [A] [U]; the inner verb is **should**. | At least **8** characters; format consisting of both **characters and numbers**; difficult to guess. |
| s.16.3.2 | Change at least every **90 days**. | (handling, not composition) |
| s.16.3.1 DOs | Do not reuse recently used passwords. | Mix of at least eight **mixed-case** alphabetic characters, **numerals and special characters**. |
| s.16.3.4 Windows | History **6**; maximum age **135 days**; minimum age **0 days**. | Minimum length **8**; complexity **Disabled**; store with reversible encryption **Disabled**. |

Three months and 90 days are the same interval in ordinary calendars; **135 days** is not. Part II requires letters and numbers; the guideline DOs add mixed case and specials; the Windows snapshot **disables** complexity. Keep all three. See [[compare-policy-guidelines]] and [[compare-shall-should-may]].

## Policy (DITSP s.8.6)

Passwords shall not be shared or divulged unless necessary (e.g. helpdesk assistance, shared PC, shared files). Sharing increases the chance of compromise. If they must be shared, **explicit approval from the Division DITSO** must be obtained. Shared passwords should be changed promptly when the need ends, and frequently if sharing is regular (s.8.6.2).

Passwords shall always be well protected/encrypted when held in storage, and encrypted when transmitted over an un-trusted communication network. If encryption is not implementable, compensating controls shall reduce risk to an acceptable level (s.8.6.3). The CSB departmental network is un-trusted; detail on [[06-network]].

Staff are prohibited from capturing or otherwise obtaining passwords, decryption keys, or any other access-control mechanism that could permit unauthorised access (s.8.6.4). All vendor-supplied default passwords shall be changed before an Information System is put into operation (s.8.6.5). All passwords shall be promptly changed if they are suspected of being, or are, compromised, or if disclosed to vendors for maintenance and support (s.8.6.6).

## Selection rules (DITSP s.16.3.1)

If possible, the software that sets passwords should enforce CSB rules.

**Don't:** login name in any form (as-is, reversed, capitalised, doubled); first, middle or last name; spouse's or child's name; easily obtained personal data (ID card, licence plate, telephone, birth date, street); the same letter repeated; consecutive letters or numbers; adjacent keyboard keys; a dictionary word in English or another language, or that word reversed; a well-known abbreviation (bureau, department, project); a simple variation of the above (appending digits or symbols; substituting 3 for E, $ for S, 0 for O); fewer than eight characters; recently used passwords.

**Do:** a mix of at least eight mixed-case alphabetic characters, numerals and special characters; different passwords for different systems according to security requirements and asset value; difficult to guess but easy to remember so it is not written down; typeable quickly without looking at the keyboard.

**Bad examples** from the booklet: `password` (most easily guessed); `administrator` (login name); `cisco` (vendor); a person's name; repeating a letter; consecutive letters or numbers; `qwertyui`; a dictionary word; `computer12` or `C0mput3r` (simple variations).

## Handling — end users (DITSP s.16.3.2)

Don't write a password down unless it is sufficiently protected; don't tell or give it out even for a good reason; don't display it on the monitor; don't send it unencrypted, especially via Internet email; don't select “Remember your password” on sites holding personal particulars, and disable that feature in the browser; don't store a password on any medium unless protected from unauthorised access (e.g. encrypted with an approved method).

Do change at least every 90 days; change the default or initial password at first login; change immediately if compromise is suspected, then notify the system/security administrator.

## Handling — administrators (DITSP s.16.3.3)

Don't disclose or reset a password on a user's behalf unless identity is verified; don't allow the password file to be publicly readable.

Do choose good, **different** initial passwords per account and require immediate change on first use; change all system default passwords, including service accounts, after installation; request periodic changes; encrypt passwords on un-trusted networks; scramble with one-way functions and, if possible, **salt** so the same password yields different outputs; deactivate an account after multiple consecutive logon failures; remind users of their duties.

## Windows 2000+ recommended settings (DITSP s.16.3.4)

Enforced through Account Policies in Local Security Policy or Domain-level Group Policy. **Recommended** for CSB Windows systems in this 2008 booklet — not a live 2026 baseline.

**Password policy:** enforce history 6; maximum age 135 days; minimum age 0 days; minimum length 8 characters; password must meet complexity requirements **Disabled**; store passwords using reversible encryption **Disabled**.

**Account lockout policy:** lockout duration **5 minutes**; threshold **10** invalid logon attempts; reset lockout counter after **5 minutes**.

## Related

[[password-management]] · [[03-access-control]] · [[ditso]] · [[encryption]] · [[06-network]] · [[compare-policy-guidelines]]
