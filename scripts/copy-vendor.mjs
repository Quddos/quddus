// Copies browser runtimes (ONNX Runtime Web, MediaPipe) into public/vendor so the QUDMI demo
// loads them from this site rather than a third-party CDN. Runs before dev and build.
import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const files = [
  ["onnxruntime-web/dist/ort.wasm.min.mjs", "ort/ort.wasm.min.mjs"],
  ["onnxruntime-web/dist/ort-wasm-simd-threaded.mjs", "ort/ort-wasm-simd-threaded.mjs"],
  ["onnxruntime-web/dist/ort-wasm-simd-threaded.wasm", "ort/ort-wasm-simd-threaded.wasm"],
  ["@mediapipe/tasks-vision/vision_bundle.mjs", "mediapipe/vision_bundle.mjs"],
  ["@mediapipe/tasks-vision/wasm/vision_wasm_internal.js", "mediapipe/wasm/vision_wasm_internal.js"],
  ["@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm", "mediapipe/wasm/vision_wasm_internal.wasm"],
  // 3D text in the VR gallery (troika needs woff/ttf, not woff2).
  ["@fontsource/space-grotesk/files/space-grotesk-latin-400-normal.woff", "fonts/space-grotesk-400.woff"],
  ["@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff", "fonts/space-grotesk-600.woff"],
];

for (const [from, to] of files) {
  const dest = join("public/vendor", to);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(join("node_modules", from), dest);
}
console.log(`copy-vendor: ${files.length} files -> public/vendor`);
