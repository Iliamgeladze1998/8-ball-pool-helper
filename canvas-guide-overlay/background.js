// background.js — Manifest V3 service worker
// Listens for the global Alt+G command and toggles the overlay in the active tab.

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-overlay") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs?.[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: "toggle" }).catch(() => {});
    });
  }
});

// Also allow clicking the toolbar icon to toggle
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "toggle" }).catch(() => {});
});
