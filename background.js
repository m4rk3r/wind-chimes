let volume = 0;

function sendToOffscreen(message) {
  chrome.runtime.sendMessage(message).catch(() => {});
}

const unpack = (details) => {
  const cl = details.responseHeaders.find(h => h.name.match(/content-length/i));
  if (cl) {
    const size = parseInt(cl.value, 10);
    if (!isNaN(size)) {
      sendToOffscreen({ type: 'packet', size });
    }
  }
};

async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Playing wind chime audio samples based on network traffic'
  });
}

async function closeOffscreen() {
  if (await chrome.offscreen.hasDocument()) {
    await chrome.offscreen.closeDocument();
  }
}

async function activate(vol) {
  volume = vol;
  chrome.action.setIcon({ path: { '16': 'on.png' } });
  await ensureOffscreen();
  chrome.webRequest.onResponseStarted.addListener(unpack, { urls: ["<all_urls>"] }, ["responseHeaders"]);
  sendToOffscreen({ type: 'start', volume: vol });
}

async function deactivate() {
  volume = 0;
  chrome.action.setIcon({ path: { '16': 'off.png' } });
  chrome.webRequest.onResponseStarted.removeListener(unpack);
  sendToOffscreen({ type: 'stop' });
  await closeOffscreen();
}

// Restore state on service worker startup
chrome.storage.local.get('windChimesVolume', async (res) => {
  if (['number', 'string'].includes(typeof res.windChimesVolume)) {
    const vol = parseInt(res.windChimesVolume, 10);
    if (vol > 0) {
      await activate(vol);
    } else {
      chrome.action.setIcon({ path: { '16': 'off.png' } });
    }
  } else {
    chrome.action.setIcon({ path: { '16': 'off.png' } });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.hasOwnProperty('volume')) {
    const vol = parseInt(request.volume, 10);
    if (vol === -1) {
      sendResponse({ volume });
      return;
    }

    if (vol > 0 && volume === 0) {
      activate(vol).then(() => {
        chrome.storage.local.set({ 'windChimesVolume': vol });
      });
    } else if (vol === 0 && volume > 0) {
      deactivate().then(() => {
        chrome.storage.local.set({ 'windChimesVolume': vol });
      });
    } else if (vol > 0) {
      volume = vol;
      chrome.storage.local.set({ 'windChimesVolume': vol });
      sendToOffscreen({ type: 'volume', value: vol });
    }
  }
});
