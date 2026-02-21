document.addEventListener("DOMContentLoaded", () => {
  const homeBtn    = document.getElementById("homeBtn");
  const riskStatus = document.getElementById("riskStatus");

  homeBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  });

  function renderStatus(status) {
    if (status === "BLOCK") {
      riskStatus.textContent = "⚠️ AI Firewall: Sensitive content detected!";
      riskStatus.className   = "risk-status danger";
    } else if (status === "SAFE") {
      riskStatus.textContent = "✅ All Clear";
      riskStatus.className   = "risk-status safe";
    } else {
      riskStatus.textContent = "Checking...";
      riskStatus.className   = "risk-status";
    }
  }

  // Guard: only run if chrome.storage is available
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["firewallStatus"], (data) => {
      renderStatus(data.firewallStatus || null);
    });
  } else {
    renderStatus(null);
  }
});