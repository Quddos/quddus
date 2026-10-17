"use client";

import { OrbitControls, Text } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { createXRStore, XR, useXR } from "@react-three/xr";
import { Glasses, Monitor } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { brainShape } from "@/components/hero/shapes";
import type { Profile, Project } from "@/lib/types";

const FONT = "/vendor/fonts/space-grotesk-400.woff";
const FONT_BOLD = "/vendor/fonts/space-grotesk-600.woff";
const EYE = 1.55;

// Loads a cover image as a texture; resolves to null if it can't be loaded (e.g. CORS).
function useCover(url: string) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        if (alive) setTex(t);
      },
      undefined,
      () => alive && setTex(null),
    );
    return () => {
      alive = false;
    };
  }, [url]);
  return tex;
}

function Brain() {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const { pos, col } = brainShape(7000);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  useFrame((s, d) => {
    if (!points.current) return;
    points.current.rotation.y += d * 0.15;
    const m = points.current.material as THREE.PointsMaterial;
    m.size = 0.022 + Math.sin(s.clock.elapsedTime * 2.2) * 0.004; // a slow "pulse"
  });
  return (
    <group position={[0, EYE - 0.1, -2.6]}>
      <points ref={points} geometry={geometry} scale={0.55} raycast={() => null}>
        <pointsMaterial vertexColors size={0.022} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <Text font={FONT} fontSize={0.06} color="#8a93ad" position={[0, -0.75, 0]} anchorX="center" letterSpacing={0.2}>
        BRAIN · BODY · WORLD
      </Text>
    </group>
  );
}

function Panel({ project, position, rotationY, onSelect, active }: { project: Project; position: [number, number, number]; rotationY: number; onSelect: () => void; active: boolean }) {
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const cover = useCover(project.cover);
  const accent = useMemo(() => new THREE.Color(project.accent || "#3ee6c1"), [project.accent]);
  useFrame((_, d) => {
    const g = group.current;
    if (!g) return;
    const target = hover || active ? 1.08 : 1;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, target, 10, d));
  });
  const W = 1.1, H = 0.62;
  return (
    <group ref={group} position={position} rotation={[0, rotationY, 0]}>
      <mesh
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={() => setHover(false)}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <planeGeometry args={[W, H + 0.42]} />
        <meshBasicMaterial color="#0b0e17" transparent opacity={0.92} />
      </mesh>
      {/* Accent frame */}
      <mesh position={[0, 0, -0.002]}>
        <planeGeometry args={[W + 0.03, H + 0.45]} />
        <meshBasicMaterial color={accent} transparent opacity={hover || active ? 0.9 : 0.35} />
      </mesh>
      <mesh position={[0, 0.2, 0.002]}>
        <planeGeometry args={[W - 0.08, H - 0.12]} />
        {cover ? <meshBasicMaterial map={cover} toneMapped={false} /> : <meshBasicMaterial color={accent} transparent opacity={0.18} />}
      </mesh>
      {!cover && (
        <Text font={FONT_BOLD} fontSize={0.16} color={accent} position={[0, 0.2, 0.004]} anchorX="center" anchorY="middle" fillOpacity={0.5} maxWidth={W - 0.15} textAlign="center">
          {project.title.split(" ")[0]}
        </Text>
      )}
      <Text font={FONT} fontSize={0.035} color="#8a93ad" position={[-W / 2 + 0.06, -0.17, 0.004]} anchorX="left" anchorY="top" letterSpacing={0.12}>
        {`${project.category} · ${project.year}`.toUpperCase()}
      </Text>
      <Text font={FONT_BOLD} fontSize={0.065} color="#e9ecf5" position={[-W / 2 + 0.06, -0.22, 0.004]} anchorX="left" anchorY="top" maxWidth={W - 0.12}>
        {project.title}
      </Text>
      <Text font={FONT} fontSize={0.034} color="#a3abc4" position={[-W / 2 + 0.06, -0.31, 0.004]} anchorX="left" anchorY="top" maxWidth={W - 0.12} lineHeight={1.3}>
        {project.tagline}
      </Text>
    </group>
  );
}

function Detail({ project, onClose }: { project: Project; onClose: () => void }) {
  const accent = project.accent || "#3ee6c1";
  return (
    <group position={[0, EYE - 0.05, -1.35]}>
      <mesh>
        <planeGeometry args={[1.5, 1.05]} />
        <meshBasicMaterial color="#070910" />
      </mesh>
      <mesh position={[0, 0.525, 0.001]}>
        <planeGeometry args={[1.5, 0.008]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <Text font={FONT} fontSize={0.032} color={accent} position={[-0.69, 0.45, 0.002]} anchorX="left" anchorY="top" letterSpacing={0.12}>
        {`${project.category} · ${project.year} · ${project.status}`.toUpperCase()}
      </Text>
      <Text font={FONT_BOLD} fontSize={0.085} color="#e9ecf5" position={[-0.69, 0.4, 0.002]} anchorX="left" anchorY="top" maxWidth={1.3}>
        {project.title}
      </Text>
      <Text font={FONT} fontSize={0.036} color="#c3c9dc" position={[-0.69, 0.27, 0.002]} anchorX="left" anchorY="top" maxWidth={1.38} lineHeight={1.4}>
        {project.description.length > 520 ? `${project.description.slice(0, 520)}…` : project.description}
      </Text>
      <Text font={FONT} fontSize={0.032} color="#8a93ad" position={[-0.69, -0.06, 0.002]} anchorX="left" anchorY="top" maxWidth={1.38} lineHeight={1.4}>
        {[...project.highlights.slice(0, 3).map((h) => `•  ${h}`), project.tech.length ? `Stack: ${project.tech.join(", ")}` : ""].filter(Boolean).join("\n")}
      </Text>
      <group position={[0.6, 0.44, 0.003]}>
        <mesh
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <circleGeometry args={[0.045, 32]} />
          <meshBasicMaterial color="#1a1f2e" />
        </mesh>
        <Text font={FONT_BOLD} fontSize={0.05} color="#e9ecf5" position={[0, 0.003, 0.002]} anchorX="center" anchorY="middle">
          ×
        </Text>
      </group>
    </group>
  );
}

function Room({ profile, projects }: { profile: Profile; projects: Project[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const inXR = useXR((s) => s.session !== undefined && s.session !== null);
  const stars = useMemo(() => {
    const n = 1500;
    const pos = new Float32Array(n * 3);
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < n; i++) {
      const u = rand() * 2 - 1;
      const t = rand() * Math.PI * 2;
      const r = 18 + rand() * 10;
      const s = Math.sqrt(1 - u * u);
      pos.set([Math.cos(t) * s * r, Math.abs(u) * r * 0.8 + 1, Math.sin(t) * s * r], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const span = Math.min(Math.PI * 1.15, 0.42 * projects.length);
  const radius = 3.1;
  const first = profile.name.split(" ")[0];

  return (
    <>
      <color attach="background" args={["#04050a"]} />
      <fog attach="fog" args={["#04050a", 8, 26]} />
      <ambientLight intensity={0.6} />
      <points geometry={stars} raycast={() => null}>
        <pointsMaterial size={0.06} color="#5a6390" sizeAttenuation transparent opacity={0.8} />
      </points>
      <gridHelper args={[16, 48, "#1d2440", "#10152a"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.45, 0.5, 64]} />
        <meshBasicMaterial color="#3ee6c1" transparent opacity={0.5} />
      </mesh>

      <Text font={FONT_BOLD} fontSize={0.22} color="#e9ecf5" position={[0, EYE + 1.15, -radius - 0.4]} anchorX="center">
        {profile.name}
      </Text>
      <Text font={FONT} fontSize={0.075} color="#3ee6c1" position={[0, EYE + 0.93, -radius - 0.4]} anchorX="center" letterSpacing={0.08}>
        {profile.headline}
      </Text>
      <Text font={FONT} fontSize={0.055} color="#8a93ad" position={[0, EYE + 0.8, -radius - 0.4]} anchorX="center">
        {inXR ? "Point at a project and pull the trigger to open it" : "Click a project to open it · drag to look around"}
      </Text>

      <Brain />

      {projects.map((p, i) => {
        const a = projects.length === 1 ? 0 : -span / 2 + (span * i) / (projects.length - 1);
        const x = Math.sin(a) * radius;
        const z = -Math.cos(a) * radius;
        return <Panel key={p.id} project={p} position={[x, EYE - 0.15, z]} rotationY={-a} active={selected === i} onSelect={() => setSelected(i)} />;
      })}

      {selected !== null && projects[selected] && <Detail project={projects[selected]} onClose={() => setSelected(null)} />}

      <Text font={FONT} fontSize={0.05} color="#5a627a" position={[0, 0.02, 1.2]} rotation={[-Math.PI / 2, 0, 0]} anchorX="center">
        {`${first.toUpperCase()}'S LAB · QUDDUS.DIASPAFRA.ORG`}
      </Text>
    </>
  );
}

type XRSystemLike = EventTarget & { isSessionSupported: (m: string) => Promise<boolean> };
const getXr = () => (navigator as Navigator & { xr?: XRSystemLike }).xr;

export default function VrGallery({ profile, projects }: { profile: Profile; projects: Project[] }) {
  const store = useMemo(() => createXRStore({
        // Quest 3 emulator for local development only; real headsets elsewhere.
        emulate: window.location.hostname === "localhost" ? { type: "metaQuest3", syntheticEnvironment: false } : false,
        offerSession: false, hand: { teleportPointer: false }, controller: { teleportPointer: false } }), []);
  // Rendered client-side only (dynamic import with ssr: false), so navigator is available.
  const [vrSupported, setVrSupported] = useState<boolean | null>(getXr() ? null : false);
  // Re-check when a headset connects or the (local) emulator installs its runtime.
  useEffect(() => {
    const check = () => {
      const xr = getXr();
      if (xr) xr.isSessionSupported("immersive-vr").then(setVrSupported).catch(() => setVrSupported(false));
    };
    check();
    const xr = getXr();
    xr?.addEventListener("devicechange", check);
    const unsubscribe = store.subscribe((state, prev) => state.emulator !== prev.emulator && check());
    return () => {
      xr?.removeEventListener("devicechange", check);
      unsubscribe();
    };
  }, [store]);

  return (
    <div className="relative h-[78vh] min-h-[520px] overflow-hidden rounded-3xl border border-line bg-bg">
      <Canvas camera={{ position: [0, EYE, 1.6], fov: 60, near: 0.05, far: 60 }} dpr={[1, 2]}>
        <XR store={store}>
          <Room profile={profile} projects={projects} />
          <OrbitControls target={[0, EYE - 0.05, -1]} enablePan={false} minDistance={0.5} maxDistance={4.5} maxPolarAngle={Math.PI * 0.62} rotateSpeed={-0.45} />
        </XR>
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 bg-gradient-to-t from-bg via-bg/60 to-transparent px-4 pb-5 pt-16 text-center">
        {vrSupported ? (
          <button onClick={() => store.enterVR()} className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3 font-medium text-bg transition hover:bg-cyan">
            <Glasses className="h-5 w-5" /> Enter VR
          </button>
        ) : (
          <div className="glass pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted">
            <Monitor className="h-4 w-4 text-cyan" />
            {vrSupported === null ? "Checking for a VR headset…" : "Desktop view. Open this page in the Meta Quest browser to step inside."}
          </div>
        )}
      </div>
    </div>
  );
}
