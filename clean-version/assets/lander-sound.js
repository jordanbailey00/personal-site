// Sound effects for the homepage lander game, synthesized with the Web Audio
// API so no audio files are needed. Nothing plays until a visitor starts
// flying (browsers allow audio only after a click or key press), and every
// call is silent where Web Audio is unavailable or the sound is muted.

export function createSounds(window) {
  const Context = window.AudioContext ?? window.webkitAudioContext;
  let audio = null, master = null, noise = null, laser = null, muted = false;

  function ready() {
    if (!Context || muted) return false;
    if (!audio) {
      audio = new Context();
      master = audio.createGain();
      master.gain.value = 0.4;
      // A limiter keeps stacked explosions from clipping.
      const limiter = audio.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.ratio.value = 12;
      master.connect(limiter).connect(audio.destination);
      noise = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
      const samples = noise.getChannelData(0);
      for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
    }
    if (audio.state === 'suspended') audio.resume();
    return true;
  }
  function envelope(gain, at, peak, duration) {
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  }
  // A pitched blip that glides from one frequency to another.
  function tone(type, from, to, duration, peak, delay = 0) {
    const at = audio.currentTime + delay, oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, at);
    oscillator.frequency.exponentialRampToValueAtTime(to, at + duration);
    envelope(gain, at, peak, duration);
    oscillator.connect(gain).connect(master);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.05);
  }
  // Filtered noise, swept from one cutoff to another: blasts, whooshes, hiss.
  function hiss(filterType, from, to, duration, peak, delay = 0, q = 1) {
    const at = audio.currentTime + delay, source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
    source.buffer = noise;
    source.loop = true;
    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, at);
    filter.frequency.exponentialRampToValueAtTime(to, at + duration);
    envelope(gain, at, peak, duration);
    source.connect(filter).connect(gain).connect(master);
    source.start(at, Math.random() * 0.5);
    source.stop(at + duration + 0.05);
  }

  const FIRE = {
    blaster() { tone('square', 1500, 160, 0.13, 0.09); tone('sawtooth', 760, 90, 0.11, 0.05); hiss('highpass', 4000, 1500, 0.05, 0.05); },
    scatter() { hiss('lowpass', 4500, 180, 0.38, 0.6); tone('sine', 170, 38, 0.32, 0.55); tone('square', 90, 40, 0.12, 0.12); },
    rapid() { tone('square', 1100 + Math.random() * 300, 380, 0.045, 0.045); hiss('bandpass', 3000, 1800, 0.03, 0.06, 0, 2); },
    missiles() { hiss('bandpass', 500, 3200, 0.55, 0.22, 0, 1.5); tone('sawtooth', 90, 300, 0.4, 0.04); },
  };
  const HIT = {
    asteroid() { hiss('lowpass', 1800, 120, 0.4, 0.35); tone('sine', 140, 45, 0.3, 0.35); },
    rock() { hiss('lowpass', 2600, 200, 0.25, 0.28); tone('sine', 200, 70, 0.2, 0.25); },
    satellite() { tone('triangle', 620, 600, 0.35, 0.12); tone('triangle', 1393, 1350, 0.25, 0.08); hiss('highpass', 5000, 2000, 0.2, 0.15); },
    ufo() { tone('sawtooth', 1800, 120, 0.4, 0.08); hiss('bandpass', 2000, 400, 0.35, 0.2, 0, 3); },
    comet() { [1568, 2093, 2637].forEach((frequency, index) => tone('triangle', frequency, frequency, 0.25, 0.08, index * 0.05)); hiss('lowpass', 3000, 150, 0.5, 0.3); },
  };

  // The laser: a rising charge, then a growling, wobbling hum under a high
  // whine and crackle, until it powers down.
  function laserOn() {
    const at = audio.currentTime, out = audio.createGain();
    out.gain.setValueAtTime(0.0001, at);
    out.gain.exponentialRampToValueAtTime(0.45, at + 0.08);
    out.connect(master);
    tone('sawtooth', 180, 2200, 0.16, 0.12);
    hiss('bandpass', 800, 5000, 0.16, 0.1, 0, 2);
    const growl = audio.createBiquadFilter(), wobble = audio.createOscillator(), depth = audio.createGain(), body = audio.createGain();
    growl.type = 'lowpass';
    growl.frequency.value = 700;
    growl.Q.value = 8;
    wobble.frequency.value = 11;
    depth.gain.value = 450;
    body.gain.value = 0.22;
    wobble.connect(depth).connect(growl.frequency);
    const saws = [55, 55.6, 110.4, 165.2].map(frequency => {
      const saw = audio.createOscillator();
      saw.type = 'sawtooth';
      saw.frequency.value = frequency;
      saw.connect(growl);
      return saw;
    });
    growl.connect(body).connect(out);
    const whine = audio.createOscillator(), vibrato = audio.createOscillator(), vibratoDepth = audio.createGain(), whineGain = audio.createGain();
    whine.frequency.value = 1200;
    vibrato.frequency.value = 27;
    vibratoDepth.gain.value = 35;
    whineGain.gain.value = 0.05;
    vibrato.connect(vibratoDepth).connect(whine.frequency);
    whine.connect(whineGain).connect(out);
    const crackle = audio.createBufferSource(), band = audio.createBiquadFilter(), crackleGain = audio.createGain();
    crackle.buffer = noise;
    crackle.loop = true;
    band.type = 'bandpass';
    band.frequency.value = 3200;
    band.Q.value = 0.7;
    crackleGain.gain.value = 0.07;
    crackle.connect(band).connect(crackleGain).connect(out);
    const sources = [...saws, wobble, whine, vibrato, crackle];
    for (const source of sources) source.start(at);
    laser = { out, sources, whine };
  }
  function silenceLaser() {
    if (!laser) return;
    const at = audio.currentTime;
    laser.out.gain.cancelScheduledValues(at);
    laser.out.gain.setValueAtTime(Math.max(0.0001, laser.out.gain.value), at);
    laser.out.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
    for (const source of laser.sources) source.stop(at + 0.12);
    laser = null;
  }

  return {
    // Call from the click or key press that starts a flight.
    start: ready,
    fire(gun) { if (FIRE[gun] && ready()) FIRE[gun](); },
    hit(kind) { if (HIT[kind] && ready()) HIT[kind](); },
    boom(size = 1) { if (ready()) { hiss('lowpass', 2400, 50, 0.5 + size * 0.5, 0.55 + size * 0.2); tone('sine', 120, 28, 0.45 + size * 0.4, 0.6); } },
    laser(on) {
      if (!on) {
        if (!laser) return;
        silenceLaser();
        if (ready()) tone('sawtooth', 900, 110, 0.28, 0.07);
      } else if (!laser && ready()) laserOn();
    },
    // The whine climbs as the laser's energy runs down.
    energy(level) { if (laser) laser.whine.frequency.setTargetAtTime(1200 + (1 - level) * 700, audio.currentTime, 0.05); },
    overheat() { if (ready()) { hiss('highpass', 6000, 1200, 0.7, 0.18); tone('sawtooth', 700, 70, 0.6, 0.08); } },
    select() { if (ready()) tone('triangle', 1400, 1900, 0.07, 0.06); },
    tick() { if (ready()) tone('sine', 1250, 1250, 0.09, 0.12); },
    finish() { if (ready()) [523, 659, 784, 1047].forEach((frequency, index) => tone('triangle', frequency, frequency, 0.22, 0.12, index * 0.11)); },
    get muted() { return muted; },
    set muted(value) {
      if (value) silenceLaser();
      muted = value;
    },
  };
}
