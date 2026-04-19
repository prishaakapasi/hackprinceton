import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PatientProvider } from "./context/PatientContext";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import SpeakScreen from "./screens/SpeakScreen";
import WalkScreen from "./screens/WalkScreen";

function App() {
  return (
    <PatientProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="/welcome" element={<LoginScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup" element={<SignUpScreen />} />

          <Route path="/home" element={<Navigate to="/speak" replace />} />
          <Route path="/speak" element={<SpeakScreen />} />
          <Route path="/walk" element={<WalkScreen />} />

          <Route path="/compare" element={<Navigate to="/speak" replace />} />
          <Route path="*" element={<Navigate to="/speak" replace />} />
        </Routes>
      </BrowserRouter>
    </PatientProvider>
  );
}

export default App;
