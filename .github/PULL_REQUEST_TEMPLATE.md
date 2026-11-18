# PR checklist

Automated guards run in CI (`npm test` includes `tests/ui-static.test.js`: i18n parity,
per-preset×mode WCAG contrast, button wiring, scaling rules, architecture guards). Manual
pass still required for anything visual:

## UI / UX review (required for any change under `public/`)
- [ ] Contrast: every new/changed color pair measured ≥ 4.5:1 (text) / ≥ 3:1 (borders/icons), in **every preset × light/dark** — `npm test` enforces this for token changes.
- [ ] Every button/control has a wired handler in **every state it's visible** (incl. dialogs: Close button, Escape, backdrop click) and a visible `:focus-visible` ring.
- [ ] All button states styled: enabled / hover / focus / pressed / disabled / loading (`aria-busy`); async buttons can't double-submit.
- [ ] Text resizes to 200% without clipping (controls use `min-height`, labels may wrap) and the layout reflows at 320 CSS px without horizontal scroll — including side panels.
- [ ] Touch targets ≥ 44px on coarse pointers; `prefers-reduced-motion` respected.
- [ ] All user-facing strings go through `I18N` in **both** en and pl (incl. `data-i18n-aria`); placeholders match; no dead keys — enforced by tests.
- [ ] Dialogs/panels fit on screen at default viewport without scrolling.
- [ ] Each partner's info stays on their own side (color-coded accent / accent-2); theme/preset changes only affect the profile being edited.
- [ ] Money semantics: split = share of shared costs by salary unless an item overrides it; fair share = equal % of own income; every % has a plain-language label + hover/focus info tip.
- [ ] Money math invariants still pass (`npm test`); integer cents only; per-item splits sum exactly.
- [ ] Live updates: edits recompute figures immediately and autosave (no save-per-form).

## Summary
- What changed and why (plain terms):

## Verification
- Commands run:
