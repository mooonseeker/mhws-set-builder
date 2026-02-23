/**
 * @fileoverview Application entry point for MHWS Set Builder.
 * Initializes core services and mounts the React application.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { MigrationReview } from "@/components/settings";
import { DataStorage } from "@/services/storage";

import App from "./App.tsx";

import "./index.css";

async function main() {
  const rootEl = document.getElementById("root");
  if (!rootEl) return;

  const root = createRoot(rootEl);

  try {
    // Initialize DataStorage before rendering the app
    const result = await DataStorage.initialize();

    if (result.status === "ready") {
      // Normal application startup
      root.render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
    } else if (result.status === "review_required") {
      // Manual migration review required
      root.render(
        <StrictMode>
          <MigrationReview analysis={result.analysis} />
        </StrictMode>,
      );
    } else {
      // Error status
      throw new Error(result.message);
    }
  } catch (error) {
    // Display error message if initialization fails
    console.error("Application initialization failed:", error);
    rootEl.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, -apple-system, sans-serif;">
        <div style="text-align: center; padding: 2rem; max-width: 500px;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">Initialization Failed</h1>
          <p style="color: #6b7280; margin-bottom: 1rem;">The application encountered an error during startup. Please try refreshing the page or clearing your browser data.</p>
          <p style="color: #9ca3af; font-size: 0.875rem;">Error Details: ${error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    `;
  }
}

// Start the application
void main().catch(console.error);
