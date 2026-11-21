// Moonlace Heist — the state machine: one game object drives the whole run.
// startLevel, one tick, win and caught transitions; the meter that rises in
// a cone and decays afterwards is the recover-after-spotted loop.

import { LEVELS } from './levels.js';
import { buildWorld, tileCenter } from './world.js';
import { makeGuard, tickGuard } from './guards.js';
import { makePlayer, tickPlayer, atExit } from './player.js';
import { GUARD, VIEW } from './config.js';

export function newGame() {
  return { phase: 'title', levelIndex: 0, world: null, player: null, guards: [],
           noises: [], tick: 0, alarm: 0, alarmTimer: 0, best: null, message: '' };
}

export function startLevel(game, index) {
  game.levelIndex = index;
  const key = Object.keys(LEVELS)[index];
  game.world = buildWorld(key);
  game.player = makePlayer(game.world.playerSpawn || tileCenter(2, 2));
  game.guards = Object.keys(game.world.patrols).map((id) =>
    makeGuard(id, game.world, game.world.guardSpawns[id]));
  game.noises = [];
  game.tick = 0;
  game.alarm = 0;
  game.alarmTimer = 0;
  game.phase = 'play';
  game.message = '';
  return game;
}

export function onNoise(game, n) {
  game.noises.push(n);
  game.player.lastNoise = n;
}

// dt is ticks. Returns nothing; read game.phase afterwards.
export function tickGame(game, keys, dt, fx) {
  if (game.phase !== 'play') return;
  game.tick += dt;
  tickPlayer(game.player, game.world, keys, dt, (n) => onNoise(game, n));

  let caught = false;
  let anySees = false;
  for (const g of game.guards) {
    if (tickGuard(g, game.world, game.player, game.noises, dt, game.alarm)) caught = true;
    if (g.suspicion > 0) anySees = true;
  }
  // The alarm is the highest warden suspicion: shared, so everyone hunts.
  game.alarm = Math.max(game.alarm * (1 - 0.004 * dt), ...game.guards.map((g) => g.suspicion));
  if (game.alarm >= 1) {
    if (game.alarmTimer === 0) fx.alarm();
    game.alarmTimer = GUARD.searchTicks;
  }
  if (game.alarmTimer > 0) { game.alarmTimer -= dt; if (game.alarmTimer <= 0) game.message = ''; }
  if (caught) {
    game.phase = 'caught';
    fx.caught();
    return;
  }
  if (atExit(game.player, game.world)) {
    game.phase = 'cleared';
    fx.exit();
    return;
  }
  game.noises.length = 0; // noise lives one tick
}
