import { outputs } from "@/lib/gratz/pluck";

let proc: ScriptProcessorNode | null = null;
let chunks: Float32Array[] = [];
let capturing = false;
let loopBuffer: AudioBuffer | null = null;
let loopSource: AudioBufferSourceNode | null = null;
let loopGain: GainNode | null = null;
let scratchSource: AudioBufferSourceNode | null = null;
let playhead = 0;
let loopStartedAt = 0;
let loopOffset = 0;
let lastGrain = 0;
let zipBuffer: AudioBuffer | null = null;

function tap() {
  const { audio, master } = outputs();
  if (!proc) {
    proc = audio.createScriptProcessor(4096, 1, 1);
    const mute = audio.createGain();
    mute.gain.value = 0;
    proc.onaudioprocess = (event) => {
      if (!capturing) return;
      chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };
    master.connect(proc);
    proc.connect(mute);
    mute.connect(audio.destination);
  }
  return audio;
}

function monitor(node: AudioNode, audio: AudioContext) {
  const { capture } = outputs();
  const gain = audio.createGain();
  gain.gain.value = 0.9;
  node.connect(gain);
  gain.connect(audio.destination);
  gain.connect(capture);
  return gain;
}

export function beginLoopCapture() {
  tap();
  stopLoop();
  chunks = [];
  capturing = true;
}

export function endLoopCapture() {
  capturing = false;
  const { audio } = outputs();
  const rate = audio.sampleRate;
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  if (length < rate * 0.2) {
    chunks = [];
    return 0;
  }
  const buffer = audio.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.length;
  }
  const fade = Math.min(Math.floor(rate * 0.012), Math.floor(length / 8));
  for (let i = 0; i < fade; i++) {
    const gain = i / fade;
    data[i] *= gain;
    data[length - 1 - i] *= gain;
  }
  loopBuffer = buffer;
  chunks = [];
  playhead = 0;
  return buffer.duration;
}

export function hasLoop() {
  return loopBuffer != null;
}

export function loopDuration() {
  return loopBuffer?.duration ?? 0;
}

export function isLooping() {
  return loopSource != null;
}

function heardPlayhead() {
  if (!loopBuffer) return 0;
  if (!loopSource) return playhead;
  const { audio } = outputs();
  const elapsed = audio.currentTime - loopStartedAt;
  const duration = loopBuffer.duration;
  return (((loopOffset + elapsed) % duration) + duration) % duration;
}

export function loopPlayhead() {
  return heardPlayhead();
}

export function startLoop(from = 0) {
  if (!loopBuffer) return;
  pauseLoop();
  const { audio } = outputs();
  const duration = loopBuffer.duration;
  const offset = ((from % duration) + duration) % duration;
  const source = audio.createBufferSource();
  source.buffer = loopBuffer;
  source.loop = true;
  loopGain = monitor(source, audio);
  source.start(audio.currentTime, offset);
  loopSource = source;
  loopStartedAt = audio.currentTime;
  loopOffset = offset;
  playhead = offset;
}

export function pauseLoop() {
  if (!loopSource) return;
  playhead = heardPlayhead();
  loopSource.onended = null;
  try {
    loopSource.stop();
  } catch {
    /* already stopped */
  }
  loopSource.disconnect();
  loopGain?.disconnect();
  loopSource = null;
  loopGain = null;
}

export function stopLoop() {
  pauseLoop();
  playhead = 0;
}

export function clearLoop() {
  stopLoop();
  loopBuffer = null;
  chunks = [];
  capturing = false;
}

function grain(at: number, rate: number) {
  if (!loopBuffer) return;
  const nowMs = performance.now();
  if (nowMs - lastGrain < 32) return;
  lastGrain = nowMs;
  const { audio } = outputs();
  if (scratchSource) {
    try {
      scratchSource.stop();
    } catch {
      /* already stopped */
    }
    scratchSource.disconnect();
  }
  const duration = loopBuffer.duration;
  const offset = Math.min(duration - 0.02, Math.max(0, at));
  const source = audio.createBufferSource();
  source.buffer = loopBuffer;
  source.playbackRate.value = Math.max(-6, Math.min(6, rate || 0.01));
  const gain = monitor(source, audio);
  source.onended = () => gain.disconnect();
  try {
    source.start(audio.currentTime, offset, 0.07);
  } catch {
    source.playbackRate.value = Math.abs(source.playbackRate.value);
    source.start(audio.currentTime, offset, 0.07);
  }
  scratchSource = source;
}

export function scratchBy(deltaSec: number) {
  if (!loopBuffer) {
    zip(deltaSec);
    return playhead;
  }
  const duration = loopBuffer.duration;
  playhead = (((playhead + deltaSec) % duration) + duration) % duration;
  const rate = deltaSec / 0.032;
  grain(playhead, rate);
  return playhead;
}

function zip(deltaSec: number) {
  const nowMs = performance.now();
  if (nowMs - lastGrain < 40) return;
  lastGrain = nowMs;
  const { audio } = outputs();
  if (!zipBuffer) {
    zipBuffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.08), audio.sampleRate);
    const data = zipBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const source = audio.createBufferSource();
  source.buffer = zipBuffer;
  source.playbackRate.value = Math.max(0.35, Math.min(3.2, Math.abs(deltaSec) * 12 + 0.4));
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  filter.Q.value = 0.7;
  source.connect(filter);
  monitor(filter, audio);
  source.start();
  playhead += deltaSec;
}