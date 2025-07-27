// popup.ts

const button = document.getElementById("clickme")!;
button.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Prevent executing on restricted pages
  if (!tab.url || tab.url.startsWith("chrome://")) {
    alert("Can't run on internal Chrome pages.");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    func: () => alert("Injected from popup!")
  });
});

