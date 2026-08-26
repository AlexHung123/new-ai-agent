---
title: Patch management
created: 2026-08-21
updated: 2026-08-21
type: concept
tags: [patch]
sources: [MinerU_markdown_Departmental_IT_Security_Policy_and_Guidelines_2090718443034923008.md]
ditsp_sections: 11.5, 17.8, 19.5
confidence: high
contested: false
---

# Patch management

Computers and networks shall only run software from trustworthy sources (DITSP s.11.5.1). No unauthorised application software shall be loaded onto a Government Information System without prior [[ditso|Division DITSO]] approval (s.11.5.2). CSB shall protect systems from known vulnerabilities by applying the **latest security patches** recommended by product vendors **or** by implementing other compensating measures (s.11.5.3) [A] [U]. **Before** patches are applied, proper risk evaluation and testing should be conducted (s.11.5.4). Hub: [[06-network-malware-patch]]. Software licensing sits beside this: [[copyright-compliance]].

## Lifecycle — five steps (s.19.5.2)

LAN/System Administrators should review and apply vendor patches/hot-fixes and should observe regular [[ogcio]] security alerts.

| Step | What it is |
| --- | --- |
| 1. **Patch acquisition** | Select and download appropriate patches; prepare them for deployment |
| 2. **Testing** | Determine whether the patch conflicts with other patches, key applications, or environment baselines |
| 3. **Risk assessment** | Impacts of installing: will application function change? does the system need a reboot that hits availability? |
| 4. **Deployment** | Install only on machines that need the patch |
| 5. **Compliance** | Verify machines function properly and comply with related policy and guidelines |

Surrounding duties: keep a hardware/software version inventory; define roles (monitoring, patching); standardise configurations; monitor relevant advisories; define a reaction timeline; apply patches through **established change control**; review the process; educate users; scan for missing patches or mis-configuration.

The 2008 booklet points to **Microsoft Systems Management Server (SMS)** for the full cycle, software inventory, and unauthorised-software detection (s.17.9, s.19.5.2). Treat SMS as a snapshot, not a live product standard.

## Test before apply; compensating controls (s.11.5.4, s.19.5.2)

Evaluate risk of installing versus risk of the vulnerability. If the owner decides **not** to apply a patch, or **no patch is available**, implement compensating controls, for example:

- turning off services or capabilities related to the vulnerability;
- adapting or adding access controls;
- increased monitoring to detect or prevent actual attacks.

Do not skip testing because a vendor labelled the patch “security”.

## High-risk systems first (s.19.5.2)

Risk is not uniform. An internal-only system faces fewer threats than one on the Internet serving the public. [[information-system-owner|Information System Owners]] set patch-checking and patching frequency for their systems. **High-risk systems should be addressed first.**

## Certificate of Product Patching (s.17.8)

To ensure Government IT **term contractors** deliver hardware and software with the latest patches, contractors certify that they have applied all applicable patches up to the time of system acceptance.

When a system has passed System Acceptance Testing and is ready for CSB acceptance, the contractor issues a **Certificate of Product Patching**. The Certificate should list all patches applied **and** any applicable patches **not** applied, with reasons. Details sit in the acquisition guidelines of the term contracts (2008 ITG / CCGO contract pages).

When a manufacturer ceases support, CSB should assess security requirement, information handled, and risk from the obsolete product, and plan upgrade or other measures ([[copyright-compliance]] on obsolete software).

## Related

[[06-network-malware-patch]] · [[malware]] · [[copyright-compliance]] · [[05-application]]
