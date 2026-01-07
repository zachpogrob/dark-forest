import { Game } from './game/Game.js';

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  window.game = game; // For debugging
});
