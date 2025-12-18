import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { DataStorage } from "@/services/DataStorage";

import App from "./App.tsx";

async function main() {
  try {
    // Initialize DataStorage before rendering the app
    await DataStorage.initialize();

    // Render the React application
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (error) {
    // Display error message if initialization fails
    console.error("Application initialization failed:", error);
    const rootEl = document.getElementById("root");
    if (rootEl) {
      rootEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, -apple-system, sans-serif;">
          <div style="text-align: center; padding: 2rem; max-width: 500px;">
            <h1 style="color: #dc2626; margin-bottom: 1rem;">初始化失败</h1>
            <p style="color: #6b7280; margin-bottom: 1rem;">应用程序在启动时遇到错误。请尝试刷新页面或清除浏览器数据后重试。</p>
            <p style="color: #9ca3af; font-size: 0.875rem;">错误详情: ${error instanceof Error ? error.message : String(error)}</p>
          </div>
        </div>
      `;
    }
  }
}

// Start the application
void main().catch(console.error);
