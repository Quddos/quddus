# Raheem Qudus: portfolio and tech hub

An immersive portfolio built with Next.js 16, React Three Fiber and a small admin backend.

- **Hero:** the portrait becomes ~42k GPU particles that morph into an EEG-lit brain, then into a connectome, as you scroll.
- **Sections:** the Lab (projects with media, video and 3D models), research and patents, the journey timeline, a 3D collaborator/mentee connectome, a talks globe, the AI Hub, and a contact form.
- **⌘K command palette** for quick navigation.
- **Qud-1 API:** a chat playground, free self-serve API keys at `/developers`, and an OpenAI-compatible `/api/v1/chat/completions` with daily limits.
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
| `AI_GATEWAY_API_KEY` | Optional. Qud-1 calls Vercel AI Gateway with the deployment's OIDC token; set this only to use a gateway key instead. |
| `QUD_BASE_MODELS` | Optional. Comma-separated AI Gateway model IDs behind `qud-1`, tried in order. |
| `QUD_KEY_DAILY_LIMIT` / `QUD_PLAYGROUND_DAILY_LIMIT` / `QUD_GLOBAL_DAILY_LIMIT` | Optional. Free-tier limits (defaults 200 per key, 30 per playground visitor, 3000 site-wide per day). |

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
