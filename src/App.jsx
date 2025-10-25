import React from "react";
import Login from "./components/Login";

export default function App() {
  const handleLogin = (username) => {
    console.log("Usuario logged:", username);
  };

  return (
    <div>
      <Login onLogin={handleLogin} />
    </div>
  );
}

