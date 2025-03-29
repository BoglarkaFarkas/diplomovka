import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import TestChecker from "./pages/TestChecker";
import MatrixCalculator from "./pages/MatrixCalculator";
import TestResults from "./pages/TestResults";
import PrivateRoute from "./components/PrivateRoute";
import LogoutButton from "./components/LogoutButton";
import "./AppD.css";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch (e) {
      return false;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    setIsLoggedIn(false);
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Router>
        <div className="app-container">
          <nav className="main-nav">
            <div className="nav-brand">MathCheck</div>
            <div className="nav-links">
              <Link to="/" className="nav-link">
                Domov
              </Link>
              {isLoggedIn ? (
                <>
                  <Link to="/test-checker" className="nav-link">
                    Kontrola testu
                  </Link>
                  <Link to="/test-results" className="nav-link">
                    Pridanie úloh
                  </Link>
                  <Link to="/calculators" className="nav-link">
                    Kalkulačky
                  </Link>
                  <LogoutButton onLogout={handleLogout} />
                </>
              ) : (
                <Link to="/login" className="nav-link">
                  Prihlásenie
                </Link>
              )}
            </div>
          </nav>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={<LoginPage onLogin={() => setIsLoggedIn(true)} />}
            />
            <Route
              path="/test-checker"
              element={
                <PrivateRoute isLoggedIn={isLoggedIn}>
                  <TestChecker />
                </PrivateRoute>
              }
            />
            <Route
              path="/test-results"
              element={
                <PrivateRoute isLoggedIn={isLoggedIn}>
                  <TestResults />
                </PrivateRoute>
              }
            />
            <Route
              path="/calculators"
              element={
                <PrivateRoute isLoggedIn={isLoggedIn}>
                  <MatrixCalculator />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
