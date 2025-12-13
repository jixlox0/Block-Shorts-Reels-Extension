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
        setTimeout(() => {
          updateShortsButtonVisibility();
          addShortsOverlay();
        }, 500);
      });
    } else {
      setTimeout(() => {
        updateShortsButtonVisibility();
        addShortsOverlay();
      }, 500);
    }
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.blockerEnabled) {
      isBlockingEnabled = changes.blockerEnabled.newValue !== false;
      updateShortsButtonVisibility();
      addShortsOverlay();
    }
  });

  // Function to replace Shorts section content with blocked content card
  function addShortsOverlay() {
    // Only process on home page
    const isHomePage =
      window.location.pathname === "/" || window.location.pathname === "";

    // Find Shorts sections - look for sections containing Shorts
    const allSections = document.querySelectorAll("ytd-rich-section-renderer");

    allSections.forEach((section) => {
      // Check if this section contains Shorts content
      const shortsLinks = section.querySelectorAll('a[href*="/shorts/"]');
      const hasShortsContent =
        shortsLinks.length > 0 ||
        section.textContent.toLowerCase().includes("shorts") ||
        section.querySelector('[aria-label*="Shorts"]') ||
        section.querySelector('[title*="Shorts"]');

      if (!hasShortsContent) return;

      // Find the shelf container that holds the Shorts videos (horizontal scroll container)
      let contentContainer = section.querySelector("ytd-reel-shelf-renderer");

      // If not found, look for the horizontal shelf container
      if (!contentContainer) {
        contentContainer =
          section.querySelector('[class*="shelf"]') ||
          section.querySelector('[class*="reel"]') ||
          section.querySelector("ytd-rich-shelf-renderer");
      }

      // Fallback to the section's content area
      if (!contentContainer) {
        contentContainer =
          section.querySelector("#contents") ||
          section.querySelector('[id*="content"]') ||
          section;
      }

      // Check if already blocked
      const isBlocked = contentContainer.hasAttribute("data-shorts-blocked");

      if (!isBlockingEnabled || !isHomePage) {
        // Restore original content if blocked
        if (isBlocked && contentContainer.dataset.originalContent) {
          try {
            const originalHTML = contentContainer.dataset.originalContent;
            contentContainer.innerHTML = originalHTML;
            contentContainer.removeAttribute("data-shorts-blocked");
            contentContainer.removeAttribute("data-original-content");
          } catch (e) {
            console.error("Error restoring Shorts content:", e);
          }
        }
        return;
      }

      // Skip if already blocked
      if (isBlocked) return;

      // Store original content before modifying
      if (!contentContainer.dataset.originalContent) {
        contentContainer.dataset.originalContent = contentContainer.innerHTML;
      }

      // Create blocked content card with modern compact design
      const blockedCardElement = document.createElement("div");
      blockedCardElement.id = "shorts-blocked-card";
      blockedCardElement.style.cssText = `
        width: 100%;
        min-height: 160px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(30, 30, 30, 0.95) 100%);
        border-radius: 16px;
        backdrop-filter: blur(12px) saturate(180%);
        -webkit-backdrop-filter: blur(12px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.08);
        pointer-events: none;
        box-sizing: border-box;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
        position: relative;
        overflow: hidden;
      `;

      // Add subtle gradient overlay
      const gradientOverlay = document.createElement("div");
      gradientOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.1) 100%);
        pointer-events: none;
      `;
      blockedCardElement.appendChild(gradientOverlay);

      // Create inner content
      const innerContent = document.createElement("div");
      innerContent.style.cssText = `
        text-align: center;
        padding: 24px 20px;
        color: rgba(255, 255, 255, 0.85);
        font-family: "YouTube Noto", Roboto, Arial, Helvetica, sans-serif;
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        max-width: 320px;
      `;

      // Create modern icon container
      const iconContainer = document.createElement("div");
      iconContainer.style.cssText = `
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(255, 59, 48, 0.2) 0%, rgba(255, 45, 85, 0.15) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1.5px solid rgba(255, 59, 48, 0.3);
        box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2);
        margin-bottom: 4px;
      `;

      const icon = document.createElement("div");
      icon.innerHTML = "🚫";
      icon.style.cssText = `
        font-size: 28px;
        line-height: 1;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      `;

      iconContainer.appendChild(icon);
      innerContent.appendChild(iconContainer);

      // Create message with modern typography
      const message = document.createElement("div");
      message.textContent = "Shorts Blocked";
      message.style.cssText = `
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.3px;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.9);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      `;

      // Add subtitle
      const subtitle = document.createElement("div");
      subtitle.textContent = "Content hidden";
      subtitle.style.cssText = `
        font-size: 12px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.6);
        letter-spacing: 0.2px;
        margin-top: -4px;
      `;

      // Add description text
      const description = document.createElement("div");
      description.textContent =
        "This content has been blocked to help you stay focused. You can disable this in the extension settings.";
      description.style.cssText = `
        font-size: 11px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.5);
        line-height: 1.5;
        letter-spacing: 0.1px;
        margin-top: 4px;
        padding: 0 8px;
      `;

      innerContent.appendChild(message);
      innerContent.appendChild(subtitle);
      innerContent.appendChild(description);
      blockedCardElement.appendChild(innerContent);

      // Replace content with blocked card
      contentContainer.innerHTML = "";
      contentContainer.appendChild(blockedCardElement);
      contentContainer.setAttribute("data-shorts-blocked", "true");
    });
  }

  // Function to hide/show Shorts navigation button (but allow Shorts on home page)
  function updateShortsButtonVisibility() {
    // Only target the navigation guide entries, not Shorts thumbnails on home page
    const guideEntries = document.querySelectorAll(
      "ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer"
    );

    guideEntries.forEach((entry) => {
      const link = entry.querySelector("a");
      if (!link) return;

      const href = link.getAttribute("href") || "";
      const ariaLabel = link.getAttribute("aria-label") || "";
      const title = link.getAttribute("title") || "";

      // Only hide the main Shorts navigation button (links to /shorts tab)
      // Don't hide individual Shorts video links (which have /shorts/VIDEO_ID)
      const isShortsNavButton =
        href === "/shorts" ||
        href === "/shorts/" ||
        (href === "" &&
          (ariaLabel.toLowerCase().includes("shorts") ||
            title.toLowerCase().includes("shorts")));

      // Make sure it's not a specific Shorts video link
      const isSpecificShortsVideo =
        href.includes("/shorts/") && href !== "/shorts/";

      if (isShortsNavButton && !isSpecificShortsVideo) {
        if (isBlockingEnabled) {
          entry.style.display = "none";
          entry.setAttribute("data-blocker-hidden", "true");
        } else {
          entry.style.display = "";
          entry.removeAttribute("data-blocker-hidden");
        }
      }
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

  // Periodically check for Shorts buttons and overlay (in case they're added dynamically)
  const buttonCheckInterval = setInterval(() => {
    if (isBlockingEnabled) {
      updateShortsButtonVisibility();
      addShortsOverlay();
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
      addShortsOverlay();
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
