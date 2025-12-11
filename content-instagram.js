// Content script to block Instagram Reels on client-side navigation
(function () {
  "use strict";

  let isBlockingEnabled = true;
  let isRedirecting = false;

  // Check if blocking is enabled
  chrome.storage.sync.get(["blockerEnabled"], (result) => {
    isBlockingEnabled = result.blockerEnabled !== false;
    // Wait for DOM to be ready before hiding buttons
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(updateReelsButtonVisibility, 500);
      });
    } else {
      setTimeout(updateReelsButtonVisibility, 500);
    }
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.blockerEnabled) {
      isBlockingEnabled = changes.blockerEnabled.newValue !== false;
      updateReelsButtonVisibility();
    }
  });

  // Function to hide/show Reels navigation button
  function updateReelsButtonVisibility() {
    // Multiple selectors for Instagram Reels button
    const reelsSelectors = [
      'a[href*="/reels"]',
      'a[href*="/reel/"]',
      '[aria-label*="Reels"]',
      '[aria-label*="Reel"]',
      '[href*="reels"]',
    ];

    reelsSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        // Check if it's actually a Reels link
        const href = element.getAttribute('href') || '';
        const ariaLabel = element.getAttribute('aria-label') || '';
        const title = element.getAttribute('title') || '';
        
        if (
          href.includes('/reels') ||
          href.includes('/reel/') ||
          ariaLabel.toLowerCase().includes('reel') ||
          title.toLowerCase().includes('reel')
        ) {
          // Hide the element
          if (isBlockingEnabled) {
            element.style.display = 'none';
            element.setAttribute('data-blocker-hidden', 'true');
            // Also try to hide parent navigation item
            const parent = element.closest('div[role="button"], a, span');
            if (parent && parent !== element) {
              parent.style.display = 'none';
              parent.setAttribute('data-blocker-hidden', 'true');
            }
          } else {
            element.style.display = '';
            element.removeAttribute('data-blocker-hidden');
            // Show parent if it was hidden
            const parent = element.closest('div[role="button"], a, span');
            if (parent && parent.hasAttribute('data-blocker-hidden')) {
              parent.style.display = '';
              parent.removeAttribute('data-blocker-hidden');
            }
          }
        }
      });
    });

    // Also look for Reels in bottom navigation (mobile) and top navigation
    const navItems = document.querySelectorAll('nav a, nav div[role="link"], nav div[role="button"]');
    navItems.forEach((item) => {
      const text = item.textContent?.toLowerCase() || '';
      const ariaLabel = item.getAttribute('aria-label')?.toLowerCase() || '';
      const href = item.getAttribute('href') || '';
      
      // Check if it's a Reels navigation item (but not a reel post link)
      if ((text.includes('reel') || ariaLabel.includes('reel')) && 
          (href.includes('/reels') || href === '' || !href.includes('/reel/'))) {
        if (isBlockingEnabled) {
          item.style.display = 'none';
          item.setAttribute('data-blocker-hidden', 'true');
        } else {
          item.style.display = '';
          item.removeAttribute('data-blocker-hidden');
        }
      }
    });
  }

  // Function to check and redirect if on reels
  function checkAndRedirect() {
    if (!isBlockingEnabled || isRedirecting) return;

    const currentUrl = window.location.href;
    const pathname = window.location.pathname;

    // Check if we're on a reels page
    if (
      currentUrl.includes("/reel/") ||
      currentUrl.includes("/reels/") ||
      pathname.startsWith("/reel/") ||
      pathname.startsWith("/reels/")
    ) {
      isRedirecting = true;
      // Use replace to avoid adding to history
      window.location.replace("https://www.instagram.com");
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

  // Periodically check for Reels buttons (in case they're added dynamically)
  const buttonCheckInterval = setInterval(() => {
    if (isBlockingEnabled) {
      updateReelsButtonVisibility();
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
        if (
          element.href &&
          (element.href.includes("/reel/") || element.href.includes("/reels/"))
        ) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          window.location.replace("https://www.instagram.com");
          return false;
        }

        // Check data attributes that might contain URLs
        if (element.dataset) {
          for (const key in element.dataset) {
            const value = element.dataset[key];
            if (
              typeof value === "string" &&
              (value.includes("/reel/") || value.includes("/reels/"))
            ) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              window.location.replace("https://www.instagram.com");
              return false;
            }
          }
        }

        // Check aria-label or title for reels indication
        const label =
          element.getAttribute("aria-label") ||
          element.getAttribute("title") ||
          "";
        if (
          (label.toLowerCase().includes("reel") ||
            label.toLowerCase().includes("reels")) &&
          element.onclick
        ) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          window.location.replace("https://www.instagram.com");
          return false;
        }

        element = element.parentElement;
      }
    },
    true // Use capture phase
  );

  // Monitor for route changes in Instagram's router
  const routeObserver = new MutationObserver(() => {
    setTimeout(() => {
      checkAndRedirect();
      isRedirecting = false;
      updateReelsButtonVisibility();
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

