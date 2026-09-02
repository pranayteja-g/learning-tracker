// ── Design tokens ─────────────────────────────────────────────────────────
// "Night study desk": a dark, warm-neutral surface with parchment-toned
// text and a single confident amber accent — like reading by a desk lamp.
// One accent carries all interactive/brand weight; green and red are
// reserved strictly for success/danger states, never decoration.
//
// This is the shared foundation for the app's visual redesign. Settings &
// modals adopt it first; the rest of the app follows in later passes —
// import from here rather than hardcoding hex values in new work.

export const color = {
  // Surfaces
  ink:        "#0d0d11",  // page/app background
  surface:    "#17161a",  // modal / card / panel background
  surfaceAlt: "#0f0e12",  // recessed fields (inputs, code blocks)
  rule:       "#252329",  // hairline borders & dividers
  ruleSoft:   "#1c1b20",  // quieter dividers (within a group)

  // Text
  text:       "#e9e4d9",  // primary text — warm parchment, not stark white
  textMuted:  "#948d80",  // secondary text
  textFaint:  "#5c574e",  // tertiary / placeholder / hint text

  // Brand accent — used for all primary actions, active states, focus
  accent:      "#d9a441",
  accentSoft:  "#d9a44122",
  accentBorder:"#d9a44144",
  onAccent:    "#1a1508",  // text drawn on top of a solid accent fill

  // Semantic — status only, never decorative
  success:      "#6f9a82",
  successSoft:  "#6f9a8220",
  successBorder:"#6f9a8244",
  danger:       "#c2543f",
  dangerSoft:   "#c2543f1e",
  dangerBorder: "#c2543f40",
};

export const radius = { sm: 6, md: 9, lg: 14 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const font = {
  display: "Georgia, 'Times New Roman', serif",
  body:    "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono:    "'SF Mono', 'Roboto Mono', monospace",
};

// ── Shared style fragments ───────────────────────────────────────────────
// Small composable pieces so common patterns (inputs, buttons, dividers)
// look identical everywhere they're used instead of drifting per-component.

export const focusRing = {
  outline: `2px solid ${color.accent}`,
  outlineOffset: 2,
};

export const input = {
  width: "100%", boxSizing: "border-box",
  background: color.surfaceAlt, border: `1px solid ${color.rule}`,
  borderRadius: radius.sm, padding: "10px 12px",
  color: color.text, fontSize: 14, fontFamily: font.body,
  outline: "none",
};

export const label = {
  fontSize: 12.5, color: color.textMuted, fontFamily: font.body,
  marginBottom: 6,
};

export function button(kind = "default") {
  const base = {
    fontFamily: font.body, fontSize: 13.5, cursor: "pointer",
    borderRadius: radius.sm, padding: "10px 16px", border: "1px solid transparent",
    transition: "opacity 0.15s, background-color 0.15s",
  };
  if (kind === "primary") return { ...base, background: color.accent, color: color.onAccent, fontWeight: 600 };
  if (kind === "danger")  return { ...base, background: color.dangerSoft, borderColor: color.dangerBorder, color: color.danger, fontWeight: 600 };
  if (kind === "success") return { ...base, background: color.successSoft, borderColor: color.successBorder, color: color.success, fontWeight: 600 };
  if (kind === "ghost")   return { ...base, background: "transparent", borderColor: color.rule, color: color.textMuted };
  return { ...base, background: color.surfaceAlt, borderColor: color.rule, color: color.text };
}

export const divider = { height: 1, background: color.rule, border: "none", margin: `${space.lg}px 0` };
