// Pure Web Audio API Synthesizer to avoid any external audio assets and work 100% reliably in any environment
class AudioSynth {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private binauralOscLeft: OscillatorNode | null = null;
  private binauralOscRight: OscillatorNode | null = null;
  private binauralGain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a premium start alert chime
  playStartChime() {
    try {
      this.initCtx();
      const ctx = this.ctx!;
      const now = ctx.currentTime;

      // Create synthetic synthesizer chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // Arpeggio notes (C5 -> E5 -> G5 -> C6)
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc1.frequency.setValueAtTime(1046.50, now + 0.3); // C6

      osc2.frequency.setValueAtTime(1046.50, now);
      osc2.frequency.setValueAtTime(1318.51, now + 0.1);
      osc2.frequency.setValueAtTime(1567.98, now + 0.2);
      osc2.frequency.setValueAtTime(2093.00, now + 0.3);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Play a premium finish alert chime
  playCompleteChime() {
    try {
      this.initCtx();
      const ctx = this.ctx!;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3); // Ramp up to C6
      osc.frequency.setValueAtTime(1046.50, now + 0.3);
      osc.frequency.setValueAtTime(1318.51, now + 0.45); // E6
      osc.frequency.setValueAtTime(1567.98, now + 0.6); // G6
      osc.frequency.setValueAtTime(2093.00, now + 0.75); // C7

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.5);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Start synthesizing binaural beats (Gamma = 40Hz difference, Alpha = 10Hz difference)
  startBinauralBeats(type: 'gamma' | 'alpha', volume: number = 0.5) {
    try {
      this.initCtx();
      const ctx = this.ctx!;
      this.stopAmbientNoise();

      const baseFreq = 200; // Comfortable base carrier frequency
      const offset = type === 'gamma' ? 40 : 10; // Gamma (focus) vs Alpha (relaxation)

      const merger = ctx.createChannelMerger(2);
      this.binauralOscLeft = ctx.createOscillator();
      this.binauralOscRight = ctx.createOscillator();
      this.binauralGain = ctx.createGain();

      this.binauralOscLeft.type = 'sine';
      this.binauralOscLeft.frequency.value = baseFreq;

      this.binauralOscRight.type = 'sine';
      this.binauralOscRight.frequency.value = baseFreq + offset;

      this.binauralGain.gain.value = volume * 0.15; // keep it quiet and non-intrusive

      // Connect left and right oscillators to individual stereo channels
      this.binauralOscLeft.connect(merger, 0, 0);
      this.binauralOscRight.connect(merger, 0, 1);
      merger.connect(this.binauralGain);
      this.binauralGain.connect(ctx.destination);

      this.binauralOscLeft.start();
      this.binauralOscRight.start();
    } catch (e) {
      console.warn('Binaural beats generation error:', e);
    }
  }

  // Start synthesizing smooth premium white/pink noise (rain generator)
  startRainNoise(volume: number = 0.5) {
    try {
      this.initCtx();
      const ctx = this.ctx!;
      this.stopAmbientNoise();

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Synthesize pink/white noise for standard rain feel
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filter formula
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // normalise volume
        b6 = white * 0.115926;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Filter to simulate soft raindrops hitting windows (lowpass filtering)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1100;

      this.binauralGain = ctx.createGain();
      this.binauralGain.gain.value = volume * 0.25;

      noiseSource.connect(filter);
      filter.connect(this.binauralGain);
      this.binauralGain.connect(ctx.destination);

      noiseSource.start(0);
      // Store node to be able to stop it
      (this as any).rainSource = noiseSource;
    } catch (e) {
      console.warn('Rain sound generation error:', e);
    }
  }

  // Adjust volume dynamically
  setVolume(volume: number) {
    if (this.binauralGain) {
      this.binauralGain.gain.setValueAtTime(volume * 0.2, this.ctx?.currentTime || 0);
    }
  }

  // Stop all ambient noise
  stopAmbientNoise() {
    try {
      if (this.binauralOscLeft) {
        this.binauralOscLeft.stop();
        this.binauralOscLeft.disconnect();
        this.binauralOscLeft = null;
      }
      if (this.binauralOscRight) {
        this.binauralOscRight.stop();
        this.binauralOscRight.disconnect();
        this.binauralOscRight = null;
      }
      if ((this as any).rainSource) {
        (this as any).rainSource.stop();
        (this as any).rainSource.disconnect();
        (this as any).rainSource = null;
      }
      if (this.binauralGain) {
        this.binauralGain.disconnect();
        this.binauralGain = null;
      }
    } catch (e) {
      // Silently ignore
    }
  }
}

export const audioSynth = new AudioSynth();
