// Moonlace Heist — bootstrap: canvas, input, the fixed-timestep loop, the
// phase transitions on ENTER, and the staged ?shot= route for captures.

import { VIEW, HUD } from './config.js';
import { newGame, startLevel, tickGame, onNoise } from './state.js';
import { drawFrame } from './render.js';
import { attachInput } from './input.js';
import { guardStep, playerStep, suspicionTick } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const g = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const game = newGame();
const keys = {};
const fx = {
  alarm() {},
  caught() {},
  exit() {},
};

attachInput(keys, () => {
  if (game.phase === 'title') startLevel(game, 0);
  else if (game.phase === 'cleared') startLevel(game, Math.min(2, game.levelIndex + 1));
  else if (game.phase === 'caught') startLevel(game, game.levelIndex);
});

// A quiet footfall sound when a warden walks near the player: you can hear
// the patrol coming even off-screen.
function wardenFootsteps() {
  for (const gd of game.guards) {
    if (game.tick % 30 === 0) {
      guardStep(Math.hypot(gd.x - game.player.x, gd.y - game.player.y));
    }
  }
}

let last = performance.now();
let acc = 0;
const STEP_MS = 1000 / 60;

function frame(now) {
  acc += now - last;
  last = now;
  let steps = 0;
  while (acc >= STEP_MS && steps < 4) {
    acc -= STEP_MS;
    steps++;
    if (game.phase === 'play') {
      const before = game.tick;
      tickGame(game, keys, 1, fx);
      if (game.tick !== before && game.tick % 30 === 0) {
        wardenFootsteps();
        playerStep(game.player.crouching);
        suspicionTick(game.alarm);
      }
    }
  }
  drawFrame(g, game);
  requestAnimationFrame(frame);
}

const shot = new URLSearchParams(location.search).get('shot');
if (shot && stageShot(game, shot)) {
  drawFrame(g, game); // one staged frame, synchronously, for the capture
} else {
  requestAnimationFrame(frame);
}
