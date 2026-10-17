"""Fine-tune Qud-1: LoRA supervised fine-tuning of a small open model on
data/seed.jsonl (hand-written, up-weighted) plus data/distilled.jsonl, then
merge, publish to Hugging Face and convert to GGUF for llama.cpp serving.

Runs on a free Colab or Kaggle T4 in about 20–40 minutes for 1.5B parameters:

    python train.py --push quddusr/qud-1 --gguf

Use --base to try another chat model, --dry-run to check data without training.
"""
import argparse, json, os, random, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).parent
SAMPLES = [
    "Who are you?",
    "How do I detect a pinch with Meta hand tracking in Unity?",
    "How do I compute alpha band power from an EEG file with MNE?",
]


def read_jsonl(path):
    return [json.loads(l) for l in Path(path).read_text().splitlines() if l.strip()]


def build_rows(seed_repeat):
    system = (HERE / "system.txt").read_text().strip()
    rows = read_jsonl(HERE / "data/seed.jsonl") * seed_repeat
    distilled = HERE / "data/distilled.jsonl"
    if distilled.exists():
        rows += read_jsonl(distilled)
    out = []
    for r in rows:
        msgs = [{"role": "system", "content": system}] + r["messages"]
        assert msgs[-1]["role"] == "assistant", "each example must end with the assistant's answer"
        # Prompt-completion format: loss is computed on the final answer only.
        out.append({"prompt": msgs[:-1], "completion": msgs[-1:]})
    return system, out


def model_card(base, n_train):
    return f"""---
license: apache-2.0
base_model: {base}
language: [en]
pipeline_tag: text-generation
tags: [xr, unity, eeg, bci, neurotech, lora, qud-1]
---

# Qud-1

An open assistant for builders working on **XR and neurotechnology**: Unity, Meta XR SDK, OpenXR,
WebXR, EEG/BCI pipelines with MNE-Python, and healthcare-AI research methods. Created by
[Raheem Qudus](https://quddus.diaspafra.org).

- **Base model:** [{base}](https://huggingface.co/{base}) (Apache-2.0)
- **Method:** LoRA supervised fine-tuning on {n_train} conversations (hand-written examples plus
  answers distilled from gpt-oss-120b, Apache-2.0), merged into the base weights.
- **Use it free:** chat and API keys at https://quddus.diaspafra.org/developers
  (OpenAI-compatible, model `qud-1`). GGUF builds for llama.cpp are in
  [`quddusr/qud-1-GGUF`](https://huggingface.co/quddusr/qud-1-GGUF).

## Limits

A small model: it can be wrong on niche API details, so check against official docs. Medical
content is for research and education only, never diagnosis or treatment advice.
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="Qwen/Qwen2.5-1.5B-Instruct")
    ap.add_argument("--out", default="out", type=Path)
    ap.add_argument("--epochs", type=float, default=3)
    ap.add_argument("--lr", type=float, default=2e-4)
    ap.add_argument("--rank", type=int, default=16)
    ap.add_argument("--max-length", type=int, default=2048)
    ap.add_argument("--seed-repeat", type=int, default=3, help="how many times the hand-written examples count")
    ap.add_argument("--push", help="Hugging Face repo for the merged model, e.g. quddusr/qud-1")
    ap.add_argument("--gguf", action="store_true", help="also build GGUF files and push them to <push>-GGUF")
    ap.add_argument("--quant", default="Q4_K_M", help="extra llama.cpp quantisation besides Q8_0 ('' to skip)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    system, rows = build_rows(args.seed_repeat)
    random.Random(0).shuffle(rows)
    print(f"{len(rows)} training conversations")
    if args.dry_run:
        print(json.dumps(rows[0], indent=2, ensure_ascii=False)[:1500])
        return

    import torch
    from datasets import Dataset
    from peft import LoraConfig, PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from trl import SFTConfig, SFTTrainer

    cuda = torch.cuda.is_available()
    bf16 = cuda and torch.cuda.is_bf16_supported()
    dtype = torch.bfloat16 if bf16 else torch.float16 if cuda else torch.float32
    tok = AutoTokenizer.from_pretrained(args.base)
    model = AutoModelForCausalLM.from_pretrained(args.base, dtype=dtype, device_map="auto" if cuda else None)

    data = Dataset.from_list(rows)
    split = data.train_test_split(test_size=0.05, seed=0) if len(data) >= 100 else None
    cfg = SFTConfig(
        output_dir=str(args.out / "checkpoints"),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=8,
        learning_rate=args.lr,
        lr_scheduler_type="cosine",
        warmup_steps=10,
        max_length=args.max_length,
        gradient_checkpointing=cuda,
        bf16=bf16,
        fp16=cuda and not bf16,
        logging_steps=5,
        eval_strategy="epoch" if split else "no",
        save_strategy="no",
        report_to="none",
        seed=0,
    )
    lora = LoraConfig(r=args.rank, lora_alpha=2 * args.rank, lora_dropout=0.05, target_modules="all-linear", task_type="CAUSAL_LM")
    trainer = SFTTrainer(
        model=model,
        args=cfg,
        train_dataset=split["train"] if split else data,
        eval_dataset=split["test"] if split else None,
        processing_class=tok,
        peft_config=lora,
    )
    trainer.train()
    adapter = args.out / "adapter"
    trainer.model.save_pretrained(adapter)
    del trainer, model
    if cuda:
        torch.cuda.empty_cache()

    # Merge the adapter into full-precision-ish weights for publishing and GGUF.
    merged_dir = args.out / "merged"
    base = AutoModelForCausalLM.from_pretrained(args.base, dtype=torch.float16 if cuda else torch.float32)
    merged = PeftModel.from_pretrained(base, adapter).merge_and_unload()
    merged.save_pretrained(merged_dir)
    tok.save_pretrained(merged_dir)
    (merged_dir / "README.md").write_text(model_card(args.base, len(rows)))
    print("merged model saved to", merged_dir)

    merged.to("cuda" if cuda else "cpu").eval()
    for q in SAMPLES:
        msgs = [{"role": "system", "content": system}, {"role": "user", "content": q}]
        ids = tok.apply_chat_template(msgs, add_generation_prompt=True, return_tensors="pt", return_dict=True).to(merged.device)
        with torch.no_grad():
            gen = merged.generate(**ids, max_new_tokens=200, do_sample=False)
        print(f"\n### {q}\n{tok.decode(gen[0][ids['input_ids'].shape[1]:], skip_special_tokens=True)}")

    if args.push:
        from huggingface_hub import HfApi

        api = HfApi()
        api.create_repo(args.push, exist_ok=True)
        api.upload_folder(repo_id=args.push, folder_path=merged_dir, commit_message="Qud-1 fine-tuned weights")
        print("pushed", f"https://huggingface.co/{args.push}")

    if args.gguf:
        build_gguf(merged_dir, args.out, args.quant, f"{args.push}-GGUF" if args.push else None)


def build_gguf(merged_dir, out, quant, repo):
    llama = out / "llama.cpp"
    if not llama.exists():
        subprocess.run(["git", "clone", "--depth", "1", "https://github.com/ggml-org/llama.cpp", str(llama)], check=True)
    files = [out / "qud-1-q8_0.gguf"]
    subprocess.run([sys.executable, str(llama / "convert_hf_to_gguf.py"), str(merged_dir), "--outtype", "q8_0", "--outfile", str(files[0])], check=True)
    if quant:
        # Smaller and faster on a CPU Space; needs the llama-quantize tool built once.
        f16 = out / "qud-1-f16.gguf"
        subprocess.run([sys.executable, str(llama / "convert_hf_to_gguf.py"), str(merged_dir), "--outtype", "f16", "--outfile", str(f16)], check=True)
        build = llama / "build"
        subprocess.run(["cmake", "-B", str(build), "-S", str(llama), "-DLLAMA_CURL=OFF", "-DGGML_CUDA=OFF"], check=True)
        subprocess.run(["cmake", "--build", str(build), "--target", "llama-quantize", "-j", str(os.cpu_count() or 2)], check=True)
        target = out / f"qud-1-{quant.lower()}.gguf"
        subprocess.run([str(build / "bin" / "llama-quantize"), str(f16), str(target), quant], check=True)
        f16.unlink()
        files.append(target)
    print("GGUF:", *[f"{f} ({f.stat().st_size / 1e9:.2f} GB)" for f in files])
    if repo:
        from huggingface_hub import HfApi

        api = HfApi()
        api.create_repo(repo, exist_ok=True)
        for f in files:
            api.upload_file(path_or_fileobj=str(f), path_in_repo=f.name, repo_id=repo)
        print("pushed", f"https://huggingface.co/{repo}")


if __name__ == "__main__":
    main()
