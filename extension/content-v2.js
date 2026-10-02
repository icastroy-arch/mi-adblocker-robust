function processAdBypasser() {
  const { selectors, settings } = currentConfig;
  const video = document.querySelector(selectors.videoPlayer);
  const isAdShowing = document.querySelector(selectors.adContainer);

  // Selectores expandidos para capturar la estructura moderna de YouTube
  const skipSelectors = [
    ".ytp-skip-ad-button",
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-modern",
    "button[id^='skip-button']",
    ".ytp-ad-skip-button-container button",
    "[class*='skip-button']",
    ".ytp-ad-text.ytp-ad-skip-button-text"
  ];

  // 1. Clic automático e inmediato en cualquier botón de saltar encontrado
  skipSelectors.forEach(selector => {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.click();
      // Generar evento de clic nativo por si la librería interna de YouTube ignora el .click()
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  });

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

 // 3. Detección real de muro Anti-Adblock
  const wall = document.querySelector(selectors.antiAdblockWall);
  if (wall && wall.offsetWidth > 0 && wall.offsetHeight > 0 && wall.innerText.length > 0) {
    console.log("[AdSkipper] Muro de restricción desplegado en pantalla.");
  }
}