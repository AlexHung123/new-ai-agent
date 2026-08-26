---
title: Outsourcing, residual ownership and cloud
created: 2026-08-21
updated: 2026-08-21
type: chapter
tags: [chapter, outsourcing, cloud, policy, guideline]
sources: [MinerU_markdown_G3_EN_2090718479378567168.md]
g3_sections: 17
confidence: high
contested: false
---

# Outsourcing, residual ownership and cloud

G3 s.17: protect systems and assets accessible by external service providers. Residual overall responsibility **stays with the B/D**. Concept: [[outsourcing-security]]. Data owner: [[information-owner]]. Approvals and visibility: [[ditso]].

## Section map

| G3 | Topic |
| --- | --- |
| 17.1(a) | ESPs observe departmental policy; need-to-know; **no** unsupervised production access; remote day-to-day management **strictly prohibited**; residual B/D responsibility; know data location |
| 17.1(b) | No access until controls + contract; NDA; SLAs; no third-party disclose without prior written consent; redirect requests; secure erase with written confirmation; escalation |
| 17.1(c) | Indemnity |
| 17.2(a) | Monitor; audit rights or periodic certificates |
| 17.2(b) | On expiry: destroy data (G3 s.10.3(b)); return assets (s.10.1(c)) |
| 17.3 | Cloud shared responsibilities; B/D still accountable |

## Outsourcing security (s.17.1(a))

Outsourcing is an arrangement with an organisation outside Government to provide services the B/D could undertake itself. When a system is outsourced, security management processes **shall** protect the data and mitigate the associated risks.

External service providers engaged on government work **shall observe and comply** with the B/D’s departmental IT security policy and other Government information-security requirements. Identify and assess risks to government data and operations. Classify all data to be handled. Data transferred to ESPs may be **masked** according to nature and use case. Document and implement security measures, service levels and management requirements commensurate with classification and business need, with defined ESP responsibilities. Grant security privileges **only on a need-to-know basis**.

B/Ds **shall not** allow ESPs **access rights to government information systems and data in a production environment**. If access is necessary (e.g. maintenance and support), it **must** be **closely supervised** by authorised personnel in a controlled environment. **Remote access to production systems and data by ESPs for day-to-day management and operation shall be strictly prohibited.**

Define, agree and document roles of the ESP, the B/D and end users. **Although development, implementation and/or maintenance can be outsourced, overall responsibility remains under the B/D.**

Ensure the ESP’s contingency plan and backup process are adequate, and that ESP staff receive awareness training. The information or system owner should **know the location of data** hosted by the provider and ensure measures comply with relevant security requirements and local laws.

## Contracts (s.17.1(b–c))

Controls **shall** administer access by external consultants, contractors and temporary staff. Reflect third-party access and internal-control requirements in the contract.

**Do not allow access** by external consultants, contractors, outsourced staff or temporary staff to information or systems owned or in the B/D’s custody **until appropriate controls are implemented and a contract has been signed** defining the terms of access.

Define security requirements of the outsourced systems in the contract; they form the basis of tendering and of tenderer compliance.

The contract should include:

- **NDA** — ESP staff undertake confidentiality where classified access is required.
- **SLAs** — expected performance of each required security control, measurable outcomes, remedies and response for non-compliance; liability, reliability and response times.
- **No transfer or disclosure** of classified government data to any third party **without the Government’s prior written consent**.
- If a third-party disclosure request cannot be rejected directly, the ESP **shall immediately inform and redirect** it to the B/D.
- Procedures for **securely erasing** government data on all ESP platforms, with **written confirmation** after erasure.
- **Escalation** for problem resolution and incident response.

Include **indemnity** clauses in all external-service contracts to protect the Government from damage or loss from service disruption or contractor-staff malpractice (s.17.1(c)).

## Monitoring and contract end (s.17.2)

**Shall** monitor and review with ESPs so operations are documented and managed. Manage and review confidentiality/NDAs when security requirements change.

Use the contract to **reserve audit and compliance-monitoring rights** over government systems, facilities and data: audit SLA responsibilities, have audits done by an independent third party, and enumerate statutory auditor rights. **Otherwise** the ESP **shall** provide satisfactory security audit/certification reports **periodically**.

Establish processes to: monitor performance against the agreement; hold regular progress meetings; review security issues, operational problems and audit reports and follow up; retain overall control and visibility (change, vulnerability, incident monitoring and response).

On **expiry or termination**, **shall** ensure all government data in external services or facilities are **cleared or destroyed** according to classification. Destruction **shall** comply with G3 **s.10.3(b)** (information erasure). ESP staff **shall return all government assets** (s.10.1(c)). Define and document the termination process.

## Cloud computing (s.17.3)

**Shared responsibilities** divide security and management between the Cloud Service Provider (public or private) and the cloud customer. Before signing, B/Ds **shall** ensure those responsibilities are **clearly defined, documented and understood**. Review terms of service, data-protection policy and CSP security measures.

After signing, ensure continuous compliance; review regularly that the CSP is meeting its share. This is how B/Ds secure the workloads they put in the cloud.

**Overall accountability of the information system remains under the B/D** even if development, implementation and/or maintenance are outsourced. Companion: *Practice Guide for Cloud Computing Security* (ITG InfoStation).

## Related links

[[outsourcing-security]] · [[information-owner]] · [[ditso]] · [[classified-information]] · [[12-development]] · [[15-continuity]]
