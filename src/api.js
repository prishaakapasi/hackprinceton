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
  return res.json();
}

/**
 * POST audio blob to /compare
 * Returns { standard: string, improved: string, comparison_mode: string }
 */
export async function compare(audioBlob, expectedText = "") {
  const form = new FormData();
  form.append("file", audioBlob, "recording.wav");

  if (expectedText && expectedText.trim()) {
    form.append("expected_text", expectedText.trim());
  }

  const res = await fetch(`${BASE_URL}/compare`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`Compare failed: ${res.status}`);
  return res.json();
}

/**
 * leave this for later
 * it will still fail unless you add a matching backend/serverless route
 */
export async function suggest(text) {
  const res = await fetch(`${BASE_URL}/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript: text }),
  });

  if (!res.ok) throw new Error(`Suggest failed: ${res.status}`);
  return res.json();
}

/**
 * leave this for later
 * it will still fail unless you add /save-phrase on the backend
 */
export async function savePhrase(phrase, audioBlob) {
  const form = new FormData();
  form.append("phrase", phrase);
  form.append("audio", audioBlob, "phrase.webm");

  const res = await fetch(`${BASE_URL}/save-phrase`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`Save phrase failed: ${res.status}`);
  return res.json();
}
