# PropArt™ Brand System

This document is the single source of truth for shared branding decisions across PropArt™ apps.

## Naming Architecture (Canonical)

- **Legal entity:** `Pegasus Suite LLC` (contracts, billing, footer legal).
- **Master customer-facing brand:** `PropArt™`.
- **Product naming pattern:** `PropArt™ + app name` (for example: PropArt™ Creator Space, PropArt™ Cropper Tool, PropArt™ Color Blend Visualizer).
- **Trademark usage:** `PropArt™` as the primary trademark line.
- **Legacy names:** retire or map through redirects (see `BRAND_NAMING_MAP.md`).

### Domain Availability Strategy

When exact-match domains are unavailable:

1. Keep branding copy consistent (`PropArt™`) across every UI.
2. Use one primary canonical web root and route apps by subpath/subdomain when possible.
3. If legacy Firebase URLs remain, treat them as technical endpoints and link with branded button labels.
4. Maintain redirect aliases so old links still resolve without exposing naming churn to users.

## 1) Design Token Contract

Use tokens first. Avoid hard-coded values in component styles where a token exists.

### Color Tokens

Defined in `theme.css`:

- `--base-charcoal`
- `--signature-navy`
- `--tech-silver`
- `--butterfly-blue`
- `--vibrant-pink`
- `--glass-bg`
- `--glass-blur`
- `--glass-border`

### Typography Tokens (target)

Adopt a shared type scale across apps:

- Display: `2.25rem` / `700`
- H1: `1.9rem` / `700`
- H2: `1.5rem` / `700`
- H3: `1.2rem` / `600`
- Body: `1rem` / `400`
- Small: `0.875rem` / `400`

### Spacing Tokens (target)

Use an 8pt-inspired scale:

- `4, 8, 12, 16, 24, 32, 48`

### Radius Tokens (target)

- Small: `10px`
- Medium: `16px`
- Large: `24px`
- Pill: `999px`

### Elevation Tokens (target)

- Level 1: subtle card
- Level 2: interactive card/hover
- Level 3: modal/sheet

## 2) Shared Component Rules

These are cross-app standards beyond color.

- **Buttons**
  - Primary gradient: butterfly-blue -> vibrant-pink.
  - Consistent min tap size (`>= 44px`).
  - Same hover/active timing/easing.
- **Panels**
  - Reuse `.glass-panel` with blur fallback.
  - Cards and modal shells should reuse shared radius/elevation values.
- **Loaders**
  - Reuse `.butterfly-loader` and `butterfly-glow` animation.
- **Focus/Accessibility**
  - Always include visible focus style for keyboard users.
  - Maintain semantic button/link roles and ARIA labels.
- **Notifications**
  - Prefer inline/toast notices over blocking popups.

## 3) Implementation Checklist

Use this checklist before releasing style changes:

- [ ] Tokenized values are used instead of hard-coded hex where possible.
- [ ] Primary actions use shared gradient and interactive states.
- [ ] Glass panels degrade blur on low-power/reduced-motion/mobile.
- [ ] All major controls meet minimum target size.
- [ ] Keyboard focus styles are visible for interactive elements.
- [ ] Loading states use butterfly loader.
- [ ] Footer legal text includes Pegasus line.

## 4) Pending Enhancements

These are queued to fully operationalize the system.

1. **Tokenize remaining inline styles in `index.html`**
   - Migrate high-value inline blocks (pricing, modals, cart fragments) to class-based styles using tokens.
2. **Extract typography and spacing tokens into `theme.css`**
   - Add formal font-size, spacing, radius, and elevation variables.
3. **Create reusable button classes**
   - `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger` and replace one-off inline button styling.
4. **Create modal shell component class**
   - Standardize modal layout, header, close button, and z-index stack behavior.
5. **Cross-app adoption**
   - Apply `theme.css` contract to Cropper, Studio, and Dashboard apps.
6. **Accessibility sweep**
   - Verify tab order, landmark labels, and contrast in all tabs/modals.
7. **Performance hardening**
   - Add a low-power mode class to disable expensive visual effects.
8. **Brand nav strategy**
   - Reintroduce shared Pegasus navigation only via an opt-in component with layout-safe placement (no flow shift).
9. **Visual regression checks**
   - Add screenshot checks for hero, cart, pricing, and modal stacks.
10. **Governance**
   - Require a brand-check section in PRs for any UI-facing change.

## 5) Change Control

When updating this system:

1. Update `theme.css` first.
2. Update this file with any new token/component rule.
3. Apply changes in one app as reference implementation.
4. Roll out to other apps using the same classes/tokens.

## Support PropArt™

Tips and ongoing support: **[Ko-fi — PropArt Suite](https://ko-fi.com/propartsuite)**.
