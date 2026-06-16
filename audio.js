// ─── VRYKS Ambient Audio System ──────────────────────────────────────────────
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, type = 'sine', vol = 0.04, attack = 0.01, release = 0.5) {
  try {
    const ac   = getCtx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    const now  = ac.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + release);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + release + 0.05);
  } catch (_) {}
}

export function playHeroChord() {
  // C major 7th — cinematic, open
  [261.63, 329.63, 392.00, 493.88].forEach((f, i) => {
    setTimeout(() => tone(f, 'sine', 0.022, 0.04, 1.4), i * 140);
  });
}

export function playSectionTone(id) {
  const map = {
    hero:         261.63,
    thesis:       293.66,
    capabilities: 329.63,
    stats:        349.23,
    portfolio:    392.00,
    converge:     440.00,
    process:      493.88,
    team:         523.25,
    contact:      587.33,
  };
  tone(map[id] || 440, 'sine', 0.025, 0.01, 0.6);
}

export function playHover() {
  tone(1046.5, 'sine', 0.018, 0.005, 0.18);
}

export function playSuccess() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    setTimeout(() => tone(f, 'sine', 0.032, 0.01, 0.7), i * 100);
  });
}

export function initAudio() {
  // Warm up AudioContext on first user gesture — browser requirement
  const warmup = () => { try { getCtx(); } catch (_) {} };
  document.addEventListener('click',      warmup, { once: true });
  document.addEventListener('touchstart', warmup, { once: true });
}
