import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// Global uncaught error listener to safeguard production builds
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    console.error("[FitPulse Production Error Handler]", event.error || event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.warn("[FitPulse Unhandled Promise Rejection]", event.reason);
  });
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary fallbackTitle="FitPulse Pro Application Recovery">
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}

