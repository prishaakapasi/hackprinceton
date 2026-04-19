const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

async function handleJson(res, label) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${label} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function transcribe(audioBlob) {
  const form = new FormData();
  form.append("file", audioBlob, "recording.webm");

  const res = await fetch(`${BASE_URL}/transcribe`, {
    method: "POST",
    body: form,
  });

  return handleJson(res, "Transcribe");
}

export async function compare(audioBlob, expectedText = "") {
  const form = new FormData();
  form.append("file", audioBlob, "recording.webm");

  if (expectedText.trim()) {
    form.append("expected_text", expectedText.trim());
  }

  const res = await fetch(`${BASE_URL}/compare`, {
    method: "POST",
    body: form,
  });

  return handleJson(res, "Compare");
}

export async function getPhrases() {
  const res = await fetch(`${BASE_URL}/get-phrases`);
  return handleJson(res, "Get phrases");
}

export async function savePhrase(phrase, audioBlob = null) {
  const form = new FormData();
  form.append("phrase", phrase);

  if (audioBlob) {
    form.append("audio", audioBlob, "phrase.webm");
  }

  const res = await fetch(`${BASE_URL}/save-phrase`, {
    method: "POST",
    body: form,
  });

  return handleJson(res, "Save phrase");
}

export function suggestFromPhrases(text, phrases = []) {
  const cleaned = (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return { suggestions: phrases.slice(0, 5) };

  const scored = phrases
    .map((phrase) => {
      const phraseLower = phrase.toLowerCase();
      let score = 0;

      if (phraseLower.includes(cleaned)) score += 10;

      for (const word of cleaned.split(" ")) {
        if (word && phraseLower.includes(word)) score += 2;
      }

      if (["lp", "hp", "hep", "halp", "home", "help"].some((t) => cleaned.includes(t)) && phraseLower.includes("help")) {
        score += 20;
      }

      if (["water", "waiter", "wadder"].some((t) => cleaned.includes(t)) && phraseLower.includes("water")) {
        score += 20;
      }

      if (["okay", "ok", "fine"].some((t) => cleaned.includes(t)) && phraseLower.includes("okay")) {
        score += 20;
      }

      return { phrase, score };
    })
    .sort((a, b) => b.score - a.score);

  const suggestions = scored
    .filter((x) => x.score > 0)
    .map((x) => x.phrase);

  for (const phrase of phrases) {
    if (!suggestions.includes(phrase)) suggestions.push(phrase);
  }

  return { suggestions: suggestions.slice(0, 5) };
}

export const suggest = suggestFromPhrases;
