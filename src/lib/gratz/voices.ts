import { withBus } from "@/lib/gratz/pluck";

export const INSTRUMENTS = ["piano", "guitar", "drums", "flute", "trumpet"] as const;
export type Instrument = (typeof INSTRUMENTS)[number];

export const PIANO_MIDIS = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72];
export const DRUMS = ["Kick", "Snare", "Hat", "Open", "Tom", "Clap"] as const;

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BLACK = new Set([1, 3, 6, 8, 10]);

const ROOTS: Record<string, number> = {
  Open: 64,
  Em: 64,
  E: 64,
  E7: 64,
  Em7: 64,
  Esus4: 64,
  G: 67,
  G7: 67,
  G6: 67,
  C: 60,
  C7: 60,
  Cmaj7: 60,
  Cadd9: 60,
  D: 62,
  D7: 62,
  Dm: 62,
  Dm7: 62,
  Dmaj7: 62,
  Dsus4: 62,
  Dadd9: 62,
  A: 69,
  Am: 69,
  A7: 69,
  Am7: 69,
  Asus2: 69,
  Amaj7: 69,
  Asus4: 69,
  F: 65,
  Fmaj7: 65,
  B7: 71,
};

let noise: AudioBuffer | null = null;

function noiseBuffer(audio: AudioContext) {
  if (!noise || noise.sampleRate !== audio.sampleRate) {
    noise = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

function burst(audio: AudioContext, bus: GainNode, seconds: number, level: number, shape: (filter: BiquadFilterNode) => void) {
  const now = audio.currentTime;
  const source = audio.createBufferSource();
  source.buffer = noiseBuffer(audio);
  const filter = audio.createBiquadFilter();
  shape(filter);
  const gain = audio.createGain();
  gain.gain.setValueAtTime(level, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(bus);
  source.start(now);
  source.stop(now + seconds + 0.02);
}

export function noteLabel(midi: number) {
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}

export function isBlackKey(midi: number) {
  return BLACK.has(((midi % 12) + 12) % 12);
}

export function windMidis(chordName: string, instrument: "flute" | "trumpet") {
  const root = (ROOTS[chordName] ?? 64) + (instrument === "flute" ? 12 : 0);
  const minor = chordName.includes("m") && !chordName.includes("maj");
  const steps = minor ? [0, 2, 3, 5, 7, 8, 10, 12] : [0, 2, 4, 5, 7, 9, 11, 12];
  return steps.map((step) => root + step);
}

export function playPiano(freq: number) {
  const { audio, master } = withBus();
  const now = audio.currentTime;
  const decay = Math.min(1.7, Math.max(0.45, 1.5 * (220 / freq)));
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
  gain.connect(master);
  [1, 2, 3, 4].forEach((partial, index) => {
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * partial;
    const partialGain = audio.createGain();
    partialGain.gain.value = [1, 0.35, 0.16, 0.07][index];
    osc.connect(partialGain);
    partialGain.connect(gain);
    osc.start(now);
    osc.stop(now + decay + 0.02);
  });
}

export function playFlute(freq: number) {
  const { audio, master } = withBus();
  const now = audio.currentTime;
  const dur = 0.85;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  gain.connect(master);
  const fundamental = audio.createOscillator();
  fundamental.type = "sine";
  fundamental.frequency.value = freq;
  const overtone = audio.createOscillator();
  overtone.type = "sine";
  overtone.frequency.value = freq * 2;
  const overtoneGain = audio.createGain();
  overtoneGain.gain.value = 0.18;
  fundamental.connect(gain);
  overtone.connect(overtoneGain);
  overtoneGain.connect(gain);
  fundamental.start(now);
  overtone.start(now);
  fundamental.stop(now + dur + 0.02);
  overtone.stop(now + dur + 0.02);
  burst(audio, master, dur, 0.015, (filter) => {
    filter.type = "highpass";
    filter.frequency.value = 1800;
  });
}

export function playTrumpet(freq: number) {
  const { audio, master } = withBus();
  const now = audio.currentTime;
  const dur = 0.6;
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 5;
  filter.frequency.setValueAtTime(380, now);
  filter.frequency.exponentialRampToValueAtTime(2200, now + 0.05);
  filter.frequency.exponentialRampToValueAtTime(640, now + dur);
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  const osc = audio.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = freq;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

export function playDrum(index: number) {
  const { audio, master } = withBus();
  const now = audio.currentTime;
  if (index === 0 || index === 4) {
    const osc = audio.createOscillator();
    osc.type = "sine";
    const start = index === 0 ? 150 : 110;
    const end = index === 0 ? 48 : 70;
    osc.frequency.setValueAtTime(start, now);
    osc.frequency.exponentialRampToValueAtTime(end, now + 0.12);
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (index === 0 ? 0.28 : 0.34));
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.4);
    return;
  }
  if (index === 1 || index === 5) {
    burst(audio, master, index === 1 ? 0.16 : 0.12, 0.28, (filter) => {
      filter.type = "bandpass";
      filter.frequency.value = index === 1 ? 1800 : 1200;
      filter.Q.value = 0.7;
    });
    if (index === 1) {
      const osc = audio.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = 190;
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 0.14);
    }
    return;
  }
  burst(audio, master, index === 2 ? 0.05 : 0.28, index === 2 ? 0.18 : 0.14, (filter) => {
    filter.type = "highpass";
    filter.frequency.value = index === 2 ? 7000 : 5000;
  });
}