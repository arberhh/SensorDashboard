// Core palette — the 3-4 base colors everything else derives from.
const palette = {
  background: "#151544",
  surface: "#1f1f5c",
  accent: "#4a5cff",
  text: "#ffffff",
};

const colors = {
  background: palette.background,
  surface: palette.surface,
  accent: palette.accent,
  text: palette.text,

  // Semantic tokens derived from the base palette for translucent UI states.
  textMuted: "rgba(255, 255, 255, 0.45)",
  border: "rgba(255, 255, 255, 0.08)",
  cardBackground: "rgba(255, 255, 255, 0.05)",
  chipBackground: "rgba(255, 255, 255, 0.08)",
  chipPressed: "rgba(255, 255, 255, 0.18)",

  // Sensor-type accent colors — warm for temperature, cool for humidity,
  // so the two are distinguishable at a glance rather than by unit alone.
  temperature: "#ff9152",
  humidity: "#4fc3f7",

  // Card drop-shadow color. Stays pure black regardless of theme, since a
  // shadow's job is to sit behind the surface color, not tint it — but it
  // still goes through the theme rather than being a literal in a style
  // block, same as every other color in this app.
  shadow: "#000000",
};

const fontSizes = {
  sm: 12,
  m: 14,
  l: 16,
  xl: 20,
};

// Base spacing unit is 16 — every other step is a multiple of it, so
// the scale stays proportional instead of a set of arbitrary numbers.
const BASE_SPACING = 16;

const spacing = {
  xs: BASE_SPACING / 4, // 4
  sm: BASE_SPACING / 2, // 8
  m: BASE_SPACING, // 16 — default gutter/padding
  l: BASE_SPACING * 1.5, // 24
  xl: BASE_SPACING * 2, // 32
};

const theme = { colors, fontSizes, spacing };

export default theme;
