// src/content.ts

let insertMode = false;

const defaultOverlayMessage =
  //'% -- INSERT MODE -- [1–5] to rate, [h] for Prev, [l] for Next, [Esc] to quit';
  '-- INSERT MODE --';

let overlayStatusSuffix = '';
let overlayResetTimer: number | undefined;

// Overlay UI
function showOverlay(text = defaultOverlayMessage): void {
  const existing = document.getElementById('cullpilot-overlay');
  if (existing) return;

  const overlay = document.createElement('div');
  overlay.id = 'cullpilot-overlay';
  overlay.innerText = text;
  overlay.style.position = 'fixed';
  overlay.style.bottom = '0px';
  overlay.style.left = '0px';
  overlay.style.width = '100%';
  overlay.style.padding = '10px 16px';
  overlay.style.background = 'rgba(0,0,0,0.8)';
  overlay.style.color = '#fff';
  overlay.style.fontSize = '14px';
  overlay.style.fontFamily = 'monospace';
  overlay.style.zIndex = '9999';
  overlay.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
  document.body.appendChild(overlay);
}

// Remove overlay
function removeOverlay(): void {
  document.getElementById('cullpilot-overlay')?.remove();
  overlayStatusSuffix = '';
  if (overlayResetTimer) {
    clearTimeout(overlayResetTimer);
    overlayResetTimer = undefined;
  }
}

// Update overlay content
function updateOverlayText(prefix = defaultOverlayMessage): void {
  const overlay = document.getElementById('cullpilot-overlay');
  if (overlay) {
    overlay.innerText = `${prefix}${overlayStatusSuffix}`;
  }
}

// Show a suffix temporarily, then revert
function setTemporarySuffix(message: string, durationMs = 1500): void {
  overlayStatusSuffix = ` ${message}`;
  updateOverlayText();

  if (overlayResetTimer) clearTimeout(overlayResetTimer);
  overlayResetTimer = window.setTimeout(() => {
    overlayStatusSuffix = '';
    updateOverlayText();
    overlayResetTimer = undefined;
  }, durationMs);
}

// Get current image rating
function getCurrentRating(): number {
  const stars = getStarButtons();

  for (let i = 0; i < stars.length; i++) {
    const icon = stars[i].querySelector('.button-icon');
    if (icon?.classList.contains('star-on-btn-icon')) {
      continue; // active star, keep going
    } else {
      return i; // first inactive = current rating is i
    }
  }

  return stars.length; // all stars active
}

// Get current star buttons if available
function getStarButtons(): NodeListOf<HTMLButtonElement> {
  return document.querySelectorAll<HTMLButtonElement>('.synofoto-lightbox-info-rating button');
}

// Click info panel button
function openInfoPanel(): boolean {
  const panelContainer = document.querySelector('.synofoto-lightbox-info-panel-container');

  const isOpen = panelContainer?.classList.contains('expended');

  if (isOpen) return true;

  const btn = document.querySelector('.info-dark-btn-icon')?.closest('button') as HTMLButtonElement | null;
  if (!btn) {
    return false;
  }

  btn.click();
  return true;
}

// Wait for stars to appear, then rate
function waitForStarsThen(rateValue: number): void {
  const container = document.querySelector('.synofoto-lightbox-info-panel-container');
  if (!container) {
    return;
  }

  const observer = new MutationObserver(() => {
    const stars = getStarButtons();
    if (stars.length >= rateValue) {
      stars[rateValue - 1].click();
      setTemporarySuffix('⭐️'.repeat(rateValue));
      observer.disconnect();
    }
  });

  observer.observe(container, { childList: true, subtree: true });
}

// Rate photo with panel enforcement
function ratePhoto(desiredRating: number = 5): void {
  const stars = getStarButtons();
  const currentRating = getCurrentRating();

  // Case: Unrate
  if (desiredRating === 0 || desiredRating === currentRating) {
    if (currentRating === 0) {
      setTemporarySuffix('Cleared'); // or '—' or '…'
      return;
    }
    stars[currentRating - 1].click(); // clicking same star removes it
    setTemporarySuffix('Cleared'); // or 'Cleared', or blank
    return;
  }

  // Case: Apply new rating
  if (stars.length >= desiredRating) {
    stars[desiredRating - 1].click();
    setTemporarySuffix('⭐️'.repeat(desiredRating));
    return;
  }

  // Case: Fallback async wait
  const opened = openInfoPanel();
  if (opened) {
    waitForStarsThen(desiredRating);
  } 
}

// Navigation with vim motion
function navigate(direction: "left" | "right"): void {
  const selector =
    direction === "left"
      ? ".synofoto-lightbox-prev-icon-button"
      : ".synofoto-lightbox-next-icon-button";

  const btn = document.querySelector<HTMLButtonElement>(selector);

  if (!btn || btn.classList.contains("hidden")) {
    setTemporarySuffix(`🚫 Can't go ${direction === "left" ? "←" : "→"}`);
    return;
  }

  btn.click();
}

// Check if Cull Pilot can be turned on
function isInLightbox(): boolean {
  return document.querySelector('.synofoto-lightbox-wrapper') !== null;
}

// Monitor DOM for lightbox exit
const observer = new MutationObserver(() => {
  const lightbox = document.querySelector('.synofoto-lightbox-wrapper');
  if (!lightbox && insertMode) {
    insertMode = false;
    removeOverlay();
  }
});

// Start observing body for subtree DOM removals
observer.observe(document.body, { childList: true, subtree: true });

// Keybindings
document.addEventListener('keydown', (e) => {
  if (!e || e.repeat) return;

  if (e.key === 'i' && !insertMode) {
    if (!isInLightbox()) {
      return;
    }

    const panelOpened = openInfoPanel();
    if (panelOpened) {
      insertMode = true;
      showOverlay();
    } else {
      insertMode = false;
    }
    return;
  }

  if (e.key === 'Escape' && insertMode) {
    e.stopImmediatePropagation();
    e.preventDefault();
    insertMode = false;
    removeOverlay();
    return;
  }

  if (insertMode) {
    if (/^[0-5]$/.test(e.key)) {
      const rating = parseInt(e.key);
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

