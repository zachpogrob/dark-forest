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

    // Creepy ambient music
    this.sounds.music = this.createCreepyMusic();

    // Footstep stomp
    this.sounds.stomp = this.createStompSound();

    // Creepy laughter
    this.sounds.laughter = this.createLaughterSound();

    // Heartbeat for tension
    this.sounds.heartbeat = this.createHeartbeatSound();

    // Jumpscare sound
    this.sounds.jumpscare = this.createJumpscareSound();
  }

  createCreepyMusic() {
    const audio = new THREE.Audio(this.listener);
    const duration = 32; // Longer loop for variety
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(2, duration * sampleRate, sampleRate);
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // Musical frequencies (minor key, dissonant)
    const baseFreq = 55; // Low A
    const frequencies = [
      baseFreq,           // A1 - root drone
      baseFreq * 1.5,     // E2 - fifth
      baseFreq * 1.2,     // C2 - minor third
      baseFreq * 1.8,     // F2 - tritone (dissonant)
      baseFreq * 2.5,     // C#3 - more dissonance
    ];

    for (let i = 0; i < leftChannel.length; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      let sampleL = 0;
      let sampleR = 0;

      // Layer 1: Deep bass drone with slow modulation
      const droneMod = 0.5 + 0.5 * Math.sin(t * 0.1);
      const drone = Math.sin(t * frequencies[0] * Math.PI * 2) * 0.25 * droneMod;
      sampleL += drone;
      sampleR += drone;

      // Layer 2: Evolving pad with multiple detuned oscillators
      const padEnvelope = 0.3 + 0.7 * Math.sin(t * 0.05 * Math.PI * 2);
      for (let j = 1; j < 4; j++) {
        const detune = 1 + Math.sin(t * 0.2 + j) * 0.01;
        const padTone = Math.sin(t * frequencies[j] * detune * Math.PI * 2);
        const pan = Math.sin(t * 0.1 + j * 2); // Slow stereo movement
        sampleL += padTone * padEnvelope * 0.08 * (1 - pan * 0.3);
        sampleR += padTone * padEnvelope * 0.08 * (1 + pan * 0.3);
      }

      // Layer 3: High dissonant tones that fade in/out
      const highEnv = Math.max(0, Math.sin(t * 0.15) * Math.sin(t * 0.07));
      const highTone = Math.sin(t * frequencies[4] * Math.PI * 2) * highEnv * 0.04;
      sampleL += highTone * 0.7;
      sampleR += highTone * 1.3;

      // Layer 4: Subtle "breathing" noise
      const breathRate = 0.25;
      const breathEnv = Math.pow(Math.max(0, Math.sin(t * breathRate * Math.PI * 2)), 4);
      const breathNoise = (Math.random() * 2 - 1) * breathEnv * 0.02;
      sampleL += breathNoise;
      sampleR += breathNoise * 0.8;

      // Layer 5: Random creepy glitches/clicks
      if (Math.random() < 0.00005) {
        const glitch = (Math.random() * 2 - 1) * 0.15;
        sampleL += glitch;
        sampleR += glitch * (Math.random() > 0.5 ? 1 : -1);
      }

      // Layer 6: Very low sub-bass rumble
      const subRumble = Math.sin(t * 25 * Math.PI * 2) * 0.08;
      const rumbleEnv = 0.3 + 0.7 * Math.sin(t * 0.03);
      sampleL += subRumble * rumbleEnv;
      sampleR += subRumble * rumbleEnv;

      // Layer 7: Occasional dissonant "string" swells
      const swellPeriod = 8;
      const swellPhase = (t % swellPeriod) / swellPeriod;
      const swellEnv = swellPhase < 0.5 ? Math.pow(Math.sin(swellPhase * Math.PI), 2) : 0;
      const stringFreq = frequencies[3] * 2;
      const string1 = Math.sin(t * stringFreq * Math.PI * 2);
      const string2 = Math.sin(t * stringFreq * 1.01 * Math.PI * 2); // Slight detune
      sampleL += (string1 + string2) * swellEnv * 0.015;
      sampleR += (string1 - string2) * swellEnv * 0.015;

      // Soft limiting
      leftChannel[i] = Math.tanh(sampleL * 1.5);
      rightChannel[i] = Math.tanh(sampleR * 1.5);
    }

    audio.setBuffer(buffer);
    audio.setLoop(true);
    audio.setVolume(0.8);

    return audio;
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

    // Start creepy music
    if (this.sounds.music && !this.sounds.music.isPlaying) {
      this.sounds.music.play();
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
    if (this.sounds.music && !this.sounds.music.isPlaying) {
      this.sounds.music.play();
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
