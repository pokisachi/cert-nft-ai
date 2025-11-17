import FormData from "form-data";
import fetch from "node-fetch";

export async function storachaUpload(file: Buffer, filename: string) {
  const apiKey = process.env.STORACHA_API_KEY;
  if (!apiKey) throw new Error("Missing STORACHA_API_KEY");

  const form = new FormData();
  form.append("file", file, filename);   // ← now works in Node.js

  const res = await fetch("https://api.storacha.network/api/v1/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...form.getHeaders()
    },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Storacha upload failed: ${await res.text()}`);
  }

  const json = await res.json();
  return json.cid;
}
