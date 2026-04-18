const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

/**
 * POST audio blob to /transcribe
 * Returns { transcript: string }
 */
export async function transcribe(audioBlob) {
  const form = new FormData();
  form.append("file", audioBlob, "recording.webm");

  const res = await fetch(`${BASE_URL}/transcribe`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`Transcribe failed: ${res.status}`);
  return res.json(); // { transcript: "..." }
}

/**
 * POST transcript text to /suggest
 * Returns { suggestions: string[] }
 */
export async function suggest(text) {
  const res = await fetch(`${BASE_URL}/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: text }),
  });

  if (!res.ok) throw new Error(`Suggest failed: ${res.status}`);
  return res.json(); // { suggestions: [...] }
}

/**
 * POST a voice recording for a phrase to /save-phrase
 * Returns { ok: true }
 */
export async function savePhrase(phrase, audioBlob) {
  const form = new FormData();
  form.append("phrase", phrase);
  form.append("audio",  audioBlob, "phrase.webm");

  const res = await fetch(`${BASE_URL}/save-phrase`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`Save phrase failed: ${res.status}`);
  return res.json();
}
