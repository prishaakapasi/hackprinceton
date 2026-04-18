import Anthropic from "@anthropic-ai/sdk";


const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { partial, phrases } = req.body;

  if (!partial || typeof partial !== "string") {
    return res.status(400).json({ error: "partial is required" });
  }

  const phraseList = Array.isArray(phrases) ? phrases.join(", ") : "";

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: `You are an AAC (augmentative and alternative communication) assistant helping a Parkinson's patient communicate. Their saved phrases are: ${phraseList}. Return ONLY a JSON array of exactly 5 short, natural sentence completions (under 8 words each). No explanation, no markdown — raw JSON array only.`,
      messages: [
        {
          role: "user",
          content: `They have typed: "${partial}". Complete this into 5 natural phrases.`,
        },
      ],
    });

    const raw = message.content[0].text.trim();

    // Parse the JSON array Claude returns
    let suggestions;
    try {
      suggestions = JSON.parse(raw);
    } catch {
      // Fallback: try to extract array from response if Claude added extra text
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        suggestions = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse suggestions from Claude response");
      }
    }

    return res.status(200).json({ suggestions: suggestions.slice(0, 5) });
  } catch (err) {
    console.error("suggest error:", err);
    return res.status(500).json({ error: "Failed to generate suggestions" });
  }
}
