import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ConfigProvider } from "./context/ConfigContext.jsx";

// Reset CSS minimale — i componenti usano inline styles
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
