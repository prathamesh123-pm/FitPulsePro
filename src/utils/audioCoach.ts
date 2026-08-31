// Web Audio API & Speech Synthesis Coach for Gym Workouts

class AudioCoachService {
  private ctx: AudioContext | null = null;
  private metronomeTimer: number | null = null;
  private ambientNoiseNode: AudioNode | null = null;
  private isSpeechSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Play a simple synthesized frequency beep
  public playBeep(freq: number = 880, durationSeconds: number = 0.15, type: OscillatorType = "sine") {
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationSeconds);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + durationSeconds);
    } catch (e) {
      console.warn("AudioContext beep failed", e);
    }
  }

  // 3-2-1 Countdown Beeps
  public playCountdownBeep(isFinal: boolean = false) {
    if (isFinal) {
      // High pitch double-chime for GO / Done
      this.playBeep(1046.5, 0.25, "triangle"); // High C
      setTimeout(() => this.playBeep(1318.5, 0.35, "sine"), 80); // High E
    } else {
      this.playBeep(587.33, 0.1, "sine"); // D5
    }
  }

  // Rest Finished Fanfare
  public playRestFinishedSound() {
    this.playCountdownBeep(true);
    if (this.isSpeechSupported) {
      this.speakText("Rest time is up! Get ready for your next set.");
    }
  }

  // Text-to-speech voice cue
  public speakText(text: string, lang: "en" | "mr" = "en") {
    if (!this.isSpeechSupported) return;
    try {
      window.speechSynthesis.cancel(); // cancel previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = lang === "mr" ? "mr-IN" : "en-US";
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis failed", e);
    }
  }

  // Lifting Metronome
  public startMetronome(bpm: number = 60, onTick?: (tick: number) => void) {
    this.stopMetronome();
    this.initContext();

    let count = 0;
    const intervalMs = (60 / bpm) * 1000;

    // First tick
    this.playBeep(800, 0.05, "sine");
    count++;
    if (onTick) onTick(count);

    this.metronomeTimer = window.setInterval(() => {
      count++;
      const isDownbeat = count % 4 === 1;
      this.playBeep(isDownbeat ? 1000 : 600, 0.05, "sine");
      if (onTick) onTick(count);
    }, intervalMs);
  }

  public stopMetronome() {
    if (this.metronomeTimer !== null) {
      clearInterval(this.metronomeTimer);
      this.metronomeTimer = null;
    }
  }

  // Ambient Gym White/Pink Noise for focus
  public startAmbientFocusNoise(type: "pink" | "white" = "pink") {
    this.stopAmbientNoise();
    this.initContext();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === "pink") {
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.03;
          b6 = white * 0.115926;
        } else {
          output[i] = white * 0.02;
        }
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      whiteNoise.loop = true;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);

      whiteNoise.connect(gain);
      gain.connect(this.ctx.destination);
      whiteNoise.start();

      this.ambientNoiseNode = whiteNoise;
    } catch (e) {
      console.warn("Ambient noise generator error", e);
    }
  }

  public stopAmbientNoise() {
    if (this.ambientNoiseNode) {
      try {
        (this.ambientNoiseNode as any).stop();
      } catch (e) {
        // ignore
      }
      this.ambientNoiseNode = null;
    }
  }
}

export const audioCoach = new AudioCoachService();
