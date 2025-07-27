// src/content.ts

console.log('[Synostar] script loaded');

let starMode = false;

// 🟩 Overlay UI
function showOverlay(text = '⭐ Star Mode Active — [1–5] to rate, [q] to quit'): void {
  const existing = document.getElementById('synostar-overlay');
  if (existing) return;

  const overlay = document.createElement('div');
  overlay.id = 'synostar-overlay';
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
  document.getElementById('synostar-overlay')?.remove();
}

function updateOverlayText(text: string): void {
  const overlay = document.getElementById('synostar-overlay');
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
  const btn = document.querySelector('.info-dark-btn-icon')?.closest('button') as HTMLButtonElement | null;
  if (!btn) {
    console.warn('[Synostar] Could not find info panel button.');
    return false;
  }
  btn.click();
  return true;
}

// ⏳ Wait for stars to appear, then rate
function waitForStarsThen(rateValue: number): void {
  const container = document.querySelector('.synofoto-lightbox-info-panel-container');
  if (!container) {
    console.warn('[Synostar] Info panel container not found');
    return;
  }

  const observer = new MutationObserver(() => {
    const stars = getStarButtons();
    if (stars.length >= rateValue) {
      console.log(`[Synostar] Stars appeared, rating ${rateValue}★`);
      stars[rateValue - 1].click();
      updateOverlayText('⭐ Star Mode Active — Rated ✔');
      setTimeout(() => updateOverlayText('⭐ Star Mode Active — [1–5] to rate, [q] to quit'), 1000);
      observer.disconnect(); // ✅ stop observing
    }
  });

  observer.observe(container, { childList: true, subtree: true });
}

// 🌟 Attempt to rate, or wait and retry
function ratePhoto(desiredRating: number = 5): void {
  const stars = getStarButtons();

  if (stars.length >= desiredRating) {
    console.log(`[Synostar] Rating immediately: ${desiredRating}★`);
    stars[desiredRating - 1].click();
    updateOverlayText('⭐ Star Mode Active — Rated ✔');
    setTimeout(() => updateOverlayText('⭐ Star Mode Active — [1–5] to rate, [q] to quit'), 1000);
    return;
  }

  console.log(`[Synostar] Stars not ready, opening info panel and waiting to rate ${desiredRating}★`);
  const opened = openInfoPanel();
  if (opened) {
    waitForStarsThen(desiredRating);
  }
}

// 🎮 Keybindings
document.addEventListener('keydown', (e) => {
  if (!e || e.repeat) return;

  if (e.key === 's' && !starMode) {
    starMode = true;
    showOverlay();
    console.log('[Synostar] Entering star mode');
    return;
  }

  if (e.key === 'q' && starMode) {
    starMode = false;
    removeOverlay();
    console.log('[Synostar] Exiting star mode');
    return;
  }

  if (starMode && /^[1-5]$/.test(e.key)) {
    const rating = parseInt(e.key);
    console.log(`[Synostar] Rating requested: ${rating}★`);
    ratePhoto(rating);
    return;
  }
});

