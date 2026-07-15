# 💻 React Core Telemetry Dashboard

A custom single-page administrative management console created using `Vite`, `React`, and clean runtime HTML styling layouts designed to display asynchronous system health metrics.

## ⚡ Functional Capabilities

- **Automatic Reconnect Architecture:** Internal heartbeat repair handlers that auto-detect network failures or backend dropouts, periodically attempting connection restoration loops every 2 seconds until the backend is restored.
- **Deterministic Property Normalization:** Built-in JSON data sanitizers that automatically parse variable casing properties (Pascal vs. Camel case mapping compatibility) smoothly.
- **Stateless Responsive Styles:** Adaptive grid panels that expand horizontally to match all display aspect profiles.

## 📦 In-Folder Execution Sequence

To prepare and boot up the UI environment modules:

```bash
# Ingest local node dependencies
npm install

# Run the local client compiler
npm run dev
```
