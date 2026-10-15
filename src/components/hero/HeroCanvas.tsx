"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { brainShape, networkShape, randoms } from "./shapes";

export type HeroState = { progress: number };

const vertexShader = /* glsl */ `
  attribute vec3 aBrain;
  attribute vec3 aNet;
  attribute vec3 aColorA;
  attribute vec3 aColorB;
  attribute vec3 aColorC;
  attribute vec2 aRand;
  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uMouse;
  uniform float uMouseStrength;
  uniform float uSize;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = aRand.x * 0.35;
    float t1 = smoothstep(0.0 + d, 0.65 + d, uProgress);
    float t2 = smoothstep(1.0 + d, 1.65 + d, uProgress);

    vec3 pos = mix(position, aBrain, t1);
    pos = mix(pos, aNet, t2);

    // Particles swirl while travelling between shapes.
    float travel = sin(t1 * 3.14159) + sin(t2 * 3.14159);
    pos += travel * 0.32 * vec3(
      sin(uTime * 0.7 + aRand.y * 20.0 + pos.y * 3.0),
      cos(uTime * 0.6 + aRand.x * 17.0 + pos.x * 3.0),
      sin(uTime * 0.5 + aRand.y * 11.0 + pos.z * 2.0)
    );
    // Idle breathing.
    pos += 0.01 * vec3(sin(uTime * 1.3 + aRand.x * 40.0), cos(uTime * 1.1 + aRand.y * 40.0), sin(uTime + aRand.x * 9.0));

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vec2 away = world.xy - uMouse.xy;
    float dist = length(away);
    float force = smoothstep(0.42, 0.0, dist) * uMouseStrength;
    world.xy += normalize(away + 1e-4) * force * 0.22;
    world.z += force * 0.25;

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.55 + aRand.y * 0.9) * mix(0.72, 1.0, t1) / -mv.z;

    // EEG-like waves sweep across the brain.
    float wave = pow(0.5 + 0.5 * sin(length(aBrain.xy) * 12.0 + aBrain.z * 7.0 - uTime * 2.6), 8.0);
    // Signals travel along the connectome fibres.
    float pulse = pow(0.5 + 0.5 * sin(length(aNet) * 9.0 - uTime * 3.2 + aRand.x * 2.0), 12.0);

    vec3 portrait = pow(aColorA, vec3(0.85)) * 0.95;
    vec3 col = mix(portrait, aColorB, t1);
    col = mix(col, aColorC, t2);
    col += wave * max(t1 - t2, 0.0) * vec3(0.35, 1.0, 0.85) * 0.9;
    col += pulse * t2 * vec3(1.0) * 0.8;
    col += force * vec3(0.2, 0.9, 0.8);

    vColor = col;
    vAlpha = mix(0.42, 0.7, t1);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

function Particles({ data, state }: { data: Float32Array; state: React.RefObject<HeroState> }) {
  const points = useRef<THREE.Points>(null);
  const { viewport, size, gl, camera } = useThree();
  const smooth = useRef(0);
  const mouse = useRef(new THREE.Vector3(99, 99, 0));
  const strength = useRef(0);
  const lastMove = useRef(-1);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") lastMove.current = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const geometry = useMemo(() => {
    const count = data.length / 5;
    const pos = new Float32Array(count * 3);
    const colA = new Float32Array(count * 3);
    const rand = randoms(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = data[i * 5] * 1.05;
      pos[i * 3 + 1] = data[i * 5 + 1] * 1.05 - 0.05;
      // Darker tones sit slightly back for a subtle relief.
      const lum = data[i * 5 + 2] * 0.3 + data[i * 5 + 3] * 0.59 + data[i * 5 + 4] * 0.11;
      pos[i * 3 + 2] = (lum - 0.5) * 0.08 + (rand[i * 2] - 0.5) * 0.04;
      colA[i * 3] = data[i * 5 + 2];
      colA[i * 3 + 1] = data[i * 5 + 3];
      colA[i * 3 + 2] = data[i * 5 + 4];
    }
    const brain = brainShape(count);
    const net = networkShape(count);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aBrain", new THREE.BufferAttribute(brain.pos, 3));
    g.setAttribute("aNet", new THREE.BufferAttribute(net.pos, 3));
    g.setAttribute("aColorA", new THREE.BufferAttribute(colA, 3));
    g.setAttribute("aColorB", new THREE.BufferAttribute(brain.col, 3));
    g.setAttribute("aColorC", new THREE.BufferAttribute(net.col, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 2));
    // Fewer particles on small screens keeps phones smooth.
    if (typeof window !== "undefined" && window.innerWidth < 700) g.setDrawRange(0, Math.floor(count * 0.6));
    return g;
  }, [data]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uMouse: { value: new THREE.Vector3() },
          uMouseStrength: { value: 0 },
          uSize: { value: 15 },
          uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
        },
      }),
    [gl],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  const wide = size.width / size.height > 1.15;

  useFrame((frame, delta) => {
    const target = state.current?.progress ?? 0;
    smooth.current = THREE.MathUtils.damp(smooth.current, target, 4, delta);
    const p = smooth.current;
    const t = frame.clock.elapsedTime;

    // Pointer on the z=0 plane in world units.
    const v = new THREE.Vector3(frame.pointer.x, frame.pointer.y, 0.5).unproject(camera);
    const dir = v.sub(camera.position).normalize();
    const hit = camera.position.clone().add(dir.multiplyScalar(-camera.position.z / dir.z));
    mouse.current.lerp(hit, 0.25);
    // Only repel once a real mouse has moved recently; touch devices stay still.
    const moving = lastMove.current > 0 && performance.now() - lastMove.current < 2500;
    strength.current = THREE.MathUtils.damp(strength.current, moving ? 1 : 0, 3, delta);

    const pts = points.current;
    if (!pts) return;
    const u = (pts.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value = t;
    u.uProgress.value = p;
    u.uMouse.value.copy(mouse.current);
    u.uMouseStrength.value = strength.current;
    const shapeMix = Math.min(p, 1);
    const offset = wide ? viewport.width * 0.2 : 0;
    pts.position.x = THREE.MathUtils.lerp(offset, wide ? viewport.width * 0.16 : 0, shapeMix);
    pts.position.y = wide ? 0 : THREE.MathUtils.lerp(0.42, 0.3, shapeMix);
    // Hold the brain in a side view, then let the connectome turn slowly.
    const spin = shapeMix * (-1.25 + Math.sin(t * 0.25) * 0.45) + Math.max(0, p - 1) * (0.6 + t * 0.12);
    pts.rotation.y = THREE.MathUtils.damp(pts.rotation.y, spin + frame.pointer.x * 0.25, 3, delta);
    pts.rotation.x = THREE.MathUtils.damp(pts.rotation.x, -frame.pointer.y * 0.12 + shapeMix * 0.15, 3, delta);
    pts.scale.setScalar(wide ? 1 : 0.68);
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}

export default function HeroCanvas({ state, onReady }: { state: React.RefObject<HeroState>; onReady?: () => void }) {
  const [data, setData] = useState<Float32Array | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/media/portrait-points.bin")
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (cancelled) return;
        setData(new Float32Array(buf));
        onReady?.();
      })
      .catch(() => onReady?.());
    return () => {
      cancelled = true;
    };
  }, [onReady]);

  return (
    <Canvas
      camera={{ position: [0, 0, 3.1], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      {data && <Particles data={data} state={state} />}
    </Canvas>
  );
}
