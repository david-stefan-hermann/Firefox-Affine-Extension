# AFFiNE Sidebar Extension

A Firefox extension that embeds your self-hosted [AFFiNE](https://affine.pro) instance as a persistent sidebar panel.

## Loading in Firefox (temporary add-on)

1. Open Firefox and navigate to `about:debugging`
2. Click **This Firefox** in the left sidebar
3. Click **Load Temporary Add-on…**
4. Navigate to this folder and select `manifest.json`

The extension loads until Firefox is restarted. To persist it, the extension would need to be signed by Mozilla.

## Usage

- Click the **AFFiNE toolbar button** to open the popup.
- Enter your AFFiNE instance URL and click **Save**.
- Use **Toggle Sidebar** to open or close the sidebar panel.
- The URL can be changed at any time via the popup — the sidebar updates instantly.

## Troubleshooting

**Blank sidebar / iframe blocked**
Your AFFiNE server may be sending `X-Frame-Options: SAMEORIGIN` or a restrictive `Content-Security-Policy`. Add the following to your AFFiNE reverse proxy config (nginx example):

```nginx
add_header X-Frame-Options "ALLOWALL";
# or remove the header entirely
```

**Sidebar doesn't open**
Make sure the extension loaded without errors in `about:debugging → This Firefox`.

---

## Development notes

Issues encountered while building this extension, documented for reference.

### 1. `"windows"` is not a valid Firefox permission

**Problem:** Adding `"windows"` to the `permissions` array in `manifest.json` caused a manifest warning and the background script failed to initialize correctly. This permission exists in Chrome but not in Firefox.

**Reason:** Firefox exposes the `browser.windows` API (including `browser.windows.onRemoved`) without requiring an explicit permission declaration. The `"windows"` string is simply not in Firefox's recognized permission list.

**Fix:** Remove `"windows"` from `permissions`. The `browser.windows.*` API works without it.

---

### 2. OIDC login completes but the sidebar stays logged out

**Problem:** Clicking "Login with OIDC" opened a new Firefox window, the login completed successfully and the window closed, but the sidebar iframe still showed the logged-out state.

**Reason:** Firefox's **Total Cookie Protection (TCP)** partitions cookies by top-level site. When AFFiNE is opened in the OIDC popup window it is the top-level site, so the session cookie is written into the `affine.example.com` first-party partition. When AFFiNE is embedded as an iframe inside the extension sidebar (`moz-extension://…`), it is a cross-site iframe — its cookies live in a *different* partition and are not sent with requests. This was confirmed by a network HAR export which showed `"cookies": []` and the header `Sec-Fetch-Storage-Access: none` on every request to the AFFiNE server.

**Fix:** Use the [Storage Access API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_Access_API):

1. Add `allow="storage-access"` to the `<iframe>` element — this is required for the embedded page to be allowed to call the API at all.
2. Inject a content script into the AFFiNE page that calls `document.requestStorageAccess()` on load. Firefox auto-grants this without a user prompt when the user has visited the site as a first-party within the last 30 days.
3. Register the content script dynamically from `background.js` using `browser.contentScripts.register()` so it only targets the user's configured AFFiNE hostname rather than all websites.
4. Add `"*://*/*"` to `permissions` so the background script has the host access required to register content scripts for arbitrary URLs.

---

### 3. Iframe did not reload after re-assigning `src` to the same URL

**Problem:** After the OIDC popup closed, the background script sent a `reloadSidebar` message to the sidebar. The handler set `frame.src = currentUrl`, but Firefox did not always treat this as a navigation when the value was identical to the existing `src`.

**Fix:** Navigate through `about:blank` first, then assign the target URL after a short timeout. This guarantees Firefox sees it as a new navigation:

```js
frame.src = "about:blank";
setTimeout(() => { frame.src = url; }, 50);
```
