# PropArt Directory — handoff notes

## Active UX direction (suite headers)

- **Canonical reference:** Color Blend Visualizer banner rhythm ([BlendVisualizer](BlendVisualizer/index.html) gradient header + white pill controls).
- **Review mockup:** [`propart-blend-banner-suite-mockup.html`](propart-blend-banner-suite-mockup.html) — one strip per surface (Creator Space, Studio, Blend, Cropper, Cane, POD, Directory).
- **Live Creator hub:** [https://propart-creator.web.app/](https://propart-creator.web.app/) (prefer over legacy local Hub file experiments unless explicitly scoped).

## Banner mockup rules (current)

| Element | Spec |
|--------|------|
| Lockup | `./PropArt-May2.svg` only — **do not** repeat “Tools for polymer clay artists” under the mark; it’s embedded in the art. |
| Gradient | Lavender → mint **~50% lighter** than the original Blend banner stops (mixed toward white); see `--banner-gradient` in the mockup file. |
| Top row | Logo left; tool **title + subtitle** center-ish (`flex: 1` meta block); **Theme** + **Sign in** **inside** the gradient card, top-right (static placeholders in mockup). |
| Pill | White pill below: **suite destinations left**, **divider**, **contextual tool icons + tier badge right**. |
| Shadows | Keep card / pill / buttons at **~4px** blur — avoids the heavy “haze” from larger spreads. |
| Typography | **Darkest text = eggplant `#3d3366`** (`--propart-eggplant` in [`propart-generic-theme.css`](propart-generic-theme.css)). **No pure black** for primary UI copy in this pattern. Secondary body uses muted eggplant `#5c4d85`. |

## Per-app header lockups

### Cropper Tool — isolated header mockup (pixel target)

Use **[`CropperTool/cropper-header-only-mockup.html`](CropperTool/cropper-header-only-mockup.html)** when refining Cropper chrome **without** touching the full app. Keep iteration confined to this file until the layout is approved, then port into [`CropperTool/index.html`](CropperTool/index.html).

| Piece | Mockup spec |
|--------|-------------|
| Top chrome row | **`min-height: 75px`** (`--top-bar-height`) |
| Logo | [`PropArt-MayCropperFinal.svg`](CropperTool/PropArt-MayCropperFinal.svg), **58px** tall |
| Tier pill | **118×34**, background [`PropArtButtonStandard.svg`](CropperTool/PropArtButtonStandard.svg) — use [`PropArtButtonPro.svg`](CropperTool/PropArtButtonPro.svg) / [`PropArtButtonFree.svg`](CropperTool/PropArtButtonFree.svg) when wiring real tier skins |
| Login indicator | Small **green dot** inside the tier pill (left), denoting logged into PropArt (mockup is static) |
| Notifications | **34×34** circle, [`PropArtButton.svg`](CropperTool/PropArtButton.svg), **bell immediately left of Sign in** |
| Sign in | **88×34**, [`PropArtSignIn.svg`](CropperTool/PropArtSignIn.svg) |
| Control pill | White/translucent rounded strip; orbit icons **34×34** circles using [`PropArtButton.svg`](CropperTool/PropArtButton.svg) |
| Auto slices | **Separate floating control** — **46×46** circle, right-middle of the card (not inside the pill); production [`CropperTool/index.html`](CropperTool/index.html) still embeds the autoslices chip **in** the orbit row until this layout is ported |

### Cropper Tool — production shell

- **[`CropperTool/index.html`](CropperTool/index.html)**: rounded **banner card** with [`PropArt-MayCropperFinal.svg`](CropperTool/PropArt-MayCropperFinal.svg) (fallback [`PropArt-MayCropper.svg`](CropperTool/PropArt-MayCropper.svg)), quick links (**Quick Start · Upload · Guide**), **orbit** toolbar using [`PropArtButton.svg`](CropperTool/PropArtButton.svg) skins, and top-right chrome **tier · bell · Sign in** ([`PropArtSignIn.svg`](CropperTool/PropArtSignIn.svg)). Tier trigger picks Standard / Pro / Free SVG via script. Legacy visible `toolbar-band` removed; **`.cropper-toolbar-ghost`** keeps hidden inputs/button IDs for `cropperOrbitAct` and existing logic.
- **Local `file://` preview:** an early `<head>` script rewrites `<base href="/CropperTool/">` to `./` so `./PropArt-*.svg` resolves; prefer hosted preview if caching or base behavior still confuses local checks.

## Related files

- Older USB / ribbon explorations: [`propart-universal-banner-mockup.html`](propart-universal-banner-mockup.html)
- Blend-style suite strips: [`propart-blend-banner-suite-mockup.html`](propart-blend-banner-suite-mockup.html)
- Brand specimen page: [`brand-showcase.html`](brand-showcase.html)

## Premium tools placement (historical context)

Premium clay calculators/widgets belong on **PropArt Studio** (`https://propart.app/Studio#clay-premium-tools`), not duplicated on Creator Space / Hub navigation as a tab.
