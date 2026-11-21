# Raheem Qudus: portfolio and tech hub

An immersive portfolio built with Next.js 16, React Three Fiber and a small admin backend.

- **Hero:** the portrait becomes ~42k GPU particles that morph into an EEG-lit brain, then into a connectome, as you scroll.
- **Sections:** the Lab (projects with media, video and 3D models), research and patents, the journey timeline, a 3D collaborator/mentee connectome, a talks globe, the AI Hub, and a contact form.
- **⌘K command palette** for quick navigation.
- **AI guide:** a floating "Ask about Raheem" assistant that answers from the live site content and offers buttons to the relevant project or section.
- **Qud-1 API:** a chat playground, free self-serve API keys at `/developers`, and an OpenAI-compatible `/api/v1/chat/completions` with daily limits.
- **QUDMI live demo** at `/demos/qudmi`: the QUDMI ONNX model runs in the browser (ONNX Runtime Web) and predicts a full body from head + hands, driven by preset motions or the webcam (MediaPipe). Runtimes are copied into `public/vendor` by `scripts/copy-vendor.mjs` before dev and build.
- **EEG Biomarker tool** at `/demos/eeg` (and `POST /api/v1/eeg/analyze`): EDF/EDF+ and Emotiv/generic CSV parsing, zero-phase 1–45 Hz filtering with a 50/60 Hz notch, artifact screening, Welch band powers, peak alpha, theta/beta, engagement and frontal asymmetry, with spectra, spectrogram, scalp map and trace viewer. Runs in the browser; the DSP is checked against SciPy.
- **RILstudio** at `/demos/rilstudio`: the live imitation and reinforcement learning studio (rilstudio.diaspafra.org) embedded in the hub, with its benchmark results and citation.
- **Qud-1 training kit** in `training/qud-1`: LoRA fine-tuning of Qud-1's own weights on a free Colab/Kaggle GPU, published to Hugging Face and served free from a Hugging Face Space. When `QUD1_BASE_URL` is set the site calls it first, falling back to the free providers below.
- **VR Lab** at `/vr` (the headset button in the top bar and hero): a WebXR gallery (`@react-three/xr`) of the projects around a particle brain. On desktop you drag to look around and click a project to open it. In the Meta Quest browser, **Enter VR** lets you point at a project and pull the trigger to open it. On `localhost` a Quest 3 emulator is installed for testing.
- **SEO and visibility:** sitemap, robots, per-page canonical URLs and share images (`opengraph-image`), schema.org JSON-LD (Person, WebSite, VideoGame/CreativeWork, ScholarlyArticle, SoftwareApplication, breadcrumbs), a page per publication at `/research/<id>` with Google Scholar `citation_*` tags, `/llms.txt` for AI assistants, and Vercel Analytics.
- **Career portal at `/career`** (served at `career.diaspafra.org`): open roles, a three-step application that takes about a minute, CV upload, and an applicant dashboard with onboarding, weekly payout status and payout history. Light or dark, switchable. It shares this project's database.
- **Admin at `/admin`:** edit every section, upload images, videos and `.glb` models to Vercel Blob, read messages, post job openings, read applications, record weekly payouts, and change credentials. Saving publishes immediately.

## Environment variables

| Variable | Needed for |
| --- | --- |
| `DATABASE_URL` (or `POSTGRES_URL`) | Neon Postgres: content, admin login and messages. Tables are created automatically. |
| `BLOB_READ_WRITE_TOKEN` | Uploads from the admin panel (Vercel Blob). |
| `AUTH_SECRET` | Optional. Signs admin sessions; derived from the database URL if unset. |
| `ADMIN_PASSWORD` | Initial admin password (8+ characters). Used once, on first login, to create the account. |
| `ADMIN_USERNAME` | Optional. Initial admin username (default `admin`). |
| `NEXT_PUBLIC_SITE_URL` | Optional. Canonical URL for metadata and API examples. |
| `NEXT_PUBLIC_CAREER_URL` | Optional. Canonical URL of the career portal (default `https://career.diaspafra.org`). |
| `NEXT_PUBLIC_CAREER_HOST` | Optional. Host(s) that serve the career portal at their root, comma-separated (default `career.diaspafra.org`; any `career.*` host also works). |
| `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` | Optional. Verification codes from Google Search Console and Bing Webmaster Tools. |
| `NEXT_PUBLIC_QUDMI_MODEL_URL` | Optional. QUDMI ONNX URL (defaults to the Hugging Face `quddusr/qudmi` weights). |
| `QUD1_BASE_URL` / `QUD1_API_KEY` | Optional. Qud-1's own fine-tuned weights on a Hugging Face Space (`https://quddusr-qud-1.hf.space/v1`); tried first. See `training/qud-1`. `QUD1_START_TIMEOUT` (seconds, default 12) sets how long to wait for a sleeping Space. |
| `CRON_SECRET` | Optional. Protects the daily `/api/cron/qud1` keep-warm ping. |
| `GROQ_API_KEY` | Recommended. Free Groq key; Qud-1's first provider. |
| `CEREBRAS_API_KEY` / `OPENROUTER_API_KEY` / `HF_TOKEN` | Optional free fallbacks, tried in that order after Groq. |
| `GROQ_MODELS`, `CEREBRAS_MODELS`, `OPENROUTER_MODELS`, `HF_MODELS` | Optional. Comma-separated model IDs per provider. |
| `AI_GATEWAY_API_KEY` / `QUD_BASE_MODELS` | Optional. Vercel AI Gateway is the last fallback, using the deployment's OIDC token unless a key is set. |
| `BLOB_STORE_ID` | Set automatically when Blob is connected via OIDC; enables uploads up to 4 MB. `BLOB_READ_WRITE_TOKEN` enables large uploads. |
| `QUD_KEY_DAILY_LIMIT` / `QUD_PLAYGROUND_DAILY_LIMIT` / `QUD_ASK_DAILY_LIMIT` / `QUD_GLOBAL_DAILY_LIMIT` | Optional. Free-tier limits (defaults 200 per key, 30 per playground visitor, 40 AI-guide questions per visitor, 3000 site-wide per day). |

Without a database, the site renders the default content from `src/lib/seed.ts`.

## Admin

The first login creates the admin account from `ADMIN_USERNAME` / `ADMIN_PASSWORD`. After that the password is stored hashed in the database, and you change it in **Admin → Settings**. The dashboard warns you until you replace the initial password.

## Career portal

The portal lives at `/career` in this same app and is rewritten to the root of the career domain by `src/proxy.ts`, so `career.diaspafra.org/apply` serves `/career/apply`. There are two ways to put it on its own domain — both share one database, because they share one `DATABASE_URL`:

1. **Same Vercel project (simplest).** Add `career.diaspafra.org` as a domain on this project. Nothing else to configure.
2. **Its own Vercel project.** Create a second project from this same repository, set `career.diaspafra.org` as its domain, and copy `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `AUTH_SECRET` and `ADMIN_PASSWORD` from the main project so both read and write the same tables and files. Set `AUTH_SECRET` explicitly on both.

What the portal does:

- `/career` lists every open role; `/career/jobs/<slug>` is the role page.
- `/career/apply` collects, in three steps: full name, preferred name, WhatsApp contact, gender, email and password; country of origin and residence (all 250 countries), year of study, whether at least 6 hours a week is possible, how soon they can start; payout currency, payout option (PayPal, UPI, bank, Wise/Payoneer or "later"), and a CV upload. Submitting creates the account and files the application.
- `/career/dashboard` shows the onboarding checklist, this week's payout and its status, the next Tuesday payout date, the amount paid to date, the hours logged, every application with its status, the full payout history, and an editor for their details.
- **Admin → Openings** posts and edits roles; **Applications** lists everyone with their details, CV, a WhatsApp link, a status (submitted, reviewing, interview, hired, rejected), private notes and a CSV export; **Payouts** records a weekly payout per person or generates pending payouts for everyone marked hired, and flips each between pending, processing and paid.

Career data lives in `career_jobs`, `career_applicants`, `career_applications` and `career_payouts`, created on first use like the rest of the schema. Applicant sessions use their own `qud_career` cookie, separate from the admin session.

## Development

```bash
npm install
npm run dev
```

`scripts/portrait-points.py` regenerates `public/media/portrait-points.bin` from a new portrait:
`python3 scripts/portrait-points.py path/to/photo.webp`.
