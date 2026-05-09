const frame = document.getElementById("affine-frame");
const noUrl = document.getElementById("no-url");
const inlineUrl = document.getElementById("inline-url");
const inlineSave = document.getElementById("inline-save");

let currentUrl = null;

function loadUrl(url) {
  currentUrl = url || null;
  if (url) {
    frame.src = url;
    frame.style.display = "block";
    noUrl.style.display = "none";
  } else {
    frame.style.display = "none";
    noUrl.style.display = "flex";
  }
}

browser.storage.local.get("affineUrl").then(({ affineUrl }) => {
  loadUrl(affineUrl);
});

browser.storage.onChanged.addListener((changes) => {
  if (changes.affineUrl) {
    loadUrl(changes.affineUrl.newValue);
  }
});

inlineSave.addEventListener("click", () => {
  const url = inlineUrl.value.trim();
  if (!url || url === "https://") return;
  browser.storage.local.set({ affineUrl: url });
});

// Reload the iframe after OIDC auth windows close so the new session takes effect.
browser.runtime.onMessage.addListener((message) => {
  if (message.type === "reloadSidebar" && currentUrl) {
    frame.src = currentUrl;
  }
});
