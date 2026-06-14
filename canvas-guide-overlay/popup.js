// popup.js — toggles the overlay in the active tab when the button is clicked.
document.getElementById("toggle").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { action: "toggle" });
  } catch (e) {
    // Content script not present on this page (only runs on 8ballpool.com).
  }
  window.close();
});
