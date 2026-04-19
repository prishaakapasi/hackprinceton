import { createContext, useContext, useEffect, useState } from "react";
import { getPhrases } from "../api";

const DEFAULT_PHRASES = [
  "I need water",
  "I need help",
  "I am okay",
  "Please wait",
  "Call my daughter",
  "I need to sit down",
];

const PatientContext = createContext(null);

export function PatientProvider({ children }) {
  const savedName = localStorage.getItem("synova-name") || "";
  const savedTheme = localStorage.getItem("synova-theme") || "dark";

  const [name, setName] = useState(savedName);
  const [medOn, setMedOn] = useState(true);
  const [theme, setTheme] = useState(savedTheme);
  const [phrases, setPhrases] = useState(DEFAULT_PHRASES);
  const [voiceProfile, setVoiceProfile] = useState({
    saved: false,
    phraseCount: 0,
    elevenLabsId: null,
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("synova-theme", theme);
  }, [theme]);

  useEffect(() => {
    async function loadBackendPhrases() {
      try {
        const data = await getPhrases();
        if (Array.isArray(data.phrases) && data.phrases.length > 0) {
          setPhrases(data.phrases);
        }
      } catch (err) {
        console.error("failed to load phrases", err);
      }
    }

    loadBackendPhrases();
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const addPhrase = (p) =>
    setPhrases((prev) => (prev.includes(p) ? prev : [...prev, p]));

  const removePhrase = (p) =>
    setPhrases((prev) => prev.filter((x) => x !== p));

  const logout = () => {
    localStorage.removeItem("synova-name");
    localStorage.removeItem("synova-theme");
    setName("");
    setTheme("dark");
    setMedOn(true);
    setPhrases(DEFAULT_PHRASES);
    setVoiceProfile({ saved: false, phraseCount: 0, elevenLabsId: null });
  };

  return (
    <PatientContext.Provider
      value={{
        name,
        setName,
        medOn,
        setMedOn,
        theme,
        toggleTheme,
        phrases,
        setPhrases,
        addPhrase,
        removePhrase,
        voiceProfile,
        setVoiceProfile,
        logout,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatient must be used inside PatientProvider");
  return ctx;
}
