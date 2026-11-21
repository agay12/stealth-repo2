// Moonlace Heist — global tunables. Every constant the game uses lives here so the
// level ladder and the feel can be re-balanced in one place.

export const VIEW = { width: 1280, height: 720 };

export const TILE = 40; // one tile is 40 px; the level grid is 32 x 16 tiles

// Palette: midnight gallery — cold floor, warm lamplight, alarm red.
export const PAL = {
  floor: '#1d2230',
  floorAlt: '#222839',
  wall: '#3d4463',
  wallTop: '#4a527a',
  shadow: '#141826',
  cover: '#8a6d3b',
  coverDark: '#5f4a26',
  exit: '#3fd68f',
  player: '#e8e3d5',
  playerDark: '#9a958a',
  guard: '#d0604f',
  cone: 'rgba(255, 214, 140, 0.16)',
  coneEdge: 'rgba(255, 214, 140, 0.55)',
  hud: '#e8e3d5',
  danger: '#ff5566',
  ok: '#3fd68f',
  night: '#0b0e18',
};

export const PLAYER = {
  radius: 11,
  walk: 2.1,      // px per tick
  sprint: 3.4,
  crouch: 1.2,
  noiseWalk: 60,  // noise radius in px
  noiseSprint: 220,
  noiseCrouch: 16,
  noiseBump: 130, // bumping into cover
};

export const GUARD = {
  radius: 12,
  speed: 1.35,
  chase: 2.3,
  coneHalfAngle: Math.PI / 5.4, // ~33 degrees each side
  coneRange: 230,
  coneRangeDark: 150,           // cones see less into shadow tiles
  turnRate: 0.055,              // radians per tick of facing smoothing
  detectRate: 0.011,            // meter fill per tick in cone, crouch halves it
  detectCrouch: 0.5,
  detectDrop: 0.006,            // meter decay per tick when unseen
  spottedAt: 1.0,
  searchTicks: 420,             // ~7s of searching after losing the player
  suspicionTicks: 150,
};

export const LEVELS = ['moonlace-hall', 'sculpture-wing', 'clock-vault'];

export const HUD = {
  height: 46,
  font: '600 15px ui-monospace, Menlo, Consolas, monospace',
};
