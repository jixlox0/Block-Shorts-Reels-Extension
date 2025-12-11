// Popup script for extension UI
document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  const statusText = document.getElementById("statusText");
  const toggleBtn = document.getElementById("toggleBtn");

  // Load current state
  chrome.storage.sync.get(["blockerEnabled"], (result) => {
    const isEnabled = result.blockerEnabled !== false; // Default to enabled
    updateUI(isEnabled);
  });

  // Toggle button click handler
  toggleBtn.addEventListener("click", () => {
    chrome.storage.sync.get(["blockerEnabled"], (result) => {
      const currentState = result.blockerEnabled !== false;
      const newState = !currentState;

      chrome.storage.sync.set({ blockerEnabled: newState }, () => {
        updateUI(newState);
        // Update rules based on new state
        if (newState) {
          chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1, 2, 3, 4],
            addRules: [
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
            ],
          });
        } else {
          // Remove rules when disabled
          chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1, 2, 3, 4],
          });
        }
      });
    });
  });

  function updateUI(isEnabled) {
    if (isEnabled) {
      statusDiv.className = "status active";
      statusText.textContent = "✓ Blocking is ACTIVE";
      toggleBtn.textContent = "Disable Blocker";
      toggleBtn.className = "toggle-btn disable";
    } else {
      statusDiv.className = "status inactive";
      statusText.textContent = "✗ Blocking is INACTIVE";
      toggleBtn.textContent = "Enable Blocker";
      toggleBtn.className = "toggle-btn enable";
    }
  }
});
