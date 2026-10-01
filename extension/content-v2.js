let currentConfig = {
  selectors: {
    adSkipButton: [
      ".ytp-skip-ad-button",
      ".ytp-ad-skip-button",
      ".ytp-ad-skip-button-modern",
      "button[id^='skip-button']",
      ".ytp-ad-skip-button-container button"
    ].join(", "),
    adContainer: ".ad-showing, .ad-interrupting, .ytp-ad-overlay-open",
    videoPlayer: ".html5-main-video",
    antiAdblockWall: "yt-playability-error-supported-renderers"
  },
  settings: { autoMuteAds: true, fastForwardSpeed: 16.0 }
};

// Cargar configuración inicial desde storage local
chrome.storage.local.get(["config"], (result) => {
  if (result.config) {
    currentConfig = result.config;
  }
  initEngine();
});

// Listener para actualización en caliente
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.config) {
    currentConfig = changes.config.newValue;
    console.log("[AdSkipper Content] Configuración reloaded en caliente:", currentConfig);
  }
});

function processAdBypasser() {
  const { selectors, settings } = currentConfig;
  const video = document.querySelector(selectors.videoPlayer);
  const isAdShowing = document.querySelector(selectors.adContainer);
  const skipButton = document.querySelector(selectors.adSkipButton);

  // 1. Clic automático e inmediato en el botón de saltar
  if (skipButton) {
    skipButton.click();
  }

  // 2. Aceleración y silencio automático durante el anuncio
  if (isAdShowing && video) {
    if (settings.autoMuteAds && !video.muted) {
      video.muted = true;
    }
    if (!isNaN(video.duration) && isFinite(video.duration)) {
      video.playbackRate = settings.fastForwardSpeed;
      video.currentTime = video.duration - 0.1;
    }
  }

  // 3. Detección real de muro Anti-Adblock (solo si el elemento es visible)
  const wall = document.querySelector(selectors.antiAdblockWall);
  if (wall && wall.offsetWidth > 0 && wall.offsetHeight > 0) {
    console.log("[AdSkipper] Muro de restricción desplegado en pantalla.");
  }
}

function initEngine() {
  const observer = new MutationObserver(() => processAdBypasser());
  observer.observe(document.body, { childList: true, subtree: true });
}