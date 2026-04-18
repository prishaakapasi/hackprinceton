import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PatientProvider } from "./context/PatientContext";
import LoginScreen   from "./screens/LoginScreen";
import SignUpScreen  from "./screens/SignUpScreen";
import HomeScreen    from "./screens/HomeScreen";

function App() {
  return (
    <PatientProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/welcome"    element={<LoginScreen />} />
          <Route path="/signup"     element={<SignUpScreen />} />
          <Route path="/"           element={<HomeScreen />} />
          <Route path="*"           element={<Navigate to="/welcome" />} />
        </Routes>
      </BrowserRouter>
    </PatientProvider>
  );
}

export default App;