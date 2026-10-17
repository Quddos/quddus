# Raheem Qudus: portfolio and tech hub

An immersive portfolio built with Next.js 16, React Three Fiber and a small admin backend.

- **Hero:** the portrait becomes ~42k GPU particles that morph into an EEG-lit brain, then into a connectome, as you scroll.
- **Sections:** the Lab (projects with media, video and 3D models), research and patents, the journey timeline, a 3D collaborator/mentee connectome, a talks globe, the AI Hub, and a contact form.
- **⌘K command palette** for quick navigation.
- **AI guide:** a floating "Ask about Raheem" assistant that answers from the live site content and offers buttons to the relevant project or section.
- **Qud-1 API:** a chat playground, free self-serve API keys at `/developers`, and an OpenAI-compatible `/api/v1/chat/completions` with daily limits.
- **QUDMI live demo** at `/demos/qudmi`: the QUDMI ONNX model runs in the browser (ONNX Runtime Web) and predicts a full body from head + hands, driven by preset motions or the webcam (MediaPipe). Runtimes are copied into `public/vendor` by `scripts/copy-vendor.mjs` before dev and build.
- **Admin at `/admin`:** edit every section, upload images, videos and `.glb` models to Vercel Blob, read messages, and change credentials. Saving publishes immediately.

## Environment variables

| Variable | Needed for |
| --- | --- |
| `DATABASE_URL` (or `POSTGRES_URL`) | Neon Postgres: content, admin login and messages. Tables are created automatically. |
| `BLOB_READ_WRITE_TOKEN` | Uploads from the admin panel (Vercel Blob). |
| `AUTH_SECRET` | Optional. Signs admin sessions; derived from the database URL if unset. |
| `ADMIN_PASSWORD` | Initial admin password (8+ characters). Used once, on first login, to create the account. |
| `ADMIN_USERNAME` | Optional. Initial admin username (default `admin`). |
| `NEXT_PUBLIC_SITE_URL` | Optional. Canonical URL for metadata and API examples. |
| `NEXT_PUBLIC_QUDMI_MODEL_URL` | Optional. QUDMI ONNX URL (defaults to the Hugging Face `quddusr/qudmi` weights). |
| `GROQ_API_KEY` | Recommended. Free Groq key; Qud-1's first provider. |
| `CEREBRAS_API_KEY` / `OPENROUTER_API_KEY` / `HF_TOKEN` | Optional free fallbacks, tried in that order after Groq. |
| `GROQ_MODELS`, `CEREBRAS_MODELS`, `OPENROUTER_MODELS`, `HF_MODELS` | Optional. Comma-separated model IDs per provider. |
| `AI_GATEWAY_API_KEY` / `QUD_BASE_MODELS` | Optional. Vercel AI Gateway is the last fallback, using the deployment's OIDC token unless a key is set. |
| `BLOB_STORE_ID` | Set automatically when Blob is connected via OIDC; enables uploads up to 4 MB. `BLOB_READ_WRITE_TOKEN` enables large uploads. |
| `QUD_KEY_DAILY_LIMIT` / `QUD_PLAYGROUND_DAILY_LIMIT` / `QUD_ASK_DAILY_LIMIT` / `QUD_GLOBAL_DAILY_LIMIT` | Optional. Free-tier limits (defaults 200 per key, 30 per playground visitor, 40 AI-guide questions per visitor, 3000 site-wide per day). |

Without a database, the site renders the default content from `src/lib/seed.ts`.

## Admin

The first login creates the admin account from `ADMIN_USERNAME` / `ADMIN_PASSWORD`. After that the password is stored hashed in the database, and you change it in **Admin → Settings**. The dashboard warns you until you replace the initial password.

## Development

```bash
npm install
npm run dev
```

`scripts/portrait-points.py` regenerates `public/media/portrait-points.bin` from a new portrait:
`python3 scripts/portrait-points.py path/to/photo.webp`.
