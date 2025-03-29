import React from "react";
import { useNavigate } from "react-router-dom";

function LogoutButton({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    onLogout?.();
    navigate("/login");
  };

  return (
    <button onClick={handleLogout} className="cta-button">
      Odhlásiť sa
    </button>
  );
}

export default LogoutButton;
