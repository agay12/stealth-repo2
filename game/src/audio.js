// Moonlace Heist — audio cues: oscillator footsteps for wardens, a rising
// shimmer while a cone holds you, the alarm sting, and the exit chime.
// No audio files: everything is synthesized, so the game loads nothing.

let ctx = null;
export function initAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function blip(freq, dur, type = 'square', gain = 0.05, when = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur);
}

// A warden's footfall: a low wooden knock, quieter the further away they are.
export function guardStep(dist) {
  const near = Math.max(0, 1 - dist / 420);
  if (near <= 0.02) return;
  blip(110 + Math.random() * 30, 0.06, 'triangle', 0.08 * near);
}

export function playerStep(crouch) {
  blip(crouch ? 70 : 95, 0.05, 'sine', crouch ? 0.02 : 0.04);
}

export function suspicionTick(level) {
  if (level > 0.05) blip(660 + level * 500, 0.05, 'sawtooth', 0.02 * level);
}

export function alarmSting() {
  blip(880, 0.4, 'sawtooth', 0.12);
  blip(440, 0.5, 'square', 0.1, 0.05);
}

export function caughtSting() {
  blip(220, 0.5, 'square', 0.14);
  blip(110, 0.7, 'sawtooth', 0.12, 0.1);
}

export function exitChime() {
  blip(523, 0.15, 'sine', 0.08);
  blip(659, 0.15, 'sine', 0.08, 0.12);
  blip(784, 0.3, 'sine', 0.08, 0.24);
}
