// Moonlace Heist — the tile world: parsing a level map, solid tests,
// shadow tests and line-of-sight. Pure functions, no rendering.

import { TILE } from './config.js';

export function buildWorld(levelKey) {
  const level = LEVELS_BY_KEY[levelKey];
  const grid = level.grid.map((row) => row.split(''));
  const walls = grid.map((row) => row.map((ch) => ch === '#'));
  const shadows = grid.map((row) => row.map((ch) => ch === '~'));
  const covers = grid.map((row) => row.map((ch) => ch === 'c'));
  let exit = null, playerSpawn = null;
  const guardSpawns = {};
  grid.forEach((row, y) => row.forEach((ch, x) => {
    if (ch === 'E') exit = tileCenter(x, y);
    if (ch === 'P') playerSpawn = tileCenter(x, y);
    if (ch === 'G') guardSpawns[`guard-${Object.keys(guardSpawns).length + 1}`] = tileCenter(x, y);
  }));
  return { levelKey, name: level.name, hint: level.hint, grid, walls, shadows, covers,
           exit, playerSpawn, guardSpawns, patrols: level.patrols, cols: 32, rows: 16 };
}

import { LEVELS } from './levels.js';
const LEVELS_BY_KEY = LEVELS;

export function tileCenter(x, y) {
  return { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
}

export function tileAt(world, px, py) {
  return { x: Math.floor(px / TILE), y: Math.floor(py / TILE) };
}

export function isSolidTile(world, tx, ty) {
  if (ty < 0 || tx < 0 || ty >= world.rows || tx >= world.cols) return true;
  return world.walls[ty][tx] || world.covers[ty][tx];
}

export function isShadowPixel(world, px, py) {
  const t = tileAt(world, px, py);
  if (t.y < 0 || t.x < 0 || t.y >= world.rows || t.x >= world.cols) return false;
  return world.shadows[t.y][t.x];
}

// Walk a ray with a small DDA; returns true when nothing solid blocks the line.
export function hasLineOfSight(world, ax, ay, bx, by) {
  const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / 8);
  for (let i = 1; i < steps; i++) {
    const x = ax + ((bx - ax) * i) / steps;
    const y = ay + ((by - ay) * i) / steps;
    const t = tileAt(world, x, y);
    if (isSolidTile(world, t.x, t.y)) return false;
  }
  return true;
}

// Circle-vs-tile collision: resolve a mover back out of solid tiles.
export function slideMove(world, pos, dx, dy, radius) {
  let nx = pos.x + dx;
  let ny = pos.y + dy;
  if (circleHitsSolid(world, nx, ny, radius)) nx = pos.x;
  if (circleHitsSolid(world, nx, ny, radius)) ny = pos.y;
  if (circleHitsSolid(world, nx, ny, radius)) { nx = pos.x; ny = pos.y; }
  return { x: nx, y: ny };
}

function circleHitsSolid(world, cx, cy, r) {
  const min = tileAt(world, cx - r, cy - r);
  const max = tileAt(world, cx + r, cy + r);
  for (let ty = min.y; ty <= max.y; ty++) {
    for (let tx = min.x; tx <= max.x; tx++) {
      if (!isSolidTile(world, tx, ty)) continue;
      const c = tileCenter(tx, ty);
      const qx = Math.max(c.x - TILE / 2, Math.min(cx, c.x + TILE / 2));
      const qy = Math.max(c.y - TILE / 2, Math.min(cy, c.y + TILE / 2));
      if ((qx - cx) ** 2 + (qy - cy) ** 2 < r * r) return true;
    }
  }
  return false;
}
