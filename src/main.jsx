import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
// Import global CSS first
import "./css/global.css";
// Then import component-specific CSS
import "./css/Layout.css";
import "./css/Dashboard.css";
import "./css/Login.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
