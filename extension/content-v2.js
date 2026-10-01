let currentConfig = {
  selectors: {
    adSkipButton: ".ytp-skip-ad-button, .ytp-ad-skip-button",
    adContainer: ".ad-showing, .ad-interrupting",
    videoPlayer: ".html5-main-video",
    antiAdblockWall: "yt-playability-error-supported-renderers"
  },
  settings: { autoMuteAds: true, fastForwardSpeed: 16.0 }
};

// Cargar configuración inicial
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

  // 1. Clic automático en botón de saltar
  if (skipButton) {
    skipButton.click();
  }

  // 2. Aceleración y silenciamiento si el anuncio está activo
  if (isAdShowing && video) {
    if (settings.autoMuteAds && !video.muted) {
      video.muted = true;
    }
    if (!isNaN(video.duration) && isFinite(video.duration)) {
      video.playbackRate = settings.fastForwardSpeed;
      video.currentTime = video.duration - 0.1;
    }
  }

  // 3. Detección de muros Anti-Adblock
  const wall = document.querySelector(selectors.antiAdblockWall);
  if (wall) {
    console.warn("[AdSkipper] Detección de muro de restricción de YouTube activa.");
  }
}

function initEngine() {
  const observer = new MutationObserver(() => processAdBypasser());
  observer.observe(document.body, { childList: true, subtree: true });
}