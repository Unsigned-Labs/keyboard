chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ isEnabled: true });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getState") {
    chrome.storage.sync.get("isEnabled", (data) => {
      sendResponse({ isEnabled: data.isEnabled });
    });
    return true;
  } else if (request.action === "toggleState") {
    chrome.storage.sync.get("isEnabled", (data) => {
      const newState = !data.isEnabled;
      chrome.storage.sync.set({ isEnabled: newState });
      sendResponse({ isEnabled: newState });
    });
    return true;
  }
});
