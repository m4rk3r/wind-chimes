
const defaultOn = 80;
const slider = document.querySelector('#chime-volume');

chrome.runtime.sendMessage({volume: -1}, (res) => {
  slider.value = res.volume;
});

slider.addEventListener('input', (e) => {
  chrome.runtime.sendMessage({volume: e.target.value});
});

document.querySelector('#on').addEventListener('click', (e) => {
  chrome.runtime.sendMessage({volume: defaultOn});
  slider.value = defaultOn;
});

document.querySelector('#off').addEventListener('click', (e) => {
  chrome.runtime.sendMessage({volume: 0});
  slider.value = 0;
});
