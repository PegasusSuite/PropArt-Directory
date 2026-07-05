# PropArt™ Suite Platform — Whitepaper

**Author:** Pegasus Suite LLC · **Audience:** Internal product / engineering · **Version:** 1.0 · **Date:** May 2026

**Distribution:** Internal only — kept in-repo for planning; **not** published via Firebase Hosting (all `*.md` and `firebase/**` under the hosting root are in `ClayWorks/firebase.json` hosting `ignore`).

## 1. Purpose

This document collects **continuity**, **brand/domain**, and **platform** directions for the PropArt™ suite. The live [Directory of Applications](https://www.craftinardor.com/suite) page stays a **minimal launcher**; strategy and backlog stay in this Markdown file outside the public site surface.

## 2. Suite Vault (continuity vision)

**Problem:** Makers use several standalone tools (Cropper, Studio, Color Blend Visualizer, Cane Design Studio, Creator Space). Saves are scattered; returning to "what I touched last Tuesday" requires bookmarks and memory.

**Direction — "Suite Vault":** A single **signed-in** surface that aggregates **recent saves** from each app with:

- **Source app** (Cropper · Studio · Hub · Studio Cane …)
- **Title / thumbnail / timestamp** (metadata agreed per integration)
- **"Open in …" deep links** that jump straight into the right screen in the originating app — **without** merging every workflow into one mega UI.

**Principles:**

- Apps stay **focused**; the Vault is navigation and memory, not a replacement editor.
- **Opt-in telemetry** only; respect tiers and entitlement flags from existing security context patterns.

## 3. Domain and naming

**Observation:** Truly **exact-match** consumer domains are often unavailable or expensive.

**Guidance:**

- Lead with the **customer-facing name** **PropArt™** in UX, marketing, and receipts.
- Rely on **stable technical URLs** (e.g. `*.web.app`, future custom apex) and **redirects/mapping tables** under your control.
- Document canonical URLs in Firebase Hosting and any storefront so future DNS moves are swaps, not rebrands.

## 4. Enhancement backlog (suggested)

Prioritize by impact vs. integration cost; not all apps need every item on day one.

| Area | Idea |
|------|------|
| **Identity** | Shared Firebase (or SSO) posture across apps so "signed in once" reliably reflects on the Vault and directory. |
| **Deep links** | Standard query or path conventions (`handoff=` already begun) documented in TECHNICAL_DOCS-style appendix. |
| **Vault data** | Lean Firestore schema: `{ userId, appId, savedAt, label, deeplinkUrl, preview? }` with TTL or caps by tier. |
| **Directory UX** | Optional "last opened" badges fed by localStorage until Vault ships. |
| **Accessibility** | Full keyboard order through dial cards; visible focus rings; reduced-motion respected. |
| **Observability** | Privacy-aware click aggregates from the directory → which tiles need better descriptions or CTAs. |
| **Operations** | Lightweight status or changelog link when an app subdomain is degraded. |
| **PWA** | Per-app install remains; optionally a **directory-only** minimal manifest as the suite "home bookmark." |

## 5. References

- Live launcher: https://www.craftinardor.com/suite  
- Source Markdown (this file): `ClayWorks/craftinardor/SUITE_PLATFORM_WHITEPAPER.md`

---

© 2026 Pegasus Suite LLC. PropArt™ is a trademark positioning for Pegasus Suite LLC products and experiences described herein.
