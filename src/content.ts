// src/content.ts

console.log('[Cull Pilot] script loaded');

let insertMode = false;
const defaultOverlayMessage = '⭐ -- INSERT MODE -— [1–5] to rate, [h] for Prev, [l] for Next, [Esc] to quit';

// 🟩 Overlay UI
function showOverlay(text = defaultOverlayMessage): void {
  const existing = document.getElementById('cullpilot-overlay');
  if (existing) return;

  const overlay = document.createElement('div');
  overlay.id = 'cullpilot-overlay';
  overlay.innerText = text;
  overlay.style.position = 'fixed';
  overlay.style.bottom = '20px';
  overlay.style.right = '20px';
  overlay.style.padding = '10px 16px';
  overlay.style.background = 'rgba(0,0,0,0.8)';
  overlay.style.color = '#fff';
  overlay.style.fontSize = '14px';
  overlay.style.fontFamily = 'monospace';
  overlay.style.zIndex = '9999';
  overlay.style.borderRadius = '6px';
  overlay.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
  document.body.appendChild(overlay);
}

function removeOverlay(): void {
  document.getElementById('cullpilot-overlay')?.remove();
}

function updateOverlayText(text = defaultOverlayMessage): void {
  const overlay = document.getElementById('cullpilot-overlay');
  if (overlay) {
    overlay.innerText = text;
  }
}

// 🔍 Get current star buttons if available
function getStarButtons(): NodeListOf<HTMLButtonElement> {
  return document.querySelectorAll<HTMLButtonElement>('.synofoto-lightbox-info-rating button');
}

// 🔘 Click info panel button
function openInfoPanel(): boolean {
  const panelContainer = document.querySelector('.synofoto-lightbox-info-panel-container');

  const isOpen = panelContainer?.classList.contains('expended');
  console.log(`[Cull Pilot] Info panel is ${isOpen ? 'already open' : 'closed, opening now'}`);

  if (isOpen) return true;

  const btn = document.querySelector('.info-dark-btn-icon')?.closest('button') as HTMLButtonElement | null;
  if (!btn) {
    console.warn('[Cull Pilot] Could not find info panel button.');
    return false;
  }

  console.log('[Cull Pilot] Clicking info panel button...');
  btn.click();
  return true;
}

// ⏳ Wait for stars to appear, then rate
function waitForStarsThen(rateValue: number): void {
  const container = document.querySelector('.synofoto-lightbox-info-panel-container');
  if (!container) {
    console.warn('[Cull Pilot] Info panel container not found');
    return;
  }

  const observer = new MutationObserver(() => {
    const stars = getStarButtons();
    if (stars.length >= rateValue) {
      console.log(`[Cull Pilot] Stars appeared, rating ${rateValue}★`);
      stars[rateValue - 1].click();
      updateOverlayText('⭐ Rated ✔');
      setTimeout(() => updateOverlayText(), 1000);
      observer.disconnect();
    }
  });

  observer.observe(container, { childList: true, subtree: true });
}

// 🌟 Rate photo with panel enforcement
function ratePhoto(desiredRating: number = 5): void {
  const stars = getStarButtons();

  if (stars.length >= desiredRating) {
    console.log(`[Cull Pilot] Rating immediately: ${desiredRating}★`);
    stars[desiredRating - 1].click();
    updateOverlayText('⭐ Rated ✔');
    setTimeout(() => updateOverlayText(), 1000);
    return;
  }

  console.log(`[Cull Pilot] Stars not ready, ensuring info panel is open then rating ${desiredRating}★`);
  const opened = openInfoPanel(); // attempt to open the panel
  if (opened) {
    waitForStarsThen(desiredRating);
  } else {
    console.warn('[Cull Pilot] Could not open info panel — rating aborted');
  }
}

function navigate(direction: "left" | "right"): void {
  const selector =
    direction === "left"
      ? ".synofoto-lightbox-prev-icon-button"
      : ".synofoto-lightbox-next-icon-button";

  const btn = document.querySelector<HTMLButtonElement>(selector);

  if (!btn || btn.classList.contains("hidden")) {
    console.warn(`[Cull Pilot] No ${direction} button — likely at edge of album`);
    updateOverlayText(`🚫 Can't go ${direction === "left" ? "←" : "→"}`);
    setTimeout(() => {
      updateOverlayText();
    }, 1000);
    return;
  }

  console.log(`[Cull Pilot] Navigating ${direction}`);
  btn.click();
}

function isInLightbox(): boolean {
  return document.querySelector('.synofoto-lightbox-wrapper') !== null;
}

// 👀 Monitor DOM for lightbox exit
const observer = new MutationObserver(() => {
  const lightbox = document.querySelector('.synofoto-lightbox-wrapper');
  if (!lightbox && insertMode) {
    insertMode = false;
    removeOverlay();
    console.log('[Cull Pilot] Lightbox closed — exiting insert mode');
  }
});

// Start observing body for subtree DOM removals
observer.observe(document.body, { childList: true, subtree: true });

// 🎮 Keybindings
document.addEventListener('keydown', (e) => {
  if (!e || e.repeat) return;

  if (e.key === 'i' && !insertMode) {
    if (!isInLightbox()) {
      console.warn("[Cull Pilot] Not in lightbox — can't enter insert mode");
      return;
    }

    const panelOpened = openInfoPanel();
    if (panelOpened) {
      insertMode = true;
      console.log('[Cull Pilot] Entering insert mode and opening info panel');
      showOverlay();
    } else {
      insertMode = false;
      console.warn('[Cull Pilot] Failed to open info panel');
    }
    return;
  }

  if (e.key === 'Escape' && insertMode) {
    e.stopImmediatePropagation();
    e.preventDefault();
    insertMode = false;
    removeOverlay();
    console.log('[Cull Pilot] Exiting insert mode');
    return;
  }

  if (insertMode) {
    if (/^[1-5]$/.test(e.key)) {
      const rating = parseInt(e.key);
      console.log(`[Cull Pilot] Rating requested: ${rating}★`);
      ratePhoto(rating);
      return;
    }

    if (e.key === 'h') {
      navigate("left");
      return;
    }

    if (e.key === 'l') {
      navigate("right");
      return;
    }
  }
});

