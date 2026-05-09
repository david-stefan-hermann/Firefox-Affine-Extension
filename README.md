# AFFiNE Sidebar Extension

A Firefox extension that embeds your self-hosted [AFFiNE](https://affine.pro) instance as a persistent sidebar panel.

## Loading in Firefox (temporary add-on)

1. Open Firefox and navigate to `about:debugging`
2. Click **This Firefox** in the left sidebar
3. Click **Load Temporary Add-on…**
4. Navigate to this folder and select `manifest.json`

The extension loads until Firefox is restarted. For a permanent installation see the section below.

## Permanent installation

Temporary add-ons are removed on every Firefox restart. There are two ways to install the extension permanently.

### Option A — Self-distribution signing via AMO (regular Firefox)

Mozilla requires all extensions in regular Firefox to be signed. You can sign this extension for private use without publishing it publicly.

1. Create a free account at [addons.mozilla.org](https://addons.mozilla.org)
2. Go to **Developer Hub → Submit a New Add-on**
3. Choose **On your own** (self-distribution, not listed on AMO)
4. Zip the extension folder contents (not the folder itself) and upload the `.zip`
5. Fill in the required metadata and submit
6. Mozilla will review and sign it automatically (usually within minutes for simple extensions)
7. Download the signed `.xpi` file
8. In Firefox, open the `.xpi` file or drag it onto the browser — Firefox will install it permanently

### Option B — Firefox Developer Edition (no signing required)

Firefox Developer Edition allows installing unsigned extensions permanently.

1. Download [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/)
2. Open `about:config` and set `xpinstall.signatures.required` to `false`
3. Load the extension via `about:debugging → Load Temporary Add-on…` — it will survive restarts

> **Note:** This setting only works in Firefox Developer Edition and Firefox Nightly, not in regular Firefox.

---

## Usage

- Click the **AFFiNE toolbar button** to open the popup.
- Enter your AFFiNE instance URL and click **Save**.
- Use **Toggle Sidebar** to open or close the sidebar panel.
- The URL can be changed at any time via the popup — the sidebar updates instantly.
- The sidebar remembers the last page you were on and reopens there.

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

---

### 4. Sidebar always reopened on the home screen instead of the last visited page

**Problem:** Firefox unloads the sidebar page every time the sidebar is closed (by design, to conserve resources). This caused the AFFiNE iframe to reload from the base URL on every open, losing the user's position within the app.

**Reason:** There is no API to prevent the sidebar from unloading. Additionally, the content script used to track the current URL was registered with `allFrames` defaulting to `false`, which means it only injected into top-level browser frames — not into iframes. Since the AFFiNE page is loaded inside an `<iframe>` in `sidebar.html`, the content script never ran there and no URL was ever saved.

**Fix:**
1. Set `allFrames: true` when registering the content script so it injects into the AFFiNE iframe.
2. In `content.js`, poll `location.href` every second and send the current URL to the background script whenever it changes (covers SPA navigation via `history.pushState`).
3. The background script stores it as `affineLastUrl` in `browser.storage.local`.
4. On sidebar open, `sidebar.js` reads `affineLastUrl` and loads it instead of the base URL, provided it still belongs to the configured instance.
