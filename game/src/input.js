// Moonlace Heist — input: keyboard for movement and stance, ENTER for the
// menus, and an audio unlock on the first key so sounds may play.

import { initAudio } from './audio.js';

export function attachInput(keys, onEnter) {
  const map = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ShiftLeft: 'shift', ShiftRight: 'shift',
    ControlLeft: 'ctrl', ControlRight: 'ctrl', KeyC: 'ctrl',
  };
  window.addEventListener('keydown', (e) => {
    initAudio();
    if (e.code === 'Enter') { onEnter(); return; }
    const k = map[e.code];
    if (k) { keys[k] = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    const k = map[e.code];
    if (k) keys[k] = false;
  });
}
