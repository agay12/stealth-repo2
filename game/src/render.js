// Moonlace Heist — the painter: floors, shadow patches, cover plinths, walls
// with lit tops, vision cones raycast tile by tile, wardens, the player and
// the HUD (detection meter, alarm banner, noise ripples). Pure canvas 2D.

import { VIEW, TILE, PAL, GUARD, HUD } from './config.js';
import { isSolidTile, tileAt, tileCenter } from './world.js';
import { hasLineOfSight } from './world.js';

export function drawFrame(g, game) {
  g.clearRect(0, 0, VIEW.width, VIEW.height);
  g.fillStyle = PAL.night;
  g.fillRect(0, 0, VIEW.width, VIEW.height);
  if (!game.world) { drawTitle(g, game); return; }
  drawFloor(g, game);
  drawNoiseRipples(g, game);
  drawCones(g, game);
  drawExit(g, game);
  drawGuards(g, game);
  drawPlayer(g, game);
  drawHud(g, game);
  drawOverlay(g, game);
}

function drawFloor(g, game) {
  const w = game.world;
  for (let y = 0; y < w.rows; y++) {
    for (let x = 0; x < w.cols; x++) {
      const px = x * TILE, py = y * TILE + HUD.height;
      if (w.walls[y][x]) {
        g.fillStyle = PAL.wall; g.fillRect(px, py, TILE, TILE);
        g.fillStyle = PAL.wallTop; g.fillRect(px, py, TILE, 6);
      } else if (w.covers[y][x]) {
        g.fillStyle = PAL.floor; g.fillRect(px, py, TILE, TILE);
        g.fillStyle = PAL.coverDark; g.fillRect(px + 3, py + 5, TILE - 6, TILE - 10);
        g.fillStyle = PAL.cover; g.fillRect(px + 5, py + 7, TILE - 10, TILE - 16);
        g.strokeStyle = 'rgba(0,0,0,0.4)'; g.strokeRect(px + 3.5, py + 5.5, TILE - 7, TILE - 11);
      } else {
        g.fillStyle = (x + y) % 2 ? PAL.floor : PAL.floorAlt;
        g.fillRect(px, py, TILE, TILE);
        if (w.shadows[y][x]) {
          g.fillStyle = PAL.shadow; g.fillRect(px, py, TILE, TILE);
          g.fillStyle = 'rgba(20,24,38,0.55)';
          g.fillRect(px - 6, py - 6, TILE + 12, TILE + 12); // feathered edge
          g.fillStyle = PAL.shadow; g.fillRect(px, py, TILE, TILE);
        }
      }
    }
  }
}

// Vision cones: a fan of rays with hard occlusion, warm fill, bright rim.
function drawCones(g, game) {
  const w = game.world;
  for (const gd of game.guards) {
    const R = GUARD.coneRange;
    const a0 = gd.facing - GUARD.coneHalfAngle;
    const a1 = gd.facing + GUARD.coneHalfAngle;
    g.beginPath();
    g.moveTo(gd.x, gd.y + HUD.height);
    const steps = 26;
    for (let i = 0; i <= steps; i++) {
      const a = a0 + ((a1 - a0) * i) / steps;
      let reach = R;
      for (let d = 12; d <= R; d += 10) {
        const px = gd.x + Math.cos(a) * d;
        const py = gd.y + Math.sin(a) * d;
        const t = tileAt(w, px, py);
        if (isSolidTile(w, t.x, t.y)) { reach = d - 10; break; }
      }
      g.lineTo(gd.x + Math.cos(a) * reach, gd.y + HUD.height + Math.sin(a) * reach);
    }
    g.closePath();
    const pulse = 0.10 + 0.10 * gd.suspicion;
    g.fillStyle = `rgba(255, 214, 140, ${pulse.toFixed(3)})`;
    g.fill();
    g.strokeStyle = `rgba(255, 214, 140, ${(0.30 + 0.4 * gd.suspicion).toFixed(3)})`;
    g.lineWidth = 1.5;
    g.stroke();
  }
}

function drawExit(g, game) {
  const e = game.world.exit;
  g.fillStyle = PAL.exit;
  g.fillRect(e.x - 14, e.y - 20 + HUD.height, 28, 40);
  g.fillStyle = '#0b0e18';
  g.fillRect(e.x - 8, e.y - 14 + HUD.height, 16, 34);
  g.fillStyle = PAL.exit;
  g.font = 'bold 11px ui-monospace, monospace';
  g.textAlign = 'center';
  g.fillText('EXIT', e.x, e.y - 26 + HUD.height);
  g.textAlign = 'left';
}

function drawGuards(g, game) {
  for (const gd of game.guards) {
    const y = gd.y + HUD.height;
    g.beginPath();
    g.arc(gd.x, y, GUARD.radius, 0, Math.PI * 2);
    g.fillStyle = gd.state === 'chase' ? PAL.danger : gd.state === 'search' || gd.state === 'suspicious' ? '#d0a04f' : PAL.guard;
    g.fill();
    g.strokeStyle = '#2a1e1c';
    g.lineWidth = 2;
    g.stroke();
    // The flashlight barrel shows which way the cone points.
    g.strokeStyle = '#ffd68c';
    g.beginPath();
    g.moveTo(gd.x, y);
    g.lineTo(gd.x + Math.cos(gd.facing) * 20, y + Math.sin(gd.facing) * 20);
    g.stroke();
    // A small meter above an investigating warden.
    if (gd.suspicion > 0 && gd.suspicion < 1) {
      g.fillStyle = 'rgba(0,0,0,0.5)';
      g.fillRect(gd.x - 14, y - 22, 28, 5);
      g.fillStyle = PAL.danger;
      g.fillRect(gd.x - 14, y - 22, 28 * gd.suspicion, 5);
    }
    if (gd.state === 'chase') {
      g.fillStyle = PAL.danger;
      g.font = 'bold 13px ui-monospace, monospace';
      g.fillText('!', gd.x - 3, y - 26);
    }
  }
}

function drawPlayer(g, game) {
  const p = game.player;
  const y = p.y + HUD.height;
  if (p.hidden) {
    g.globalAlpha = 0.45; // hidden in shadow: barely there
  }
  g.beginPath();
  g.arc(p.x, y, PLAYER_R, 0, Math.PI * 2);
  g.fillStyle = PAL.player;
  g.fill();
  g.strokeStyle = PAL.playerDark;
  g.lineWidth = 2;
  g.stroke();
  g.globalAlpha = 1;
}
const PLAYER_R = 11;

function drawNoiseRipples(g, game) {
  // Visual echo of the player's latest noise: a fading ring.
  const n = game.player.lastNoise;
  if (!n) return;
  const age = (game.tick - n.tick) / 30;
  if (age > 1) return;
  g.beginPath();
  g.arc(n.x, n.y + HUD.height, n.radius * age, 0, Math.PI * 2);
  g.strokeStyle = `rgba(232, 227, 213, ${(0.5 * (1 - age)).toFixed(3)})`;
  g.lineWidth = 2;
  g.stroke();
}

function drawHud(g, game) {
  g.fillStyle = 'rgba(7, 9, 16, 0.92)';
  g.fillRect(0, 0, VIEW.width, HUD.height);
  g.strokeStyle = '#2c3350';
  g.beginPath(); g.moveTo(0, HUD.height + 0.5); g.lineTo(VIEW.width, HUD.height + 0.5); g.stroke();
  g.fillStyle = PAL.hud;
  g.font = HUD.font;
  g.textAlign = 'left';
  g.fillText(`MOONLACE HEIST — ${game.world.name}  (${game.levelIndex + 1}/3)`, 16, 20);
  g.fillStyle = '#8b93b0';
  g.fillText(game.world.hint, 16, 37);
  g.textAlign = 'left';

  // Detection meter, centred so it never collides with the controls column.
  const mx = 540, mw = 200, mh = 16;
  g.fillStyle = 'rgba(0,0,0,0.6)';
  g.fillRect(mx, 8, mw, mh);
  const alarm = Math.max(0, game.alarm);
  g.fillStyle = alarm > 0.6 ? PAL.danger : alarm > 0.25 ? '#d0a04f' : PAL.ok;
  g.fillRect(mx, 8, mw * Math.min(1, alarm), mh);
  g.strokeStyle = '#5a6288';
  g.strokeRect(mx + 0.5, 8.5, mw, mh);
  g.fillStyle = game.alarm >= 1 ? PAL.danger : '#8b93b0';
  g.textAlign = 'center';
  g.fillText(game.alarm >= 1 ? 'SPOTTED — WARDENS HUNTING' : 'detection', mx + mw / 2, 37);
  g.textAlign = 'left';

  g.textAlign = 'right';
  g.fillText(`WASD move · SHIFT sprint · CTRL crouch`, VIEW.width - 16, 20);
  const crouchState = game.player.crouching ? (game.player.hidden ? 'HIDDEN' : 'crouched') : 'upright';
  g.fillStyle = game.player.hidden ? PAL.ok : PAL.hud;
  g.fillText(crouchState, VIEW.width - 16, 37);
  g.textAlign = 'left';
}

function drawTitle(g, game) {
  g.fillStyle = PAL.hud;
  g.textAlign = 'center';
  g.font = '700 52px Georgia, serif';
  g.fillText('Moonlace Heist', VIEW.width / 2, 250);
  g.font = '400 19px ui-monospace, monospace';
  g.fillStyle = '#aab1cc';
  g.fillText('Three galleries. Eight wardens. One door left open.', VIEW.width / 2, 300);
  g.fillText('Walk their rhythm, crouch in the shadows, reach the EXIT unseen.', VIEW.width / 2, 330);
  g.fillStyle = PAL.hud;
  g.font = '600 18px ui-monospace, monospace';
  g.fillText('Press ENTER to begin the night', VIEW.width / 2, 420);
  g.textAlign = 'left';
}

function drawOverlay(g, game) {
  if (game.phase === 'play') return;
  g.fillStyle = 'rgba(7, 9, 16, 0.72)';
  g.fillRect(0, HUD.height, VIEW.width, VIEW.height - HUD.height);
  g.textAlign = 'center';
  g.fillStyle = game.phase === 'cleared' ? PAL.ok : game.phase === 'caught' ? PAL.danger : PAL.hud;
  g.font = '700 44px Georgia, serif';
  const head = { title: 'Moonlace Heist', cleared: 'Gone. Clean exit.', caught: 'Caught in the light' }[game.phase];
  g.fillText(head, VIEW.width / 2, VIEW.height / 2 - 20);
  g.font = '400 18px ui-monospace, monospace';
  g.fillStyle = '#aab1cc';
  const line = {
    title: 'Press ENTER',
    cleared: `ENTER — next gallery${game.levelIndex >= 2 ? ' (then credits)' : ''}`,
    caught: 'ENTER — try this gallery again',
  }[game.phase];
  g.fillText(line, VIEW.width / 2, VIEW.height / 2 + 24);
  g.textAlign = 'left';
}
