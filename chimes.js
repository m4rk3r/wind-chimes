
chrome.webRequest.onResponseStarted.addListener((details) => {
  console.log(details);
}, {urls: ["<all_urls>"]});
