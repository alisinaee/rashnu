(function () {
  "use strict";

  const toggle = document.getElementById("debugToggle");
  const statusText = document.getElementById("statusText");

  init().catch((error) => {
    statusText.textContent = `خطا: ${error.message}`;
  });

  async function init() {
    const stored = await chrome.storage.local.get(["dirobDebugEnabled"]);
    toggle.checked = Boolean(stored.dirobDebugEnabled);
    statusText.textContent = toggle.checked ? "Debug روشن است." : "Debug خاموش است.";

    toggle.addEventListener("change", async () => {
      await chrome.storage.local.set({
        dirobDebugEnabled: toggle.checked
      });
      await chrome.runtime.sendMessage({
        type: "DIROB_SET_DEBUG",
        payload: { enabled: toggle.checked }
      });
      statusText.textContent = toggle.checked ? "Debug روشن شد." : "Debug خاموش شد.";
    });
  }
})();
