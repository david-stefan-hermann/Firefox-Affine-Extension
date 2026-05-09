let registeredScript = null;

async function registerStorageAccessScript(url) {
  if (registeredScript) {
    await registeredScript.unregister().catch(() => {});
    registeredScript = null;
  }
  if (!url) return;
  try {
    const { protocol, hostname } = new URL(url);
    registeredScript = await browser.contentScripts.register({
      matches: [`${protocol}//${hostname}/*`],
      js: [{ file: "content.js" }],
      runAt: "document_start",
      allFrames: true,
    });
  } catch (e) {}
}

browser.storage.local.get("affineUrl").then(({ affineUrl }) => {
  if (affineUrl) registerStorageAccessScript(affineUrl);
});

browser.storage.onChanged.addListener((changes) => {
  if (changes.affineUrl) {
    registerStorageAccessScript(changes.affineUrl.newValue);
    // Clear the saved last URL when the base URL changes.
    browser.storage.local.remove("affineLastUrl");
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.type === "saveUrl") {
    browser.storage.local.set({ affineLastUrl: message.url });
  }
});

// After the OIDC popup closes, reload the sidebar so the now-unpartitioned
// session cookie is picked up on the fresh load.
browser.windows.onRemoved.addListener(async () => {
  const { affineUrl } = await browser.storage.local.get("affineUrl");
  if (!affineUrl) return;
  setTimeout(() => {
    browser.runtime.sendMessage({ type: "reloadSidebar" }).catch(() => {});
  }, 300);
});
