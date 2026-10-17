// Turns "where are the head and hands" into QUDMI tracker frames, from either preset motions
// or webcam pose landmarks. Body coordinates are metres with x = the person's left,
// y = up from the floor and z = forward, origin under the pelvis.

import {
  add,
  apply,
  cross,
  dot,
  fromColumns,
  fromTo,
  HEAD,
  identity,
  L_WRIST,
  mul,
  normalize,
  R_WRIST,
  scale,
  standingPose,
  sub,
  TRACKER_REF,
  transpose,
  type Mat3,
  type TrackerFrame,
  type Vec3,
} from "./math";

const standing = standingPose();
const hipsLateral = sub(standing.positions[1], standing.positions[2]);
const LEFT = normalize([hipsLateral[0], 0, hipsLateral[2]]);
const UP: Vec3 = [0, 1, 0];
const FORWARD = cross(LEFT, UP);
const PELVIS_XZ: Vec3 = [standing.positions[0][0], 0, standing.positions[0][2]];

// Body frame -> canonical world frame.
export const BODY_TO_WORLD: Mat3 = fromColumns(LEFT, UP, FORWARD);
const WORLD_TO_BODY = transpose(BODY_TO_WORLD);
const toBody = (world: Vec3) => apply(WORLD_TO_BODY, sub(world, PELVIS_XZ));
const toWorld = (body: Vec3) => add(apply(BODY_TO_WORLD, body), PELVIS_XZ);

export const NEUTRAL = {
  head: toBody(standing.positions[HEAD]),
  lHand: toBody(standing.positions[L_WRIST]),
  rHand: toBody(standing.positions[R_WRIST]),
  lShoulder: toBody(standing.positions[16]),
  rShoulder: toBody(standing.positions[17]),
};

// Yaw that turns the canonical body to face +Z, for display.
export const DISPLAY_YAW = -Math.atan2(FORWARD[0], FORWARD[2]);

export type RigState = {
  head: Vec3;
  headRot: Mat3; // rotation of the head relative to looking straight ahead, body frame
  lHand: Vec3;
  rHand: Vec3;
  lShoulder?: Vec3;
  rShoulder?: Vec3;
};

// Hand orientation follows the shoulder-to-hand direction, relative to arms hanging down.
function handRotation(ref: Mat3, shoulder: Vec3, hand: Vec3, neutralShoulder: Vec3, neutralHand: Vec3) {
  const swing = fromTo(apply(BODY_TO_WORLD, sub(neutralHand, neutralShoulder)), apply(BODY_TO_WORLD, sub(hand, shoulder)));
  return mul(swing, ref);
}

export function buildFrame(s: RigState): TrackerFrame {
  const headWorld = mul(mul(BODY_TO_WORLD, s.headRot), WORLD_TO_BODY);
  return {
    pos: [toWorld(s.head), toWorld(s.lHand), toWorld(s.rHand)],
    rot: [
      mul(headWorld, TRACKER_REF[0]),
      handRotation(TRACKER_REF[1], s.lShoulder ?? NEUTRAL.lShoulder, s.lHand, NEUTRAL.lShoulder, NEUTRAL.lHand),
      handRotation(TRACKER_REF[2], s.rShoulder ?? NEUTRAL.rShoulder, s.rHand, NEUTRAL.rShoulder, NEUTRAL.rHand),
    ],
  };
}

// ---------- preset motions ----------

export const MOTIONS = ["Idle", "Wave", "Squat", "Reach", "Look around", "Jog in place", "Follow mouse"] as const;
export type Motion = (typeof MOTIONS)[number];

const euler = (yaw: number, pitch: number, roll = 0): Mat3 => {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
  const Ry: Mat3 = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
  const Rx: Mat3 = [1, 0, 0, 0, cp, -sp, 0, sp, cp];
  const Rz: Mat3 = [cr, -sr, 0, sr, cr, 0, 0, 0, 1];
  return mul(Ry, mul(Rx, Rz));
};

const v = (x: number, y: number, z: number): Vec3 => [x, y, z];

// Head and hand targets for a preset at time t (seconds). `pointer` is in [-1, 1].
export function presetState(motion: Motion, t: number, pointer: [number, number]): RigState {
  const N = NEUTRAL;
  const sway = Math.sin(t * 0.8) * 0.01;
  const base: RigState = { head: add(N.head, v(sway, Math.sin(t * 1.6) * 0.004, 0)), headRot: identity(), lHand: N.lHand, rHand: N.rHand };
  switch (motion) {
    case "Wave": {
      const w = Math.sin(t * 7);
      return { ...base, headRot: euler(-0.15, 0.05), rHand: add(N.rShoulder, v(-0.18 + w * 0.12, 0.42, 0.12)) };
    }
    case "Squat": {
      const d = (1 - Math.cos(t * 1.6)) / 2; // 0 standing -> 1 deep squat
      const drop = d * 0.48;
      const lerp = (a: Vec3, b: Vec3): Vec3 => add(scale(a, 1 - d), scale(b, d));
      const lShoulder = add(N.lShoulder, v(0, -drop, 0.08 * d));
      const rShoulder = add(N.rShoulder, v(0, -drop, 0.08 * d));
      return {
        ...base,
        head: add(N.head, v(0, -drop, 0.08 * d)),
        headRot: euler(0, 0.15 * d),
        // Arms hang at rest and come forward for balance as the squat deepens.
        lHand: lerp(N.lHand, add(lShoulder, v(-0.02, -0.12, 0.45))),
        rHand: lerp(N.rHand, add(rShoulder, v(0.02, -0.12, 0.45))),
        lShoulder,
        rShoulder,
      };
    }
    case "Reach": {
      const a = (Math.sin(t * 1.4) + 1) / 2;
      const b = 1 - a;
      return {
        ...base,
        head: add(N.head, v(0, 0.02 * (a + b), 0.04)),
        headRot: euler(0.25 * (a - b), -0.2),
        lHand: add(N.lShoulder, v(0.1 * a, -0.55 + 0.95 * a, 0.45 * a)),
        rHand: add(N.rShoulder, v(-0.1 * b, -0.55 + 0.95 * b, 0.45 * b)),
      };
    }
    case "Look around":
      return { ...base, headRot: euler(Math.sin(t * 0.9) * 0.9, Math.sin(t * 1.3) * 0.35, Math.sin(t * 0.7) * 0.1) };
    case "Jog in place": {
      const s = Math.sin(t * 9);
      return {
        ...base,
        head: add(N.head, v(0, Math.abs(Math.sin(t * 9)) * 0.05, 0.02)),
        lHand: add(N.lShoulder, v(0.02, -0.3, 0.2 * s + 0.1)),
        rHand: add(N.rShoulder, v(-0.02, -0.3, -0.2 * s + 0.1)),
      };
    }
    case "Follow mouse": {
      const [px, py] = pointer;
      return { ...base, headRot: euler(-px * 0.5, -py * 0.3), rHand: add(N.rShoulder, v(-px * 0.55, py * 0.6, 0.35)) };
    }
    default:
      return base;
  }
}

// ---------- webcam (MediaPipe pose world landmarks) ----------

type Landmark = { x: number; y: number; z: number; visibility?: number };

const LM = { nose: 0, lEar: 7, rEar: 8, lShoulder: 11, rShoulder: 12, lWrist: 15, rWrist: 16, lHip: 23, rHip: 24 };

const lmVec = (l: Landmark): Vec3 => [l.x, l.y, l.z];
const mid = (a: Vec3, b: Vec3) => scale(add(a, b), 0.5);

export type WebcamCalibration = { headRot0: Mat3; scale: number };

// Expresses landmarks in body coordinates (independent of camera mirroring or handedness).
function bodyFrame(lm: Landmark[]) {
  const P = lm.map(lmVec);
  const origin = mid(P[LM.lHip], P[LM.rHip]);
  const up: Vec3 = [0, -1, 0]; // MediaPipe world y points down
  const lat = sub(P[LM.lShoulder], P[LM.rShoulder]);
  const left = normalize(sub(lat, scale(up, dot(lat, up))));
  let fwd = normalize(cross(left, up));
  const face = sub(P[LM.nose], mid(P[LM.lEar], P[LM.rEar]));
  if (dot(fwd, face) < 0) fwd = scale(fwd, -1);
  const to = (p: Vec3): Vec3 => {
    const d = sub(p, origin);
    return [dot(d, left), dot(d, up), dot(d, fwd)];
  };
  return { P, to };
}

function headRotation(lm: Landmark[], to: (p: Vec3) => Vec3): Mat3 {
  const P = lm.map(lmVec);
  const earMid = to(mid(P[LM.lEar], P[LM.rEar]));
  const lh = normalize(sub(to(P[LM.lEar]), to(P[LM.rEar])));
  const fh = normalize(sub(to(P[LM.nose]), earMid));
  const uh = normalize(cross(fh, lh));
  const f2 = normalize(cross(lh, uh));
  return fromColumns(lh, uh, f2);
}

export function calibrateWebcam(lm: Landmark[]): WebcamCalibration {
  const { P, to } = bodyFrame(lm);
  const headUp = to(mid(P[LM.lEar], P[LM.rEar]))[1];
  const pelvisToHead = NEUTRAL.head[1] - standing.positions[0][1];
  return { headRot0: headRotation(lm, to), scale: headUp > 0.1 ? pelvisToHead / headUp : 1 };
}

export function webcamState(lm: Landmark[], cal: WebcamCalibration): RigState {
  const { P, to } = bodyFrame(lm);
  const pelvisY = standing.positions[0][1];
  const place = (p: Vec3): Vec3 => {
    const b = scale(to(p), cal.scale);
    return [b[0], b[1] + pelvisY, b[2]];
  };
  return {
    head: place(mid(P[LM.lEar], P[LM.rEar])),
    headRot: mul(headRotation(lm, to), transpose(cal.headRot0)),
    lHand: place(P[LM.lWrist]),
    rHand: place(P[LM.rWrist]),
    lShoulder: place(P[LM.lShoulder]),
    rShoulder: place(P[LM.rShoulder]),
  };
}
