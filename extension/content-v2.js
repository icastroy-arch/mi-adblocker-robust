// content-v2.js — AdSkipper mejorado
// ======================================

let currentConfig = {
  selectors: {
    videoPlayer: ".video-stream.html5-main-video",
    adContainer: ".ad-showing, .ytp-ad-player-overlay-layout, .ytp-ad-module",
    antiAdblockWall: ".ytp-enforcement-message-view-model, #efyt-container, .style-scope.yt-playability-error-supported-renderers",
    skipButtons: [
      ".ytp-skip-ad-button",
      ".ytp-ad-skip-button",
      ".ytp-ad-skip-button-modern",
      "button[id^='skip-button']",
      ".ytp-ad-skip-button-container button",
      "[class*='skip-button']"
    ]
  },
  settings: {
    autoMuteAds: true,
    fastForwardSpeed: 8,
    reportToBot: true,
    botEndpoint: "http://localhost:8791/report-ad"
  }
};

// Estado interno
let lastAdLogged = false;
let lastWallLogged = false;
let lastSkipClick = 0;

// ======================================
// CONFIG: escuchar actualizaciones del bot/background
// ======================================
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'CONFIG_UPDATE' && msg.config) {
    currentConfig = msg.config;
  }
});

// ======================================
// NÚCLEO: bypass de anuncios
// ======================================
function processAdBypasser() {
  const { selectors, settings } = currentConfig;
  const video = document.querySelector(selectors.videoPlayer);
  const isAdShowing = !!document.querySelector(selectors.adContainer)
    || document.body.classList.contains('ad-showing')
    || !!document.querySelector('.html5-video-player.ad-showing');

  // 1. Clic en TODOS los botones de skip visibles (throttle de 200ms)
  const now = Date.now();
  if (now - lastSkipClick > 200) {
    lastSkipClick = now;
    const skipSelectors = [
      ...(selectors.skipButtons || []),
      ".ytp-ad-text.ytp-ad-skip-button-text"
    ];
    skipSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(btn => {
        try {
          btn.click();
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        } catch (e) { /* nodo eliminado entre queries */ }
      });
    });
  }

  // 2. Silenciar / acelerar durante anuncio — y RESTAURAR después
  if (video) {
    if (isAdShowing) {
      if (settings.autoMuteAds && !video.muted) video.muted = true;

      // Fast-forward progresivo (evita rebobinado agresivo de YouTube)
      if (!isNaN(video.duration) && isFinite(video.duration) && video.duration > 0) {
        const targetRate = Math.min(settings.fastForwardSpeed, 8);
        if (video.playbackRate < targetRate) video.playbackRate = targetRate;
        // Saltar al final solo si falta más de 0.5s
        if (video.duration - video.currentTime > 0.5) {
          video.currentTime = video.duration - 0.05;
        }
      }
    } else if (video.muted && settings.autoMuteAds) {
      // Solo restaurar si el silencio no lo puso el usuario.
      // Heurística: restaurar si el video sigue reproduciéndose normal.
      video.muted = false;
      if (video.playbackRate > 1) video.playbackRate = 1;
    }
  }

  // 3. Aviso al bot — UNA SOLA VEZ por anuncio (edge-triggered)
  if (isAdShowing && !lastAdLogged) {
    lastAdLogged = true;
    reportAd('in-stream');
    console.log("[AdSkipper] 🚨 Anuncio detectado y procesado");
  } else if (!isAdShowing && lastAdLogged) {
    lastAdLogged = false;
    reportAd('ad-finished');
  }

  // 4. Muro anti-adblock — edge-triggered, no por tick
  const wall = document.querySelector(selectors.antiAdblockWall);
  const wallVisible = wall && wall.offsetWidth > 0 
    && wall.offsetHeight > 0 
    && wall.innerText.trim().length > 0;

  if (wallVisible && !lastWallLogged) {
    lastWallLogged = true;
    reportAd('anti-adblock-wall');
    console.log("[AdSkipper] 🧱 Muro de restricción desplegado");
  } else if (!wallVisible && lastWallLogged) {
    lastWallLogged = false;
  }
}

// ======================================
// REPORTE AL BOT (local server)
// ======================================
function reportAd(adType) {
  const payload = {
    type: 'AD_DETECTED',
    adType: adType,
    url: location.href,
    videoId: new URLSearchParams(location.search).get('v') || null,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent.slice(0, 100)
  };

  // 1. Notificación visual vía background
  chrome.runtime.sendMessage({
    type: 'NOTIFY',
    title: adType === 'anti-adblock-wall'
      ? 'AdSkipper: muro anti-adblock detectado'
      : 'AdSkipper: anuncio detectado y saltado',
    message: `Tipo: ${adType}`
  }).catch(() => {}); // sin listener en bg no crashea

  // 2. Reporte al servidor local del bot (fire-and-forget)
  if (currentConfig.settings.reportToBot) {
    fetch(currentConfig.settings.botEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {}); // bot apagado = silencioso
  }
}

// ======================================
// OBSERVERS: detección en tiempo real
// ======================================
// MutationObserver: dispara al instante cuando YouTube inyecta el DOM
const domObserver = new MutationObserver(() => {
  processAdBypasser();
});
domObserver.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class']
});

// Intervalo como red de seguridad (el observer puede perderse en SPA navigations)
setInterval(processAdBypasser, 1000);

// Re-iniciar observer en navegaciones SPA de YouTube
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    processAdBypasser();
  }
}).observe(document.body, { childList: true, subtree: true });