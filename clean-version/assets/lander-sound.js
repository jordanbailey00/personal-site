// Sci-fi sound effects for the homepage lander game, synthesized with the Web
// Audio API so no audio files are needed: frequency-modulated zaps and bells,
// resonant filter sweeps, filtered noise, and a dark echo that gives every
// sound some empty space around it. Sounds pan toward where they happen.
// Nothing plays until a visitor starts flying (browsers allow audio only
// after a click or key press), and every call is silent where Web Audio is
// unavailable or the sound is muted.

export function createSounds(window) {
  const Context = window.AudioContext ?? window.webkitAudioContext;
  let audio = null, master = null, space = null, noise = null, laser = null, muted = false, recentHits = [];

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
      // A repeating, darkening echo: the sound of empty space.
      space = audio.createDelay(1);
      space.delayTime.value = 0.19;
      const damping = audio.createBiquadFilter(), feedback = audio.createGain(), wet = audio.createGain();
      damping.type = 'lowpass';
      damping.frequency.value = 2600;
      feedback.gain.value = 0.38;
      wet.gain.value = 0.5;
      space.connect(damping).connect(feedback).connect(space);
      damping.connect(wet).connect(master);
      noise = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
      const samples = noise.getChannelData(0);
      for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
    }
    if (audio.state === 'suspended') audio.resume();
    return true;
  }

  // Sends a sound to the speakers, panned toward where it happened, and into the echo.
  function route(node, pan = 0, echo = 0.3) {
    let out = node;
    if (pan && audio.createStereoPanner) {
      const panner = audio.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      out = node.connect(panner);
    }
    out.connect(master);
    if (echo) {
      const send = audio.createGain();
      send.gain.value = echo;
      out.connect(send).connect(space);
    }
  }
  function envelope(gain, at, peak, duration, attack) {
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  }
  // A swept tone. With a modulator (ratio and index) it becomes an FM voice:
  // bright zaps when the modulation falls away, metallic clangs at odd
  // ratios, and bells when it rings on.
  function voice({ type = 'sine', from, to = from, duration, peak, delay = 0, ratio = 0, index = 0, pan = 0, echo = 0.3, attack = 0.004 }) {
    const at = audio.currentTime + delay, carrier = audio.createOscillator(), gain = audio.createGain();
    carrier.type = type;
    carrier.frequency.setValueAtTime(from, at);
    carrier.frequency.exponentialRampToValueAtTime(to, at + duration);
    if (ratio) {
      const modulator = audio.createOscillator(), depth = audio.createGain();
      modulator.frequency.setValueAtTime(from * ratio, at);
      modulator.frequency.exponentialRampToValueAtTime(to * ratio, at + duration);
      depth.gain.setValueAtTime(index, at);
      depth.gain.exponentialRampToValueAtTime(Math.max(1, index * 0.02), at + duration);
      modulator.connect(depth).connect(carrier.frequency);
      modulator.start(at);
      modulator.stop(at + duration + 0.05);
    }
    envelope(gain, at, peak, duration, attack);
    carrier.connect(gain);
    route(gain, pan, echo);
    carrier.start(at);
    carrier.stop(at + duration + 0.05);
  }
  // A buzzing tone through a resonant filter that sweeps: the "vwoom" of
  // charging and launching.
  function sweep({ type = 'sawtooth', frequency, from, to, duration, peak, q = 12, delay = 0, pan = 0, echo = 0.3, attack = 0.01 }) {
    const at = audio.currentTime + delay, oscillator = audio.createOscillator(), filter = audio.createBiquadFilter(), gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    filter.type = 'lowpass';
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, at);
    filter.frequency.exponentialRampToValueAtTime(to, at + duration);
    envelope(gain, at, peak, duration, attack);
    oscillator.connect(filter).connect(gain);
    route(gain, pan, echo);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.05);
  }
  // Filtered noise swept between two cutoffs: blasts, rumbles, and venting.
  function hiss({ filter: type = 'lowpass', from, to = from, duration, peak, delay = 0, q = 1, pan = 0, echo = 0.3, attack = 0.006 }) {
    const at = audio.currentTime + delay, source = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
    source.buffer = noise;
    source.loop = true;
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, at);
    filter.frequency.exponentialRampToValueAtTime(to, at + duration);
    envelope(gain, at, peak, duration, attack);
    source.connect(filter).connect(gain);
    route(gain, pan, echo);
    source.start(at, Math.random() * 0.5);
    source.stop(at + duration + 0.05);
  }

  const FIRE = {
    // A classic laser zap with a bright click at the front.
    blaster(pan) {
      voice({ type: 'triangle', from: 1700, to: 240, duration: 0.16, peak: 0.16, ratio: 2, index: 700, pan, echo: 0.35 });
      voice({ from: 3200, to: 1200, duration: 0.05, peak: 0.05, pan, echo: 0 });
    },
    // A plasma spread: a quick charge, a fan of falling zaps, a resonant
    // "vwomp", and a sub-bass punch.
    scatter(pan) {
      voice({ from: 500, to: 1900, duration: 0.05, peak: 0.07, pan, echo: 0 });
      [2300, 1900, 1550].forEach((from, index) => voice({ type: 'triangle', from, to: from / 8, duration: 0.32, peak: 0.08, delay: 0.035, ratio: 1.5, index: 260, pan: pan + (index - 1) * 0.25, echo: 0.45 }));
      sweep({ frequency: 70, from: 2400, to: 160, duration: 0.36, peak: 0.22, q: 9, delay: 0.03, pan, echo: 0.4 });
      voice({ from: 140, to: 38, duration: 0.3, peak: 0.4, delay: 0.03, pan, echo: 0 });
    },
    // Short, bright blips with a little random pitch.
    rapid(pan) {
      voice({ from: 1500 + Math.random() * 400, to: 650, duration: 0.07, peak: 0.06, ratio: 3, index: 400, pan, echo: 0.15 });
    },
    // A rising resonant launch, two quick lock-on beeps, and a soft thrust.
    missiles(pan) {
      sweep({ frequency: 95, from: 220, to: 3200, duration: 0.5, peak: 0.2, q: 14, pan, echo: 0.4, attack: 0.04 });
      voice({ from: 1568, duration: 0.05, peak: 0.06, delay: 0.06, pan, echo: 0.5 });
      voice({ from: 2093, duration: 0.05, peak: 0.06, delay: 0.13, pan, echo: 0.5 });
      hiss({ filter: 'bandpass', from: 900, to: 2400, duration: 0.45, peak: 0.08, q: 3, pan, echo: 0.2, attack: 0.05 });
    },
  };
  // Each kind of target breaks apart with its own sound.
  // Breaking-material building blocks. `v` nudges the pitch so repeated hits
  // never sound identical.
  // A sharp crack: a very short, bright transient.
  function crack(pan, delay = 0, peak = 0.3) {
    hiss({ filter: 'highpass', from: 5000, to: 2500, duration: 0.025, peak, delay, pan, echo: 0.1, attack: 0.001 });
  }
  // A low knock that falls in pitch.
  function thud(from, length, peak, pan, v, delay = 0) {
    voice({ from: from * v, to: from * 0.38, duration: length, peak, delay, pan, echo: 0.15 });
  }
  // A cluster of short, resonant noise grains: material breaking into pieces.
  function grains({ count, center, spread = 0.8, q = 3, spacing = 0.018, jitter = 0.01, peak = 0.24, length = 0.05, fall = 0.5, decay = 1, delay = 0, pan, v }) {
    for (let index = 0; index < count; index++) {
      const frequency = center * v * (1 - spread / 2 + Math.random() * spread);
      hiss({ filter: 'bandpass', from: frequency, to: frequency * fall, duration: length, peak: peak * decay ** index, q, delay: delay + index * spacing + Math.random() * jitter, pan, echo: 0.2 });
    }
  }
  // A metallic ping, like a bolt or a plate ringing as it flies off.
  function ping(frequency, pan, v, delay = 0, length = 0.2, peak = 0.045) {
    voice({ from: frequency * v, to: frequency * v * 0.97, duration: length, peak, delay, ratio: 1.414, index: frequency * 0.7, pan, echo: 0.45 });
  }
  const HIT = {
    // Deep fracture: a low groan as the rock gives way, a crack, a heavy
    // boom, and crumbling.
    asteroid(pan, v) {
      hiss({ filter: 'bandpass', from: 900 * v, to: 180, duration: 0.18, peak: 0.3, q: 6, pan, echo: 0.3 });
      crack(pan, 0.1, 0.3);
      thud(70, 0.55, 0.5, pan, v, 0.1);
      grains({ count: 12, center: 800, spread: 1, q: 2, spacing: 0.025, peak: 0.18, length: 0.06, decay: 0.92, delay: 0.14, pan, v });
    },
    // The smaller rocks an asteroid splits into fracture quicker and higher.
    rock(pan, v) {
      hiss({ filter: 'bandpass', from: 1400 * v, to: 300, duration: 0.12, peak: 0.22, q: 6, pan, echo: 0.3 });
      crack(pan, 0.06, 0.2);
      grains({ count: 6, center: 1200, spread: 1, q: 2, spacing: 0.02, peak: 0.15, length: 0.05, delay: 0.08, pan, v });
    },
    // Panel blowout: an explosion that throws bolts and plates, ringing as
    // they fly off.
    satellite(pan, v) {
      hiss({ from: 3200 * v, to: 90, duration: 0.5, peak: 0.42, pan, echo: 0.4 });
      thud(110, 0.45, 0.45, pan, v);
      for (const [delay, frequency] of [[0.05, 2900], [0.11, 3700], [0.16, 2300], [0.24, 4100], [0.33, 3100]]) ping(frequency, pan + (Math.random() - 0.5) * 0.6, v, delay, 0.15, 0.04);
    },
    ufo(pan) {
      voice({ from: 1900, to: 140, duration: 0.45, peak: 0.14, ratio: 2.5, index: 1200, pan, echo: 0.5 });
      voice({ type: 'triangle', from: 600, to: 2400, duration: 0.2, peak: 0.05, pan });
    },
    comet(pan) {
      [1568, 2093, 2637, 3136].forEach((from, index) => voice({ from, duration: 0.3, peak: 0.07, delay: index * 0.045, ratio: 3.5, index: 500, pan, echo: 0.55 }));
      hiss({ from: 3000, to: 200, duration: 0.5, peak: 0.2, pan });
    },
  };

  // The laser: a rising charge, then a growling, wobbling hum under a high
  // whine and crackle, until it powers down.
  function laserOn(pan) {
    const at = audio.currentTime, out = audio.createGain();
    out.gain.setValueAtTime(0.0001, at);
    out.gain.exponentialRampToValueAtTime(0.45, at + 0.08);
    route(out, pan, 0.25);
    voice({ type: 'sawtooth', from: 180, to: 2200, duration: 0.16, peak: 0.12, pan, echo: 0 });
    hiss({ filter: 'bandpass', from: 800, to: 5000, duration: 0.16, peak: 0.1, q: 2, pan, echo: 0 });
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
    laser = { out, sources, whine, pan };
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
    fire(gun, pan = 0) { if (FIRE[gun] && ready()) FIRE[gun](pan); },
    hit(kind, pan = 0) {
      if (!HIT[kind] || !ready()) return;
      // A missile burst or the laser can break many targets at once; a few
      // sounds carry that, and more would only add mud and audio work.
      const now = audio.currentTime;
      recentHits = recentHits.filter(time => now - time < 0.08);
      if (recentHits.length >= 3) return;
      recentHits.push(now);
      HIT[kind](pan, 0.94 + Math.random() * 0.12);
    },
    // An explosion: a falling roar, a metallic plasma boom, and a deep thud.
    boom(size = 1, pan = 0) {
      if (!ready()) return;
      hiss({ from: 2600, to: 60, duration: 0.6 + size * 0.5, peak: 0.45 + size * 0.2, pan, echo: 0.45 });
      voice({ from: 320, to: 35, duration: 0.5 + size * 0.4, peak: 0.35, ratio: 1.5, index: 600, pan, echo: 0.35 });
      voice({ from: 90, to: 28, duration: 0.6 + size * 0.3, peak: 0.5, pan, echo: 0 });
    },
    laser(on, pan = 0) {
      if (!on) {
        if (!laser) return;
        const { pan: where } = laser;
        silenceLaser();
        if (ready()) voice({ type: 'sawtooth', from: 900, to: 110, duration: 0.28, peak: 0.07, pan: where });
      } else if (!laser && ready()) laserOn(pan);
    },
    // The whine climbs as the laser's energy runs down.
    energy(level) { if (laser) laser.whine.frequency.setTargetAtTime(1200 + (1 - level) * 700, audio.currentTime, 0.05); },
    // Venting steam under two warning beeps and a falling tone.
    overheat() {
      if (!ready()) return;
      hiss({ filter: 'highpass', from: 7000, to: 1800, duration: 0.8, peak: 0.16 });
      for (const delay of [0, 0.14]) voice({ type: 'square', from: 880, duration: 0.09, peak: 0.04, delay, echo: 0.4 });
      voice({ from: 900, to: 120, duration: 0.6, peak: 0.07 });
    },
    // A two-tone interface chirp.
    select() {
      if (!ready()) return;
      voice({ from: 1320, duration: 0.04, peak: 0.06 });
      voice({ from: 1760, duration: 0.05, peak: 0.06, delay: 0.045 });
    },
    // A sonar ping for the last seconds of a round.
    tick() { if (ready()) voice({ from: 1050, to: 1000, duration: 0.25, peak: 0.12, echo: 0.5, attack: 0.002 }); },
    // A rising chord of bells when time runs out.
    finish() { if (ready()) [523.25, 659.25, 783.99, 1046.5].forEach((from, index) => voice({ from, duration: 0.5, peak: 0.1, delay: index * 0.11, ratio: 3.5, index: 400, echo: 0.5 })); },
    get muted() { return muted; },
    set muted(value) {
      if (value) silenceLaser();
      muted = value;
    },
  };
}
