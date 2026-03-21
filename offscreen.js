let min = 1;
let max = 1;
const queue = [];
let volume = 0;
let iter = null;

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
  if (in_max === in_min) return (out_min + out_max) / 2;
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

const linearToLog = (val) => {
  if (val <= 0) return -Infinity;
  return 6.02 * Math.log2(val) - 40;
};

const startLoop = () => {
  if (iter) return;
  iter = setInterval(() => {
    for (let i = 0; i < 4 && queue.length > 0; i++) {
      const v = queue.shift();
      const o = Math.round(scale(v, min, max, 3, 1));
      const d = scale(v, min, max, 0.1, 1);
      sampler.triggerAttack(`${notes[Math.floor(Math.random() * notes.length)]}${o}`, Tone.now(), d);
    }
  }, 50);
};

const stopLoop = () => {
  clearInterval(iter);
  iter = null;
  queue.length = 0;
};

chrome.runtime.onMessage.addListener((request) => {
  if (!request.type) return;

  switch (request.type) {
    case 'packet': {
      const size = request.size;
      min = Math.min(min, size);
      max = Math.max(max, size);
      queue.push(size);
      break;
    }
    case 'start':
      volume = request.volume;
      sampler.volume.value = linearToLog(volume);
      Tone.start();
      startLoop();
      break;
    case 'stop':
      stopLoop();
      break;
    case 'volume':
      volume = request.value;
      sampler.volume.value = linearToLog(volume);
      break;
  }
});
