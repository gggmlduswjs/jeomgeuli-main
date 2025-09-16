import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

const containerId = "root";
let container = document.getElementById(containerId);
if (!container) {
  container = document.createElement("div");
  container.id = containerId;
  document.body.appendChild(container);
}

const Fallback = () => <div style={{ padding:16 }}>로딩 중...</div>;

// 전역 헬스 체크 초기화
(window as any).__APP_HEALTH__ = { 
  buildTime: new Date().toISOString(),
  cssLoaded: true,
  routesReady: false,
  appMounted: false
};

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<Fallback />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(()=>{});
  });
}
