---
title: Cryptography — encryption and key management
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, encryption]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 12
confidence: high
contested: false
---

# Cryptography — encryption and key management

G3 s.12: B/Ds shall ensure proper and effective use of cryptography to protect the confidentiality, authenticity, and integrity of information. Password *policy* remains on [[07-access-control-passwords]] and [[password-management]]; this chapter is algorithms, key lengths, and key lifecycle. Concept page: [[encryption]].

## Section map

| G3 | Topic |
| --- | --- |
| 12 (chapeau) | Proper and effective use of cryptography |
| 12.1(a) | Data encryption; password hashing; classified-data encryption; Catalogue of IT Security Solutions |
| 12.1(b) | Cryptographic key management and lifecycle |

## Data encryption (G3 s.12.1(a))

Encryption protects data in transmission and in storage. Schemes include an application's own encryption feature, an external hardware device, secret-key encryption, and public-key encryption. An application's password-protection feature mainly prevents unauthorised opening of a file; users should **encrypt the file**, not rely on a password alone, when confidentiality is required. When a password is used, follow G3 ss.11.4(b)–(c).

B/Ds **shall comply** with government security requirements on encryption for the protection of [[classified-information|classified data]].

User passwords used for authentication or administration should be **hashed or encrypted in storage**. For hashing, at least **SHA-2 or the equivalent** should be used. Subject to operational needs, **SM3** can also be used. **SHA-1 shall not be used unless it is for legacy systems.** If encryption (rather than hashing) is used, keys for performing encryption (symmetric key only) or decryption **shall** be kept secret and shall not be disclosed to unauthorised users.

B/Ds are encouraged to research and evaluate solutions that meet their business requirements. The theme page **Catalogue of IT Security Solutions** on ITG InfoStation (`https://itginfo.ccgo.hksarg/content/coss`) lists encryption solutions as a starting point.

## Key lengths (G3 s.12.1(b))

“Key” here means a code used with [[classified-information]] for authentication, decryption, or generation of a digital signature, produced by cryptographic algorithms.

| Classification | Symmetric | Asymmetric |
| --- | --- | --- |
| **CONFIDENTIAL or above** (**shall**) | At least **128-bit AES** or equivalent; **SM4** may meet the requirement subject to operational needs | At least **2048-bit RSA**; alternatively **ECC at least 224-bit** or equivalent; **SM2** subject to operational needs |
| **RESTRICTED** (**should**) | Same lengths as above | Same lengths as above |

For RESTRICTED, B/Ds **should** have a plan to upgrade existing systems to meet those key lengths and review the plan regularly so the upgrade follows the pre-defined schedule.

Keys used for processing information classified **CONFIDENTIAL or above shall be stored separately** from the corresponding encrypted information. They may sit in smart-card chips, tokens, disks, and similar, for authentication and/or decryption. Do **not** distribute the decryption key along with the encrypted file — anyone who obtains both can open the file.

## Key lifecycle (G3 s.12.1(b))

Key management should be documented and performed as follows.

**(i) Generation.** Equipment used to generate keys should be physically protected.

**(ii) Storage.** The **master cryptographic key** should be stored securely — for example in a **hardware security module (HSM)** or a **trusted platform module (TPM)** — and should **not leave** that security storage for the master key's service life.

**(iii) Recovery.** Assess whether a recoverable key is needed. If so, keys should be recoverable by authorised personnel only. The key-recovery password should be protected by **at least two levels of independent access controls** and limited to personnel authorised for information recovery.

**(iv) Backup.** Back up the cryptographic key with proper protection. Establish a documented process to access backed-up keys.

**(v) Transfer.** Cryptographic keys should **never** be transported together with the data or media containing the encrypted data.

**(vi) Retirement.** Define activation and deactivation dates to reduce compromise from brute-force, personnel turnover, open-office exposure, and similar. Establish revocation and replacement processes.

**(vii) Logging.** Record **all access** to key-recovery passwords and to backed-up keys in an audit trail.

Where a data-encryption key is itself protected by a key-encryption key, the **ultimate** key-encryption key should be protected in accordance with relevant government security requirements.

## Related

[[encryption]] · [[classified-information]] · [[password-management]] · [[07-access-control-passwords]] · [[09-physical]]
