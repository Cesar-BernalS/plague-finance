import React from "react";
import ReactDOM from "react-dom/client";
import Login from "./components/Login";
import "./index.css"; // Tailwind

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Login onLogin={(username) => console.log("Usuario:", username)} />
  </React.StrictMode>
);