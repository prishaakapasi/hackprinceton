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
          <Route path="/"           element={<HomeScreen />} />
          <Route path="/speak"      element={<SpeakScreen />} />
          <Route path="/walk"       element={<WalkScreen />} />
          <Route path="/banking"    element={<Navigate to="/speak" />} />
          <Route path="/login-form" element={<Navigate to="/" />} />
          <Route path="*"           element={<Navigate to="/welcome" />} />
        </Routes>
      </BrowserRouter>
    </PatientProvider>
  );
}

export default App;