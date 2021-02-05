
const synth = new Tone.PolySynth(Tone.Synth).toDestination();
Tone.start()
const notes = ['A','B','C','D','E','F'];
let min = 0;
let max = 1;
const queue = [];
let active = false;

const scale = (num, in_min, in_max, out_min, out_max) => {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

setInterval(() => {
  if (queue.length) {
    const v = queue.shift();
    const o = Math.round(scale(v, min, max, 6, 1));
    const d = scale(v, min, max, 0.1, 1);
    synth.triggerAttackRelease(`${notes[Math.round(Math.random() * (notes.length - 1))]}${o}`, d);
  }
}, 25);

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

console.log(chrome)

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
