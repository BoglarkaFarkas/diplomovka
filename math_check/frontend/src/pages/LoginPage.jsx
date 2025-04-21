import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const handleLogin = async (credentialResponse, retry = false) => {
    try {
      const id_token = credentialResponse.credential;

      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_token }),
      });

      if (res.status === 401 && !retry) {
        console.warn("Token ešte nebol validný.");
        setTimeout(() => handleLogin(credentialResponse, true), 1000);
        return;
      }

      const data = await res.json();

      if (data.access_token) {
        localStorage.setItem("jwtToken", data.access_token);
        onLogin();
        navigate("/");
      } else {
        console.error("Chyba pri prihlaseni.");
      }
    } catch (err) {
      console.error("Chyba pri prihlaseni:", err);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card">
        <h1>Vitajte na MathCheck</h1>
        <p className="subtitle">
          Prihláste sa pomocou svojho Google účtu, aby ste mohli pokračovať.
        </p>
        <GoogleLogin
          onSuccess={handleLogin}
          onError={() => console.log("Chyba pri prihlaseni.")}
          useOneTap
        />
      </div>
    </div>
  );
}

export default LoginPage;
