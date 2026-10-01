const CONFIG_ENDPOINTS = [
  "http://localhost:8765/blocker-config.json", // Prioridad 1: Servidor Local
  "https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/config/blocker-config.json" // Prioridad 2: GitHub CDN
];

const ALARM_NAME = "syncConfigAlarm";

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 10 });
  fetchAndStoreConfig();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    fetchAndStoreConfig();
  }
});

async function fetchAndStoreConfig() {
  for (const url of CONFIG_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout rápido para el servidor local

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      if (data && data.selectors) {
        await chrome.storage.local.set({
          config: data,
          lastSyncSource: url,
          lastUpdated: new Date().toISOString()
        });
        console.log(`[AdSkipper] Configuración actualizada exitosamente desde: ${url}`);
        return; // Éxito: finaliza la búsqueda
      }
    } catch (err) {
      console.warn(`[AdSkipper] No se pudo obtener la configuración desde ${url}:`, err.message);
    }
  }
}