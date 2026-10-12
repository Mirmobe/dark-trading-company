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
import { pluck, armAudio, captureStream, tapMic } from "@/lib/gratz/pluck";
import {
  DRUMS,
  INSTRUMENTS,
  PIANO_MIDIS,
  isBlackKey,
  noteLabel,
  playDrum,
  playFlute,
  playPiano,
  playTrumpet,
  windMidis,
  type Instrument,
} from "@/lib/gratz/voices";
import { xIntent } from "@/lib/dtc/links";

type Phase = "walk" | "hole";
type Mode = "guitar" | "tuner";

const PAGE = 10;

const CHORDS: { name: string; frets: number[] }[] = [
  { name: "Open", frets: [0, 0, 0, 0, 0, 0] },
  { name: "Em", frets: [0, 2, 2, 0, 0, 0] },
  { name: "E", frets: [0, 2, 2, 1, 0, 0] },
  { name: "G", frets: [3, 2, 0, 0, 0, 3] },
  { name: "C", frets: [-1, 3, 2, 0, 1, 0] },
  { name: "D", frets: [-1, -1, 0, 2, 3, 2] },
  { name: "Am", frets: [-1, 0, 2, 2, 1, 0] },
  { name: "A", frets: [-1, 0, 2, 2, 2, 0] },
  { name: "Dm", frets: [-1, -1, 0, 2, 3, 1] },
  { name: "F", frets: [-1, -1, 3, 2, 1, 1] },
  { name: "Em7", frets: [0, 2, 2, 0, 3, 0] },
  { name: "E7", frets: [0, 2, 0, 1, 0, 0] },
  { name: "G7", frets: [3, 2, 0, 0, 0, 1] },
  { name: "C7", frets: [-1, 3, 2, 3, 1, 0] },
  { name: "D7", frets: [-1, -1, 0, 2, 1, 2] },
  { name: "A7", frets: [-1, 0, 2, 0, 2, 0] },
  { name: "Am7", frets: [-1, 0, 2, 0, 1, 0] },
  { name: "Dm7", frets: [-1, -1, 0, 2, 1, 1] },
  { name: "B7", frets: [-1, 2, 1, 2, 0, 2] },
  { name: "Asus2", frets: [-1, 0, 2, 2, 0, 0] },
  { name: "Cmaj7", frets: [-1, 3, 2, 0, 0, 0] },
  { name: "Dmaj7", frets: [-1, -1, 0, 2, 2, 2] },
  { name: "Amaj7", frets: [-1, 0, 2, 1, 2, 0] },
  { name: "Fmaj7", frets: [-1, -1, 3, 2, 1, 0] },
  { name: "Esus4", frets: [0, 2, 2, 2, 0, 0] },
  { name: "Asus4", frets: [-1, 0, 2, 2, 3, 0] },
  { name: "Dsus4", frets: [-1, -1, 0, 2, 3, 3] },
  { name: "G6", frets: [3, 2, 0, 0, 0, 0] },
  { name: "Cadd9", frets: [-1, 3, 2, 0, 3, 0] },
  { name: "Dadd9", frets: [-1, -1, 0, 2, 3, 0] },
];

export function GratzTune() {
  const [phase, setPhase] = useState<Phase>("walk");
  const [mode, setMode] = useState<Mode>("guitar");
  const [instrument, setInstrument] = useState<Instrument>("guitar");
  const [reference, setReference] = useState<ReferenceHz>(432);
  const [chord, setChord] = useState(0);
  const [armed, setArmed] = useState<number | null>(null);
  const [pings, setPings] = useState([0, 0, 0, 0, 0, 0]);
  const [heard, setHeard] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [walkKey, setWalkKey] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [take, setTake] = useState<Blob | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const stopRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const lastStrum = useRef<number | null>(null);
  const timers = useRef<number[]>([]);
  const modeRef = useRef(mode);
  const instrumentRef = useRef(instrument);
  const chordRef = useRef(chord);
  const referenceRef = useRef(reference);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recordingRef = useRef(false);
  const micTap = useRef<(() => void) | null>(null);
  const dragX = useRef<number | null>(null);
  const swiped = useRef(false);
  modeRef.current = mode;
  instrumentRef.current = instrument;
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
      micTap.current?.();
      recRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  function lanes() {
    if (modeRef.current === "tuner" || instrumentRef.current === "guitar" || instrumentRef.current === "drums") return 6;
    if (instrumentRef.current === "piano") return PIANO_MIDIS.length;
    return 8;
  }

  function sound(index: number, level: number) {
    const inst = instrumentRef.current;
    const tuning = referenceRef.current;
    if (modeRef.current === "tuner" || inst === "guitar") {
      const fret = modeRef.current === "guitar" ? CHORDS[chordRef.current].frets[index] : 0;
      if (fret < 0) return;
      pluck(stringFreq(STRING_MIDIS[index] + fret, tuning), level);
    } else if (inst === "drums") {
      playDrum(index);
    } else if (inst === "piano") {
      playPiano(stringFreq(PIANO_MIDIS[index], tuning));
    } else {
      const midi = windMidis(CHORDS[chordRef.current].name, inst)[index];
      const freq = stringFreq(midi, tuning);
      if (inst === "flute") playFlute(freq);
      else playTrumpet(freq);
    }
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
    const index = Math.min(lanes() - 1, Math.floor(ratio * lanes()));
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
    if (modeRef.current === "guitar" && instrumentRef.current === "drums") {
      const pattern = direction > 0 ? [0, 2, 1, 2, 0, 2, 1, 4] : [5, 3, 1, 4, 0, 2];
      timers.current = pattern.map((index, step) => window.setTimeout(() => sound(index, 0.2), step * 120));
      return;
    }
    if (modeRef.current === "guitar" && instrumentRef.current === "piano" && direction > 0) {
      const midis = CHORDS[chordRef.current].frets.flatMap((fret, index) =>
        fret < 0 ? [] : [STRING_MIDIS[index] + fret + 12],
      );
      timers.current = midis.map(
        (midi, step) => window.setTimeout(() => playPiano(stringFreq(midi, referenceRef.current)), step * 80),
      );
      return;
    }
    const count = lanes();
    const order = Array.from({ length: count }, (_, index) => (direction > 0 ? index : count - 1 - index));
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
      if (recordingRef.current) {
        micTap.current?.();
        micTap.current = tapMic(stream);
      }
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
    micTap.current?.();
    micTap.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setListening(false);
  }

  function shiftPage(direction: number) {
    const pages = Math.ceil(CHORDS.length / PAGE);
    setPage((current) => (current + direction + pages) % pages);
  }

  function startRecording() {
    armAudio();
    const stream = captureStream();
    if (streamRef.current) {
      micTap.current?.();
      micTap.current = tapMic(streamRef.current);
    }
    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch {
      setShareNote("This browser cannot record audio.");
      return;
    }
    chunks.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.current.push(event.data);
    };
    recorder.onstop = () => {
      setTake(new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" }));
      setRecording(false);
      recordingRef.current = false;
    };
    recorder.start();
    recRef.current = recorder;
    recordingRef.current = true;
    setSeconds(0);
    setTake(null);
    setShareNote(null);
    setRecording(true);
  }

  function stopRecording() {
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
  }

  function takeFile() {
    if (!take) return null;
    const ext = take.type.includes("mp4") ? "m4a" : "webm";
    return new File([take], `gratz-tune.${ext}`, { type: take.type || "audio/webm" });
  }

  function saveLocal() {
    const file = takeFile();
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
    setShareNote("Saved on this device.");
  }

  async function shareOnX() {
    const file = takeFile();
    if (!file) return;
    const text = `A ${instrument} take from Gratz-Tune. ${CHORDS[chord].name}, A at ${reference} Hz.\n#GratzTune #DarkTradingCompany`;
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text, title: "Gratz-Tune" });
        return;
      } catch {
        return;
      }
    }
    saveLocal();
    window.open(xIntent(text), "_blank", "noopener,noreferrer");
    setShareNote("X cannot take the file from the browser. It is saved — attach it to the post.");
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
        <div className="relative z-10 flex h-full flex-col">
          <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
            <Link to="/" className="min-h-11 text-sm text-ivory">
              Desk
            </Link>
            <div className="text-center">
              <p className="text-xs tracking-seal text-brass uppercase">Gratz-Tune</p>
              <h1 className="font-serif text-2xl">
                {mode === "tuner" ? "Tune" : instrument === "piano" ? "Keys" : instrument === "drums" ? "Kit" : instrument === "flute" ? "Flute" : instrument === "trumpet" ? "Horn" : "Strum"}
              </h1>
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

          <div className="hole-fit px-4">
            <div className="hole-open soundhole relative aspect-square overflow-hidden rounded-full border border-brass/50">
              <img src="/soundhole.jpg" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
              {mode === "tuner" || instrument === "guitar" ? (
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
              ) : instrument === "drums" ? (
                <div className="absolute inset-[16%] grid grid-cols-3 gap-3">
                  {DRUMS.map((name, index) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => sound(index, 0.3)}
                      onPointerEnter={(event) => {
                        if (event.buttons === 1) sound(index, 0.3);
                      }}
                      className={`rounded-full border text-sm ${active === index ? "bg-brass text-ink" : "border-ivory/40 bg-ink/55 text-ivory"}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  ref={rowRef}
                  className="absolute inset-[10%] flex touch-none overflow-hidden rounded-slab"
                  onPointerDown={beginStrum}
                  onPointerMove={moveStrum}
                  onPointerUp={endStrum}
                  onPointerCancel={endStrum}
                >
                  {(instrument === "piano" ? PIANO_MIDIS : windMidis(CHORDS[chord].name, instrument)).map((midi, index) => {
                    const black = instrument === "piano" && isBlackKey(midi);
                    return (
                      <button
                        key={`${midi}-${index}`}
                        type="button"
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault();
                          sound(index, 0.3);
                        }}
                        className={`relative min-h-11 flex-1 text-xs ${black ? "self-start bg-ink/85 text-ivory" : "bg-ivory/80 text-ink"}`}
                        style={black ? { height: "62%" } : undefined}
                        aria-label={`Play ${noteLabel(midi)}`}
                      >
                        <span className="mt-4 block">{noteLabel(midi)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 px-3 pt-2 pb-4">
            <div className="mx-auto grid w-full max-w-3xl grid-cols-5 gap-2">
              {INSTRUMENTS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setInstrument(id);
                    useMode("guitar");
                  }}
                  className={`min-h-11 text-sm capitalize ${mode === "guitar" && instrument === id ? "bg-brass text-ink" : "border border-line text-ivory"}`}
                >
                  {id}
                </button>
              ))}
            </div>
            <div className="mx-auto mt-2 flex w-full max-w-3xl gap-2">
              <button
                type="button"
                onClick={() => useMode("tuner")}
                className={`min-h-11 flex-1 text-sm ${mode === "tuner" ? "bg-brass text-ink" : "border border-line text-ivory"}`}
              >
                Tuner
              </button>
              <button
                type="button"
                onClick={() => (recording ? stopRecording() : startRecording())}
                className={`min-h-11 flex-1 text-sm ${recording ? "bg-ivory text-ink" : "bg-brass text-ink"}`}
              >
                {recording ? `Stop ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : "Record"}
              </button>
            </div>
            <div className="mx-auto mt-2 flex w-full max-w-3xl gap-2">
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
              <button
                type="button"
                onClick={saveLocal}
                disabled={!take || recording}
                className="min-h-11 flex-1 border border-line text-sm text-ivory disabled:opacity-40"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => void shareOnX()}
                disabled={!take || recording}
                className="min-h-11 flex-1 border border-line text-sm text-ivory disabled:opacity-40"
              >
                Post on X
              </button>
            </div>
            {shareNote ? <p className="mx-auto mt-2 max-w-3xl text-xs text-brass">{shareNote}</p> : null}
            {mode === "guitar" ? (
              <div
                className="mx-auto mt-3 w-full max-w-3xl rounded-slab border border-line bg-ink/70 px-3 py-3 backdrop-blur"
                onPointerDown={(event) => {
                  dragX.current = event.clientX;
                  swiped.current = false;
                }}
                onPointerUp={(event) => {
                  if (dragX.current == null) return;
                  const delta = event.clientX - dragX.current;
                  dragX.current = null;
                  if (Math.abs(delta) < 48) return;
                  swiped.current = true;
                  shiftPage(delta < 0 ? 1 : -1);
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-serif text-xl">{CHORDS[chord].name}</p>
                  <p className="text-xs text-muted">
                    {page * PAGE + 1}–{Math.min(CHORDS.length, page * PAGE + PAGE)} of {CHORDS.length}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {instrument === "drums" ? (
                    <p className="min-h-11 flex-1 text-sm text-muted">Tap a pad, or drag across the kit.</p>
                  ) : (
                  <>
                  <button type="button" onClick={() => shiftPage(-1)} className="min-h-11 min-w-11 border border-line text-ivory" aria-label="Earlier chords">
                    ‹
                  </button>
                  <div className="grid flex-1 grid-cols-5 gap-2">
                    {CHORDS.slice(page * PAGE, page * PAGE + PAGE).map((item, offset) => {
                      const index = page * PAGE + offset;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            if (swiped.current) {
                              swiped.current = false;
                              return;
                            }
                            setChord(index);
                          }}
                          className={`min-h-11 px-1 text-sm ${chord === index ? "bg-brass text-ink" : "border border-line text-ivory"}`}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => shiftPage(1)} className="min-h-11 min-w-11 border border-line text-ivory" aria-label="Later chords">
                    ›
                  </button>
                  </>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => sweep(1)} className="min-h-11 flex-1 bg-brass text-sm text-ink">
                    {instrument === "drums" ? "Groove" : instrument === "piano" ? "Chord" : instrument === "guitar" ? "Strum down" : "Run up"}
                  </button>
                  <button type="button" onClick={() => sweep(-1)} className="min-h-11 flex-1 border border-line text-sm text-ivory">
                    {instrument === "drums" ? "Fill" : instrument === "piano" ? "Gliss" : instrument === "guitar" ? "Strum up" : "Run down"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mx-auto mt-3 w-full max-w-3xl rounded-slab border border-line bg-ink/70 px-4 py-3 backdrop-blur">
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