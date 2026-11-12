// Web Audio API Ringtone & Sound FX Generator (Zero external audio file dependencies)

let activeRingtone = null;
let activeRingback = null;

/**
 * Play incoming phone ringtone (European / Modern 2-tone ring)
 */
export function startIncomingRingtone() {
  stopIncomingRingtone();
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    const ctx = new AudioContext();

    let isPlaying = true;

    const playBurst = () => {
      if (!isPlaying || ctx.state === 'closed') return;

      const now = ctx.currentTime;
      // Tone 1: 440 Hz (A4)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain.gain.setValueAtTime(0.12, now + 1.2);
      gain.gain.linearRampToValueAtTime(0, now + 1.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.3);
      osc2.stop(now + 1.3);
    };

    playBurst();
    const interval = setInterval(playBurst, 2500);

    activeRingtone = () => {
      isPlaying = false;
      clearInterval(interval);
      try {
        ctx.close();
      } catch (_) {}
      activeRingtone = null;
    };

    return activeRingtone;
  } catch (err) {
    console.error('AudioContext error:', err);
    return null;
  }
}

export function stopIncomingRingtone() {
  if (activeRingtone) {
    try {
      activeRingtone();
    } catch (_) {}
    activeRingtone = null;
  }
}

/**
 * Play outgoing ringback tone ("tuut... tuut...") while waiting for receiver to pick up
 */
export function startOutgoingRingback() {
  stopOutgoingRingback();
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    const ctx = new AudioContext();

    let isPlaying = true;

    const playTone = () => {
      if (!isPlaying || ctx.state === 'closed') return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.setValueAtTime(0.08, now + 1.0);
      gain.gain.linearRampToValueAtTime(0, now + 1.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.05);
    };

    playTone();
    const interval = setInterval(playTone, 3000);

    activeRingback = () => {
      isPlaying = false;
      clearInterval(interval);
      try {
        ctx.close();
      } catch (_) {}
      activeRingback = null;
    };

    return activeRingback;
  } catch (err) {
    console.error('AudioContext ringback error:', err);
    return null;
  }
}

export function stopOutgoingRingback() {
  if (activeRingback) {
    try {
      activeRingback();
    } catch (_) {}
    activeRingback = null;
  }
}

/**
 * Play a short call end beep
 */
export function playCallEndSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(200, now + 0.25);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
    setTimeout(() => {
      try { ctx.close(); } catch (_) {}
    }, 400);
  } catch (_) {}
}
