let ctx: AudioContext | null = null;

function context() {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function pluck(freq: number, level = 0.32) {
  const audio = context();
  void audio.resume();
  const duration = 2.2;
  const rate = audio.sampleRate;
  const length = Math.floor(rate * duration);
  const buffer = audio.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  const period = Math.max(2, Math.round(rate / freq));
  for (let i = 0; i < period; i++) data[i] = Math.random() * 2 - 1;
  for (let i = period; i < length; i++) {
    data[i] = (data[i - period] + data[i - period + 1]) * 0.496;
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(level, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  source.connect(gain);
  gain.connect(audio.destination);
  source.start();
}
