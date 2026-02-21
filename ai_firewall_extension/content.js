console.log("AI FIREWALL CONTENT SCRIPT LOADED");

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

async function checkTextWithAPI(text) {
  try {
    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log("API response:", data);
    return data;
  } catch (error) {
    console.error("AI Firewall API error:", error);
    return null;
  }
}

function redactElement(el, redactedText) {
  const textToSet = redactedText || "***";

  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    const proto = el.tagName === "INPUT"
      ? window.HTMLInputElement.prototype
      : window.HTMLTextAreaElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value");
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(el, textToSet);
    } else {
      el.value = textToSet;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (el.isContentEditable) {
    el.innerText = textToSet;
  }
}

// Keep track of the last flagged input element and redacted text
let lastFlaggedElement = null;

const handleInput = debounce(async (event) => {
  const el = event.target;

  const isTypable =
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable;

  if (!isTypable) return;

  const text = (el.value || el.innerText || "").trim();
  console.log("Detected input:", text);

  if (text.length <= 3) return;

  const result = await checkTextWithAPI(text);
  const status = (result && result.action === "BLOCK") ? "BLOCK" : "SAFE";

  if (status === "BLOCK") {
    // Save the element and redacted text — wait for user to click Redact in popup
    lastFlaggedElement = el;
    chrome.storage.local.set({
      firewallStatus: status,
      redactedText: result.redacted_text || "***"
    });
  } else {
    lastFlaggedElement = null;
    chrome.storage.local.set({ firewallStatus: status, redactedText: null });
  }

  chrome.runtime.sendMessage({ type: "FIREWALL_STATUS", status });

}, 300);

// Listen for redact command from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "DO_REDACT" && lastFlaggedElement) {
    redactElement(lastFlaggedElement, message.redactedText);
    lastFlaggedElement = null;
    chrome.storage.local.set({ firewallStatus: "SAFE", redactedText: null });
    chrome.runtime.sendMessage({ type: "FIREWALL_STATUS", status: "SAFE" });
  }
});

document.addEventListener("input", handleInput, true);
document.addEventListener("keyup", handleInput, true);

function attachToShadowInputs(root) {
  root.querySelectorAll("input, textarea").forEach((el) => {
    if (el.dataset.firewallAttached) return;
    el.dataset.firewallAttached = "true";
    el.addEventListener("input", handleInput, true);
    el.addEventListener("keyup", handleInput, true);
    console.log("AI Firewall attached to:", el);
  });
}

const observer = new MutationObserver(() => {
  attachToShadowInputs(document);
  document.querySelectorAll("*").forEach((el) => {
    if (el.shadowRoot) attachToShadowInputs(el.shadowRoot);
  });
});

observer.observe(document.body, { childList: true, subtree: true });
attachToShadowInputs(document);