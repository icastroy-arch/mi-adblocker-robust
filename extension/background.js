chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'NOTIFY') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: msg.title,
      message: msg.message
    });
  }
  if (msg.type === 'CONFIG_UPDATE') { /* reenviar al content script */ }
});