import React, { useEffect, useRef, useState } from "react";
import { getPhrases, savePhrase, suggest, transcribe } from "../api";

const NORMALIZATION_RULES = [
  { tokens: ["help", "hep", "hp", "halp", "home"], output: "I need help" },
  { tokens: ["water", "waiter", "wadder"], output: "I need water" },
  { tokens: ["okay", "ok", "fine"], output: "I am okay" },
  { tokens: ["wait"], output: "Please wait" },
  { tokens: ["daughter", "call"], output: "Call my daughter" },
  { tokens: ["sit", "down"], output: "I need to sit down" },
];

function cleanText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeToPlainEnglish(rawText, phrases, suggestionList) {
  const cleaned = cleanText(rawText);

  if (!cleaned) return "";

  if (suggestionList && suggestionList.length > 0) {
    return suggestionList[0];
  }

  for (const rule of NORMALIZATION_RULES) {
    if (rule.tokens.some((token) => cleaned.includes(token))) {
      return rule.output;
    }
  }

  let bestPhrase = rawText;
  let bestScore = 0;

  for (const phrase of phrases) {
    const phraseClean = cleanText(phrase);
    let score = 0;

    if (phraseClean.includes(cleaned) && cleaned.length > 1) {
      score += 8;
    }

    for (const word of cleaned.split(" ")) {
      if (!word) continue;
      if (phraseClean.includes(word)) {
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestPhrase = phrase;
    }
  }

  return bestScore >= 2 ? bestPhrase : rawText;
}

export default function HomeScreen() {
  const [tab, setTab] = useState("speak");
  const [phrases, setPhrases] = useState([]);
  const [rawTranscript, setRawTranscript] = useState("");
  const [normalTranscript, setNormalTranscript] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState("Hold the mic to speak");
  const [newPhrase, setNewPhrase] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    loadPhrases();
    return () => stopTracks();
  }, []);

  async function loadPhrases() {
    try {
      const data = await getPhrases();
      setPhrases(data.phrases || []);
    } catch (err) {
      console.error(err);
    }
  }

  function stopTracks() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  async function startRecording() {
    if (isRecording) return;

    try {
      setIsRecording(true);
      setStatus("Listening...");
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          setStatus("Converting to normal wording...");

          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          const tx = await transcribe(audioBlob);
          const heard = tx.transcript || "";

          setRawTranscript(heard);

          let suggestionList = [];
          try {
            const sug = await suggest(heard, phrases);
            suggestionList = sug.suggestions || [];
            setSuggestions(suggestionList);
          } catch (err) {
            console.error(err);
            setSuggestions([]);
          }

          const normal = normalizeToPlainEnglish(heard, phrases, suggestionList);
          setNormalTranscript(normal);
          setStatus("Done");
        } catch (err) {
          console.error(err);
          setStatus("Could not transcribe");
        } finally {
          stopTracks();
          setIsRecording(false);
        }
      };

      recorder.start();
    } catch (err) {
      console.error(err);
      setStatus("Microphone access failed");
      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (!isRecording) return;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  function speakText(text) {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function useSuggestedPhrase(phrase) {
    setNormalTranscript(phrase);
    speakText(phrase);
  }

  async function handleSavePhrase() {
    const phrase = newPhrase.trim();
    if (!phrase) return;

    try {
      const result = await savePhrase(phrase);
      setPhrases(result.phrases || []);
      setNewPhrase("");
    } catch (err) {
      console.error(err);
      setStatus("Could not save phrase");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#02383d",
        color: "#8ce7df",
        padding: "32px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "3.2rem", fontWeight: 700 }}>synova</h1>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setTab("speak")}
            style={{
              padding: "14px 22px",
              borderRadius: "999px",
              border: "1px solid rgba(140,231,223,0.35)",
              background: tab === "speak" ? "rgba(140,231,223,0.18)" : "transparent",
              color: "#8ce7df",
              cursor: "pointer",
            }}
          >
            Speak
          </button>

          <button
            onClick={() => setTab("voicebank")}
            style={{
              padding: "14px 22px",
              borderRadius: "999px",
              border: "1px solid rgba(140,231,223,0.35)",
              background: tab === "voicebank" ? "rgba(140,231,223,0.18)" : "transparent",
              color: "#8ce7df",
              cursor: "pointer",
            }}
          >
            Voice Bank
          </button>
        </div>
      </div>

      {tab === "speak" && (
        <>
          <div
            style={{
              border: "1px solid rgba(140,231,223,0.18)",
              borderRadius: "28px",
              padding: "28px",
              minHeight: "120px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6cc8c2",
              fontSize: "1.2rem",
            }}
          >
            {status}
          </div>

          <div
            style={{
              borderRadius: "28px",
              padding: "28px",
              minHeight: "150px",
              marginBottom: "16px",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ color: "#74cfc8", marginBottom: "10px", fontSize: "0.95rem" }}>
              Normal wording
            </div>
            <div
              style={{
                color: normalTranscript ? "#c8fffb" : "#74cfc8",
                fontSize: "1.35rem",
                fontWeight: 600,
                minHeight: "32px",
              }}
            >
              {normalTranscript || "Your words will appear here"}
            </div>

            {rawTranscript && (
              <div style={{ marginTop: "18px", color: "#74cfc8", fontSize: "0.95rem" }}>
                Heard raw: {rawTranscript}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              style={{
                width: "180px",
                height: "180px",
                borderRadius: "999px",
                border: "none",
                background: isRecording ? "rgba(255,80,80,0.85)" : "rgba(140,231,223,0.18)",
                color: "#8ce7df",
                fontSize: "1.05rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 0 40px rgba(140,231,223,0.18)",
              }}
            >
              {isRecording ? "RELEASE TO STOP" : "HOLD TO RECORD"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <button
              onClick={() => speakText(normalTranscript)}
              style={{
                padding: "12px 20px",
                borderRadius: "14px",
                border: "none",
                background: "#8ce7df",
                color: "#02383d",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Speak aloud
            </button>
          </div>

          <div>
            <h3 style={{ color: "#8ce7df", marginBottom: "12px" }}>Closest normal phrases</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {suggestions.map((item) => (
                <button
                  key={item}
                  onClick={() => useSuggestedPhrase(item)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "999px",
                    border: "1px solid rgba(140,231,223,0.28)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#c8fffb",
                    cursor: "pointer",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "voicebank" && (
        <>
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ color: "#8ce7df", marginBottom: "12px" }}>Saved normal phrases</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
                marginBottom: "24px",
              }}
            >
              {phrases.map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => useSuggestedPhrase(phrase)}
                  style={{
                    minHeight: "76px",
                    padding: "16px",
                    borderRadius: "18px",
                    border: "1px solid rgba(140,231,223,0.18)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#c8fffb",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: "24px",
              padding: "20px",
            }}
          >
            <h3 style={{ color: "#8ce7df", marginTop: 0 }}>Add new normal phrase</h3>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <input
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="Type a phrase"
                style={{
                  flex: 1,
                  minWidth: "220px",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1px solid rgba(140,231,223,0.25)",
                  background: "rgba(0,0,0,0.12)",
                  color: "#c8fffb",
                  outline: "none",
                }}
              />

              <button
                onClick={handleSavePhrase}
                style={{
                  padding: "14px 18px",
                  borderRadius: "14px",
                  border: "none",
                  background: "#8ce7df",
                  color: "#02383d",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Save phrase
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
