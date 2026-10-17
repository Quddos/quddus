# Qud-1 training kit

This kit builds Qud-1's own weights. It fine-tunes a small open model with LoRA, publishes it to Hugging Face, and serves it free from a Hugging Face Space. The website then calls that Space first and falls back to larger free models when the Space is asleep or busy.

```
data/seed.jsonl ──┐
                  ├─► train.py ─► quddusr/qud-1 (merged weights)
distill.py ───────┘            └► quddusr/qud-1-GGUF ─► Space (llama.cpp) ─► quddus.diaspafra.org/api/v1
(data/prompts.txt → teacher model)
```

| File | What it does |
| --- | --- |
| `data/seed.jsonl` | Hand-written conversations: identity, voice, and core Unity/XR, EEG/BCI and research answers. Counted 3× in training. |
| `data/prompts.txt` | About 200 questions that XR and neurotech builders ask. Add your own. |
| `distill.py` | Has a larger open model (gpt-oss-120b, Apache-2.0, free on Groq) answer the prompts in Qud-1's voice and writes `data/distilled.jsonl`. It filters bad answers and resumes after rate limits. |
| `train.py` | Runs LoRA SFT on Qwen2.5-1.5B-Instruct (Apache-2.0), trained on the answers only. It then merges the adapter, prints sample answers, pushes the model, and builds Q8_0 and Q4_K_M GGUF files. |
| `system.txt` | Qud-1's system prompt, the same one the site sends. Keep it in sync with `src/lib/qud.ts`. |
| `Qud_1_training.ipynb` | Runs all of the above on a free Colab or Kaggle T4 GPU. |
| `space/` | `Dockerfile` and card for the free CPU Space that serves the model. |

## Run it (free)

1. Open `Qud_1_training.ipynb` in [Colab](https://colab.research.google.com) (*File → Open notebook → GitHub*, then paste the repo URL) or upload it to Kaggle. Pick a **T4 GPU**.
2. Add secrets:
   - `HF_TOKEN`: a Hugging Face **write** token.
   - `GROQ_API_KEY`: optional, but recommended for the distilled data.
3. Click **Run all**. It takes about 30–60 minutes and creates `quddusr/qud-1` and `quddusr/qud-1-GGUF`.

## Serve it (free)

1. Create a new Space named `qud-1`: SDK **Docker**, hardware **CPU basic**.
2. Upload `space/Dockerfile` and `space/README.md` to it.
3. Add the Space secret `LLAMA_API_KEY`: a long random string.
4. In Vercel, set these environment variables, then redeploy:
   - `QUD1_BASE_URL` = `https://quddusr-qud-1.hf.space/v1`
   - `QUD1_API_KEY` = the same string

To check that the Space answers:

```bash
curl https://quddusr-qud-1.hf.space/v1/chat/completions \
  -H "Authorization: Bearer $LLAMA_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"qud-1","messages":[{"role":"user","content":"Who are you?"}]}'
```

**Admin → API → Test AI providers** on the site should now list **Qud-1 (fine-tuned)** first.

## What to expect

- **Speed:** a 1.5B model on 2 free vCPUs generates roughly 10–20 tokens per second.
- **Sleeping Space:** a free Space sleeps after 48 hours without traffic. A daily Vercel Cron ping (`/api/cron/qud1`) keeps it awake. If it is still waking, the site waits 12 seconds (`QUD1_START_TIMEOUT`) and then answers with a fallback model.
- **Quality:** Qud-1 is specialised, not bigger. It knows its identity and domain style, but a 1.5B model is weaker than the 70–120B fallbacks on hard reasoning. The site guide ("Ask about Raheem") always uses the larger models because it needs long context.
- **Retraining:** add examples to `seed.jsonl` or questions to `prompts.txt`, then re-run the notebook. The Space picks up the new GGUF on restart.
- **Bigger model:** pass `--base Qwen/Qwen2.5-3B-Instruct` for a stronger model that runs about half as fast on the free Space.
