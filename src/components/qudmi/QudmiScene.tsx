"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { NUM_JOINTS, PARENTS, type Pose, type TrackerFrame, type Vec3 } from "@/lib/qudmi/math";
import { DISPLAY_YAW } from "@/lib/qudmi/rig";

export type LiveState = { pose: Pose | null; trackers: TrackerFrame | null };

// Legs and hips are inferred; nothing observes them.
const INFERRED = new Set([0, 1, 2, 4, 5, 7, 8, 10, 11]);
const CYAN = new THREE.Color("#3ee6c1");
const VIOLET = new THREE.Color("#8b7bff");
const AMBER = new THREE.Color("#ffb547");

const up = new THREE.Vector3(0, 1, 0);

// Moves elbow and wrist so the wrist reaches the target, keeping bone lengths and the
// predicted bend direction.
function solveTwoBone(shoulder: THREE.Vector3, elbow: THREE.Vector3, wrist: THREE.Vector3, target: THREE.Vector3) {
  const a = shoulder.distanceTo(elbow);
  const b = elbow.distanceTo(wrist);
  const toTarget = target.clone().sub(shoulder);
  const d = Math.min(Math.max(toTarget.length(), 1e-4), a + b - 1e-4);
  const dir = toTarget.normalize();
  const bendHint = elbow.clone().sub(shoulder);
  const pole = bendHint.sub(dir.clone().multiplyScalar(bendHint.dot(dir)));
  if (pole.lengthSq() < 1e-8) pole.set(0, -1, 0).sub(dir.clone().multiplyScalar(-dir.y));
  pole.normalize();
  const x = (a * a - b * b + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(a * a - x * x, 0));
  elbow.copy(shoulder).addScaledVector(dir, x).addScaledVector(pole, h);
  wrist.copy(shoulder).addScaledVector(dir, d);
}

function Body({ live }: { live: React.RefObject<LiveState> }) {
  const joints = useRef<THREE.Mesh[]>([]);
  const bones = useRef<THREE.Mesh[]>([]);
  const trackers = useRef<THREE.Mesh[]>([]);
  const smooth = useRef<THREE.Vector3[]>(Array.from({ length: NUM_JOINTS }, () => new THREE.Vector3()));
  const seeded = useRef(false);
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), q: new THREE.Quaternion() }), []);

  const jointMat = useMemo(
    () => Array.from({ length: NUM_JOINTS }, (_, j) => new THREE.MeshStandardMaterial({ color: INFERRED.has(j) ? VIOLET : CYAN, emissive: INFERRED.has(j) ? VIOLET : CYAN, emissiveIntensity: 0.9 })),
    [],
  );
  const boneMat = useMemo(
    () => Array.from({ length: NUM_JOINTS }, (_, j) => new THREE.MeshStandardMaterial({ color: INFERRED.has(j) ? VIOLET : CYAN, emissive: INFERRED.has(j) ? VIOLET : CYAN, emissiveIntensity: 0.35, transparent: true, opacity: 0.85 })),
    [],
  );
  const trackerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: AMBER, emissive: AMBER, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 }), []);

  useFrame((_, delta) => {
    const { pose, trackers: tr } = live.current ?? { pose: null, trackers: null };
    if (pose && tr) {
      // Anchor the body to the tracked headset, as the Unity runtime does.
      const head = pose.positions[15];
      const shift: Vec3 = [tr.pos[0][0] - head[0], tr.pos[0][1] - head[1], tr.pos[0][2] - head[2]];
      const k = seeded.current ? 1 - Math.exp(-delta * 18) : 1;
      const placed = pose.positions.map((p) => new THREE.Vector3(p[0] + shift[0], p[1] + shift[1], p[2] + shift[2]));
      // Snap the wrists onto the tracked controllers with two-bone IK, as the Unity runtime does.
      for (const [sh, el, wr, t] of [[16, 18, 20, 1], [17, 19, 21, 2]] as const) {
        solveTwoBone(placed[sh], placed[el], placed[wr], new THREE.Vector3(...tr.pos[t]));
      }
      for (let j = 0; j < NUM_JOINTS; j++) smooth.current[j].lerp(placed[j], k);
      seeded.current = true;
    }
    for (let j = 0; j < NUM_JOINTS; j++) {
      const mesh = joints.current[j];
      if (!mesh) continue;
      mesh.visible = seeded.current;
      mesh.position.copy(smooth.current[j]);
      const bone = bones.current[j];
      if (!bone || j === 0) continue;
      bone.visible = seeded.current;
      tmp.a.copy(smooth.current[PARENTS[j]]);
      tmp.b.copy(smooth.current[j]);
      const len = tmp.a.distanceTo(tmp.b);
      bone.position.copy(tmp.a).add(tmp.b).multiplyScalar(0.5);
      bone.scale.set(1, Math.max(len, 1e-4), 1);
      tmp.q.setFromUnitVectors(up, tmp.b.sub(tmp.a).normalize());
      bone.quaternion.copy(tmp.q);
    }
    if (tr) {
      for (let i = 0; i < 3; i++) {
        const m = trackers.current[i];
        if (m) {
          m.visible = true;
          m.position.set(tr.pos[i][0], tr.pos[i][1], tr.pos[i][2]);
        }
      }
    }
  });

  return (
    <group rotation={[0, DISPLAY_YAW, 0]}>
      {Array.from({ length: NUM_JOINTS }, (_, j) => (
        <mesh key={`j${j}`} ref={(m) => void (m && (joints.current[j] = m))} material={jointMat[j]} visible={false}>
          <sphereGeometry args={[j === 15 ? 0.085 : 0.028, 20, 20]} />
        </mesh>
      ))}
      {Array.from({ length: NUM_JOINTS }, (_, j) =>
        j === 0 ? null : (
          <mesh key={`b${j}`} ref={(m) => void (m && (bones.current[j] = m))} material={boneMat[j]} visible={false}>
            <cylinderGeometry args={[0.018, 0.018, 1, 10]} />
          </mesh>
        ),
      )}
      {[0, 1, 2].map((i) => (
        <mesh key={`t${i}`} ref={(m) => void (m && (trackers.current[i] = m))} material={trackerMat} visible={false}>
          {i === 0 ? <boxGeometry args={[0.2, 0.09, 0.11]} /> : <octahedronGeometry args={[0.045]} />}
        </mesh>
      ))}
    </group>
  );
}

export default function QudmiScene({ live }: { live: React.RefObject<LiveState> }) {
  return (
    <Canvas camera={{ position: [0, 1.25, 3.1], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[2, 3, 3]} intensity={18} color="#bfd4ff" />
      <pointLight position={[-3, 2, -2]} intensity={10} color="#8b7bff" />
      <gridHelper args={[8, 32, "#2a3150", "#141a2c"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <circleGeometry args={[1.1, 64]} />
        <meshBasicMaterial color="#3ee6c1" transparent opacity={0.05} />
      </mesh>
      <Body live={live} />
      <OrbitControls target={[0, 0.95, 0]} enablePan={false} minDistance={1.6} maxDistance={6} maxPolarAngle={Math.PI * 0.55} />
    </Canvas>
  );
}
