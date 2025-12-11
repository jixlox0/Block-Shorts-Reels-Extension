// Content script to block YouTube Shorts on client-side navigation
(function () {
  "use strict";

  let isBlockingEnabled = true;
  let isRedirecting = false;

  // Check if blocking is enabled
  chrome.storage.sync.get(["blockerEnabled"], (result) => {
    isBlockingEnabled = result.blockerEnabled !== false;
    // Wait for DOM to be ready before hiding buttons
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(updateShortsButtonVisibility, 500);
      });
    } else {
      setTimeout(updateShortsButtonVisibility, 500);
    }
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.blockerEnabled) {
      isBlockingEnabled = changes.blockerEnabled.newValue !== false;
      updateShortsButtonVisibility();
    }
  });

  // Function to hide/show Shorts navigation button
  function updateShortsButtonVisibility() {
    // Multiple selectors for YouTube Shorts button
    const shortsSelectors = [
      'a[href*="/shorts"]',
      'a[href="/shorts"]',
      'ytd-guide-entry-renderer a[href*="/shorts"]',
      'ytd-mini-guide-entry-renderer a[href*="/shorts"]',
      '[aria-label*="Shorts"]',
      '[title*="Shorts"]',
    ];

    shortsSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        // Check if it's actually a Shorts link
        const href = element.getAttribute("href") || "";
        const ariaLabel = element.getAttribute("aria-label") || "";
        const title = element.getAttribute("title") || "";

        if (
          href.includes("/shorts") ||
          ariaLabel.toLowerCase().includes("shorts") ||
          title.toLowerCase().includes("shorts")
        ) {
          // Find the parent guide entry to hide the whole button
          const guideEntry = element.closest(
            "ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer"
          );
          if (guideEntry) {
            if (isBlockingEnabled) {
              guideEntry.style.display = "none";
              guideEntry.setAttribute("data-blocker-hidden", "true");
            } else {
              guideEntry.style.display = "";
              guideEntry.removeAttribute("data-blocker-hidden");
            }
          } else {
            // Fallback: hide the element itself
            if (isBlockingEnabled) {
              element.style.display = "none";
              element.setAttribute("data-blocker-hidden", "true");
            } else {
              element.style.display = "";
              element.removeAttribute("data-blocker-hidden");
            }
          }
        }
      });
    });
  }

  // Function to check and redirect if on shorts
  function checkAndRedirect() {
    if (!isBlockingEnabled || isRedirecting) return;

    const currentUrl = window.location.href;
    const pathname = window.location.pathname;

    // Check if we're on a shorts page
    if (currentUrl.includes("/shorts/") || pathname.startsWith("/shorts/")) {
      isRedirecting = true;
      // Use replace to avoid adding to history
      window.location.replace("https://www.youtube.com");
      return true;
    }
    return false;
  }

  // Immediate check
  checkAndRedirect();

  // Intercept history API changes - must be done early
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(history, args);
    setTimeout(() => {
      if (checkAndRedirect()) return;
      isRedirecting = false;
    }, 10);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args);
    setTimeout(() => {
      if (checkAndRedirect()) return;
      isRedirecting = false;
    }, 10);
  };

  // Listen for popstate (back/forward button)
  window.addEventListener("popstate", () => {
    setTimeout(() => {
      checkAndRedirect();
      isRedirecting = false;
    }, 10);
  });

  // Monitor URL changes more aggressively
  let lastUrl = location.href;
  const urlCheckInterval = setInterval(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      if (checkAndRedirect()) {
        return;
      }
      isRedirecting = false;
    }
  }, 100);

  // Periodically check for Shorts buttons (in case they're added dynamically)
  const buttonCheckInterval = setInterval(() => {
    if (isBlockingEnabled) {
      updateShortsButtonVisibility();
    }
  }, 1000);

  // Intercept all clicks - more aggressive approach
  document.addEventListener(
    "click",
    (e) => {
      if (!isBlockingEnabled) return;

      // Check the clicked element and all parents
      let element = e.target;
      for (let i = 0; i < 10 && element; i++) {
        // Check href attribute
        if (element.href && element.href.includes("/shorts/")) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          window.location.replace("https://www.youtube.com");
          return false;
        }

        // Check data attributes that might contain URLs
        if (element.dataset) {
          for (const key in element.dataset) {
            const value = element.dataset[key];
            if (typeof value === "string" && value.includes("/shorts/")) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              window.location.replace("https://www.youtube.com");
              return false;
            }
          }
        }

        // Check aria-label or title for shorts indication
        const label =
          element.getAttribute("aria-label") ||
          element.getAttribute("title") ||
          "";
        if (label.toLowerCase().includes("shorts") && element.onclick) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          window.location.replace("https://www.youtube.com");
          return false;
        }

        element = element.parentElement;
      }
    },
    true // Use capture phase
  );

  // Listen for YouTube's custom navigation events
  const ytEvents = [
    "yt-navigate-start",
    "yt-navigate-finish",
    "yt-page-data-updated",
    "yt-navigate",
  ];

  ytEvents.forEach((eventName) => {
    window.addEventListener(eventName, () => {
      setTimeout(() => {
        checkAndRedirect();
        isRedirecting = false;
      }, 50);
    });
  });

  // Override YouTube's navigation if possible
  if (window.yt && window.yt.config_) {
    const originalNavigate = window.yt.navigate;
    if (originalNavigate) {
      window.yt.navigate = function (...args) {
        const url = args[0];
        if (url && url.includes("/shorts/")) {
          window.location.replace("https://www.youtube.com");
          return;
        }
        return originalNavigate.apply(this, args);
      };
    }
  }

  // Monitor for route changes in YouTube's router
  const routeObserver = new MutationObserver(() => {
    setTimeout(() => {
      checkAndRedirect();
      isRedirecting = false;
      updateShortsButtonVisibility();
    }, 50);
  });

  // Start observing when DOM is ready
  if (document.body) {
    routeObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.body) {
        routeObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }
    });
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    clearInterval(urlCheckInterval);
    clearInterval(buttonCheckInterval);
    routeObserver.disconnect();
  });
})();
