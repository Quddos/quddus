"use client";

import { Camera, CameraOff, Cpu, Loader2, Play, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type * as Ort from "onnxruntime-web";
import { canonicalize, decodePose, FPS, INPUT_DIM, WINDOW, type TrackerFrame } from "@/lib/qudmi/math";
import { buildFrame, calibrateWebcam, MOTIONS, presetState, webcamState, type Motion, type WebcamCalibration } from "@/lib/qudmi/rig";
import type { LiveState } from "./QudmiScene";

const QudmiScene = dynamic(() => import("./QudmiScene"), { ssr: false });

const MODEL_URL = process.env.NEXT_PUBLIC_QUDMI_MODEL_URL || "https://huggingface.co/quddusr/qudmi/resolve/main/qudmi_v0.onnx";
const POSE_MODEL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

// Loads an ES module from /public at runtime, outside the bundler.
const runtimeImport = (url: string) => new Function("u", "return import(u)")(url) as Promise<unknown>;

type Landmark = { x: number; y: number; z: number; visibility?: number };
type PoseLandmarker = { detectForVideo: (v: HTMLVideoElement, t: number) => { worldLandmarks: Landmark[][] }; close: () => void };

async function fetchWithProgress(url: string, onProgress: (p: number) => void) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Model download failed (${res.status})`);
  const total = Number(res.headers.get("content-length")) || 19_600_000;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress(Math.min(0.99, received / total));
  }
  const out = new Uint8Array(received);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

export function QudmiDemo() {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"preset" | "webcam">("preset");
  const [motion, setMotion] = useState<Motion>("Squat");
  const [stats, setStats] = useState({ ms: 0, hz: 0 });
  const [camState, setCamState] = useState<"off" | "starting" | "on" | "error">("off");
  const [calibrating, setCalibrating] = useState(false);

  const session = useRef<Ort.InferenceSession | null>(null);
  const ort = useRef<typeof Ort | null>(null);
  const live = useRef<LiveState>({ pose: null, trackers: null });
  const buffer = useRef<TrackerFrame[]>([]);
  const busy = useRef(false);
  const pointer = useRef<[number, number]>([0, 0]);
  const motionRef = useRef(motion);
  const modeRef = useRef(mode);
  const video = useRef<HTMLVideoElement>(null);
  const landmarker = useRef<PoseLandmarker | null>(null);
  const landmarks = useRef<Landmark[] | null>(null);
  const calibration = useRef<WebcamCalibration | null>(null);
  const timing = useRef({ total: 0, runs: 0, since: performance.now() });

  useEffect(() => {
    motionRef.current = motion;
  }, [motion]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const runtime = (await runtimeImport("/vendor/ort/ort.wasm.min.mjs")) as typeof Ort;
      runtime.env.wasm.wasmPaths = "/vendor/ort/";
      runtime.env.wasm.numThreads = 1;
      ort.current = runtime;
      const override = new URLSearchParams(window.location.search).get("model");
      const bytes = await fetchWithProgress(override?.startsWith("/") ? override : MODEL_URL, setProgress);
      session.current = await runtime.InferenceSession.create(bytes, { executionProviders: ["wasm"] });
      setProgress(1);
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setError((e as Error).message || "Couldn't load the model.");
      setStatus("error");
    }
  }, []);

  // 30 Hz loop: sample trackers, keep a 40-frame window, run the model.
  useEffect(() => {
    if (status !== "ready") return;
    const start = performance.now();
    const id = window.setInterval(async () => {
      const t = (performance.now() - start) / 1000;
      let frame: TrackerFrame | null = null;
      if (modeRef.current === "webcam") {
        const lm = landmarks.current;
        if (lm && calibration.current) frame = buildFrame(webcamState(lm, calibration.current));
      } else {
        frame = buildFrame(presetState(motionRef.current, t, pointer.current));
      }
      if (!frame) return;
      const buf = buffer.current;
      buf.push(frame);
      if (buf.length > WINDOW) buf.shift();
      live.current.trackers = frame;
      if (buf.length < WINDOW || busy.current || !session.current || !ort.current) return;
      busy.current = true;
      try {
        const input = new ort.current.Tensor("float32", canonicalize(buf), [1, WINDOW, INPUT_DIM]);
        const t0 = performance.now();
        const result = await session.current.run({ [session.current.inputNames[0]]: input });
        const elapsed = performance.now() - t0;
        const out = result[session.current.outputNames[0]].data as Float32Array;
        live.current.pose = decodePose(out, buf[buf.length - 1].rot[0]);
        const tm = timing.current;
        tm.total += elapsed;
        tm.runs += 1;
        if (performance.now() - tm.since > 1000) {
          setStats({ ms: tm.total / tm.runs, hz: (tm.runs * 1000) / (performance.now() - tm.since) });
          timing.current = { total: 0, runs: 0, since: performance.now() };
        }
      } finally {
        busy.current = false;
      }
    }, 1000 / FPS);
    return () => window.clearInterval(id);
  }, [status]);

  const stopCamera = useCallback(() => {
    const stream = video.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((tr) => tr.stop());
    if (video.current) video.current.srcObject = null;
    landmarker.current?.close();
    landmarker.current = null;
    landmarks.current = null;
    calibration.current = null;
    setCamState("off");
    setMode("preset");
    buffer.current = [];
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  async function startCamera() {
    setCamState("starting");
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
      const v = video.current!;
      v.srcObject = stream;
      await v.play();
      const vision = (await runtimeImport("/vendor/mediapipe/vision_bundle.mjs")) as {
        FilesetResolver: { forVisionTasks: (p: string) => Promise<unknown> };
        PoseLandmarker: { createFromOptions: (f: unknown, o: unknown) => Promise<PoseLandmarker> };
      };
      const files = await vision.FilesetResolver.forVisionTasks("/vendor/mediapipe/wasm");
      landmarker.current = await vision.PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: POSE_MODEL, delegate: "GPU" },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      buffer.current = [];
      setMode("webcam");
      setCamState("on");
      setCalibrating(true);
      let lastTs = -1;
      const tick = () => {
        if (!landmarker.current || !v.srcObject) return;
        const ts = performance.now();
        if (v.readyState >= 2 && ts !== lastTs) {
          lastTs = ts;
          const res = landmarker.current.detectForVideo(v, ts);
          const lm = res.worldLandmarks?.[0];
          if (lm) {
            // Light smoothing against landmark jitter.
            const prev = landmarks.current;
            landmarks.current = prev ? lm.map((p, i) => ({ x: prev[i].x * 0.4 + p.x * 0.6, y: prev[i].y * 0.4 + p.y * 0.6, z: prev[i].z * 0.4 + p.z * 0.6 })) : lm;
          }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      window.setTimeout(() => recalibrate(), 2500);
    } catch (e) {
      console.error(e);
      stopCamera();
      setCamState("error");
      setError((e as Error).name === "NotAllowedError" ? "Camera permission was denied." : "Couldn't start the webcam pose tracker.");
    }
  }

  function recalibrate() {
    if (landmarks.current) {
      calibration.current = calibrateWebcam(landmarks.current);
      buffer.current = [];
    }
    setCalibrating(false);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-[radial-gradient(70%_60%_at_50%_40%,rgba(62,230,193,0.08),transparent_70%),#05070c] lg:aspect-auto lg:h-[620px]"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          pointer.current = [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)];
        }}
      >
        {status === "ready" && <QudmiScene live={live} />}
        {status !== "ready" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            {status === "loading" ? (
              <div className="w-64">
                <div className="mono-label mb-3 flex justify-between">
                  <span>Loading QUDMI v0</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-gradient-to-r from-cyan to-violet transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
                <p className="mt-3 text-xs text-dim">19.6 MB, downloaded once and run on your device</p>
              </div>
            ) : (
              <div>
                <p className="font-display text-2xl font-semibold">Three trackers in. A whole body out.</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted">The model runs entirely in your browser. Nothing is uploaded.</p>
                {error && <p className="mt-3 text-sm text-danger">{error}</p>}
                <button onClick={load} className="mt-6 inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3 font-medium text-bg transition hover:bg-cyan">
                  <Play className="h-4 w-4" /> {status === "error" ? "Try again" : "Load the model"}
                </button>
              </div>
            )}
          </div>
        )}
        {status === "ready" && (
          <>
            <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2 font-mono text-[11px]">
              <span className="glass rounded-full px-3 py-1">
                <span className="text-amber">◆</span> tracked: head + hands
              </span>
              <span className="glass rounded-full px-3 py-1">
                <span className="text-cyan">●</span> predicted upper body
              </span>
              <span className="glass rounded-full px-3 py-1">
                <span className="text-violet">●</span> inferred legs
              </span>
            </div>
            <div className="pointer-events-none absolute bottom-4 left-4 font-mono text-[11px] text-muted">
              {stats.ms ? `${stats.ms.toFixed(1)} ms / inference · ${stats.hz.toFixed(0)} Hz · on-device` : "warming up…"}
            </div>
            {mode === "preset" && motion === "Follow mouse" && (
              <div className="mono-label pointer-events-none absolute bottom-4 right-4">Move your mouse over the scene</div>
            )}
          </>
        )}
        <video ref={video} playsInline muted className={`absolute bottom-4 right-4 w-40 -scale-x-100 rounded-xl border border-line ${camState === "on" ? "" : "hidden"}`} />
        {calibrating && camState === "on" && (
          <div className="glass absolute inset-x-4 top-14 mx-auto max-w-sm rounded-2xl p-4 text-center text-sm">
            Stand back so your head, shoulders and hands are visible, face the camera and keep still…
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-line bg-bg-2 p-5">
          <div className="mono-label mb-3">Input source</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (camState === "on") stopCamera();
                setMode("preset");
                buffer.current = [];
              }}
              className={`rounded-xl border px-3 py-2.5 text-sm transition ${mode === "preset" ? "border-cyan bg-cyan/10" : "border-line text-muted hover:text-fg"}`}
            >
              Preset motions
            </button>
            <button
              disabled={status !== "ready" || camState === "starting"}
              onClick={() => (camState === "on" ? stopCamera() : startCamera())}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition disabled:opacity-40 ${mode === "webcam" ? "border-cyan bg-cyan/10" : "border-line text-muted hover:text-fg"}`}
            >
              {camState === "starting" ? <Loader2 className="h-4 w-4 animate-spin" /> : camState === "on" ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              {camState === "on" ? "Stop webcam" : "Webcam"}
            </button>
          </div>
          {mode === "preset" ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {MOTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMotion(m)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${motion === m ? "border-fg bg-fg text-bg" : "border-line text-muted hover:text-fg"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          ) : (
            <button onClick={recalibrate} className="admin-btn mt-4 w-full justify-center">
              <RotateCcw className="h-4 w-4" /> Recalibrate (stand straight, face camera)
            </button>
          )}
          <p className="mt-4 text-xs leading-relaxed text-dim">
            {mode === "preset"
              ? "Presets move only the head and hands. Watch the legs: in Squat, the model infers the knees bending purely from the head dropping."
              : "MediaPipe estimates your head and wrists from the webcam; QUDMI then predicts your full body from just those three points, as if you wore a VR headset."}
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-bg-2 p-5">
          <div className="mono-label mb-3 flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5" /> Model
          </div>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            {[
              ["Input", "40 × 36"],
              ["Output", "22 joints"],
              ["Parameters", "4.8 M"],
              ["Test MPJPE", "94 mm"],
              ["Runtime", "ONNX · WASM"],
              ["Rate", "30 Hz"],
            ].map(([k, val]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-mono">{val}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
