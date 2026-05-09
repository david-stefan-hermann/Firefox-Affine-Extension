// Firefox's Total Cookie Protection partitions cookies for cross-site iframes.
// Calling requestStorageAccess() unpartitions them so the session cookie is
// visible. Firefox auto-grants this without a user prompt when the user has
// visited the site as first-party in the last 30 days.
if (document.hasStorageAccess) {
  document.hasStorageAccess().then((hasAccess) => {
    if (!hasAccess) {
      document.requestStorageAccess().catch(() => {});
    }
  });
}

// Track the current URL (including SPA navigation) so the sidebar can restore
// the last visited page when it is reopened after being closed.
let lastSavedUrl = null;
setInterval(() => {
  const current = location.href;
  if (current !== lastSavedUrl) {
    lastSavedUrl = current;
    browser.runtime.sendMessage({ type: "saveUrl", url: current }).catch(() => {});
  }
}, 1000);
