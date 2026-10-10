export const STRING_MIDIS = [40, 45, 50, 55, 59, 64] as const;

export const STRING_NAMES = ["E", "A", "D", "G", "B", "e"] as const;

export type ReferenceHz = 432 | 428;

export function stringFreq(midi: number, reference: ReferenceHz) {
  return reference * 2 ** ((midi - 69) / 12);
}

export function centsBetween(heard: number, target: number) {
  return 1200 * Math.log2(heard / target);
}

export function nearestString(heard: number, reference: ReferenceHz) {
  let index = 0;
  let best = Infinity;
  for (let i = 0; i < STRING_MIDIS.length; i++) {
    const delta = Math.abs(centsBetween(heard, stringFreq(STRING_MIDIS[i], reference)));
    if (delta < best) {
      best = delta;
      index = i;
    }
  }
  return index;
}

export function detectPitch(buf: Float32Array, sampleRate: number) {
  let energy = 0;
  for (let i = 0; i < buf.length; i++) energy += buf[i] * buf[i];
  if (energy / buf.length < 0.0004) return null;

  const half = Math.floor(buf.length / 2);
  const minLag = Math.floor(sampleRate / 520);
  const maxLag = Math.min(half - 2, Math.floor(sampleRate / 60));
  const yin = new Float32Array(maxLag + 1);
  const window = buf.length - maxLag;
  for (let tau = 1; tau <= maxLag; tau++) {
    let sum = 0;
    for (let i = 0; i < window; i++) {
      const delta = buf[i] - buf[i + tau];
      sum += delta * delta;
    }
    yin[tau] = sum;
  }

  let running = 0;
  yin[0] = 1;
  for (let tau = 1; tau <= maxLag; tau++) {
    running += yin[tau];
    yin[tau] = running === 0 ? 1 : (yin[tau] * tau) / running;
  }

  let tau = minLag;
  while (tau < maxLag && yin[tau] > 0.15) tau++;
  if (tau >= maxLag || yin[tau] > 0.15) return null;
  while (tau + 1 < maxLag && yin[tau + 1] < yin[tau]) tau++;

  const earlier = yin[tau - 1];
  const here = yin[tau];
  const later = yin[tau + 1];
  const denom = 2 * here - later - earlier;
  const shift = denom === 0 ? 0 : (later - earlier) / (2 * denom);
  const lag = tau + shift;
  if (lag <= 0) return null;
  return sampleRate / lag;
}
