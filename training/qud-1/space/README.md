---
title: Qud-1
emoji: 🧠
colorFrom: indigo
colorTo: green
sdk: docker
app_port: 7860
pinned: false
license: apache-2.0
short_description: Qud-1 inference server (OpenAI-compatible, llama.cpp)
---

# Qud-1 server

Serves [quddusr/qud-1-GGUF](https://huggingface.co/quddusr/qud-1-GGUF) with llama.cpp's
OpenAI-compatible server. The public front door, with free API keys and limits, is
https://quddus.diaspafra.org/developers.

**Secret to set:** `LLAMA_API_KEY` (any long random string). Put the same value in the
website's `QUD1_API_KEY`.

To serve a different file, set the variable `LLAMA_ARG_HF_FILE` (for example `qud-1-q8_0.gguf`).
