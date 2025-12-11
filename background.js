// Service worker for blocking YouTube Shorts and Instagram Reels
const BLOCKING_RULES = [
  // YouTube Shorts rules
  {
    id: 1,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { url: "https://www.youtube.com" },
    },
    condition: {
      urlFilter: "*youtube.com/shorts/*",
      resourceTypes: ["main_frame"],
    },
  },
  {
    id: 2,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { url: "https://www.youtube.com" },
    },
    condition: {
      regexFilter: "https?://(www\\.)?youtu\\.be/.*/shorts/.*",
      resourceTypes: ["main_frame"],
    },
  },
  // Instagram Reels rules
  {
    id: 3,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { url: "https://www.instagram.com" },
    },
    condition: {
      urlFilter: "*instagram.com/reel/*",
      resourceTypes: ["main_frame"],
    },
  },
  {
    id: 4,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { url: "https://www.instagram.com" },
    },
    condition: {
      urlFilter: "*instagram.com/reels/*",
      resourceTypes: ["main_frame"],
    },
  },
];

// Initialize rules on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Shorts & Reels Blocker installed");

  // Set default state to enabled
  chrome.storage.sync.get(["blockerEnabled"], (result) => {
    if (result.blockerEnabled === undefined) {
      chrome.storage.sync.set({ blockerEnabled: true });
    }

    // Initialize rules if enabled
    chrome.storage.sync.get(["blockerEnabled"], (result) => {
      if (result.blockerEnabled !== false) {
        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [1, 2, 3, 4],
          addRules: BLOCKING_RULES,
        });
      }
    });
  });
});

// Listen for navigation to YouTube Shorts and Instagram Reels
chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    chrome.storage.sync.get(["blockerEnabled"], (result) => {
      if (result.blockerEnabled === false) return;

      if (details.url.includes("/shorts/")) {
        // Redirect to YouTube homepage
        chrome.tabs.update(details.tabId, {
          url: "https://www.youtube.com",
        });
      } else if (
        details.url.includes("/reel/") ||
        details.url.includes("/reels/")
      ) {
        // Redirect to Instagram homepage
        chrome.tabs.update(details.tabId, {
          url: "https://www.instagram.com",
        });
      }
    });
  },
  {
    url: [
      { hostContains: "youtube.com" },
      { hostContains: "youtu.be" },
      { hostContains: "instagram.com" },
    ],
  }
);

// Also listen for tab updates (catches client-side navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;

  chrome.storage.sync.get(["blockerEnabled"], (result) => {
    if (result.blockerEnabled === false) return;

    if (changeInfo.url.includes("/shorts/")) {
      chrome.tabs.update(tabId, {
        url: "https://www.youtube.com",
      });
    } else if (
      changeInfo.url.includes("/reel/") ||
      changeInfo.url.includes("/reels/")
    ) {
      chrome.tabs.update(tabId, {
        url: "https://www.instagram.com",
      });
    }
  });
});
