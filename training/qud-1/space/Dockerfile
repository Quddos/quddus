# Qud-1 inference server for a free Hugging Face CPU Space (2 vCPU, 16 GB).
# llama.cpp's server exposes an OpenAI-compatible API at /v1/chat/completions.
FROM ghcr.io/ggml-org/llama.cpp:server

# The model downloads from the Hub on first start into a writable cache.
ENV LLAMA_CACHE=/tmp/llama-cache \
    LLAMA_ARG_HF_REPO=quddusr/qud-1-GGUF \
    LLAMA_ARG_HF_FILE=qud-1-q4_k_m.gguf \
    LLAMA_ARG_ALIAS=qud-1 \
    LLAMA_ARG_HOST=0.0.0.0 \
    LLAMA_ARG_PORT=7860 \
    LLAMA_ARG_CTX_SIZE=8192 \
    LLAMA_ARG_N_PARALLEL=2 \
    LLAMA_ARG_THREADS=2

# LLAMA_API_KEY comes from the Space's secrets; requests without it get 401.
EXPOSE 7860
