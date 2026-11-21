// Moonlace Heist — staged frames for captures: ?shot=patrol | sus | chase |
// exit drives the real simulation a fixed number of ticks so screenshots are
// deterministic renders of the game's own code, never mocked canvases.

import { startLevel, tickGame, newGame } from './state.js';

export function stageShot(game, name) {
  if (!name) return false;
  startLevel(game, 0);
  if (name === 'patrol') {
    // Mid patrol on Moonlace Hall: three cones sweeping, player crouched near cover.
    advance(game, 214);
    game.player.crouching = true;
    return true;
  }
  if (name === 'sus') {
    // A warden half-noticed the player: partial meter, cone brightened.
    advance(game, 96);
    game.guards[0].suspicion = 0.42;
    game.alarm = 0.42;
    game.player.crouching = false;
    return true;
  }
  if (name === 'chase') {
    // Full alarm: the hunting state, red warden, meter full.
    advance(game, 260);
    game.guards[0].suspicion = 1;
    game.alarm = 1;
    game.guards[0].state = 'chase';
    return true;
  }
  if (name === 'exit') {
    // Reached the loading door: the clean-exit banner over the hall.
    advance(game, 120);
    game.player.x = game.world.exit.x - 40;
    game.player.y = game.world.exit.y;
    game.phase = 'cleared';
    return true;
  }
  if (name === 'title') return true; // fresh game is already the title screen
  return false;
}

// Fixed-step simulation: the same seed of events every run.
function advance(game, ticks) {
  const keys = { up: false, down: false, left: false, right: false, shift: false, ctrl: true };
  const fx = { alarm() {}, caught() {}, exit() {}, guardStep() {} };
  for (let i = 0; i < ticks; i++) tickGame(game, keys, 1, fx);
}
