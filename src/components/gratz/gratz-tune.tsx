import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  STRING_MIDIS,
  STRING_NAMES,
  centsBetween,
  detectPitch,
  nearestString,
  stringFreq,
  type ReferenceHz,
} from "@/lib/gratz/pitch";
import { pluck } from "@/lib/gratz/pluck";

type Phase = "walk" | "hole";
type Mode = "guitar" | "tuner";

const CHORDS: { name: string; frets: number[] }[] = [
  { name: "Open", frets: [0, 0, 0, 0, 0, 0] },
  { name: "Em", frets: [0, 2, 2, 0, 0, 0] },
  { name: "G", frets: [3, 2, 0, 0, 0, 3] },
  { name: "C", frets: [-1, 3, 2, 0, 1, 0] },
  { name: "D", frets: [-1, -1, 0, 2, 3, 2] },
  { name: "Am", frets: [-1, 0, 2, 2, 1, 0] },
];

export function GratzTune() {
  const [phase, setPhase] = useState<Phase>("walk");
  const [mode, setMode] = useState<Mode>("guitar");
  const [reference, setReference] = useState<ReferenceHz>(432);
  const [chord, setChord] = useState(0);
  const [armed, setArmed] = useState<number | null>(null);
  const [pings, setPings] = useState([0, 0, 0, 0, 0, 0]);
  const [heard, setHeard] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [walkKey, setWalkKey] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const stopRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const lastStrum = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const modeRef = useRef(mode);
  const chordRef = useRef(chord);
  const referenceRef = useRef(reference);
  modeRef.current = mode;
  chordRef.current = chord;
  referenceRef.current = reference;

  useEffect(() => {
    const previous = document.title;
    document.title = "Gratz-Tune";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setPhase("hole");
    return () => {
      document.title = previous;
      stopRef.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      timers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function sound(index: number, level: number) {
    const fret = modeRef.current === "guitar" ? CHORDS[chordRef.current].frets[index] : 0;
    if (fret < 0) return;
    pluck(stringFreq(STRING_MIDIS[index] + fret, referenceRef.current), level);
    setArmed(index);
    setPings((current) => current.map((count, i) => (i === index ? count + 1 : count)));
  }

  function cross(clientX: number) {
    const row = rowRef.current;
    if (!row) return;
    const rect = row.getBoundingClientRect();
    const style = getComputedStyle(row);
    const padLeft = Number.parseFloat(style.paddingLeft) || 0;
    const padRight = Number.parseFloat(style.paddingRight) || 0;
    const inner = rect.width - padLeft - padRight;
    if (inner <= 0) return;
    const ratio = (clientX - rect.left - padLeft) / inner;
    if (ratio < 0 || ratio > 1) return;
    setPick((padLeft + ratio * inner) / rect.width);
    const index = Math.min(5, Math.floor(ratio * 6));
    const previous = lastStrum.current;
    if (previous == null) {
      sound(index, 0.22);
    } else if (previous !== index) {
      const step = index > previous ? 1 : -1;
      for (let i = previous + step; i !== index + step; i += step) sound(i, 0.2);
    }
    lastStrum.current = index;
  }

  function beginStrum(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    lastStrum.current = null;
    cross(event.clientX);
  }

  function moveStrum(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    cross(event.clientX);
  }

  function endStrum() {
    lastStrum.current = null;
    setPick(null);
  }

  function sweep(direction: 1 | -1) {
    timers.current.forEach((id) => window.clearTimeout(id));
    const order = direction > 0 ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
    timers.current = order.map((index, step) => window.setTimeout(() => sound(index, 0.2), step * 46));
  }

  function useMode(next: Mode) {
    setMode(next);
    if (next === "guitar") stopListening();
  }

  async function listen() {
    setMicError(null);
    const session = ++stopRef.current;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      if (stopRef.current !== session) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const audio = new AudioContext();
      const source = audio.createMediaStreamSource(stream);
      const analyser = audio.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      setListening(true);
      let frame = 0;
      const tick = () => {
        if (stopRef.current !== session) {
          stream.getTracks().forEach((track) => track.stop());
          void audio.close();
          setListening(false);
          return;
        }
        frame += 1;
        if (frame % 3 === 0) {
          analyser.getFloatTimeDomainData(buf);
          setHeard(detectPitch(buf, audio.sampleRate));
        }
        window.requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setMicError("The microphone stayed shut. You can still pluck the strings.");
      setListening(false);
    }
  }

  function stopListening() {
    stopRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }

  const frets = CHORDS[chord].frets;
  const active = mode === "tuner" ? (armed ?? (heard != null ? nearestString(heard, reference) : null)) : armed;
  const target =
    active == null ? null : stringFreq(STRING_MIDIS[active] + (mode === "guitar" ? Math.max(0, frets[active]) : 0), reference);
  const cents = heard != null && target != null && mode === "tuner" ? centsBetween(heard, target) : null;
  const inTune = cents != null && Math.abs(cents) <= 5;

  return (
    <div className="fixed inset-0 z-10 overflow-hidden bg-ink text-ivory">
      <img src="/glade.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      {phase === "walk" ? (
        <div className="absolute inset-0 z-20">
          <video
            key={walkKey}
            src="/gratz-walk.mp4"
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            onEnded={() => setPhase("hole")}
            onError={() => setPhase("hole")}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink/80 to-transparent p-4">
            <p className="font-serif text-2xl">She is bringing the guitar.</p>
            <button type="button" onClick={() => setPhase("hole")} className="min-h-11 px-3 text-sm text-ivory">
              Skip
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 h-full">
          <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 py-3">
            <Link to="/" className="min-h-11 text-sm text-ivory">
              Desk
            </Link>
            <div className="text-center">
              <p className="text-xs tracking-seal text-brass uppercase">Gratz-Tune</p>
              <h1 className="font-serif text-2xl">{mode === "guitar" ? "Strum" : "Tune"}</h1>
            </div>
            <button
              type="button"
              onClick={() => {
                setWalkKey((n) => n + 1);
                setPhase("walk");
              }}
              className="min-h-11 text-sm text-ivory"
            >
              Again
            </button>
          </header>

          <div className="flex h-full items-center justify-center">
            <div className="hole-open soundhole relative aspect-square overflow-hidden rounded-full border border-brass/50">
              <img src="/soundhole.jpg" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
              <div
                ref={rowRef}
                className="string-row absolute inset-0 flex touch-none"
                onPointerDown={beginStrum}
                onPointerMove={moveStrum}
                onPointerUp={endStrum}
                onPointerCancel={endStrum}
              >
                {pick != null ? (
                  <span className="pointer-events-none absolute top-[8%] bottom-[8%] w-px bg-brass" style={{ left: `${pick * 100}%` }} />
                ) : null}
                {STRING_NAMES.map((name, index) => {
                  const fret = mode === "guitar" ? frets[index] : 0;
                  const freq = fret < 0 ? null : stringFreq(STRING_MIDIS[index] + fret, reference);
                  const hot = active === index;
                  return (
                    <button
                      key={name + index}
                      type="button"
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        sound(index, 0.3);
                      }}
                      className="relative flex h-full min-h-11 flex-1 flex-col items-center pt-16"
                      aria-label={freq == null ? `${name} muted` : `Play ${name} at ${freq.toFixed(1)} hertz`}
                    >
                      <span className={`text-xs ${hot ? "text-brass" : "text-ivory"}`}>{name}</span>
                      <span className="num text-xs text-ivory/80">{freq == null ? "×" : freq.toFixed(1)}</span>
                      <span
                        key={pings[index]}
                        className="string-ping string-line absolute bg-ivory"
                        style={{ width: `${3.6 - index * 0.38}px`, opacity: fret < 0 ? 0.25 : hot ? 1 : 0.8 }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-4 pt-3 pb-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => useMode("guitar")}
                className={`min-h-11 flex-1 text-sm ${mode === "guitar" ? "bg-brass text-ink" : "border border-line text-ivory"}`}
              >
                Guitar
              </button>
              <button
                type="button"
                onClick={() => useMode("tuner")}
                className={`min-h-11 flex-1 text-sm ${mode === "tuner" ? "bg-brass text-ink" : "border border-line text-ivory"}`}
              >
                Tuner
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              {([432, 428] as const).map((hz) => (
                <button
                  key={hz}
                  type="button"
                  onClick={() => setReference(hz)}
                  className={`min-h-11 flex-1 text-sm ${reference === hz ? "bg-brass text-ink" : "border border-line text-ivory"}`}
                >
                  A at {hz}
                </button>
              ))}
            </div>
            {mode === "guitar" ? (
              <div className="mt-3 rounded-slab border border-line bg-ink/70 px-4 py-3 backdrop-blur">
                <p className="font-serif text-xl">{CHORDS[chord].name}</p>
                <p className="mt-1 text-xs text-muted">Drag across the hole. Muted strings stay quiet.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CHORDS.map((item, index) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setChord(index)}
                      className={`min-h-11 px-3 text-sm ${chord === index ? "bg-brass text-ink" : "border border-line text-ivory"}`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => sweep(1)} className="min-h-11 flex-1 bg-brass text-sm text-ink">
                    Strum down
                  </button>
                  <button type="button" onClick={() => sweep(-1)} className="min-h-11 flex-1 border border-line text-sm text-ivory">
                    Strum up
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-slab border border-line bg-ink/70 px-4 py-3 backdrop-blur">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-serif text-xl">
                    {active == null || target == null ? "Tap a string" : `${STRING_NAMES[active]} · ${target.toFixed(2)} Hz`}
                  </p>
                  <p className={`num text-sm ${inTune ? "text-ivory" : "text-brass"}`}>
                    {cents == null ? "Quiet" : inTune ? "In tune" : `${cents > 0 ? "+" : ""}${cents.toFixed(0)} cents`}
                  </p>
                </div>
                <div className="relative mt-3 h-2 rounded-full bg-raised">
                  <span className="absolute top-0 left-1/2 h-full w-px bg-ivory" />
                  {cents != null ? (
                    <span
                      className="absolute top-0 h-full w-1 bg-brass"
                      style={{ left: `${50 + (Math.max(-50, Math.min(50, cents)) / 50) * 46}%` }}
                    />
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-muted">
                  {heard ? `${heard.toFixed(1)} Hz heard` : "Open strings only. Listen with a real guitar."} Flat is left,
                  sharp is right.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => (listening ? stopListening() : void listen())}
                    className="min-h-11 flex-1 bg-brass text-sm text-ink"
                  >
                    {listening ? "Stop listening" : "Listen"}
                  </button>
                  <button type="button" onClick={() => setArmed(null)} className="min-h-11 border border-line px-3 text-sm text-ivory">
                    Nearest
                  </button>
                </div>
                {micError ? <p className="mt-2 text-xs text-brass">{micError}</p> : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}