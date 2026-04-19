import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PatientProvider } from "./context/PatientContext";
import LoginScreen   from "./screens/LoginScreen";
import SignUpScreen  from "./screens/SignUpScreen";
import HomeScreen    from "./screens/HomeScreen";
import SpeakScreen   from "./screens/SpeakScreen";
import WalkScreen    from "./screens/WalkScreen";

function App() {
  return (
    <PatientProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/welcome"    element={<LoginScreen />} />
          <Route path="/signup"     element={<SignUpScreen />} />
          <Route path="/home"       element={<HomeScreen />} />
          <Route path="/speak"      element={<SpeakScreen />} />
          <Route path="/walk"       element={<WalkScreen />} />
          <Route path="/banking"    element={<Navigate to="/speak" replace />} />
          <Route path="/login-form" element={<Navigate to="/home" replace />} />
          <Route path="/"           element={<Navigate to="/welcome" replace />} />
          <Route path="*"           element={<Navigate to="/welcome" replace />} />
        </Routes>
      </BrowserRouter>
    </PatientProvider>
  );
}

export default App;