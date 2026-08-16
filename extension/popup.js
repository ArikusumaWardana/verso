const setup = document.querySelector("#setup");
const archive = document.querySelector("#archive");
const serverInput = document.querySelector("#server-url");
const saveServerButton = document.querySelector("#save-server");
const saveTabButton = document.querySelector("#save-tab");
const changeServerButton = document.querySelector("#change-server");
const status = document.querySelector("#status");
const loginLink = document.querySelector("#login-link");
const tabTitle = document.querySelector("#tab-title");

let activeTab = null;
let serverUrl = null;

function setStatus(message, tone) {
  status.textContent = message;
  status.dataset.tone = tone || "";
}

function normalizeServerUrl(value) {
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Gunakan alamat HTTP atau HTTPS");
  return url.origin;
}

function showSetup() {
  setup.hidden = false;
  archive.hidden = true;
  serverInput.value = serverUrl || "http://localhost:3000";
  serverInput.focus();
}

function showArchive() {
  setup.hidden = true;
  archive.hidden = false;
}

async function load() {
  [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabTitle.textContent = activeTab?.title || "Tab aktif";
  const stored = await chrome.storage.local.get("serverUrl");
  serverUrl = stored.serverUrl || null;
  if (serverUrl) showArchive(); else showSetup();
}

saveServerButton.addEventListener("click", async () => {
  setStatus("");
  try {
    const nextUrl = normalizeServerUrl(serverInput.value);
    const granted = await chrome.permissions.request({ origins: [`${nextUrl}/*`] });
    if (!granted) throw new Error("Izin server belum diberikan");
    await chrome.storage.local.set({ serverUrl: nextUrl });
    serverUrl = nextUrl;
    showArchive();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Alamat server tidak valid", "error");
  }
});

changeServerButton.addEventListener("click", showSetup);

saveTabButton.addEventListener("click", async () => {
  if (!serverUrl || !activeTab?.url || !/^https?:/.test(activeTab.url)) {
    setStatus("Tab ini tidak memiliki tautan web yang dapat disimpan", "error");
    return;
  }
  saveTabButton.disabled = true;
  loginLink.hidden = true;
  setStatus("Menyimpan bacaan…");
  try {
    const response = await fetch(`${serverUrl}/api/archive`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: activeTab.url, source: "extension" })
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        loginLink.href = `${serverUrl}/login`;
        loginLink.hidden = false;
      }
      throw new Error(result.error || "Tab belum dapat disimpan");
    }
    setStatus("Tersimpan di arsip.", "success");
    saveTabButton.textContent = "Sudah tersimpan";
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Tab belum dapat disimpan", "error");
    saveTabButton.disabled = false;
  }
});

load().catch(() => setStatus("Extension tidak dapat membaca tab aktif", "error"));
