# AFFiNE Sidebar Extension

A Firefox extension that embeds your self-hosted [AFFiNE](https://affine.pro) instance as a persistent sidebar panel.

## Configuration

Open `config.js` and replace the placeholder with your AFFiNE URL:

```js
const AFFINE_URL = "https://your-affine-instance.example.com";
```

This is the only place you need to change.

## Loading in Firefox (temporary add-on)

1. Open Firefox and navigate to `about:debugging`
2. Click **This Firefox** in the left sidebar
3. Click **Load Temporary Add-on…**
4. Navigate to this folder and select `manifest.json`

The extension loads until Firefox is restarted. To persist it, the extension would need to be signed by Mozilla.

## Usage

- Click the **AFFiNE toolbar button** to toggle the sidebar open or closed.
- The sidebar opens AFFiNE in a full-height iframe with no extra chrome.

## Troubleshooting

**Blank sidebar / iframe blocked**
Your AFFiNE server may be sending `X-Frame-Options: SAMEORIGIN` or a restrictive `Content-Security-Policy`. Add the following to your AFFiNE reverse proxy config (nginx example):

```nginx
add_header X-Frame-Options "ALLOWALL";
# or remove the header entirely
```

**Sidebar doesn't open**
Make sure the extension loaded without errors in `about:debugging → This Firefox`.
