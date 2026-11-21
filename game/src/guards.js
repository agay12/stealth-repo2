// Moonlace Heist — warden patrol AI. Each guard walks a named patrol route,
// turns its cone smoothly, hears noise, investigates, chases when the meter
// fills, then searches and returns: a spotted warden can be shaken again.

import { GUARD, PLAYER } from './config.js';
import { tileCenter, slideMove, isSolidTile } from './world.js';
import { coneSees, normalizeAngle } from './vision.js';

// States: 'patrol' -> 'suspicious' (heard something) -> 'search' (lost the
// player) -> back to 'patrol'; 'chase' while the alarm is hot.
export function makeGuard(id, world, spawnOverride) {
  const spawn = spawnOverride || world.guardSpawns[id] || tileCenter(2, 2);
  const route = (world.patrols[id] || [[spawn.x, spawn.y]]).map(([tx, ty]) => tileCenter(tx, ty));
  return {
    id, x: spawn.x, y: spawn.y, facing: 0, state: 'patrol',
    route, leg: 0, suspicion: 0, target: null, searchTimer: 0, waitTimer: 0,
    alertness: 0, // global alarm contribution, decays with time
  };
}

// One tick of a guard. Noise events (footsteps) arrive as {x, y, radius} list.
export function tickGuard(g, world, player, noises, dt, alarm) {
  const seen = coneSees(world, g, player);
  if (seen > 0 && !player.hidden) {
    g.suspicion = Math.min(1, g.suspicion + GUARD.detectRate * seen * (player.crouching ? GUARD.detectCrouch : 1) * dt);
  } else {
    g.suspicion = Math.max(0, g.suspicion - GUARD.detectDrop * dt);
  }

  // Hearing: the loudest noise this tick that reaches the guard.
  let heard = null;
  for (const n of noises) {
    if (Math.hypot(n.x - g.x, n.y - g.y) <= n.radius && (!heard || n.radius > heard.radius)) heard = n;
  }
  if (heard && g.state !== 'chase') {
    g.state = 'suspicious';
    g.target = { x: heard.x, y: heard.y };
    g.suspicion = Math.max(g.suspicion, 0.25);
  }

  if (g.suspicion >= GUARD.spottedAt) {
    g.state = 'chase';
    g.searchTimer = GUARD.searchTicks;
  }

  switch (g.state) {
    case 'patrol': return tickPatrol(g, world, dt);
    case 'suspicious': return tickSuspicious(g, world, dt);
    case 'chase': return tickChase(g, world, player, dt, alarm);
    case 'search': return tickSearch(g, world, dt);
  }
  return false;
}

function faceToward(g, x, y, dt) {
  const want = Math.atan2(y - g.y, x - g.x);
  const diff = normalizeAngle(want - g.facing);
  g.facing += Math.max(-GUARD.turnRate * dt * 2, Math.min(GUARD.turnRate * dt * 2, diff));
}

function stepToward(g, world, x, y, speed, dt) {
  const d = Math.hypot(x - g.x, y - g.y);
  if (d < 4) return true;
  const mv = slideMove(world, g, ((x - g.x) / d) * speed * dt, ((y - g.y) / d) * speed * dt, GUARD.radius);
  g.x = mv.x; g.y = mv.y;
  faceToward(g, x, y, dt);
  return false;
}

function tickPatrol(g, world, dt) {
  if (g.waitTimer > 0) { g.waitTimer -= dt; return false; }
  const goal = g.route[g.leg];
  if (stepToward(g, world, goal.x, goal.y, GUARD.speed, dt)) {
    g.leg = (g.leg + 1) % g.route.length;
    g.waitTimer = 40; // pause at each waypoint: a rhythm you can learn
  }
  return false;
}

function tickSuspicious(g, world, dt) {
  faceToward(g, g.target.x, g.target.y, dt);
  if (stepToward(g, world, g.target.x, g.target.y, GUARD.speed * 1.3, dt)) {
    g.state = 'search';
    g.searchTimer = GUARD.suspicionTicks;
  }
  if (g.suspicion <= 0) g.state = 'patrol';
  return false;
}

function tickChase(g, world, player, dt) {
  stepToward(g, world, player.x, player.y, GUARD.chase, dt);
  g.searchTimer -= dt;
  if (Math.hypot(player.x - g.x, player.y - g.y) < GUARD.radius + PLAYER.radius + 2) return true; // caught
  if (g.suspicion <= 0.1 && coneSees(world, g, player) === 0) {
    if (g.searchTimer <= 0) { g.state = 'search'; g.searchTimer = GUARD.searchTicks; }
  }
  return false;
}

function tickSearch(g, world, dt) {
  // Sweep the head and drift around the last known point.
  g.facing += 0.03 * dt;
  g.searchTimer -= dt;
  if (g.searchTimer % 120 === 0) {
    const dx = (Math.random() - 0.5) * TILE * 3;
    const dy = (Math.random() - 0.5) * TILE * 3;
    g.target = { x: g.x + dx, y: g.y + dy };
  }
  if (g.target) stepToward(g, world, g.target.x, g.target.y, GUARD.speed, dt);
  if (g.searchTimer <= 0) { g.state = 'patrol'; g.suspicion = 0; }
  return false;
}

// Guards never path-find; a chase that runs into furniture slides along it
// because stepToward uses slideMove like everything else.
