import * as THREE from 'three';

export class AudioManager {
  constructor(camera) {
    this.camera = camera;
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    this.audioLoader = new THREE.AudioLoader();
    this.sounds = {};

    this.isInitialized = false;
    this.stompInterval = null;
    this.laughterInterval = null;

    // Generate sounds on first user interaction
    document.addEventListener('click', () => this.init(), { once: true });
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Create audio context
    this.audioContext = THREE.AudioContext.getContext();

    // Generate procedural sounds
    this.generateSounds();
  }

  generateSounds() {
    // Ambient wind
    this.sounds.wind = this.createWindSound();

    // Footstep stomp
    this.sounds.stomp = this.createStompSound();

    // Creepy laughter
    this.sounds.laughter = this.createLaughterSound();

    // Heartbeat for tension
    this.sounds.heartbeat = this.createHeartbeatSound();

    // Jumpscare sound
    this.sounds.jumpscare = this.createJumpscareSound();
  }

  createWindSound() {
    const audio = new THREE.Audio(this.listener);
    const duration = 4;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate wind noise
    for (let i = 0; i < data.length; i++) {
      // Brown noise (wind-like)
      const white = Math.random() * 2 - 1;
      data[i] = (data[i - 1] || 0) + (0.02 * white);
      data[i] *= 0.1; // Volume

      // Modulate for wind gusts
      data[i] *= 0.5 + 0.5 * Math.sin(i / sampleRate * 0.3);
    }

    audio.setBuffer(buffer);
    audio.setLoop(true);
    audio.setVolume(0.3);

    return audio;
  }

  createStompSound() {
    const audio = new THREE.Audio(this.listener);
    const duration = 0.5;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Heavy stomp sound
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8);

      // Low frequency thud
      const thud = Math.sin(t * 60 * Math.PI * 2) * envelope;

      // Impact noise
      const noise = (Math.random() * 2 - 1) * envelope * 0.3;

      data[i] = (thud + noise) * 0.8;
    }

    audio.setBuffer(buffer);
    audio.setVolume(0.6);

    return audio;
  }

  createLaughterSound() {
    const audio = new THREE.Audio(this.listener);
    const duration = 2;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Creepy child-like laughter
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;

      // Multiple "ha" sounds
      const haFreq = 4; // 4 "ha"s per second
      const haPhase = (t * haFreq) % 1;
      const haEnvelope = haPhase < 0.3 ? Math.sin(haPhase / 0.3 * Math.PI) : 0;

      // Voice-like oscillation
      const voice = Math.sin(t * 400 * Math.PI * 2) * 0.5 +
                    Math.sin(t * 600 * Math.PI * 2) * 0.3 +
                    Math.sin(t * 200 * Math.PI * 2) * 0.2;

      // Overall envelope
      const envelope = Math.sin(t / duration * Math.PI);

      data[i] = voice * haEnvelope * envelope * 0.15;
    }

    audio.setBuffer(buffer);
    audio.setVolume(0.4);

    return audio;
  }

  createHeartbeatSound() {
    const audio = new THREE.Audio(this.listener);
    const duration = 1;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Double thump heartbeat
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;

      // First beat
      const beat1 = t < 0.15 ? Math.sin(t * 40 * Math.PI * 2) * Math.exp(-t * 20) : 0;

      // Second beat (slightly delayed)
      const t2 = t - 0.2;
      const beat2 = t2 > 0 && t2 < 0.15 ? Math.sin(t2 * 35 * Math.PI * 2) * Math.exp(-t2 * 25) : 0;

      data[i] = (beat1 + beat2 * 0.7) * 0.5;
    }

    audio.setBuffer(buffer);
    audio.setLoop(true);
    audio.setVolume(0);

    return audio;
  }

  createJumpscareSound() {
    const audio = new THREE.Audio(this.listener);
    const duration = 1.5;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Loud, jarring sound
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2);

      // Dissonant frequencies
      const sound = Math.sin(t * 150 * Math.PI * 2) * 0.4 +
                    Math.sin(t * 220 * Math.PI * 2) * 0.3 +
                    Math.sin(t * 180 * Math.PI * 2) * 0.3 +
                    (Math.random() * 2 - 1) * 0.4;

      data[i] = sound * envelope * 0.8;
    }

    audio.setBuffer(buffer);
    audio.setVolume(0.8);

    return audio;
  }

  startAmbience() {
    if (!this.isInitialized) {
      setTimeout(() => this.startAmbience(), 100);
      return;
    }

    // Start wind
    if (this.sounds.wind && !this.sounds.wind.isPlaying) {
      this.sounds.wind.play();
    }

    // Start heartbeat (will fade in when danger)
    if (this.sounds.heartbeat && !this.sounds.heartbeat.isPlaying) {
      this.sounds.heartbeat.play();
    }
  }

  playLaughter() {
    if (!this.isInitialized) return;

    // Play occasional laughter
    const playRandomLaughter = () => {
      if (this.sounds.laughter) {
        this.sounds.laughter.stop();
        this.sounds.laughter.play();
      }
    };

    // Initial laughter
    setTimeout(playRandomLaughter, 2000);

    // Random intervals
    this.laughterInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        playRandomLaughter();
      }
    }, 15000);
  }

  updateBearProximity(distance) {
    if (!this.isInitialized) return;

    // Heartbeat intensity based on distance
    const heartbeatVolume = Math.max(0, 1 - distance / 30) * 0.5;
    if (this.sounds.heartbeat) {
      this.sounds.heartbeat.setVolume(heartbeatVolume);
    }

    // Stomping when bear is close
    if (distance < 40) {
      if (!this.stompInterval) {
        const stompRate = Math.max(500, 2000 - (40 - distance) * 40);
        this.stompInterval = setInterval(() => {
          if (this.sounds.stomp) {
            this.sounds.stomp.stop();
            this.sounds.stomp.setVolume(Math.min(0.8, (40 - distance) / 40));
            this.sounds.stomp.play();
          }
        }, stompRate);
      }
    } else {
      if (this.stompInterval) {
        clearInterval(this.stompInterval);
        this.stompInterval = null;
      }
    }
  }

  playJumpscare() {
    if (!this.isInitialized) return;

    // Stop all other sounds
    Object.values(this.sounds).forEach(sound => {
      if (sound.isPlaying) sound.stop();
    });

    if (this.stompInterval) clearInterval(this.stompInterval);
    if (this.laughterInterval) clearInterval(this.laughterInterval);

    // Play jumpscare
    if (this.sounds.jumpscare) {
      this.sounds.jumpscare.play();
    }
  }

  pause() {
    if (!this.isInitialized) return;

    // Pause all sounds
    Object.values(this.sounds).forEach(sound => {
      if (sound.isPlaying) {
        sound.pause();
      }
    });

    // Clear intervals
    if (this.stompInterval) {
      clearInterval(this.stompInterval);
      this.stompInterval = null;
    }
    if (this.laughterInterval) {
      clearInterval(this.laughterInterval);
      this.laughterInterval = null;
    }
  }

  resume() {
    if (!this.isInitialized) return;

    // Resume looping sounds
    if (this.sounds.wind && !this.sounds.wind.isPlaying) {
      this.sounds.wind.play();
    }
    if (this.sounds.heartbeat && !this.sounds.heartbeat.isPlaying) {
      this.sounds.heartbeat.play();
    }

    // Restart laughter interval
    this.laughterInterval = setInterval(() => {
      if (Math.random() < 0.3 && this.sounds.laughter) {
        this.sounds.laughter.stop();
        this.sounds.laughter.play();
      }
    }, 15000);
  }
}
