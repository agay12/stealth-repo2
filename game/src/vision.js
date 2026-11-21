// Moonlace Heist — vision cone geometry: which points a guard's flashlight
// reaches, and how strongly the detection meter climbs at the player.

import { GUARD } from './config.js';
import { hasLineOfSight, isShadowPixel } from './world.js';

// Is the player inside a guard's cone of vision? Returns a detection weight
// 0..1 (0 = invisible, 1 = dead centre at point blank).
export function coneSees(world, guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.coneRange) return 0;
  const ang = Math.atan2(dy, dx);
  const off = Math.abs(normalizeAngle(ang - guard.facing));
  if (off > GUARD.coneHalfAngle) return 0;
  if (!hasLineOfSight(world, guard.x, guard.y, player.x, player.y)) return 0;
  // Shadow patches halve how far a cone carries; deep shadow inside short range only.
  let weight = 1 - dist / GUARD.coneRange;
  if (isShadowPixel(world, player.x, player.y)) {
    if (dist > GUARD.coneRangeDark) return 0;
    weight *= 0.45;
  }
  // Looking straight at someone is worse than catching them at the cone's rim.
  weight *= 1 - 0.5 * (off / GUARD.coneHalfAngle);
  return Math.min(1, weight * 1.6);
}

export function normalizeAngle(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}
