// When an auth popup (OIDC) closes, the sidebar iframe still holds the old
// unauthenticated page. Reload it so the new session cookie takes effect.
browser.windows.onRemoved.addListener(async () => {
  const { affineUrl } = await browser.storage.local.get("affineUrl");
  if (!affineUrl) return;
  browser.runtime.sendMessage({ type: "reloadSidebar" }).catch(() => {});
});
