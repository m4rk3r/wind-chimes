
let min = 1;
let max = 1;
const queue = [];
let active = false;
let volume = 0;

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

const linearToLog = (val) => {
  return 6.02 * Math.log2(val) - 40;
};

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

chrome.storage.local.get('windChimesVolume', (res) => {
  if (['number', 'string'].includes(typeof res.windChimesVolume)) {
    volume = parseInt(res.windChimesVolume);
    chrome.browserAction.setIcon({ path: {
      '16': `${volume > 0 ?'on':'off'}.png`,
    }});


    if (volume > 0) {
      console.log('setting vol', volume)
      chrome.webRequest.onResponseStarted.addListener(unpack, {urls: ["<all_urls>"]}, ["responseHeaders"]);
      sampler.volume.value = linearToLog(volume);
    }
  } else {
    chrome.browserAction.setIcon({ path: {
      '16': 'off.png',
    }});
  }
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.hasOwnProperty('volume')) {
    // get current volume on popup open
    const vol = parseInt(request.volume);
    if (vol === -1) {
      sendResponse({volume});
    } else { // set volume
      if (vol > 0 && volume === 0) {
        chrome.browserAction.setIcon({ path: {
          '16': 'on.png',
        }});
        chrome.webRequest.onResponseStarted.addListener(unpack, {urls: ["<all_urls>"]}, ["responseHeaders"]);
      } else if (vol === 0 && volume > 0) {
        chrome.browserAction.setIcon({ path: {
          '16': 'off.png',
        }});
        chrome.webRequest.onResponseStarted.removeListener(unpack);
      }

      chrome.storage.local.set({'windChimesVolume': vol});

      volume = vol;
      sampler.volume.value = linearToLog(vol);
    }
  }
});
