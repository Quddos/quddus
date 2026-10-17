"""Expand Qud-1's training set by having a larger open-weight teacher answer
data/prompts.txt in Qud-1's voice. Output goes to data/distilled.jsonl and the
script resumes where it stopped, so it is safe to re-run after a rate limit.

Any OpenAI-compatible endpoint works. The default is Groq's free tier serving
gpt-oss-120b (Apache-2.0, so its outputs can be used to train another model):

    export TEACHER_API_KEY=gsk_...          # free key from console.groq.com
    python distill.py

Other free options: --base-url https://api.cerebras.ai/v1 --model gpt-oss-120b
"""
import argparse, json, os, re, sys, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from openai import OpenAI, RateLimitError, APIStatusError

HERE = Path(__file__).parent
STYLE = """
Answer as Qud-1. Be accurate, practical and concise: lead with the answer, use short sections or bullet lists only when they help, and include working code where it fits (C# for Unity, Python for EEG/ML, JavaScript for web).
Use current APIs and name the package or SDK you rely on. If something depends on versions, say so. Never claim to be another assistant or company's model.
"""

# Answers that would teach the wrong identity or are unusable.
BAD = re.compile(r"\b(as an ai (language )?model|i am chatgpt|i'm chatgpt|developed by openai|created by openai|i am gpt|i'm gpt)\b", re.I)


def load_prompts(path):
    return [l.strip() for l in path.read_text().splitlines() if l.strip() and not l.startswith("#")]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompts", default=HERE / "data/prompts.txt", type=Path)
    ap.add_argument("--out", default=HERE / "data/distilled.jsonl", type=Path)
    ap.add_argument("--base-url", default=os.environ.get("TEACHER_BASE_URL", "https://api.groq.com/openai/v1"))
    ap.add_argument("--model", default=os.environ.get("TEACHER_MODEL", "openai/gpt-oss-120b"))
    ap.add_argument("--workers", type=int, default=2)
    ap.add_argument("--max-tokens", type=int, default=1500)
    args = ap.parse_args()

    key = os.environ.get("TEACHER_API_KEY") or os.environ.get("GROQ_API_KEY")
    if not key:
        sys.exit("Set TEACHER_API_KEY (for example a free Groq key).")
    client = OpenAI(base_url=args.base_url, api_key=key, max_retries=0)
    system = (HERE / "system.txt").read_text() + STYLE

    done = set()
    if args.out.exists():
        for line in args.out.read_text().splitlines():
            done.add(json.loads(line)["messages"][0]["content"])
    todo = [p for p in load_prompts(args.prompts) if p not in done]
    print(f"{len(done)} done, {len(todo)} to go with {args.model}")

    def answer(prompt):
        for attempt in range(8):
            try:
                r = client.chat.completions.create(
                    model=args.model,
                    messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                    max_tokens=args.max_tokens,
                    temperature=0.4,
                )
                choice = r.choices[0]
                text = (choice.message.content or "").strip()
                if choice.finish_reason != "stop" or len(text) < 40 or BAD.search(text):
                    print(f"  skipped ({choice.finish_reason}): {prompt}")
                    return None
                return {"messages": [{"role": "user", "content": prompt}, {"role": "assistant", "content": text}]}
            except RateLimitError:
                time.sleep(min(60, 5 * 2**attempt))
            except APIStatusError as e:
                if e.status_code >= 500:
                    time.sleep(5)
                    continue
                print(f"  error {e.status_code}: {prompt}")
                return None
        return None

    with args.out.open("a") as f, ThreadPoolExecutor(args.workers) as pool:
        for i, row in enumerate(pool.map(answer, todo), 1):
            if row:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
                f.flush()
            if i % 10 == 0:
                print(f"  {i}/{len(todo)}")
    print("done:", sum(1 for _ in args.out.open()), "examples in", args.out)


if __name__ == "__main__":
    main()
