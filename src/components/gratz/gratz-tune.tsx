import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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

export function GratzTune() {
  const [phase, setPhase] = useState<Phase>("walk");
  const [reference, setReference] = useState<ReferenceHz>(432);
  const [armed, setArmed] = useState<number | null>(null);
  const [pings, setPings] = useState([0, 0, 0, 0, 0, 0]);
  const [heard, setHeard] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [walkKey, setWalkKey] = useState(0);
  const stopRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = "Gratz-Tune";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setPhase("hole");
    return () => {
      document.title = previous;
      stopRef.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function playString(index: number) {
    pluck(stringFreq(STRING_MIDIS[index], reference));
    setArmed(index);
    setPings((current) => current.map((count, i) => (i === index ? count + 1 : count)));
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

  const active = armed ?? (heard != null ? nearestString(heard, reference) : null);
  const target = active == null ? null : stringFreq(STRING_MIDIS[active], reference);
  const cents = heard != null && target != null ? centsBetween(heard, target) : null;
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
        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
            <Link to="/" className="min-h-11 text-sm text-ivory">
              Desk
            </Link>
            <div className="text-center">
              <p className="text-xs tracking-seal text-brass uppercase">Gratz-Tune</p>
              <h1 className="font-serif text-2xl">The soundhole</h1>
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

          <div className="flex min-h-0 flex-1 items-center justify-center px-4">
            <div className="hole-open soundhole relative aspect-square h-full max-w-full overflow-hidden rounded-full border border-brass/50">
            <img src="/soundhole.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="string-row absolute inset-0 flex justify-evenly">
              {STRING_NAMES.map((name, index) => {
                const freq = stringFreq(STRING_MIDIS[index], reference);
                const hot = active === index;
                return (
                  <button
                    key={name + index}
                    type="button"
                    onClick={() => playString(index)}
                    className="group relative flex h-full w-8 flex-col items-center justify-between py-3"
                    aria-label={`Pluck ${name} at ${freq.toFixed(1)} hertz`}
                  >
                    <span className={`text-xs ${hot ? "text-brass" : "text-ivory"}`}>{name}</span>
                    <span
                      key={pings[index]}
                      className="string-ping string-line absolute w-px bg-ivory"
                      style={{ width: `${3.5 - index * 0.35}px`, opacity: hot ? 1 : 0.75 }}
                    />
                    <span className="num text-xs text-ivory/80">{freq.toFixed(0)}</span>
                  </button>
                );
              })}
            </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md shrink-0 px-4 pt-3 pb-4">
            <div className="flex gap-2">
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
            <div className="mt-3 rounded-slab border border-line bg-ink/70 px-4 py-3 backdrop-blur">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-serif text-xl">
                  {active == null || target == null
                    ? "Tap a string"
                    : `${STRING_NAMES[active]} · ${target.toFixed(2)} Hz`}
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
                {heard ? `${heard.toFixed(1)} Hz heard` : "Pluck a string, or listen to a real guitar."} Flat is left,
                sharp is right. Five cents is in tune.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => (listening ? stopListening() : void listen())}
                  className="min-h-11 flex-1 bg-brass text-sm text-ink"
                >
                  {listening ? "Stop listening" : "Listen"}
                </button>
                <button
                  type="button"
                  onClick={() => setArmed(null)}
                  className="min-h-11 border border-line px-3 text-sm text-ivory"
                >
                  Nearest
                </button>
              </div>
              {micError ? <p className="mt-2 text-xs text-brass">{micError}</p> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
