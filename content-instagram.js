// Content script to block Instagram Reels on client-side navigation
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
          updateReelsButtonVisibility();
          addReelsBlockedCardsInChat();
          detectAndCloseReelsModal();
          blockPlayingReels();
        }, 500);
      });
    } else {
      setTimeout(() => {
        updateReelsButtonVisibility();
        addReelsBlockedCardsInChat();
        detectAndCloseReelsModal();
        blockPlayingReels();
      }, 500);
    }
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.blockerEnabled) {
      isBlockingEnabled = changes.blockerEnabled.newValue !== false;
      updateReelsButtonVisibility();
      addReelsBlockedCardsInChat();
      if (isBlockingEnabled) {
        detectAndCloseReelsModal();
        blockPlayingReels();
      }
    }
  });

  // Function to hide/show Reels navigation button
  function updateReelsButtonVisibility() {
    // Don't hide reels button on home page - allow reels to work normally
    if (isHomePage()) {
      // Restore any hidden elements on home page
      document
        .querySelectorAll('[data-blocker-hidden="true"]')
        .forEach((element) => {
          element.style.display = "";
          element.removeAttribute("data-blocker-hidden");
        });
      return;
    }

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
        const href = element.getAttribute("href") || "";
        const ariaLabel = element.getAttribute("aria-label") || "";
        const title = element.getAttribute("title") || "";

        if (
          href.includes("/reels") ||
          href.includes("/reel/") ||
          ariaLabel.toLowerCase().includes("reel") ||
          title.toLowerCase().includes("reel")
        ) {
          // Hide the element
          if (isBlockingEnabled) {
            element.style.display = "none";
            element.setAttribute("data-blocker-hidden", "true");
            // Also try to hide parent navigation item
            const parent = element.closest('div[role="button"], a, span');
            if (parent && parent !== element) {
              parent.style.display = "none";
              parent.setAttribute("data-blocker-hidden", "true");
            }
          } else {
            element.style.display = "";
            element.removeAttribute("data-blocker-hidden");
            // Show parent if it was hidden
            const parent = element.closest('div[role="button"], a, span');
            if (parent && parent.hasAttribute("data-blocker-hidden")) {
              parent.style.display = "";
              parent.removeAttribute("data-blocker-hidden");
            }
          }
        }
      });
    });

    // Also look for Reels in bottom navigation (mobile) and top navigation
    const navItems = document.querySelectorAll(
      'nav a, nav div[role="link"], nav div[role="button"]'
    );
    navItems.forEach((item) => {
      const text = item.textContent?.toLowerCase() || "";
      const ariaLabel = item.getAttribute("aria-label")?.toLowerCase() || "";
      const href = item.getAttribute("href") || "";

      // Check if it's a Reels navigation item (but not a reel post link)
      if (
        (text.includes("reel") || ariaLabel.includes("reel")) &&
        (href.includes("/reels") || href === "" || !href.includes("/reel/"))
      ) {
        if (isBlockingEnabled) {
          item.style.display = "none";
          item.setAttribute("data-blocker-hidden", "true");
        } else {
          item.style.display = "";
          item.removeAttribute("data-blocker-hidden");
        }
      }
    });
  }

  // Helper function to create a blocked card element
  function createBlockedCard() {
    const blockedCardElement = document.createElement("div");
    blockedCardElement.className = "reel-blocked-card";
    blockedCardElement.style.cssText = `
      width: 100%;
      min-height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(138, 58, 185, 0.15) 0%, rgba(225, 48, 108, 0.15) 100%);
      border-radius: 12px;
      backdrop-filter: blur(8px) saturate(180%);
      -webkit-backdrop-filter: blur(8px) saturate(180%);
      border: 1px solid rgba(225, 48, 108, 0.2);
      pointer-events: none;
      box-sizing: border-box;
      box-shadow: 0 4px 16px rgba(138, 58, 185, 0.2), 
                  inset 0 1px 0 rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
      padding: 16px;
    `;

    const gradientOverlay = document.createElement("div");
    gradientOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(225, 48, 108, 0.08) 0%, rgba(138, 58, 185, 0.08) 100%);
      pointer-events: none;
    `;
    blockedCardElement.appendChild(gradientOverlay);

    const innerContent = document.createElement("div");
    innerContent.style.cssText = `
      text-align: center;
      color: rgba(255, 255, 255, 0.9);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      max-width: 280px;
    `;

    const iconContainer = document.createElement("div");
    iconContainer.style.cssText = `
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(225, 48, 108, 0.25) 0%, rgba(138, 58, 185, 0.25) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid rgba(225, 48, 108, 0.4);
      box-shadow: 0 4px 12px rgba(225, 48, 108, 0.3);
      margin-bottom: 2px;
    `;

    const icon = document.createElement("div");
    icon.innerHTML = "🚫";
    icon.style.cssText = `
      font-size: 24px;
      line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    `;

    iconContainer.appendChild(icon);
    innerContent.appendChild(iconContainer);

    const message = document.createElement("div");
    message.textContent = "Reel Blocked";
    message.style.cssText = `
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.2px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.95);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    `;

    const subtitle = document.createElement("div");
    subtitle.textContent = "Content hidden";
    subtitle.style.cssText = `
      font-size: 11px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.65);
      letter-spacing: 0.1px;
      margin-top: -2px;
    `;

    const description = document.createElement("div");
    description.textContent =
      "This reel has been blocked to help you stay focused.";
    description.style.cssText = `
      font-size: 10px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.5);
      line-height: 1.4;
      letter-spacing: 0.1px;
      margin-top: 2px;
      padding: 0 4px;
    `;

    innerContent.appendChild(message);
    innerContent.appendChild(subtitle);
    innerContent.appendChild(description);
    blockedCardElement.appendChild(innerContent);

    return blockedCardElement;
  }

  // Function to add blocked content cards for reels in chat
  function addReelsBlockedCardsInChat() {
    if (!isBlockingEnabled) {
      // Restore original content if blocking is disabled
      document
        .querySelectorAll('[data-reel-blocked="true"]')
        .forEach((blockedElement) => {
          if (blockedElement.dataset.originalContent) {
            try {
              blockedElement.innerHTML = blockedElement.dataset.originalContent;
              blockedElement.removeAttribute("data-reel-blocked");
              blockedElement.removeAttribute("data-original-content");
            } catch (e) {
              console.error("Error restoring reel content:", e);
            }
          }
        });
      return;
    }

    // Don't block reels on home page - allow them to work normally
    if (isHomePage()) {
      // Restore any blocked reels on home page
      document
        .querySelectorAll('[data-reel-blocked="true"]')
        .forEach((blockedElement) => {
          if (blockedElement.dataset.originalContent) {
            try {
              blockedElement.innerHTML = blockedElement.dataset.originalContent;
              blockedElement.removeAttribute("data-reel-blocked");
              blockedElement.removeAttribute("data-original-content");
            } catch (e) {
              console.error("Error restoring reel content:", e);
            }
          }
        });
      return;
    }

    // Don't show blocked cards on Profile pages (but allow on Explore page)
    if (isProfilePage()) {
      return;
    }

    // Helper function to check if an element is a reel
    function isReelElement(element) {
      if (!element) return false;

      // Check href
      const href = element.getAttribute("href") || element.href || "";
      if (href.includes("/reel/") || href.includes("/reels/")) return true;

      // Check data attributes
      if (element.dataset) {
        for (const key in element.dataset) {
          const value = element.dataset[key];
          if (
            typeof value === "string" &&
            (value.includes("/reel/") || value.includes("/reels/"))
          ) {
            return true;
          }
        }
      }

      // Check for reel in text content or aria-label
      const text = (element.textContent || "").toLowerCase();
      const ariaLabel = (
        element.getAttribute("aria-label") || ""
      ).toLowerCase();
      if (
        (text.includes("reel") || ariaLabel.includes("reel")) &&
        (href.includes("/reel/") ||
          href.includes("/reels/") ||
          element.querySelector("video, img"))
      ) {
        return true;
      }

      // Check if contains video or image that might be a reel
      const hasVideo = element.querySelector("video");
      const hasReelImage = element.querySelector(
        'img[src*="reel"], img[alt*="reel"]'
      );
      if (
        (hasVideo || hasReelImage) &&
        (href.includes("/reel/") || href.includes("/reels/"))
      ) {
        return true;
      }

      return false;
    }

    // Helper function to find the best container for a reel element
    function findReelContainer(element) {
      if (!element) return null;

      // Check if element itself is a reel
      if (isReelElement(element)) {
        // Try to find a parent container (message bubble, media container, etc.)
        const parent = element.closest(
          'div[class*="message"], div[class*="bubble"], div[class*="media"], div[class*="content"], div[class*="thread"], div[class*="chat"], article, section, div[role="button"], a'
        );
        if (
          parent &&
          parent !== element &&
          !parent.hasAttribute("data-reel-blocked")
        ) {
          // Check if parent also contains reel indicators
          if (
            isReelElement(parent) ||
            parent.querySelector(
              'a[href*="/reel/"], a[href*="/reels/"], video, img[src*="reel"]'
            )
          ) {
            return parent;
          }
        }
        return element;
      }

      return null;
    }

    // Find all reel links in chat messages - more comprehensive selectors
    const chatSelectors = [
      'a[href*="/reel/"]',
      'a[href*="/reels/"]',
      '[href*="/reel/"]',
      '[href*="/reels/"]',
    ];

    // Process all potential reel elements
    const allElements = document.querySelectorAll(
      'a, div, article, section, [role="button"], [role="link"]'
    );
    const processedContainers = new Set();

    // Check if we're on Explore page or home page
    const currentUrl = window.location.href;
    const pathname = window.location.pathname;
    const isExplorePage =
      pathname === "/explore/" ||
      pathname === "/explore" ||
      currentUrl.includes("/explore/");
    const isHomePageFeed = isHomePage();

    allElements.forEach((element) => {
      // Skip if already blocked or processed
      if (element.closest('[data-reel-blocked="true"]')) return;
      if (processedContainers.has(element)) return;

      // Check if this element is in a chat context, Explore page, or home page feed
      const chatContext = element.closest(
        '[role="main"], [class*="message"], [class*="bubble"], [class*="thread"], [class*="chat"], [class*="DirectMessage"]'
      );

      // Check if element is in main feed (article elements on home page)
      const isInFeed =
        element.closest('article, section[role="feed"]') && isHomePageFeed;

      // Allow processing if in chat, Explore page, or home page feed
      if (!chatContext && !isExplorePage && !isInFeed) return;

      // Check if element is a reel or contains reel content
      if (!isReelElement(element)) {
        // Check if it contains reel links or media
        const reelLink = element.querySelector(
          'a[href*="/reel/"], a[href*="/reels/"]'
        );
        const reelVideo = element.querySelector("video");
        const reelImage = element.querySelector(
          'img[src*="reel"], img[alt*="reel"]'
        );

        // Also check for images with play buttons (common reel pattern)
        const hasImageAndPlayButton =
          element.querySelector("img") &&
          element.querySelector(
            'svg[aria-label*="Play"], svg[aria-label*="play"], [class*="play"], [class*="Play"]'
          );

        if (!reelLink && !reelVideo && !reelImage && !hasImageAndPlayButton)
          return;
      }

      // Find the best container to block
      let reelContainer = findReelContainer(element) || element;

      // If element itself isn't a reel but contains reel content, try to find a better container
      if (!isReelElement(element)) {
        // Prioritize article elements for home page feed
        let betterContainer = null;
        if (isHomePageFeed) {
          betterContainer = element.closest("article");
        }
        if (!betterContainer) {
          betterContainer = element.closest(
            'div[class*="message"], div[class*="bubble"], div[class*="media"], article, section, a'
          );
        }
        if (
          betterContainer &&
          betterContainer !== element &&
          !betterContainer.hasAttribute("data-reel-blocked")
        ) {
          reelContainer = betterContainer;
        }
      }

      // Skip if already processed
      if (
        processedContainers.has(reelContainer) ||
        reelContainer.hasAttribute("data-reel-blocked")
      )
        return;

      // Mark as processed
      processedContainers.add(reelContainer);

      // Store original content
      if (!reelContainer.dataset.originalContent) {
        reelContainer.dataset.originalContent = reelContainer.innerHTML;
      }

      // On home page, just hide the content (no blocked card)
      // On other pages (chat, explore), show blocked card
      if (isHomePageFeed) {
        reelContainer.innerHTML = "";
        reelContainer.style.cssText = `
          width: 100%;
          min-height: 120px;
          background: transparent;
          pointer-events: none;
        `;
      } else {
        // Create and insert blocked card
        const blockedCardElement = createBlockedCard();
        reelContainer.innerHTML = "";
        reelContainer.appendChild(blockedCardElement);
      }
      reelContainer.setAttribute("data-reel-blocked", "true");
    });

    // Also look for video elements in chat, Explore page, or home page feed (reels often have video tags)
    const videos = document.querySelectorAll("video");
    videos.forEach((video) => {
      // Check if video is in a chat context, Explore page, or home page feed
      const chatContext = video.closest(
        '[role="main"], [class*="message"], [class*="bubble"], [class*="thread"], [class*="chat"], [class*="DirectMessage"]'
      );

      // Check if video is in main feed article (home page)
      const isInFeed =
        video.closest('article, section[role="feed"]') && isHomePageFeed;

      // Allow processing if in chat, Explore page, or home page feed
      if (!chatContext && !isExplorePage && !isInFeed) return;

      // Skip if already blocked
      if (video.closest('[data-reel-blocked="true"]')) return;

      // Check if parent or sibling has reel link
      const parent = video.parentElement;
      const reelLink =
        parent?.querySelector('a[href*="/reel/"], a[href*="/reels/"]') ||
        chatContext.querySelector('a[href*="/reel/"], a[href*="/reels/"]');

      if (reelLink || video.src?.includes("reel")) {
        // Find container
        let reelContainer = parent;
        if (reelLink) {
          const linkContainer = reelLink.closest(
            'div[class*="message"], div[class*="bubble"], div[class*="media"], article, section'
          );
          if (linkContainer) reelContainer = linkContainer;
        }

        if (!reelContainer || reelContainer.hasAttribute("data-reel-blocked"))
          return;
        if (processedContainers.has(reelContainer)) return;
        processedContainers.add(reelContainer);

        // Store original content
        if (!reelContainer.dataset.originalContent) {
          reelContainer.dataset.originalContent = reelContainer.innerHTML;
        }

        // On home page, just hide the content (no blocked card)
        // On other pages (chat, explore), show blocked card
        if (isHomePageFeed) {
          reelContainer.innerHTML = "";
          reelContainer.style.cssText = `
            width: 100%;
            min-height: 120px;
            background: transparent;
            pointer-events: none;
          `;
        } else {
          // Create and insert blocked card in the specific reel content area
          const blockedCardElement = createBlockedCard();
          reelContainer.innerHTML = "";
          reelContainer.appendChild(blockedCardElement);
        }
        reelContainer.setAttribute("data-reel-blocked", "true");
      }
    });

    // Look for images with play buttons (common reel thumbnail pattern)
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      // Check if image is in a chat context, Explore page, or home page feed
      const chatContext = img.closest(
        '[role="main"], [class*="message"], [class*="bubble"], [class*="thread"], [class*="chat"], [class*="DirectMessage"]'
      );

      // Check if image is in main feed (home page)
      const isInFeed =
        img.closest('article, section[role="feed"]') && isHomePageFeed;

      // Allow processing if in chat, Explore page, or home page feed
      if (!chatContext && !isExplorePage && !isInFeed) return;

      // Skip if already blocked
      if (img.closest('[data-reel-blocked="true"]')) return;

      // Check if image has a play button overlay (common for reels)
      const parent = img.parentElement;
      const hasPlayButton =
        parent?.querySelector(
          'svg[aria-label*="Play"], svg[aria-label*="play"], [class*="play"], [class*="Play"], svg[viewBox*="0 0"], svg path[d*="M8 5"], svg path[d*="m8 5"]'
        ) ||
        chatContext.querySelector(
          'svg[aria-label*="Play"], svg[aria-label*="play"]'
        );

      // Check if parent or nearby has reel link
      const reelLink =
        parent?.querySelector('a[href*="/reel/"], a[href*="/reels/"]') ||
        chatContext.querySelector('a[href*="/reel/"], a[href*="/reels/"]');

      if (
        hasPlayButton ||
        reelLink ||
        img.src?.includes("reel") ||
        img.alt?.toLowerCase().includes("reel")
      ) {
        // Find container
        let reelContainer = parent;
        if (reelLink) {
          const linkContainer = reelLink.closest(
            'div[class*="message"], div[class*="bubble"], div[class*="media"], article, section'
          );
          if (linkContainer) reelContainer = linkContainer;
        }

        if (!reelContainer || reelContainer.hasAttribute("data-reel-blocked"))
          return;
        if (processedContainers.has(reelContainer)) return;
        processedContainers.add(reelContainer);

        // Store original content
        if (!reelContainer.dataset.originalContent) {
          reelContainer.dataset.originalContent = reelContainer.innerHTML;
        }

        // On home page, just hide the content (no blocked card)
        // On other pages (chat, explore), show blocked card
        if (isHomePageFeed) {
          reelContainer.innerHTML = "";
          reelContainer.style.cssText = `
            width: 100%;
            min-height: 120px;
            background: transparent;
            pointer-events: none;
          `;
        } else {
          // Create and insert blocked card in the specific reel content area
          const blockedCardElement = createBlockedCard();
          reelContainer.innerHTML = "";
          reelContainer.appendChild(blockedCardElement);
        }
        reelContainer.setAttribute("data-reel-blocked", "true");
      }
    });

    // Additional check: Look for any div/container that has both an image and play button (very common reel pattern)
    const containers = document.querySelectorAll("div, article, section");
    containers.forEach((container) => {
      // Check if container is in a chat context, Explore page, or home page feed
      const chatContext = container.closest(
        '[role="main"], [class*="message"], [class*="bubble"], [class*="thread"], [class*="chat"], [class*="DirectMessage"]'
      );

      // Check if container is in main feed (home page)
      const isInFeed =
        container.closest('article, section[role="feed"]') && isHomePageFeed;

      // Allow processing if in chat, Explore page, or home page feed
      if (!chatContext && !isExplorePage && !isInFeed) return;

      // Skip if already blocked or processed
      if (
        container.hasAttribute("data-reel-blocked") ||
        processedContainers.has(container)
      )
        return;
      if (container.closest('[data-reel-blocked="true"]')) return;

      // Check if container has both an image and a play button (strong indicator of reel)
      const hasImage = container.querySelector("img");
      const hasPlayButton = container.querySelector(
        'svg[aria-label*="Play"], svg[aria-label*="play"], [class*="play"], [class*="Play"], svg path[d*="M8 5"], svg path[d*="m8 5"]'
      );
      const hasReelLink = container.querySelector(
        'a[href*="/reel/"], a[href*="/reels/"]'
      );

      // If it has image + play button, or image + reel link, it's likely a reel
      if (hasImage && (hasPlayButton || hasReelLink)) {
        // Make sure it's not too large (to avoid blocking entire chat areas)
        const rect = container.getBoundingClientRect();
        if (rect.width > 500 || rect.height > 500) {
          // Check if it's a direct child of chat context (more likely to be a reel container)
          if (container.parentElement !== chatContext) return;
        }

        processedContainers.add(container);

        // Store original content
        if (!container.dataset.originalContent) {
          container.dataset.originalContent = container.innerHTML;
        }

        // On home page, just hide the content (no blocked card)
        // On other pages (chat, explore), show blocked card
        if (isHomePageFeed) {
          container.innerHTML = "";
          container.style.cssText = `
            width: 100%;
            min-height: 120px;
            background: transparent;
            pointer-events: none;
          `;
        } else {
          // Create and insert blocked card in the specific reel content area
          const blockedCardElement = createBlockedCard();
          container.innerHTML = "";
          container.appendChild(blockedCardElement);
        }
        container.setAttribute("data-reel-blocked", "true");
      }
    });
  }

  // Function to detect and block playing reels on any page
  function blockPlayingReels() {
    if (!isBlockingEnabled) return;

    // Don't block reels on Profile pages (but allow on Explore page)
    if (isProfilePage()) {
      return;
    }

    // Find all video elements on the page
    const videos = document.querySelectorAll("video");
    videos.forEach((video) => {
      // Skip if already blocked
      if (video.closest('[data-reel-blocked="true"]')) return;

      // Check if this video is a reel - be more specific
      const videoSrc = video.src || video.currentSrc || "";
      const parent = video.parentElement;
      const article = video.closest('article, section, div[role="main"]');

      const isReel =
        // Direct indicators
        videoSrc.includes("reel") ||
        video.closest('a[href*="/reel/"], a[href*="/reels/"]') ||
        video.closest('[class*="reel"]') ||
        // Check parent/ancestor for reel links
        parent?.querySelector('a[href*="/reel/"], a[href*="/reels/"]') ||
        article?.querySelector('a[href*="/reel/"], a[href*="/reels/"]') ||
        // Check for reel-specific classes or attributes
        article?.querySelector('[class*="reel"], [class*="Reel"]') ||
        // Check if URL contains reel in the path (for embedded reels)
        window.location.href.includes("/reel/") ||
        window.location.href.includes("/reels/");

      if (isReel) {
        // Pause the video immediately
        video.pause();
        video.currentTime = 0;
        video.muted = true;

        // Find the container to replace
        let container = video.parentElement;
        const reelLink =
          container?.querySelector('a[href*="/reel/"], a[href*="/reels/"]') ||
          video.closest(
            'article, section, div[role="main"], div[class*="post"]'
          );

        if (reelLink) {
          const linkContainer = reelLink.closest(
            'article, section, div[class*="post"], div[role="main"]'
          );
          if (linkContainer) container = linkContainer;
        }

        if (!container || container.hasAttribute("data-reel-blocked")) return;

        // Store original content
        if (!container.dataset.originalContent) {
          container.dataset.originalContent = container.innerHTML;
        }

        // On home page, just hide the content (no blocked card)
        // On other pages, show blocked card
        if (isHomePage()) {
          container.innerHTML = "";
          container.style.cssText = `
            width: 100%;
            min-height: 120px;
            background: transparent;
            pointer-events: none;
          `;
        } else {
          // Create and insert blocked card in the specific reel content area
          const blockedCardElement = createBlockedCard();
          container.innerHTML = "";
          container.appendChild(blockedCardElement);
        }
        container.setAttribute("data-reel-blocked", "true");
      }
    });
  }

  // Function to check and block if on reels page (show blank page instead of redirecting)
  // Only blanks the page if we're actually on a reel page, not on home page with reels content
  function checkAndBlockReelsPage() {
    if (!isBlockingEnabled || isRedirecting) return;

    // Don't blank if body is not ready
    if (!document.body || document.body.children.length === 0) {
      return false;
    }

    const currentUrl = window.location.href;
    const pathname = window.location.pathname;

    // First, check if we're on home page - if so, NEVER blank the page
    // Use the same robust home page detection as isHomePage() function
    const isHomePageCheck = isHomePage();
    if (isHomePageCheck) {
      // Never blank the home page - just return
      return false;
    }

    // Only blank the page if we're on a specific reel page, not on home page
    // Double-check we're not on home page before blanking
    if (isHomePage()) {
      return false;
    }

    // Check if we're on a reels page
    if (
      currentUrl.includes("/reel/") ||
      currentUrl.includes("/reels/") ||
      pathname.startsWith("/reel/") ||
      pathname.startsWith("/reels/")
    ) {
      // Final safety check - make absolutely sure we're not on home page
      if (isHomePage()) {
        return false;
      }

      isRedirecting = true;
      // Make the page blank instead of redirecting
      document.body.innerHTML = "";
      document.body.style.cssText = `
        margin: 0;
        padding: 0;
        background: #000;
        width: 100%;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      return true;
    }

    // Also check if we're on a post page that is actually a reel (not just contains reel links)
    if (currentUrl.includes("/p/")) {
      // Check if the main content is a reel (video with reel indicators)
      const mainVideo = document.querySelector(
        'article video, section video, div[role="main"] video'
      );
      if (mainVideo) {
        const isMainReel =
          mainVideo.src?.includes("reel") ||
          mainVideo.closest('a[href*="/reel/"], a[href*="/reels/"]') ||
          mainVideo
            .closest("article, section")
            ?.querySelector('a[href*="/reel/"], a[href*="/reels/"]') ||
          mainVideo.closest('[class*="reel"]');

        if (isMainReel) {
          // Final safety check - make absolutely sure we're not on home page
          if (isHomePage()) {
            return false;
          }

          isRedirecting = true;
          // Make the page blank instead of redirecting
          document.body.innerHTML = "";
          document.body.style.cssText = `
              margin: 0;
              padding: 0;
              background: #000;
              width: 100%;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            `;
          return true;
        }
      }
    }

    return false;
  }

  // Delayed check to ensure page structure is loaded
  setTimeout(() => {
    checkAndBlockReelsPage();
    blockPlayingReels();
  }, 100);

  // Listen for video play events to catch reels as they start playing
  document.addEventListener(
    "play",
    (e) => {
      if (!isBlockingEnabled) return;
      if (e.target.tagName === "VIDEO") {
        setTimeout(() => {
          blockPlayingReels();
        }, 100);
      }
    },
    true
  );

  // Also listen for video load events
  document.addEventListener(
    "loadeddata",
    (e) => {
      if (!isBlockingEnabled) return;
      if (e.target.tagName === "VIDEO") {
        setTimeout(() => {
          blockPlayingReels();
        }, 100);
      }
    },
    true
  );

  // Intercept history API changes - must be done early
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(history, args);
    setTimeout(() => {
      if (checkAndBlockReelsPage()) return;
      isRedirecting = false;
    }, 10);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args);
    setTimeout(() => {
      if (checkAndBlockReelsPage()) return;
      isRedirecting = false;
    }, 10);
  };

  // Listen for popstate (back/forward button)
  window.addEventListener("popstate", () => {
    setTimeout(() => {
      checkAndBlockReelsPage();
      isRedirecting = false;
    }, 10);
  });

  // Monitor URL changes more aggressively
  let lastUrl = location.href;
  const urlCheckInterval = setInterval(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      if (checkAndBlockReelsPage()) {
        return;
      }
      isRedirecting = false;
    }
  }, 100);

  // Store reference to the reel modal that needs to be closed
  let pendingReelModalToClose = null;

  // Helper function to check if we're on Profile page
  function isProfilePage() {
    const pathname = window.location.pathname;

    // Check if we're on Profile page (e.g., /username/, /username/posts/, etc.)
    const isProfile =
      pathname.match(/^\/[^\/]+\/?$/) || // /username/
      pathname.match(/^\/[^\/]+\/(posts|reels|tagged|saved)\/?$/); // /username/posts/, etc.

    return isProfile;
  }

  // Helper function to safely trigger a click on an element
  function safeClick(element) {
    if (!element) return false;

    try {
      if (typeof element.click === "function") {
        element.click();
        return true;
      } else {
        // Try dispatching a mouse event
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        element.dispatchEvent(clickEvent);
        return true;
      }
    } catch (e) {
      console.warn("Failed to click element:", e);
      return false;
    }
  }

  // Helper function to check if we're on home page
  function isHomePage() {
    try {
      const currentUrl = window.location.href;
      const pathname = window.location.pathname;

      // First check: if URL contains reel/reels, definitely not home page
      if (currentUrl.includes("/reel/") || currentUrl.includes("/reels/")) {
        return false;
      }

      // Second check: pathname must be home-like
      const isHomePath =
        pathname === "/" ||
        pathname === "" ||
        pathname === "/?" ||
        pathname.startsWith("/?");

      if (!isHomePath) {
        return false;
      }

      // Third check: URL must be home page URL
      const isHomeUrl =
        currentUrl === "https://www.instagram.com/" ||
        currentUrl === "https://www.instagram.com" ||
        currentUrl.startsWith("https://www.instagram.com/?") ||
        currentUrl.startsWith("https://www.instagram.com#") ||
        (currentUrl.includes("instagram.com") &&
          !currentUrl.includes("/reel/") &&
          !currentUrl.includes("/reels/") &&
          (pathname === "/" || pathname === ""));

      if (!isHomeUrl) {
        return false;
      }

      // Fourth check: look for feed structure (but don't require it - sometimes it loads late)
      // If we have the URL and pathname checks, that's enough
      return true;
    } catch (e) {
      // If there's any error, default to false (not home page) to be safe
      return false;
    }
  }

  // Helper function to check if we're on followers/following pages
  function isFollowersFollowingPage() {
    try {
      const currentUrl = window.location.href;
      const pathname = window.location.pathname;

      // Check if URL or pathname indicates followers/following page
      return (
        pathname.includes("/followers/") ||
        pathname.includes("/following/") ||
        currentUrl.includes("/followers/") ||
        currentUrl.includes("/following/") ||
        pathname.match(/\/[^\/]+\/(followers|following)\/?$/)
      );
    } catch (e) {
      return false;
    }
  }

  // Function to show blocked content alert modal
  function showBlockedContentAlert() {
    // Don't show popup on home page - only show inline blocked cards
    // Double check to be absolutely sure
    if (isHomePage()) {
      return;
    }

    // Don't show popup on followers/following pages
    if (isFollowersFollowingPage()) {
      return;
    }

    // Additional safety check - verify we're not on home page by checking URL again
    const currentUrl = window.location.href;
    const pathname = window.location.pathname;
    if (
      (pathname === "/" || pathname === "" || pathname === "/?") &&
      !currentUrl.includes("/reel/") &&
      !currentUrl.includes("/reels/")
    ) {
      return;
    }

    // Check if alert already exists
    if (document.getElementById("reel-blocked-alert")) return;

    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "reel-blocked-alert";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
      pointer-events: auto;
    `;

    // Add fade-in animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Create modal content
    const modal = document.createElement("div");
    modal.style.cssText = `
      background: linear-gradient(135deg, rgba(18, 18, 18, 0.98) 0%, rgba(28, 28, 28, 0.98) 100%);
      border-radius: 20px;
      padding: 32px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                  0 0 0 1px rgba(255, 255, 255, 0.1);
      animation: slideUp 0.3s ease;
      position: relative;
    `;

    // Create icon container
    const iconContainer = document.createElement("div");
    iconContainer.style.cssText = `
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(225, 48, 108, 0.25) 0%, rgba(138, 58, 185, 0.25) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(225, 48, 108, 0.4);
      box-shadow: 0 8px 24px rgba(225, 48, 108, 0.3);
      margin: 0 auto 20px;
    `;

    const icon = document.createElement("div");
    icon.innerHTML = "🚫";
    icon.style.cssText = `
      font-size: 32px;
      line-height: 1;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    `;
    iconContainer.appendChild(icon);

    // Create title
    const title = document.createElement("div");
    title.textContent = "Reel Blocked";
    title.style.cssText = `
      font-size: 24px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
      text-align: center;
      margin-bottom: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      letter-spacing: -0.5px;
    `;

    // Create description
    const description = document.createElement("div");
    description.textContent =
      "This reel has been blocked to help you stay focused. You can disable this in the extension settings.";
    description.style.cssText = `
      font-size: 14px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.7);
      text-align: center;
      line-height: 1.6;
      margin-bottom: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    `;

    // Create anchor tag for close button
    const closeLink = document.createElement("a");
    closeLink.href = "#";
    closeLink.textContent = "Got it";
    closeLink.style.cssText = `
      display: block;
      width: 100%;
      padding: 12px 24px;
      background: linear-gradient(135deg, rgba(225, 48, 108, 0.2) 0%, rgba(138, 58, 185, 0.2) 100%);
      border: 1px solid rgba(225, 48, 108, 0.3);
      border-radius: 12px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      transition: all 0.2s ease;
      text-align: center;
      text-decoration: none;
      box-sizing: border-box;
    `;

    closeLink.addEventListener("mouseenter", () => {
      closeLink.style.background =
        "linear-gradient(135deg, rgba(225, 48, 108, 0.3) 0%, rgba(138, 58, 185, 0.3) 100%)";
      closeLink.style.borderColor = "rgba(225, 48, 108, 0.5)";
    });

    closeLink.addEventListener("mouseleave", () => {
      closeLink.style.background =
        "linear-gradient(135deg, rgba(225, 48, 108, 0.2) 0%, rgba(138, 58, 185, 0.2) 100%)";
      closeLink.style.borderColor = "rgba(225, 48, 108, 0.3)";
    });

    closeLink.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Close the reel modal first (if exists)
      if (pendingReelModalToClose) {
        const modal = pendingReelModalToClose;

        // Try to find a clickable close button
        let modalCloseButton = modal.querySelector(
          'button[aria-label*="Close"], ' + 'button[aria-label*="close"]'
        );

        // If not found, try to find a button with close icon
        if (!modalCloseButton) {
          const closeIcon = modal.querySelector(
            'svg[aria-label*="Close"], ' + 'svg[aria-label*="close"]'
          );
          if (closeIcon) {
            // Find the parent button
            modalCloseButton = closeIcon.closest('button, [role="button"]');
          }
        }

        // If still not found, try role="button" elements
        if (!modalCloseButton) {
          modalCloseButton = modal.querySelector(
            '[role="button"][aria-label*="Close"]'
          );
        }

        if (modalCloseButton) {
          safeClick(modalCloseButton);
        } else {
          // Try pressing Escape key
          const escapeEvent = new KeyboardEvent("keydown", {
            key: "Escape",
            code: "Escape",
            keyCode: 27,
            which: 27,
            bubbles: true,
            cancelable: true,
          });
          modal.dispatchEvent(escapeEvent);
          document.dispatchEvent(escapeEvent);

          // Remove modal if still visible
          if (modal.parentElement) {
            modal.style.display = "none";
            modal.remove();
          }
        }
        pendingReelModalToClose = null;
      }

      // Animate out the alert
      overlay.style.animation = "fadeOut 0.3s ease";

      // Remove overlay after animation
      setTimeout(() => {
        if (overlay && overlay.parentElement) {
          overlay.remove();
        }
        if (style && style.parentElement) {
          style.remove();
        }
      }, 300);
    });

    // Assemble modal
    modal.appendChild(iconContainer);
    modal.appendChild(title);
    modal.appendChild(description);
    modal.appendChild(closeLink);
    overlay.appendChild(modal);

    // Prevent modal clicks from closing the overlay
    modal.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeLink.click();
      }
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      if (document.getElementById("reel-blocked-alert")) {
        closeLink.click();
      }
    }, 5000);

    // Ensure overlay is appended to body and stays on top
    // Use requestAnimationFrame to ensure DOM is ready
    const appendOverlay = () => {
      if (document.body) {
        // Remove any existing alert first
        const existing = document.getElementById("reel-blocked-alert");
        if (existing) existing.remove();

        document.body.appendChild(overlay);

        // Force it to stay on top by bringing to front
        overlay.style.zIndex = "9999999";

        // Prevent any clicks from propagating to elements behind
        overlay.addEventListener(
          "click",
          (e) => {
            e.stopPropagation();
          },
          true
        );
      } else {
        requestAnimationFrame(appendOverlay);
      }
    };

    appendOverlay();
  }

  // Function to detect and close Reels modals/popups
  function detectAndCloseReelsModal() {
    if (!isBlockingEnabled) return;

    // Don't show popup on home page
    if (isHomePage()) return;

    // Don't show popup on followers/following pages
    if (isFollowersFollowingPage()) return;

    let reelDetected = false;

    // Common selectors for Instagram modals/overlays that contain reels
    const modalSelectors = [
      '[role="dialog"]',
      '[aria-modal="true"]',
      'div[style*="position: fixed"]',
      'div[style*="z-index"]',
      '[class*="modal"]',
      '[class*="overlay"]',
      '[class*="Dialog"]',
      '[class*="Reel"]',
    ];

    // Look for modals that contain reel content
    modalSelectors.forEach((selector) => {
      const modals = document.querySelectorAll(selector);
      modals.forEach((modal) => {
        // Check if this modal contains reel-related content
        // Be more specific - only check for actual reel links/videos, not text content
        // (text content can contain "reel" in words like "following")
        const hasReelContent =
          modal.querySelector('video[src*="reel"]') ||
          modal.querySelector('a[href*="/reel/"]') ||
          modal.querySelector('a[href*="/reels/"]') ||
          // Only check aria-label if it specifically mentions "Reel" or "Reels" (capitalized, indicating it's about reels)
          (modal.getAttribute("aria-label")?.includes("Reel") &&
            !modal
              .getAttribute("aria-label")
              ?.toLowerCase()
              .includes("following")) ||
          modal.querySelector('[aria-label*="Reel"]') ||
          modal.querySelector('[aria-label*="Reels"]');

        if (hasReelContent) {
          reelDetected = true;

          // Don't show popup on home page
          if (!isHomePage()) {
            // Store reference to modal to close after alert is dismissed
            pendingReelModalToClose = modal;

            // Show blocked content alert - it will close the modal when dismissed
            showBlockedContentAlert();
          }
        }
      });
    });

    // Also check for video elements that are reels in modals
    const videos = document.querySelectorAll("video");
    videos.forEach((video) => {
      // Check if video is in a modal/overlay context
      const parentModal = video.closest(
        '[role="dialog"], [aria-modal="true"], div[style*="position: fixed"]'
      );
      if (parentModal) {
        // Check if it's a reel video
        const isReel =
          video.src?.includes("reel") ||
          parentModal.querySelector('a[href*="/reel/"]') ||
          parentModal.querySelector('a[href*="/reels/"]') ||
          parentModal.textContent?.toLowerCase().includes("reel");

        if (isReel) {
          reelDetected = true;

          // Pause the video
          video.pause();
          video.currentTime = 0;

          // Don't show popup on home page
          if (!isHomePage()) {
            // Store reference to modal to close after alert is dismissed
            pendingReelModalToClose = parentModal;

            // Show blocked content alert - it will close the modal when dismissed
            showBlockedContentAlert();
          }
        }
      }
    });
  }

  // Periodically check for Reels buttons (in case they're added dynamically)
  const buttonCheckInterval = setInterval(() => {
    if (isBlockingEnabled) {
      updateReelsButtonVisibility();
      addReelsBlockedCardsInChat();
      detectAndCloseReelsModal();
      blockPlayingReels();
    }
  }, 1000);

  // Intercept all clicks - block reels on click
  document.addEventListener(
    "click",
    (e) => {
      if (!isBlockingEnabled) return;

      // Don't block reels on home page - allow them to work normally
      if (isHomePage()) {
        return;
      }

      // Skip if clicking on a blocked card
      if (e.target.closest('[data-reel-blocked="true"], .reel-blocked-card')) {
        return;
      }

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

          // Only show popup if not on home page
          if (!isHomePage()) {
            showBlockedContentAlert();
          }

          // Also check for modals that might have opened
          setTimeout(() => detectAndCloseReelsModal(), 50);
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

              // Only show popup if not on home page
              if (!isHomePage()) {
                showBlockedContentAlert();
              }

              setTimeout(() => detectAndCloseReelsModal(), 50);
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
          (element.onclick || element.closest('a, button, [role="button"]'))
        ) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          // Only show popup if not on home page
          if (!isHomePage()) {
            showBlockedContentAlert();
          }

          setTimeout(() => detectAndCloseReelsModal(), 50);
          return false;
        }

        // Check for reel links in chat messages (often have different structure)
        const chatContext = element.closest(
          '[role="main"], [class*="chat"], [class*="message"], [class*="thread"]'
        );
        if (chatContext) {
          const reelLink = chatContext.querySelector(
            'a[href*="/reel/"], a[href*="/reels/"]'
          );
          if (
            reelLink &&
            (reelLink.contains(element) || element.contains(reelLink))
          ) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            // Only show popup if not on home page
            if (!isHomePage()) {
              showBlockedContentAlert();
            }

            setTimeout(() => detectAndCloseReelsModal(), 50);
            return false;
          }
        }

        element = element.parentElement;
      }
    },
    true // Use capture phase
  );

  // Monitor for route changes in Instagram's router
  const routeObserver = new MutationObserver(() => {
    setTimeout(() => {
      checkAndBlockReelsPage();
      isRedirecting = false;
      updateReelsButtonVisibility();
      addReelsBlockedCardsInChat();
      // Only detect modals if not on home page
      if (!isHomePage()) {
        detectAndCloseReelsModal();
      }
      blockPlayingReels();
    }, 50);
  });

  // Dedicated observer for modal detection (more aggressive)
  const modalObserver = new MutationObserver((mutations) => {
    if (!isBlockingEnabled) return;

    // Don't detect modals on home page
    if (isHomePage()) return;

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          // Check if the added node is a modal or contains reel content
          const isModal =
            node.matches?.('[role="dialog"]') ||
            node.matches?.('[aria-modal="true"]') ||
            node.querySelector?.('[role="dialog"]') ||
            node.querySelector?.('[aria-modal="true"]');

          if (isModal) {
            // Immediately check and close if it's a reel modal
            setTimeout(() => {
              if (!isHomePage()) {
                detectAndCloseReelsModal();
              }
              addReelsBlockedCardsInChat();
              blockPlayingReels();
            }, 10);
          }

          // Check for video elements being added
          if (node.matches?.("video") || node.querySelector?.("video")) {
            setTimeout(() => {
              if (!isHomePage()) {
                detectAndCloseReelsModal();
              }
              addReelsBlockedCardsInChat();
              blockPlayingReels();
            }, 10);
          }

          // Check for reel links or images being added (for chat blocking)
          if (
            node.matches?.(
              'a[href*="/reel/"], a[href*="/reels/"], img[src*="reel"]'
            ) ||
            node.querySelector?.(
              'a[href*="/reel/"], a[href*="/reels/"], img[src*="reel"]'
            )
          ) {
            setTimeout(() => {
              addReelsBlockedCardsInChat();
            }, 10);
          }
        }
      });
    });
  });

  // Start observing when DOM is ready
  if (document.body) {
    routeObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    modalObserver.observe(document.body, {
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
        modalObserver.observe(document.body, {
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
    modalObserver.disconnect();
  });
})();
