---
title: Security by design
created: 2026-08-22
updated: 2026-08-22
type: concept
tags: [security-by-design, development, principle]
sources: [MinerU_markdown_S17_EN_2090718517630623744.md]
s17_sections: 6, 16
confidence: high
contested: false
---

# Security by design

Security by design **shall** be adopted to incorporate security requirements into the system development lifecycle (SDLC), ensuring that information systems and applications are implemented with appropriate security and data-protection measures. Security **shall** be considered and introduced throughout **all phases** of the development process in order to minimise rework efforts (S17 s.6). Hub: [[12-development]].

S17 does **not** print G3’s “shift-left,” program-cataloguing, or design-stage review *shalls*. Do not invent them here.

## In the SDLC (S17 s.16)

Security planning and implementation of appropriate security measures and controls for systems under development according to the systems’ security requirements **shall** be included (s.16.1.1). B/Ds **shall** establish and appropriately secure development environments covering the entire SDLC (s.16.2.1). Formal testing and review of security measures **shall** be performed **prior to implementation** (s.16.2.3).

The integrity of an application **shall** be maintained with version control and **separation of environments** for development, system testing, acceptance testing, and live operation (s.16.2.4) — isolate those environments whenever possible (s.16 chapeau). Change-control procedures for requesting and approving program/system changes **shall** be documented (s.16.2.5). Staff **shall** be formally advised of the impact of security changes and usage (s.16.2.6).

The Application Development & Maintenance Team **shall** liaise with the [[information-owner|Information Owner]] to define and implement system security requirements during development and maintenance, and ensure quality procedures, techniques, and tools are used to produce secure systems (S17 s.5.3.4). Test data: s.16.3.1. Pre-rollout SRA/PIA: [[security-risk-assessment]].

## Related

[[12-development]] · [[information-owner]] · [[security-risk-assessment]] · [[02-principles]] · [[segregation-of-duties]] · [[classified-protection]]
