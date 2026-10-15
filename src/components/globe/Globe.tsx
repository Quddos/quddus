"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type GlobePin = { id: string; lat: number; lng: number; label: string };

const R = 1;

function toVec(lat: number, lng: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function Dots() {
  const geo = useMemo(() => {
    const n = 5200;
    const pos = new Float32Array(n * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      pos[i * 3] = Math.cos(golden * i) * r * R;
      pos[i * 3 + 1] = y * R;
      pos[i * 3 + 2] = Math.sin(golden * i) * r * R;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.012} color="#5a6390" transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

function Arc({ from, to, color, offset }: { from: THREE.Vector3; to: THREE.Vector3; color: string; offset: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const lift = 1 + from.distanceTo(to) * 0.45;
    mid.normalize().multiplyScalar(R * lift);
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    return new THREE.TubeGeometry(curve, 64, 0.004, 6, false);
  }, [from, to]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uOffset: { value: offset } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uTime; uniform vec3 uColor; uniform float uOffset; varying vec2 vUv;
          void main(){ float head = fract(uTime*0.35 + uOffset); float d = vUv.x - head; float trail = smoothstep(-0.35, 0.0, d) * step(d, 0.0);
          gl_FragColor = vec4(uColor, 0.18 + trail * 0.9); }`,
      }),
    [color, offset],
  );
  useFrame((s) => {
    const m = mesh.current?.material as THREE.ShaderMaterial | undefined;
    if (m) m.uniforms.uTime.value = s.clock.elapsedTime;
  });
  return <mesh ref={mesh} geometry={geometry} material={material} />;
}

function Scene({ pins, home }: { pins: GlobePin[]; home: { lat: number; lng: number }[] }) {
  const group = useRef<THREE.Group>(null);
  useFrame((s, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.08;
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, 0.35 - s.pointer.y * 0.2, 3, delta);
    }
  });
  const origin = toVec(home[0].lat, home[0].lng);
  const colors = ["#3ee6c1", "#8b7bff", "#ffb547", "#ff4d6d", "#5ac8fa"];
  const unique = pins.filter((p, i) => pins.findIndex((q) => q.lat === p.lat && q.lng === p.lng) === i);
  return (
    <group ref={group} rotation={[0.35, -1.9, 0]}>
      <mesh>
        <sphereGeometry args={[R * 0.985, 64, 64]} />
        <meshBasicMaterial color="#070a12" />
      </mesh>
      <Dots />
      {[...home, ...unique].map((p, i) => {
        const v = toVec(p.lat, p.lng, R * 1.005);
        return (
          <mesh key={`${p.lat},${p.lng},${i}`} position={v}>
            <sphereGeometry args={[i < home.length ? 0.022 : 0.016, 16, 16]} />
            <meshBasicMaterial color={i < home.length ? "#ffffff" : colors[i % colors.length]} />
          </mesh>
        );
      })}
      {unique
        .filter((p) => p.lat !== home[0].lat || p.lng !== home[0].lng)
        .map((p, i) => (
          <Arc key={p.id} from={origin} to={toVec(p.lat, p.lng)} color={colors[i % colors.length]} offset={i * 0.17} />
        ))}
      {home.slice(1).map((h, i) => (
        <Arc key={`home${i}`} from={toVec(h.lat, h.lng)} to={origin} color="#ffffff" offset={0.5} />
      ))}
    </group>
  );
}

export default function Globe({ pins }: { pins: GlobePin[] }) {
  // Amaravati (current base) and Lagos (home).
  const home = [
    { lat: 16.4632, lng: 80.5064 },
    { lat: 6.5244, lng: 3.3792 },
  ];
  return (
    <Canvas camera={{ position: [0, 0, 2.9], fov: 45 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
      <Scene pins={pins} home={home} />
    </Canvas>
  );
}
