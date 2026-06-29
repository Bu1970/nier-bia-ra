import React from "react";
import ReactDOM from "react-dom/client";
import { ProcessViewDemo } from "./views/ProcessView.jsx";

// Reset CSS minimale — i componenti usano inline styles
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProcessViewDemo />
  </React.StrictMode>
);
