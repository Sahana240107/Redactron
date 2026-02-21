chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_TEXT") {
    fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message.text }),
    })
      .then((res) => res.json())
      .then((data) => sendResponse({ result: data }))
      .catch((err) => {
        console.error("Background fetch error:", err);
        sendResponse({ result: null });
      });

    return true;
  }

  if (message.type === "FIREWALL_STATUS") {
    if (message.status === "BLOCK") {
      // Increment blockCount every time a new BLOCK is detected
      chrome.storage.local.get(["blockCount"], (data) => {
        const next = (data.blockCount || 0) + 1;
        chrome.storage.local.set({ blockCount: next });
      });

      // Auto-open popup
      chrome.action.openPopup();
    }
  }
});