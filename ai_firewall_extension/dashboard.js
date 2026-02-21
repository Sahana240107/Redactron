document.addEventListener("DOMContentLoaded", () => {
  const buddy        = document.getElementById("aiBuddy");
  const panel        = document.getElementById("contactPanel");
  const riskNumber   = document.querySelector(".risk-number");
  const statusBtn    = document.querySelector(".status");
  const statusSpan   = document.querySelector(".status span");

  // ── AI Buddy toggle ────────────────────────────────────────────────────────
  buddy.addEventListener("click", () => {
    panel.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!buddy.contains(e.target) && !panel.contains(e.target)) {
      panel.classList.remove("show");
    }
  });

  // ── Render helpers ─────────────────────────────────────────────────────────
  function renderCount(count) {
    riskNumber.textContent = count || 0;
  }

  function renderStatus(status) {
    if (status === "BLOCK") {
      statusSpan.textContent     = "⚠️ System Status: THREAT DETECTED";
      statusBtn.style.background = "#c0392b";
    } else if (status === "SAFE") {
      statusSpan.textContent     = "✅ System Status: ALL CLEAR";
      statusBtn.style.background = "#888B5D";
    } else {
      statusSpan.textContent     = "🔍 System Status: MONITORING";
      statusBtn.style.background = "#888B5D";
    }
  }

  // ── Initial load ───────────────────────────────────────────────────────────
  chrome.storage.local.get(["firewallStatus", "blockCount"], (data) => {
    renderCount(data.blockCount || 0);
    renderStatus(data.firewallStatus || null);
  });

  // ── Live updates via storage ───────────────────────────────────────────────
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.firewallStatus) renderStatus(changes.firewallStatus.newValue);
    if (changes.blockCount)     renderCount(changes.blockCount.newValue);
  });
});