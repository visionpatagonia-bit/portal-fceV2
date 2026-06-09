// NEXUS isometric cube-stack logo, recreated as scalable SVG (no raster assets).
// Blue -> cyan gradient, three stacked cubes with the "N" on the top cube and
// </> + {} glyphs on the lower cubes, over a glowing base platform.

export function brandMark({ size = 40, id = 'nx', glyphs = true } = {}) {
  const T = `${id}-top`, L = `${id}-left`, R = `${id}-right`, G = `${id}-glow`;
  return `
<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="NEXUS">
  <defs>
    <linearGradient id="${T}" x1="14" y1="6" x2="50" y2="34" gradientUnits="userSpaceOnUse">
      <stop stop-color="#5ea0ff"/><stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
    <linearGradient id="${L}" x1="14" y1="16" x2="32" y2="46" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1f47a6"/><stop offset="1" stop-color="#15327e"/>
    </linearGradient>
    <linearGradient id="${R}" x1="32" y1="16" x2="52" y2="46" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2c63c9"/><stop offset="1" stop-color="#1a3f97"/>
    </linearGradient>
    <radialGradient id="${G}" cx="0.5" cy="0.5" r="0.5">
      <stop stop-color="#22d3ee" stop-opacity="0.55"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- base platform glow -->
  <ellipse cx="32" cy="49" rx="26" ry="11" fill="url(#${G})"/>
  <path d="M32 41 L53 48 L32 55 L11 48 Z" fill="none" stroke="#22d3ee" stroke-opacity="0.7" stroke-width="1.1"/>

  <!-- lower-left cube -->
  ${cube(23, 30, 9, 10, T, L, R)}
  ${glyphs ? glyph('M19 33 l-3 3 l3 3 M27 33 l3 3 l-3 3', 23, 36) : ''}

  <!-- lower-right cube -->
  ${cube(41, 30, 9, 10, T, L, R)}
  ${glyphs ? glyph('M38 33 c-2 0 -2 2 -2 3 c0 1 0 3 -2 3 M44 33 c2 0 2 2 2 3 c0 1 0 3 2 3', 41, 36) : ''}

  <!-- top cube with N -->
  ${cube(32, 13, 9, 10, T, L, R)}
  <path d="M28.5 26.5 L28.5 16.8 L35.5 23.2 L35.5 13.5" fill="none" stroke="#ffffff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// One isometric cube: top-face center at (cx, cyTop), half-width a, height h.
function cube(cx, cyTop, a, h, T, L, R) {
  const ry = a / 2;
  const bx = cx, by = cyTop + ry;          // front-bottom of top face
  return `
  <path d="M${cx} ${cyTop - ry} L${cx + a} ${cyTop} L${cx} ${cyTop + ry} L${cx - a} ${cyTop} Z" fill="url(#${T})"/>
  <path d="M${cx - a} ${cyTop} L${bx} ${by} L${bx} ${by + h} L${cx - a} ${cyTop + h} Z" fill="url(#${L})"/>
  <path d="M${bx} ${by} L${cx + a} ${cyTop} L${cx + a} ${cyTop + h} L${bx} ${by + h} Z" fill="url(#${R})"/>
  <path d="M${cx} ${cyTop - ry} L${cx + a} ${cyTop} L${cx} ${cyTop + ry} L${cx - a} ${cyTop} Z M${bx} ${by} L${bx} ${by + h}" fill="none" stroke="#7fd9f5" stroke-opacity="0.5" stroke-width="0.7"/>`;
}

function glyph(d, _cx, _cy) {
  return `<path d="${d}" fill="none" stroke="#bfe9ff" stroke-opacity="0.85" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`;
}
