document.addEventListener("DOMContentLoaded", () => {
  const homeBtn    = document.getElementById("homeBtn");
  const riskStatus = document.getElementById("riskStatus");
  const redactBtn  = document.getElementById("redactBtn");

  homeBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  });

  function renderStatus(status) {
    if (status === "BLOCK") {
      riskStatus.textContent = "⚠️ Sensitive content detected!";
      riskStatus.className   = "risk-status danger";
      redactBtn.style.display = "block";
    } else if (status === "SAFE") {
      riskStatus.textContent = "✅ All Clear";
      riskStatus.className   = "risk-status safe";
      redactBtn.style.display = "none";
    } else {
      riskStatus.textContent = "Checking...";
      riskStatus.className   = "risk-status";
      redactBtn.style.display = "none";
    }
  }

  // Redact button — send message to content.js to replace the input text
  redactBtn.addEventListener("click", () => {
    chrome.storage.local.get(["redactedText"], (data) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "DO_REDACT",
          redactedText: data.redactedText || "***"
        });
        // Update popup to safe immediately
        renderStatus("SAFE");
      });
    });
  });

  // Load current status on popup open
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["firewallStatus"], (data) => {
      renderStatus(data.firewallStatus || null);
    });
  } else {
    renderStatus(null);
  }
});