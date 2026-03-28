const API_URL = "http://localhost:5000/api/focus/active";

const DISTRACTING_SITES = ["youtube.com", "facebook.com", "reddit.com", "twitter.com", "instagram.com", "tiktok.com", "netflix.com"];

let isFocusActive = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "CHECK_BLOCK") {
    const url = request.url || "";
    const isDistracting = DISTRACTING_SITES.some(site => url.includes(site));
    sendResponse({ shouldBlock: isDistracting && isFocusActive });
  }

  if (request.type === "SET_FOCUS_STATE") {
    isFocusActive = request.active;
    chrome.storage.local.set({ isFocusActive: request.active });
    sendResponse({ success: true });
  }
});

chrome.storage.local.get(["isFocusActive"], (res) => {
  if (res.isFocusActive !== undefined) {
    isFocusActive = res.isFocusActive;
  }
});
