// Procedural target shapes for the hero particle morph.

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// A stylised brain: two folded cortical hemispheres, cerebellum and brainstem.
export function brainShape(count: number) {
  const rand = mulberry32(11);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const part = rand();
    let x: number, y: number, z: number;
    if (part < 0.84) {
      const u = rand() * 2 - 1;
      const th = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      let dx = s * Math.cos(th);
      const dy = u;
      const dz = s * Math.sin(th);
      const side = dx >= 0 ? 1 : -1;
      dx = Math.abs(dx);
      const gyri =
        0.05 * Math.sin(11 * dy + 4 * Math.sin(7 * dz)) * Math.cos(10 * dz + 3 * Math.sin(8 * dy)) +
        0.025 * Math.sin(23 * dz + 9 * dy);
      const shell = 0.62 + 0.38 * Math.pow(rand(), 0.45);
      const r = (1 + gyri) * shell;
      x = side * (0.06 + dx * 0.5 * r);
      y = dy * (dy < 0 ? 0.36 : 0.52) * r;
      z = dz * 0.74 * r;
    } else if (part < 0.95) {
      const u = rand() * 2 - 1;
      const th = rand() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const fill = Math.cbrt(rand()) * (1 + 0.05 * Math.sin(u * 40));
      x = s * Math.cos(th) * 0.34 * fill;
      y = -0.3 + u * 0.14 * fill;
      z = -0.48 + s * Math.sin(th) * 0.2 * fill;
    } else {
      const t = rand();
      const a = rand() * Math.PI * 2;
      const rr = 0.075 * Math.sqrt(rand());
      x = Math.cos(a) * rr;
      y = -0.3 - t * 0.42;
      z = -0.2 - t * 0.12 + Math.sin(a) * rr;
    }
    const k = 1.12;
    pos[i * 3] = x * k;
    pos[i * 3 + 1] = y * k + 0.1;
    pos[i * 3 + 2] = z * k;
    // Teal at the front fading to violet at the back.
    const t = Math.min(1, Math.max(0, (z + 0.75) / 1.5));
    const lift = 0.15 * rand();
    col[i * 3] = lerp(0.55, 0.18, t) + lift;
    col[i * 3 + 1] = lerp(0.45, 0.9, t) + lift;
    col[i * 3 + 2] = lerp(1.0, 0.76, t) + lift;
  }
  return { pos, col };
}

// A connectome: neuron clusters joined by synaptic fibres.
export function networkShape(count: number, nodes = 150) {
  const rand = mulberry32(29);
  const centers: [number, number, number][] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < nodes; i++) {
    const y = 1 - (i / (nodes - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const R = 0.4 + 0.55 * Math.pow(rand(), 0.6);
    centers.push([Math.cos(th) * r * R * 1.15, y * R, Math.sin(th) * r * R * 1.15]);
  }
  centers[0] = [0, 0, 0];
  const edges: [number, number][] = [];
  for (let i = 0; i < nodes; i++) {
    const d = centers
      .map((c, j) => [j, (c[0] - centers[i][0]) ** 2 + (c[1] - centers[i][1]) ** 2 + (c[2] - centers[i][2]) ** 2] as const)
      .filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1]);
    for (let k = 0; k < 3; k++) edges.push([i, d[k][0]]);
    if (i % 9 === 0) edges.push([0, i]);
  }
  const palette = [
    [0.24, 0.9, 0.76],
    [0.55, 0.48, 1.0],
    [1.0, 0.71, 0.28],
    [1.0, 0.3, 0.43],
    [0.36, 0.78, 0.98],
  ];
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    if (rand() < 0.38) {
      const n = Math.floor(rand() * nodes);
      const c = centers[n];
      const spread = n === 0 ? 0.09 : 0.035;
      pos[i * 3] = c[0] + gaussian(rand) * spread;
      pos[i * 3 + 1] = c[1] + gaussian(rand) * spread;
      pos[i * 3 + 2] = c[2] + gaussian(rand) * spread;
      const p = n === 0 ? [1, 1, 1] : palette[n % palette.length];
      col[i * 3] = p[0];
      col[i * 3 + 1] = p[1];
      col[i * 3 + 2] = p[2];
    } else {
      const [a, b] = edges[Math.floor(rand() * edges.length)];
      const t = rand();
      const ca = centers[a];
      const cb = centers[b];
      const j = 0.006;
      pos[i * 3] = lerp(ca[0], cb[0], t) + gaussian(rand) * j;
      pos[i * 3 + 1] = lerp(ca[1], cb[1], t) + gaussian(rand) * j;
      pos[i * 3 + 2] = lerp(ca[2], cb[2], t) + gaussian(rand) * j;
      const p = palette[a % palette.length];
      col[i * 3] = p[0] * 0.55;
      col[i * 3 + 1] = p[1] * 0.55;
      col[i * 3 + 2] = p[2] * 0.55;
    }
  }
  return { pos, col };
}

export function randoms(count: number) {
  const rand = mulberry32(5);
  const out = new Float32Array(count * 2);
  for (let i = 0; i < out.length; i++) out[i] = rand();
  return out;
}
