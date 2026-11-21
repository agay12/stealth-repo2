// Moonlace Heist — the player: walking, sprinting, crouching, hiding in
// shadows, and the noise every step makes. Movement speed trades against
// how far away a warden can hear you.

import { PLAYER } from './config.js';
import { slideMove, isShadowPixel, isSolidTile, tileAt, tileCenter } from './world.js';

export function makePlayer(spawn) {
  return { x: spawn.x, y: spawn.y, facing: 0, crouching: false, sprinting: false,
           hidden: false, stepClock: 0, lastNoise: null };
}

// dt is in ticks (1 per frame at 60fps budget). Keys: {up,down,left,right,shift,ctrl}.
export function tickPlayer(p, world, keys, dt, onNoise) {
  let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  let dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  p.crouching = !!keys.ctrl;
  p.sprinting = !!keys.shift && !p.crouching && (dx !== 0 || dy !== 0);
  const speed = p.crouching ? PLAYER.crouch : p.sprinting ? PLAYER.sprint : PLAYER.walk;
  const moving = dx !== 0 || dy !== 0;
  if (moving) {
    const d = Math.hypot(dx, dy);
    dx /= d; dy /= d;
    p.facing = Math.atan2(dy, dx);
    const mv = slideMove(world, p, dx * speed * dt, dy * speed * dt, PLAYER.radius);
    const blocked = mv.x === p.x && mv.y === p.y;
    p.x = mv.x; p.y = mv.y;
    p.stepClock += speed * dt;
    if (p.stepClock > 26) { // a footfall every ~26px of travel
      p.stepClock = 0;
      const radius = p.crouching ? PLAYER.noiseCrouch : p.sprinting ? PLAYER.noiseSprint : PLAYER.noiseWalk;
      onNoise({ x: p.x, y: p.y, radius: blocked ? PLAYER.noiseBump : radius });
    }
  }
  p.hidden = isShadowPixel(world, p.x, p.y) && p.crouching; // crouch in shadow = gone dark
  p.lastNoise = null;
  return p;
}

// Reaching the exit tile completes the level.
export function atExit(p, world) {
  const t = tileAt(world, p.x, p.y);
  const e = tileAt(world, world.exit.x, world.exit.y);
  return Math.hypot(world.exit.x - p.x, world.exit.y - p.y) < TILE_HIT;
}
const TILE_HIT = 26;
