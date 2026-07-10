// Tiny Web Audio SFX synth — no assets, cute little blips.
let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.15, when = 0) {
  const c = ac(); if (!c || muted) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

export const sfx = {
  setMuted(m: boolean) { muted = m; try { localStorage.setItem("sfx-muted", m ? "1" : "0"); } catch { /* noop */ } },
  isMuted() {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem("sfx-muted") === "1"; } catch { return muted; }
  },
  init() { muted = this.isMuted(); },
  tap()    { tone(660, 0.08, "sine", 0.08); },
  pop()    { tone(520, 0.09, "triangle", 0.1); tone(780, 0.08, "sine", 0.06, 0.04); },
  success(){ tone(523.25, 0.12, "sine", 0.14); tone(659.25, 0.12, "sine", 0.14, 0.09); tone(783.99, 0.22, "sine", 0.16, 0.18); },
  levelUp(){ tone(523.25, 0.1, "triangle", 0.14); tone(659.25, 0.1, "triangle", 0.14, 0.08); tone(783.99, 0.1, "triangle", 0.14, 0.16); tone(1046.5, 0.28, "triangle", 0.16, 0.24); },
  coin()   { tone(987.77, 0.07, "square", 0.08); tone(1318.5, 0.18, "square", 0.09, 0.06); },
  fanfare(){ tone(659.25,0.09,"triangle",0.13); tone(880,0.09,"triangle",0.13,0.08); tone(1174.66,0.09,"triangle",0.13,0.16); tone(1567.98,0.35,"triangle",0.15,0.24); },
  error()  { tone(220, 0.15, "sawtooth", 0.09); },
  fail()   { tone(330, 0.14, "sawtooth", 0.14); tone(220, 0.28, "sawtooth", 0.14, 0.1); tone(110, 0.4, "sawtooth", 0.12, 0.22); },
  scanBeep(){ tone(1200, 0.05, "square", 0.05); },
};

if (typeof window !== "undefined") sfx.init();
