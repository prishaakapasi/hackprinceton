import { createContext, useContext, useState, useEffect } from "react";

const PatientContext = createContext(null);

export function PatientProvider({ children }) {
  const savedName  = localStorage.getItem("synova-name")  || "";
  const savedTheme = localStorage.getItem("synova-theme") || "dark";

  const [name, setName]           = useState(savedName);
  const [medOn, setMedOn]         = useState(true);
  const [theme, setTheme]         = useState(savedTheme);
  const [phrases, setPhrases]     = useState([
    "I need water",
    "I'm in pain",
    "Call my daughter",
    "I'm tired",
    "Thank you",
    "Yes",
    "No",
    "I need my medication",
    "I'd like to go outside",
    "Good morning",
  ]);
  const [voiceProfile, setVoiceProfile] = useState({
    saved: false,
    phraseCount: 0,
    elevenLabsId: null,
  });

  // Apply theme to document on mount and whenever it changes
  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("synova-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  const addPhrase    = (p) => setPhrases((prev) => [...prev, p]);
  const removePhrase = (p) => setPhrases((prev) => prev.filter((x) => x !== p));

  return (
    <PatientContext.Provider value={{
      name, setName,
      medOn, setMedOn,
      theme, toggleTheme,
      phrases, addPhrase, removePhrase,
      voiceProfile, setVoiceProfile,
    }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatient must be used inside PatientProvider");
  return ctx;
}
