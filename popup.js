const input = document.getElementById("url-input");
const saveBtn = document.getElementById("save-btn");
const toggleBtn = document.getElementById("toggle-btn");
const status = document.getElementById("status");

browser.storage.local.get("affineUrl").then(({ affineUrl }) => {
  if (affineUrl) input.value = affineUrl;
});

saveBtn.addEventListener("click", () => {
  const url = input.value.trim();
  if (!url) return;
  browser.storage.local.set({ affineUrl: url }).then(() => {
    status.textContent = "Saved!";
    setTimeout(() => { status.textContent = ""; }, 2000);
  });
});

toggleBtn.addEventListener("click", () => {
  browser.sidebarAction.toggle();
  window.close();
});
