const frame = document.getElementById("affine-frame");
const noUrl = document.getElementById("no-url");

function loadUrl(url) {
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
