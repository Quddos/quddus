// QUDMI v0 math, ported from github.com/Quddos/qudmi (src/qudmi/data/*.py and the Unity
// runtime). Everything here is in the pipeline's right-handed, Y-up frame, which is also
// three.js's convention, so no handedness conversion is needed in the browser.
// Matrices are 3x3, row-major: m[r * 3 + c].

export type Vec3 = [number, number, number];
export type Mat3 = number[]; // length 9

export const WINDOW = 40;
export const FPS = 30;
export const NUM_JOINTS = 22;
export const INPUT_DIM = 36;
export const OUTPUT_DIM = 135;

export const JOINT_NAMES = [
  "pelvis", "L_hip", "R_hip", "spine1", "L_knee", "R_knee", "spine2", "L_ankle", "R_ankle", "spine3",
  "L_foot", "R_foot", "neck", "L_collar", "R_collar", "head", "L_shoulder", "R_shoulder", "L_elbow",
  "R_elbow", "L_wrist", "R_wrist",
];
export const PARENTS = [-1, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 12, 13, 14, 16, 17, 18, 19];
export const HEAD = 15;
export const L_WRIST = 20;
export const R_WRIST = 21;

// Approximate mean-shape SMPL rest joint locations (metres, template frame: Y-up, facing +Z).
// Only used to draw the skeleton; the model itself never sees them.
const REST: Vec3[] = [
  [0.0, -0.223, 0.028], [0.07, -0.314, 0.024], [-0.068, -0.315, 0.021], [-0.002, -0.104, 0.002],
  [0.103, -0.705, 0.019], [-0.105, -0.705, 0.015], [0.005, 0.026, 0.028], [0.089, -1.111, -0.018],
  [-0.089, -1.11, -0.02], [0.001, 0.082, 0.028], [0.12, -1.168, 0.121], [-0.118, -1.168, 0.126],
  [0.0, 0.288, -0.015], [0.081, 0.195, -0.005], [-0.081, 0.194, -0.007], [0.005, 0.352, 0.05],
  [0.172, 0.226, -0.014], [-0.172, 0.226, -0.019], [0.432, 0.212, -0.036], [-0.431, 0.21, -0.041],
  [0.686, 0.222, -0.044], [-0.684, 0.219, -0.045],
];

// Global joint orientations of a standing, arms-down pose, measured over the training set
// (unity_plugin/Runtime/SmplStandingReference.cs). Given as matrix columns, pipeline frame.
const STANDING_COLUMNS: [Vec3, Vec3, Vec3][] = [
  [[-0.9011, -0.0004, 0.4337], [-0.4336, 0.0253, -0.9008], [-0.0106, -0.9997, -0.023]],
  [[-0.9261, 0.0174, 0.3769], [-0.3732, 0.105, -0.9218], [-0.0556, -0.9943, -0.0908]],
  [[-0.8791, -0.0612, 0.4727], [-0.4765, 0.0962, -0.8739], [0.008, -0.9935, -0.1138]],
  [[-0.9025, 0.0237, 0.4301], [-0.4296, -0.1205, -0.8949], [0.0306, -0.9924, 0.1189]],
  [[-0.8995, -0.0597, 0.4327], [-0.4261, -0.0984, -0.8993], [0.0963, -0.9934, 0.063]],
  [[-0.8951, -0.0406, 0.4441], [-0.4359, -0.1305, -0.8905], [0.0941, -0.9906, 0.0991]],
  [[-0.9072, -0.022, 0.4201], [-0.4144, -0.1247, -0.9015], [0.0722, -0.992, 0.104]],
  [[-0.8973, 0.1051, 0.4288], [-0.4315, -0.0028, -0.9021], [-0.0936, -0.9945, 0.0479]],
  [[-0.9099, -0.2066, 0.3597], [-0.3636, -0.0203, -0.9313], [0.1997, -0.9782, -0.0567]],
  [[-0.9067, -0.037, 0.4201], [-0.4139, -0.113, -0.9033], [0.0808, -0.9929, 0.0871]],
  [[-0.9127, 0.1728, 0.3702], [-0.3559, 0.1086, -0.9282], [-0.2006, -0.979, -0.0377]],
  [[-0.8677, -0.1804, 0.4632], [-0.4626, -0.0476, -0.8853], [0.1817, -0.9824, -0.0421]],
  [[-0.9141, -0.0453, 0.403], [-0.396, -0.1149, -0.911], [0.0876, -0.9923, 0.087]],
  [[-0.6916, 0.0033, 0.7223], [-0.7119, -0.1723, -0.6808], [0.1222, -0.985, 0.1215]],
  [[-0.9983, -0.003, 0.0581], [-0.0571, -0.1356, -0.9891], [0.0108, -0.9908, 0.1352]],
  [[-0.9246, -0.0681, 0.3748], [-0.3591, -0.1724, -0.9172], [0.1271, -0.9827, 0.135]],
  [[0.2142, 0.0479, 0.9756], [-0.9235, -0.3153, 0.2183], [0.3181, -0.9478, -0.0233]],
  [[-0.6058, -0.0555, -0.7937], [0.7646, -0.3164, -0.5615], [-0.22, -0.947, 0.2341]],
  [[0.2732, -0.3392, 0.9002], [-0.8651, -0.4959, 0.0757], [0.4207, -0.7994, -0.4289]],
  [[-0.5396, 0.3764, -0.7531], [0.6598, -0.3667, -0.6559], [-0.523, -0.8508, -0.0504]],
  [[0.3111, -0.401, 0.8616], [-0.8749, -0.4749, 0.0949], [0.3712, -0.7834, -0.4986]],
  [[-0.4433, 0.4313, -0.7858], [0.7343, -0.3281, -0.5943], [-0.5142, -0.8404, -0.1713]],
];

// ---------- small linear algebra ----------

export const identity = (): Mat3 => [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function mul(a: Mat3, b: Mat3): Mat3 {
  const o = new Array(9).fill(0);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
  return o;
}

export const transpose = (m: Mat3): Mat3 => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];

export const apply = (m: Mat3, v: Vec3): Vec3 => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];

export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
export const normalize = (a: Vec3): Vec3 => {
  const n = norm(a) || 1;
  return [a[0] / n, a[1] / n, a[2] / n];
};

export const fromColumns = (c0: Vec3, c1: Vec3, c2: Vec3): Mat3 => [c0[0], c1[0], c2[0], c0[1], c1[1], c2[1], c0[2], c1[2], c2[2]];
export const column = (m: Mat3, c: number): Vec3 => [m[c], m[3 + c], m[6 + c]];

export function rotY(angle: number): Mat3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}

// Rodrigues rotation about a unit axis.
export function axisAngle(axis: Vec3, angle: number): Mat3 {
  const [x, y, z] = normalize(axis);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = 1 - c;
  return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c];
}

// Shortest rotation taking unit vector a onto unit vector b.
export function fromTo(a: Vec3, b: Vec3): Mat3 {
  const u = normalize(a);
  const v = normalize(b);
  const axis = cross(u, v);
  const s = norm(axis);
  const c = dot(u, v);
  if (s < 1e-6) return c > 0 ? identity() : axisAngle(Math.abs(u[0]) < 0.9 ? cross(u, [1, 0, 0]) : cross(u, [0, 1, 0]), Math.PI);
  return axisAngle(axis, Math.atan2(s, c));
}

// ---------- pipeline conventions ----------

// matrix_to_rot6d: first two columns, concatenated.
export const toRot6d = (m: Mat3): number[] => [m[0], m[3], m[6], m[1], m[4], m[7]];

// rot6d_to_matrix: Gram-Schmidt.
export function fromRot6d(v: ArrayLike<number>, o = 0): Mat3 {
  const b1 = normalize([v[o], v[o + 1], v[o + 2]]);
  const a2: Vec3 = [v[o + 3], v[o + 4], v[o + 5]];
  const b2 = normalize(sub(a2, scale(b1, dot(b1, a2))));
  return fromColumns(b1, b2, cross(b1, b2));
}

// yaw_only_matrix: yaw of the matrix's local +Z axis about world +Y.
export function yawOnly(m: Mat3): Mat3 {
  const f = column(m, 2);
  return rotY(Math.atan2(f[0], f[2]));
}

export type TrackerFrame = { pos: [Vec3, Vec3, Vec3]; rot: [Mat3, Mat3, Mat3] }; // head, L wrist, R wrist

// canonicalize_window: the model input for one window, flattened (WINDOW * 36).
export function canonicalize(frames: TrackerFrame[]): Float32Array {
  const anchor = frames[frames.length - 1];
  const horiz: Vec3 = [anchor.pos[0][0], 0, anchor.pos[0][2]];
  const invYaw = transpose(yawOnly(anchor.rot[0]));
  const W = frames.length;
  const pos: Vec3[][] = frames.map((f) => f.pos.map((p) => apply(invYaw, sub(p, horiz))));
  const out = new Float32Array(W * INPUT_DIM);
  for (let w = 0; w < W; w++) {
    for (let t = 0; t < 3; t++) {
      const i = w * INPUT_DIM + t * 12;
      const p = pos[w][t];
      const r6 = toRot6d(mul(invYaw, frames[w].rot[t]));
      const prev = w > 0 ? pos[w - 1][t] : null;
      const vel = prev ? sub(p, prev) : W > 1 ? sub(pos[1][t], pos[0][t]) : ([0, 0, 0] as Vec3);
      out.set([...p, ...r6, ...vel], i);
    }
  }
  return out;
}

// Z-up -> Y-up conversion the pipeline applies at the FK boundary: (x, y, z) -> (x, z, -y).
const C: Mat3 = [1, 0, 0, 0, 0, 1, 0, -1, 0];
const CT = transpose(C);

export const STANDING: Mat3[] = STANDING_COLUMNS.map(([a, b, c]) => fromColumns(a, b, c));

// Bone offsets in the pipeline's Y-up frame.
const OFFSETS: Vec3[] = REST.map((p, j) => (j === 0 ? ([0, 0, 0] as Vec3) : apply(C, sub(p, REST[PARENTS[j]]))));

export type Pose = { rotations: Mat3[]; positions: Vec3[] };

// Forward kinematics from global root rotation and local (template-frame) joint rotations.
export function forwardKinematics(root: Mat3, locals: Mat3[]): Pose {
  const rotations: Mat3[] = [root];
  const positions: Vec3[] = [[0, 0, 0]];
  for (let j = 1; j < NUM_JOINTS; j++) {
    const parent = PARENTS[j];
    rotations.push(mul(rotations[parent], mul(C, mul(locals[j], CT))));
    positions.push(add(positions[parent], apply(rotations[parent], OFFSETS[j])));
  }
  return { rotations, positions };
}

// SmplStandingReference stores Unity-style globals (root * product of raw locals). Converted
// to the pipeline's FK frame they match TrackerCalibration's references to within ~4 degrees.
const R0 = STANDING[0];
export const STANDING_GLOBAL: Mat3[] = STANDING.map((g, j) => (j === 0 ? g : mul(mul(mul(R0, C), mul(transpose(R0), g)), CT)));

// Canonical-frame orientations of head, left wrist and right wrist for a person standing
// upright with arms down (unity_plugin/Runtime/TrackerCalibration.cs).
export const TRACKER_REF: Mat3[] = [
  fromColumns([-0.942, 0.07, 0.329], [-0.336, -0.244, -0.91], [0.016, -0.967, 0.254]),
  fromColumns([-0.202, -0.904, -0.378], [0.221, 0.334, -0.916], [0.954, -0.268, 0.132]),
  fromColumns([0.096, 0.926, 0.365], [-0.699, 0.324, -0.637], [-0.709, -0.194, 0.678]),
];

// Median training-set head-joint height (metres); live input is scaled toward it.
export const REFERENCE_HEAD_HEIGHT = 1.42;

const localsFromGlobals = (globals: Mat3[]) =>
  globals.map((g, j) => (j === 0 ? identity() : mul(CT, mul(mul(transpose(globals[PARENTS[j]]), g), C))));

// Standing pose in the canonical frame (head yaw removed), head joint at reference height.
export function standingPose(): Pose {
  const inv = transpose(yawOnly(STANDING_GLOBAL[HEAD]));
  const pose = forwardKinematics(mul(inv, STANDING_GLOBAL[0]), localsFromGlobals(STANDING_GLOBAL));
  const lift = REFERENCE_HEAD_HEIGHT - pose.positions[HEAD][1];
  return { rotations: pose.rotations, positions: pose.positions.map((p) => [p[0], p[1] + lift, p[2]] as Vec3) };
}

// The 135-value model output that would describe a given canonical pose (used for tests).
export function encodePose(pose: Pose): Float32Array {
  const out = new Float32Array(OUTPUT_DIM);
  out.set(toRot6d(pose.rotations[0]), 0);
  const locals = localsFromGlobals(pose.rotations);
  for (let j = 1; j < NUM_JOINTS; j++) out.set(toRot6d(locals[j]), j * 6);
  return out;
}

// Decodes the 135 outputs back into the world: root re-yawed to the anchor head, then FK.
// Positions are returned relative to the pelvis; place the body by its head (see QudmiDemo).
export function decodePose(out: ArrayLike<number>, anchorHeadRot: Mat3): Pose {
  const yaw = yawOnly(anchorHeadRot);
  const root = mul(yaw, fromRot6d(out, 0));
  const locals = [identity()];
  for (let j = 1; j < NUM_JOINTS; j++) locals.push(fromRot6d(out, j * 6));
  return forwardKinematics(root, locals);
}
