// When an OIDC auth popup closes the session cookie is now set, but the
// sidebar iframe still holds the old unauthenticated page. Reload it.
browser.windows.onRemoved.addListener(async () => {
  const { affineUrl } = await browser.storage.local.get("affineUrl");
  if (!affineUrl) return;
  // Small delay so the session cookie is fully written before we reload.
  setTimeout(() => {
    browser.runtime.sendMessage({ type: "reloadSidebar" }).catch(() => {});
  }, 300);
});
