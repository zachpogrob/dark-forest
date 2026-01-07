import * as THREE from 'three';
import { Player } from './Player.js';
import { Forest } from './Forest.js';
import { Bear } from './Bear.js';
import { AudioManager } from './AudioManager.js';
import { NightVisionPass } from '../shaders/NightVisionPass.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.isPlaying = false;
    this.isPaused = false;
    this.pauseCooldown = false;

    this.init();
    this.setupIntro();
    this.setupPause();
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050508);
    this.scene.fog = new THREE.FogExp2(0x050508, 0.015);

    // Renderer - full screen
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Night vision post-processing
    this.nightVision = new NightVisionPass(this.renderer, this.scene, this.camera);

    // Clock for delta time
    this.clock = new THREE.Clock();

    // Initialize game systems
    this.forest = new Forest(this.scene);
    this.player = new Player(this.camera, this.canvas, this.scene);
    this.bear = new Bear(this.scene, this.player);
    this.audio = new AudioManager(this.camera);

    // Position player at start
    this.player.position.set(0, 1.6, 0);
    this.camera.position.copy(this.player.position);

    // Resize handler
    window.addEventListener('resize', () => this.onResize());

    // Start render loop
    this.animate();
  }

  setupIntro() {
    const introScreen = document.getElementById('intro-screen');
    const introText = document.querySelector('.intro-text');
    const startBtn = document.getElementById('start-btn');

    const storyText = `Three days ago, your daughter Emily went into the forest.

She never came back.
Tonight, you found her necklace at the edge of the trees.

You have to find her.`;

    let charIndex = 0;
    const typeWriter = () => {
      if (charIndex < storyText.length) {
        introText.textContent += storyText.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 50);
      }
    };

    setTimeout(typeWriter, 1000);

    startBtn.addEventListener('click', () => {
      introScreen.classList.add('hidden');
      this.startGame();
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
      location.reload();
    });
  }

  setupPause() {
    // ESC key handler
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (this.isPlaying && !this.pauseCooldown) {
          this.togglePause();
        }
      }
    });

    // Resume button
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        if (!this.pauseCooldown) {
          this.togglePause();
        }
      });
    }

    // Handle pointer lock loss
    document.addEventListener('pointerlockchange', () => {
      const isLocked = document.pointerLockElement === this.canvas;
      if (!isLocked && this.isPlaying && !this.isPaused && !this.pauseCooldown) {
        this.pause();
      }
    });
  }

  togglePause() {
    if (this.isPaused) {
      this.unpause();
    } else {
      this.pause();
    }
  }

  pause() {
    if (this.isPaused || this.pauseCooldown) return;

    this.isPaused = true;
    this.pauseCooldown = true;

    // Release pointer
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    // Show pause menu
    const pauseMenu = document.getElementById('pause-menu');
    pauseMenu.classList.remove('hidden');
    pauseMenu.classList.add('fade-in');

    // Pause audio
    this.audio.pause();

    // Reset clock
    this.clock.getDelta();

    // Cooldown
    setTimeout(() => {
      this.pauseCooldown = false;
      pauseMenu.classList.remove('fade-in');
    }, 200);
  }

  unpause() {
    if (!this.isPaused || this.pauseCooldown) return;

    this.isPaused = false;
    this.pauseCooldown = true;

    // Hide pause menu
    const pauseMenu = document.getElementById('pause-menu');
    pauseMenu.classList.add('fade-out');

    setTimeout(() => {
      pauseMenu.classList.add('hidden');
      pauseMenu.classList.remove('fade-out');

      // Re-lock pointer
      this.canvas.requestPointerLock();

      // Resume audio
      this.audio.resume();

      // Reset clock
      this.clock.getDelta();

      this.pauseCooldown = false;
    }, 150);
  }

  startGame() {
    this.isPlaying = true;
    this.canvas.requestPointerLock();

    document.getElementById('instructions').classList.remove('hidden');

    this.audio.startAmbience();

    setTimeout(() => {
      document.getElementById('instructions').classList.add('hidden');
    }, 8000);

    // Bear activates after 30 seconds
    setTimeout(() => {
      this.bear.activate();
      this.audio.playLaughter();
    }, 30000);
  }

  gameOver() {
    this.isPlaying = false;
    document.exitPointerLock();
    document.getElementById('game-over').classList.remove('hidden');
    this.audio.playJumpscare();
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.nightVision.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    if (this.isPlaying && !this.isPaused) {
      this.player.update(delta);
      this.camera.position.copy(this.player.position);
      this.bear.update(delta, this.player.isSprinting);

      if (this.bear.hasCaughtPlayer()) {
        this.gameOver();
      }

      this.audio.updateBearProximity(this.bear.getDistanceToPlayer());
    }

    this.nightVision.render();
  }
}
