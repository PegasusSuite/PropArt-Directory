# Ardor naming options (PropArt™ + Pegasus Suite LLC)

You asked to keep **ardor** in the story while the **master brand stays PropArt™** and **legal stays Pegasus Suite LLC**. This doc is a shortlist to "shop" names before you commit on domains, print, and app-store copy.

## Recommended stack (implemented on site)

| Layer | Name | Role |
|-------|------|------|
| Legal | **Pegasus Suite LLC** | Contracts, footer, invoices |
| Trademark | **PropArt™** | Suite-wide customer brand |
| Product | **PropArt™ Creator Space** | This app (Firebase / craft-inardor hosting) |
| Signature line | **create with ardor** | Emotional hook; honors "ardor" without a second trademark fight |
| Legacy (retire) | Craft In Ardor / Craft: In Ardor | Redirects & internal mapping only |

**Why this split:** PropArt™ is already on collateral in `C:\Projects\Git\Assets` and in suite docs. "Ardor" becomes the **voice** (tagline, hero, PWA subtitle), not a competing product name that confuses PropArt™ or the LLC.

---

## If you want "ardor" in the **product title** (not only the tagline)

Ranked for fit with PropArt™ + clay/maker audience:

### Tier A — strong fits

1. **PropArt™ Ardor Studio**  
   - *Pros:* Ardor in the name; "Studio" matches creation workflows.  
   - *Cons:* Another "Studio" next to PropArt™ Studio (PC tool); clarify in nav.

2. **PropArt™ Maker's Ardor**  
   - *Pros:* Warm, community-forward, clearly handmade.  
   - *Cons:* Long; harder on small UI.

3. **Ardor by PropArt™**  
   - *Pros:* DTC-friendly; ardor leads in conversation ("open Ardor").  
   - *Cons:* Sub-brand may feel separate from suite grid.

### Tier B — poetic / pegasus-adjacent (no "Pegasus" word)

4. **PropArt™ Wing & Ardor** — subtle lift/flight nod without using the LLC name in the product.  
5. **PropArt™ Fired Ardor** — clay/kiln energy; niche but memorable.  
6. **PropArt™ Ardor Commons** — community/gallery emphasis.

### Tier C — keep ardor as **edition** only

7. **PropArt™ Creator Space: Ardor Edition** — seasonal or launch naming.  
8. **The Ardor Hub** (subtitle under PropArt™) — internal codename only.

---

## Names to avoid

- **Pegasus Ardor** / **Pegasus Creator** — blurs LLC vs product; save "Pegasus" for legal/footer.  
- **Craft In Ardor** as primary — legacy; conflicts with PropArt™ collateral refresh.  
- **Ardor™** alone — expensive to defend; overlaps emotionally with PropArt™.

---

## Domain & hosting notes

- Canonical suite direction in Git docs points at **propart.app** paths; **www.craftinardor.com** can remain a technical host with **branded UI only** (no "craftinardor" in user-facing strings).  
- Pick **one** public name before buying domains; taglines can change without DNS churn.

---

## Decision checklist

- [ ] Product title: **Creator Space** vs **Ardor Studio** vs **Ardor by PropArt™**  
- [ ] Tagline locked: **create with ardor** (yes/no)  
- [ ] Print/QR: PropArt™ lockup from `PropArt-May2.svg` (no duplicate tagline under mark)  
- [ ] Email receipts / Stripe descriptors match chosen product name  
- [ ] Retire "Craft In Ardor" in all non-archive HTML (Bananas backups OK)

---

## Asset source of truth

Copy from **`C:\Projects\Git\Assets`** (private) into this app when marks change:

- Header lockup: `PropArt-May2.svg`  
- Compact mark: `propart-logo.svg`  
- Favicon: match `PropArt-Creator-Space/public/favicon.svg`  
- Tokens: `theme.css` / `propart-generic-theme.css` per `BRAND_SYSTEM.md`
