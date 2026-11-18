# UI audit — readability & working controls (2026-11-18)

Scope: full check of `public/` (index.html, app.js, styles.css) against the constitution
(Principle VI/X), Google Modern Web Guidance (`.vibe/skills/modern-web-guidance`:
visual-design/color, dark-mode, accessibility), and WCAG 2.2 AA. Contrast ratios below are
measured with the WCAG relative-luminance formula. Baseline: `npm test` — 25/25 pass.

## Found issues

### A. Unreadable color combinations are possible (the screenshot)
1. `applyTheme()` (`public/app.js`) sets `--accent`, `--bg`, `--surface`, `--fg`, `--ink`
   straight from the profile's saved colors with **no validation**. Black text on a dark
   purple background measures **1.36:1** — exactly the unreadable screen in the screenshot.
2. `--accent-ink` (primary-button text) is hard-coded per mode (`#ffffff` light,
   `#141613` dark) and is **not recomputed** when the user picks a different accent. A light
   accent (e.g. yellow) with white text is unreadable.
3. `--ink-2` / `--ink-3` (muted text) and `--line` / `--line-2` (borders) are fixed values,
   not derived from the user's `--fg`/`--bg`, so custom themes inherit mismatched muted
   text and borders.
4. `.toast` uses `background: var(--ink); color: var(--canvas)` — `--canvas` is never
   updated by `applyTheme()`, so toast text can end up on a near-identical background.
5. `.badge` and `.who-name` use raw `--accent` as text color — a light accent on a light
   surface is invisible.
6. Settings lets each profile pick any accent/background/surface/text color with plain
   `<input type="color">` (default `#000000`), no contrast check, no preview guard, and no
   "reset to default".
7. Switching profiles never clears previously set inline custom properties, so stale
   colors can linger.

### B. Measured contrast failures in the CURRENT DEFAULT tokens (`public/styles.css`)
8. Light mode muted text `--ink-3: #777e77` on `--surface: #fbfcfa` = **4.05:1** — fails
   WCAG AA 4.5:1 for normal text (used by hints, table headers, captions, empty states).
   On `--canvas: #eef0ee` it is **3.64:1**.
9. Input borders `--line-2: #cdd2cb` on surface = **1.49:1** (dark mode `#3a3f37` =
   **1.54:1**) — fails WCAG 1.4.11 non-text 3:1; fields are barely visible.

### C. Buttons / controls that do not work or are not operable in every situation
10. **All four dialog "Close" buttons are dead.** `public/app.js:1080` wires
    `document.querySelectorAll('dialog.panel')`, but the dialogs have class
    `dialog dialog-panel` (no `panel` class), so the selector matches nothing. Settings,
    History, Leftover log, and Month summary cannot be closed with their Close button
    (only native Escape works); backdrop click does nothing.
11. **No visible keyboard focus on buttons.** `:focus-visible` styles exist only for
    inputs/selects/textareas and the segmented control; `.btn` has no focus ring — fails
    WCAG 2.4.7. Buttons are native `<button>` so Enter/Space work, but focus is invisible.
12. `closeMonth()` relies on the native `confirm()` dialog — works, but inconsistent with
    the app's own dialogs; double-clicking "Close month" can fire the request twice
    (no loading/disabled state while the request is in flight).
13. Disabled buttons use `opacity: 0.45` — permitted by WCAG (disabled controls are
    exempt), but they still look clickable; prefer keeping them enabled and validating on
    click with an inline error where possible (NN/g guidance).
14. Async buttons (Save, Add expense, Add entry, Remove, Create/Close month) give no
    in-flight feedback — a click during a slow request looks like nothing happened and
    invites duplicate submissions.

### D. Default color scheme
15. Default light accent is ochre `#a16207` (4.78:1 on surface — passes, but reads muddy);
    the two seed profile themes (`src/db.js`) use red `#a63d2f` / teal `#1f5f5b` on paper
    `#faf6ef`, so the "default look" differs depending on which profile you pick.
16. Tab shows "Not secure" (`Niezabezpieczone`) because the app is served over plain HTTP —
    expected for LAN self-hosting; HTTPS belongs to the owners' nginx proxy, not app code.

## Proposed changes (plain terms)

1. **Make unreadable impossible.** In `applyTheme()`, compute WCAG contrast of the chosen
   text-vs-background and accent-vs-background; if below 4.5:1 (text) / 3:1 (non-text),
   auto-adjust (darken/lighten the text toward the required ratio) instead of applying
   raw values. Derive `--accent-ink` (white or dark ink, whichever contrasts ≥ 4.5:1 with
   the accent), `--ink-2`/`--ink-3`, `--line`/`--line-2`, `--canvas`, and the toast pair
   from the chosen colors via `color-mix()`. Clear all inline theme properties before
   applying a new profile.
2. **Settings theme editor:** show a live contrast readout per pair (pass/fail vs 4.5:1),
   block or auto-correct failing picks, and add a "Reset to default" button per profile.
3. **Fix the dead Close buttons:** select `dialog.dialog-panel, dialog.dialog-center`
   (or all `dialog`), and add backdrop-click-to-close for the slide-over panels.
4. **Focus rings everywhere:** add `.btn:focus-visible` (and `.panel-close`,
   `.segmented` already has it) with a 2–3px outline/ring ≥ 3:1 against the surface.
5. **All button states:** enabled / hover / focus / pressed / disabled / loading
   (spinner or label swap + `disabled` while a request is in flight, so no double submits);
   replace native `confirm()` for month close with the app's own dialog (Cancel/Confirm).
6. **New default palette (locked tokens, both modes), all pairs measured ≥ 4.5:1 text /
   ≥ 3:1 borders:**
   - Light: canvas `#faf6ef`, surface `#ffffff`, surface-2 `#f1e8da`, ink `#241c14`
     (15.58:1), muted `#5d564b` (6.73:1), accent `#1f5f5b` (6.85:1 on canvas, white on it
     7.38:1), danger `#a63d2f`, borders darkened to ≥ 3:1 on surface.
   - Dark: canvas `#1c1811`, surface `#262019`, ink `#f1e8da` (14.56:1), muted `#b3a894`
     (7.53:1), accent `#7fc4bb` (8.85:1 on canvas, dark ink on it 8.85:1).
   - Align the two seed themes in `src/db.js` to this palette (teal / red accents).
7. **Keep everything else:** layout, single-screen concept, per-profile theming (styles
   only) stay as-is per Principle VII; only the token values and the safety layer change.

## E. Scaling, zoom & touch targets (checked 2026-11-18)

Checked against WCAG 2.2 SC 1.4.4 (resize text 200%), SC 1.4.10 (reflow at 320 CSS px),
SC 1.4.12 (text spacing), SC 2.5.8 (target size >= 24x24 px), and Modern Web Guidance
`respect-os-text-scale` + `accessibility` (target sizes).

17. **Fixed pixel heights clip scaled text (SC 1.4.4 failure F69).** `--control-h: 40px`
    is applied as `height:` on `.btn` (styles.css:337), all inputs/selects/textareas
    (:412), and color inputs (:443). `.btn` also has `line-height: 1` + `white-space:
    nowrap` (:341-342). At 200% text zoom / larger OS text, button and field labels are
    clipped or overflow their fixed box.
18. **No OS text-scale opt-in, px body font.** `index.html` has the viewport meta (good:
    no `user-scalable=no`, pinch zoom allowed) but NOT `<meta name="text-scale"
    content="scale">`; `--font-size-body: 16px` is fixed px (styles.css:54), so OS-level
    text scaling is ignored and rem-based children don't scale from a responsive root.
19. **No coarse-pointer target bump.** Buttons are 40px tall (passes SC 2.5.8's 24px
    minimum, and 46px for `.btn-lg`/`.pick-buttons`), but there is no
    `@media (pointer: coarse)` rule raising targets toward the recommended 44x44px on
    touch screens. Segmented-control options are 32px tall (ok).
20. **Pixel media query assumes default text size.** The only breakpoint is
    `@media (max-width: 1024px)` (styles.css:247); Modern Web Guidance recommends
    em-based or container-query breakpoints so layout still reflows when text is scaled.
    Reflow itself is mostly fine: single column below 1024px, wrapping flex topbar,
    `.table-wrap` horizontal scroll (allowed 2D exception for data tables), dialogs use
    `min(520px, 100vw/94vw)`, toast `min(480px, 92vw)`.
21. `--font-size-micro: 0.72rem` (~11.5px) is very small — already fails contrast via
    `--ink-3`; also bump when fixing readability.

### Proposed scaling fixes
- Controls: `min-height: var(--control-h)` instead of `height` (keep `--control-h` in
  `rem`-friendly form), remove `nowrap` from `.btn`, give `.btn` `line-height: 1.2` and
  `height: auto` growth; allow labels to wrap to two lines.
- Typography: add `<meta name="text-scale" content="scale">` to `index.html`; set body
  font-size in `rem` (or inherit) and convert the `--font-size-*` tokens from px to rem;
  never set `font-size` on `:root`/`html`.
- Touch: `@media (pointer: coarse) { .btn, .segmented span, .panel-close { min-height:
  44px } }`.
- Layout: move the 3-column `.screen` breakpoint to a container query (or em-based media
  query) so it triggers on available space, not assumed text size.

## Implementation status (2026-11-18, branch vibe/ui-readability-c3e02f)

All items above implemented in `public/` + `src/db.js`:
- `applyTheme()` now validates every pair with the WCAG luminance formula and auto-derives
  safe values (`--accent-ink`, muted inks, lines, `--canvas`, surfaces); stale inline props
  are cleared on profile switch. No selectable combination can drop below 4.5:1 text /
  3:1 borders.
- Settings: live contrast readout per profile (text/bg and accent/bg ratios with OK/too
  low) + "Reset to default" button.
- Dialog Close buttons fixed (`dialog` selector, all dialogs), backdrop-click closes every
  dialog except the mandatory profile pick; month close uses an in-app Confirm dialog
  instead of `confirm()`.
- `.btn:focus-visible` / `.panel-close:focus-visible` outline rings added; buttons use
  `min-height` + wrapping labels + `line-height: 1.2`; `aria-busy` loading state on all
  async buttons (save/add/remove/create/close) prevents double submits.
- New default palette in `styles.css` (+ dark mode) and aligned seeds in `src/db.js` —
  every pair re-measured (see verification below). Breakpoint moved to `64em`;
  `@media (pointer: coarse)` 44px targets; `<meta name="text-scale" content="scale">`;
  font tokens in rem; toast wraps instead of clipping; `inputmode="decimal"` on money
  inputs; smooth scrolling gated behind `prefers-reduced-motion: no-preference`.
- Micro-interactions (per 2025/26 guidance: quick 90–130ms, transform+color only,
  reduced-motion respected): button press `translateY(1px) scale(0.98)`, focus rings,
  busy state, wrapping toast with `title`, smooth scroll.

Verification: `node --check` on all JS; `npm test` 25/25; live server smoke test
(GET /, /api/state, POST /api/months, PUT plan, GET month, PUT profile theme);
contrast re-measured from the final stylesheet tokens (all text pairs >= 4.5:1, borders
>= 3:1 in both modes).

## Round 2 — theme presets & dark mode (2026-11-18)

- Customization reworked: free-form color pickers replaced by 4 predefined FULL-theme presets
  (`paper`, `paper-dark`, `ink`, `contrast`) selected in Settings with live preview. Each
  preset changes colors + fonts + radii + density + shadows together (`data-theme` attribute).
- **Dark mode fixed**: previously `data-mode='dark'` was clobbered by inline light colors
  written by `applyTheme()`. Now the preset owns the whole token set incl. `color-scheme`.
  Server validates `theme.preset`; legacy color themes normalize to `paper` on read.
- All 4 presets re-measured from the shipped CSS: every text pair >= 4.5:1, borders >= 3:1.

## Round 3 — figures, categories, settings (2026-11-18)

- "Personal obligatory" renamed to "Personal expenses" (en/pl, aria-labels, README).
- Live figures redesigned: split bar (% per side of the shared plan, driven by the salary
  inputs), live coverage bar (who fronted what % of actual spending vs the pot — changed via
  the payer pick on each expense), per-partner leftover rows, pot balance + settle-up, and the
  fairness note "each side pays X% of their own income" (equal by construction, R2/R4).
- Expense categories are now selectable per expense (new `expenses.category` column with a
  guarded `ALTER TABLE` migration) and shown as color-coded chips in the log and in Settings.
- Settings has ONE Save button (saves all profiles + currency/language/categories at once);
  per-profile "Reset to default" just re-selects the paper preset.
- Dialog panels compacted so default content fits 100dvh without scrolling.

## Round 4 — 6 preset families, each light+dark (2026-11-18)

- 6 presets: paper, ink, sunrise, berry, ocean, contrast — each with `data-mode` light/dark
  variants (12 combos). Structure (fonts/radii/density/shadows) varies per family; colors per
  family+mode. Settings: preset picker + light/dark toggle per profile, live preview, one Save.
- All 12 combos re-measured from shipped CSS: text >= 4.5:1, borders >= 3:1.
- Server: THEME_PRESETS list, preset+mode validation, legacy themes normalize (preset=paper,
  mode=light). Seeds: A=paper/light, B=berry/dark.

## Round 5 — split semantics & per-side layout (2026-11-18)

- Split bar is explicitly "share of the shared plan (by salary)" — never "% of the pot".
  Fairness line states the definition: equal % of each partner's own income (both pay X%).
  Each partner column shows their share of plan AND their % of own income.
- Coverage bar = who fronted what % of money actually spent so far (A / B / pot).
- Hover/focus info tips (small "i", keyboard-focusable, WCAG-safe tooltip) explain each bar.
- Each partner's info is on their own side, color-coded: side A = accent, side B = accent-2
  (side panels, figures columns).

## Round 6 — per-user settings, live calc, per-item shares, personal cards (2026-11-18)

- Theme is per PARTNER PROFILE (server-side) again — never per browser. Settings shows only
  the current profile (name + theme preset + mode); the other partner's theme is not editable
  from your session. One Save button in Settings.
- "Currency (ISO 4217)" label simplified to "Currency"/"Waluta".
- Live calculations: plan figures recompute client-side on every keystroke (shared money.js
  served at /shared/money.js) + debounced autosave with a Saving…/Saved indicator; the plan
  Save button is gone.
- Per-item partner share % on fixed/variable costs (empty = "auto" salary split); -1 sentinel,
  guarded table-rebuild migration, API validates [-1,100]; sums stay exact (tests).
- Split bar now reflects effective contributions (incl. overrides); each partner column shows
  their actual % of own income; fairness note shows when both are equal.
- Personal expenses render as compact cards in the side panels — no horizontal scrolling.

## Round 7 — prevention & detection system (2026-11-18)

So UI/UX regressions are caught without anyone spelling them out:
- `tests/ui-static.test.js` (runs in `npm test` + CI): i18n parity/placeholders/dead keys/
  hardcoded strings; WCAG 2.2 AA contrast for EVERY preset × light/dark token pair; every HTML
  button id wired in app.js; dialog close + backdrop; scaling guards (no fixed control heights,
  no nowrap buttons, zoom allowed, text-scale meta, coarse targets); theme per-profile (no
  localStorage), settings scoped to current profile, single Save; autosave/liveSummary wiring;
  personal cards not tables; per-item pct migration+validation.
- `.github/workflows/ci.yml`: runs the suite on push/PR.
- `.github/PULL_REQUEST_TEMPLATE.md`: manual visual checklist (states, focus, 200% zoom,
  320px reflow, dialogs fit, per-side info, % labels + tips).
- Constitution 1.5.0 encodes this as Principle X.

## Guidelines checked against
- WCAG 2.2 (W3C): SC 1.4.3 contrast ≥ 4.5:1 normal / 3:1 large text; SC 1.4.11 non-text
  ≥ 3:1; SC 2.4.7 visible focus; SC 2.5.8 target size ≥ 24×24px (44×44px recommended —
  current `--control-h: 40px` height is fine on desktop, bump padding on small screens).
- Google Modern Web Guidance (installed at `.vibe/skills/modern-web-guidance`):
  `visual-design/color` (never color-alone, forced-colors fallbacks, tint generation),
  `visual-design/dark-mode`, `accessibility/*` (focus indicators, target sizes, live
  regions — the existing `role="status"` toast is correct).
- NN/g button guidance: verb-first labels (already good: "Create month", "Save"), all
  states distinct, don't rely on color alone, prefer enabled+inline-error over silent
  disabled buttons.
- WCAG 2.2 scaling criteria: 1.4.4 Resize Text (200%), 1.4.10 Reflow (320 CSS px),
  1.4.12 Text Spacing, 2.5.8 Target Size (24x24 px min, 44px on coarse pointers per Modern
  Web Guidance); Modern Web Guidance `respect-os-text-scale` (`<meta name="text-scale"
  content="scale">`, rem units, min-height over height, no root font-size override).

## Round 5 — full review pass (2026-11-18, found by reading the shipped code end to end)

### Found (concrete)
1. **Literal "null" rendered next to the Add button** in personal expenses (and in the
   variable-cost section of a closed month, and in the leftover log): `replaceChildren(...,
   cond ? node : null)` — the DOM stringifies a raw `null` argument into the text "null".
   Fixed with a `kids()` filter helper used at every `replaceChildren` call site; a static
   guard test now fails if a raw `null`/`false` is ever passed directly to `replaceChildren`.
2. **Only one partner % per cost, cramped into the cost table.** Fixed/variable plan items
   were a 4-column table (label / amount / "B %" / remove) with `thead th { white-space:
   nowrap }` and `.table-wrap { overflow-x: auto }` — the % column lived in the same row as
   the costs, scaled badly, and forced horizontal scrolling in the center card. Plan items
   now render as cards with a two-sided split editor: `A%` and `B%` inputs side by side,
   kept in sync to sum to 100, blank = automatic salary split (placeholders show the
   computed salary %), plus an "auto" reset. Personal items keep one % but it is labeled
   with the partner's actual name.
3. **Horizontal scrolling in the side panels**: `.personal-row` did not wrap, so the
   % label + 4.5rem input + Remove button overflowed the 230px-min panel. Rows now wrap,
   the % input is narrower, `thead th` no longer nowraps, `td` wraps anywhere, and
   `.screen > *` is `min-width: 0`.
4. **Settings sections were indistinguishable** (flat stacks of h3s). Now three labeled
   sections: "Your profile" (with a hint that name/theme/mode are per-profile only),
   "App" (currency/language), "Expense categories". Still exactly one Save button.
5. Guard suite extended: kids()/replaceChildren scan, plan-cards-not-tables, both `data-side`
   split inputs, every dynamic `el('button'` has `onclick`, CSS wrap/nowrap/min-width rules.
   `npm test`: 43/43 pass. API smoke test: per-item `partnerSharePct` (-1/25/50/100) round-trips
   and contributions sum exactly.
