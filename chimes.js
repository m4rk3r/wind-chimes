
let min = 1;
let max = 1;
const queue = [];
let active = false;

const chimes = {
  A1: 'chimes/3bagbrew__barn-chime1.mp3',
  B1: 'chimes/3bagbrew__barn-chime2.mp3',
  C1: 'chimes/3bagbrew__barn-chime3.mp3',
  D1: 'chimes/3bagbrew__barn-chime4.mp3',
};

const notes = Object.keys(chimes).map(k => k.replace('1', ''));

const sampler = new Tone.Sampler({
  urls: chimes,
  release: 1,
  baseUrl: 'chime-src/files/'
}).toDestination();

const scale = (num, in_min, in_max, out_min, out_max) => {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

setInterval(() => {
  for (i = 0; i < 4 && queue.length > 0; i++) {
    const v = queue.shift();
    const o = Math.round(scale(v, min, max, 3, 1));
    const d = scale(v, min, max, 0.1, 1);
    sampler.triggerAttack(`${notes[Math.floor(Math.random() * notes.length)]}${o}`, Tone.now(), d);
  }
}, 50);

const unpack = (details) => {
  const cl = details.responseHeaders.find(h => h.name.match(/content-length/i));
  if (cl) {
    min = Math.min(min, cl.value);
    max = Math.max(max, cl.value);
    queue.push(cl.value);
  } else {
    console.log('Content-Length not found', details.responseHeaders);
  }
}

chrome.storage.local.get('wcEnabled', (res) => {
  chrome.browserAction.setIcon({ path: {
    '16': `${res.wcEnabled?'on':'off'}.png`,
  }});


  if (res.wcEnabled) {
    chrome.webRequest.onResponseStarted.addListener(unpack, {urls: ["<all_urls>"]}, ["responseHeaders"]);
  }
})


chrome.browserAction.onClicked.addListener((tab) => {
  chrome.storage.local.get(['wcEnabled'], res => {
    const enabled = !res.wcEnabled;

    // update storage
    chrome.storage.local.set({'wcEnabled': enabled});

    chrome.browserAction.setIcon({ path: {
      '16': `${enabled?'on':'off'}.png`,
    }});

    // notify content script
    if (enabled) {
      chrome.webRequest.onResponseStarted.addListener(unpack, {urls: ["<all_urls>"]}, ["responseHeaders"]);
    } else {
      chrome.webRequest.onResponseStarted.removeListener(unpack);
    }
  });
});
