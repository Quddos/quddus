"use client";

import { useState } from "react";

const API = `${(process.env.NEXT_PUBLIC_SITE_URL || "https://quddus.diaspafra.org").replace(/\/$/, "")}/api/v1`;

const snippets = {
  cURL: `curl ${API}/chat/completions \\
  -H "Authorization: Bearer $QUD_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qud-1",
    "messages": [{"role": "user",
      "content": "Unity C# for Quest hand-tracking grab"}]
  }'`,
  Python: `# pip install openai
import os
from openai import OpenAI

client = OpenAI(
    base_url="${API}",
    api_key=os.environ["QUD_API_KEY"],
)
reply = client.chat.completions.create(
    model="qud-1",
    messages=[{"role": "user",
               "content": "Band-pass filter Emotiv EEG in MNE"}],
)
print(reply.choices[0].message.content)`,
  JavaScript: `// npm install openai
import OpenAI from "openai";

const qud = new OpenAI({
  baseURL: "${API}",
  apiKey: process.env.QUD_API_KEY,
});

const stream = await qud.chat.completions.create({
  model: "qud-1",
  messages: [{ role: "user", content: "Explain OpenXR action maps" }],
  stream: true,
});
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
}`,
  "Unity C#": `using System.Text;
using UnityEngine;
using UnityEngine.Networking;

// Keep the key on your own backend in production builds.
IEnumerator AskQud(string prompt) {
  var body = "{\\"model\\":\\"qud-1\\",\\"messages\\":[{\\"role\\":\\"user\\",\\"content\\":\\""
             + prompt + "\\"}]}";
  using var req = new UnityWebRequest("${API}/chat/completions", "POST");
  req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(body));
  req.downloadHandler = new DownloadHandlerBuffer();
  req.SetRequestHeader("Content-Type", "application/json");
  req.SetRequestHeader("Authorization", "Bearer " + apiKey);
  yield return req.SendWebRequest();
  Debug.Log(req.downloadHandler.text);
}`,
};

export function CodeTabs() {
  const [tab, setTab] = useState<keyof typeof snippets>("cURL");
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-[#05070c]">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-line px-3 py-2.5">
        {(Object.keys(snippets) as (keyof typeof snippets)[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-xs transition ${tab === k ? "bg-white/10 text-fg" : "text-dim hover:text-fg"}`}
          >
            {k}
          </button>
        ))}
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-fg/85">
        <code>{snippets[tab]}</code>
      </pre>
    </div>
  );
}
