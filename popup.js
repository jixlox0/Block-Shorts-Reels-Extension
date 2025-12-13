// Popup script for extension UI

// Block extension inspection (runs immediately, before DOMContentLoaded)
(function () {
  "use strict";

  // Disable right-click context menu
  document.addEventListener(
    "contextmenu",
    function (e) {
      e.preventDefault();
      return false;
    },
    false
  );

  // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
  document.addEventListener(
    "keydown",
    function (e) {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        return false;
      }
      // Ctrl+S (Save Page)
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        return false;
      }
    },
    false
  );

  // Disable text selection
  document.addEventListener(
    "selectstart",
    function (e) {
      e.preventDefault();
      return false;
    },
    false
  );

  // Disable drag
  document.addEventListener(
    "dragstart",
    function (e) {
      e.preventDefault();
      return false;
    },
    false
  );

  // Clear console on load
  if (typeof console !== "undefined") {
    console.clear();
    console.log(
      "%cStop!",
      "color: red; font-size: 50px; font-weight: bold;"
    );
    console.log(
      "%cThis is a browser feature intended for developers.",
      "font-size: 16px;"
    );
  }

  // Override console methods
  const noop = function () {};
  const methods = [
    "log",
    "debug",
    "info",
    "warn",
    "error",
    "assert",
    "dir",
    "dirxml",
    "group",
    "groupEnd",
    "time",
    "timeEnd",
    "count",
    "trace",
    "profile",
    "profileEnd",
  ];
  methods.forEach(function (method) {
    if (console[method]) {
      console[method] = noop;
    }
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  const statusText = document.getElementById("statusText");
  const toggleBtn = document.getElementById("toggleBtn");
  const authModal = document.getElementById("authModal");
  const authPassword = document.getElementById("authPassword");
  const authSubmit = document.getElementById("authSubmit");
  const authCancel = document.getElementById("authCancel");
  const authError = document.getElementById("authError");
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const currentPassword = document.getElementById("currentPassword");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const settingsSubmit = document.getElementById("settingsSubmit");
  const settingsCancel = document.getElementById("settingsCancel");
  const settingsError = document.getElementById("settingsError");
  const settingsSuccess = document.getElementById("settingsSuccess");
  const authClose = document.getElementById("authClose");
  const settingsClose = document.getElementById("settingsClose");
  const passwordStrength = document.getElementById("passwordStrength");
  const passwordHint = document.getElementById("passwordHint");
  const setPasswordModal = document.getElementById("setPasswordModal");
  const setNewPassword = document.getElementById("setNewPassword");
  const setConfirmPassword = document.getElementById("setConfirmPassword");
  const setPasswordSubmit = document.getElementById("setPasswordSubmit");
  const setPasswordCancel = document.getElementById("setPasswordCancel");
  const setPasswordClose = document.getElementById("setPasswordClose");
  const setPasswordError = document.getElementById("setPasswordError");
  const setPasswordSuccess = document.getElementById("setPasswordSuccess");
  const setPasswordStrength = document.getElementById("setPasswordStrength");
  const setPasswordHint = document.getElementById("setPasswordHint");

  // Default password (user can change this)
  const DEFAULT_PASSWORD = "disable123";
  
  // Simple hash function for password storage
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Check if password is set
  async function isPasswordSet() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["blockerPassword"], (result) => {
        resolve(!!result.blockerPassword);
      });
    });
  }

  // Get stored password hash
  async function getStoredPasswordHash() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["blockerPassword"], (result) => {
        resolve(result.blockerPassword || null);
      });
    });
  }

  // Verify password
  async function verifyPassword(inputPassword) {
    const storedHash = await getStoredPasswordHash();
    if (!storedHash) return false;
    const inputHash = await hashPassword(inputPassword);
    return storedHash === inputHash;
  }

  // Show authentication modal
  function showAuthModal() {
    authModal.classList.add("show");
    authPassword.value = "";
    authPassword.classList.remove("error", "success");
    authError.classList.remove("show");
    setTimeout(() => authPassword.focus(), 100);
  }

  // Hide authentication modal
  function hideAuthModal() {
    authModal.classList.remove("show");
    authPassword.value = "";
    authPassword.classList.remove("error", "success");
    authError.classList.remove("show");
  }

  // Close button handlers
  authClose.addEventListener("click", () => hideAuthModal());
  settingsClose.addEventListener("click", () => hideSettingsModal());

  // Handle authentication submit
  authSubmit.addEventListener("click", async () => {
    const password = authPassword.value.trim();
    
    // Reset states
    authPassword.classList.remove("error", "success");
    authError.classList.remove("show");
    
    if (!password) {
      authError.textContent = "Please enter a password.";
      authError.classList.add("show");
      authPassword.classList.add("error");
      authPassword.focus();
      return;
    }

    // Disable button during verification
    authSubmit.disabled = true;
    authSubmit.textContent = "Verifying...";

    const isValid = await verifyPassword(password);
    
    authSubmit.disabled = false;
    authSubmit.textContent = "Verify";
    
    if (isValid) {
      authPassword.classList.add("success");
      setTimeout(() => {
        hideAuthModal();
        disableBlocker();
      }, 300);
    } else {
      authError.textContent = "Incorrect password. Please try again.";
      authError.classList.add("show");
      authPassword.classList.add("error");
      authPassword.value = "";
      setTimeout(() => authPassword.focus(), 100);
    }
  });

  // Handle authentication cancel
  authCancel.addEventListener("click", () => {
    hideAuthModal();
  });

  // Handle Enter key in password field
  authPassword.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      authSubmit.click();
    }
  });

  // Handle Escape key to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (authModal.classList.contains("show")) {
        hideAuthModal();
      }
      if (settingsModal.classList.contains("show")) {
        hideSettingsModal();
      }
      if (setPasswordModal.classList.contains("show")) {
        hideSetPasswordModal();
      }
    }
  });

  // Close modal on outside click
  authModal.addEventListener("click", (e) => {
    if (e.target === authModal) {
      hideAuthModal();
    }
  });

  // Password strength checker
  function checkPasswordStrength(password) {
    if (!password) return { strength: null, hint: "" };
    
    let strength = 0;
    let hint = "";
    
    if (password.length >= 4) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    if (strength <= 2) {
      return { strength: "weak", hint: "Use at least 8 characters with mixed case and numbers" };
    } else if (strength <= 3) {
      return { strength: "medium", hint: "Good! Add special characters for better security" };
    } else {
      return { strength: "strong", hint: "Strong password!" };
    }
  }

  // Update password strength indicator
  function updatePasswordStrength() {
    const password = newPassword.value;
    const strengthInfo = checkPasswordStrength(password);
    
    passwordStrength.className = "password-strength";
    if (strengthInfo.strength) {
      passwordStrength.classList.add(strengthInfo.strength);
      passwordHint.textContent = strengthInfo.hint;
      passwordHint.style.display = "block";
    } else {
      passwordHint.style.display = "none";
    }
  }

  // Show settings modal
  function showSettingsModal() {
    settingsModal.classList.add("show");
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    [currentPassword, newPassword, confirmPassword].forEach(input => {
      input.classList.remove("error", "success");
    });
    settingsError.classList.remove("show");
    settingsSuccess.classList.remove("show");
    passwordStrength.className = "password-strength";
    passwordHint.style.display = "none";
    setTimeout(() => currentPassword.focus(), 100);
  }

  // Hide settings modal
  function hideSettingsModal() {
    settingsModal.classList.remove("show");
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    [currentPassword, newPassword, confirmPassword].forEach(input => {
      input.classList.remove("error", "success");
    });
    settingsError.classList.remove("show");
    settingsSuccess.classList.remove("show");
    passwordStrength.className = "password-strength";
    passwordHint.style.display = "none";
  }

  // Real-time password strength checking
  newPassword.addEventListener("input", () => {
    updatePasswordStrength();
    newPassword.classList.remove("error", "success");
    if (newPassword.value.length > 0) {
      const strength = checkPasswordStrength(newPassword.value);
      if (strength.strength === "strong") {
        newPassword.classList.add("success");
      }
    }
  });

  // Real-time confirm password validation
  confirmPassword.addEventListener("input", () => {
    confirmPassword.classList.remove("error", "success");
    if (confirmPassword.value.length > 0) {
      if (confirmPassword.value === newPassword.value) {
        confirmPassword.classList.add("success");
      } else {
        confirmPassword.classList.add("error");
      }
    }
  });

  // Settings button click handler
  settingsBtn.addEventListener("click", async () => {
    const passwordSet = await isPasswordSet();
    if (!passwordSet) {
      showSetPasswordModal();
    } else {
      showSettingsModal();
    }
  });

  // Settings cancel button
  settingsCancel.addEventListener("click", () => {
    hideSettingsModal();
  });

  // Close settings modal on outside click
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
      hideSettingsModal();
    }
  });

  // Close set password modal on outside click
  setPasswordModal.addEventListener("click", (e) => {
    if (e.target === setPasswordModal) {
      hideSetPasswordModal();
    }
  });

  // Handle password change
  settingsSubmit.addEventListener("click", async () => {
    const current = currentPassword.value.trim();
    const newPwd = newPassword.value.trim();
    const confirm = confirmPassword.value.trim();

    // Reset states
    [currentPassword, newPassword, confirmPassword].forEach(input => {
      input.classList.remove("error", "success");
    });
    settingsError.classList.remove("show");
    settingsSuccess.classList.remove("show");

    let hasError = false;

    // Validation
    if (!current) {
      currentPassword.classList.add("error");
      hasError = true;
    }
    if (!newPwd) {
      newPassword.classList.add("error");
      hasError = true;
    }
    if (!confirm) {
      confirmPassword.classList.add("error");
      hasError = true;
    }

    if (hasError) {
      settingsError.textContent = "Please fill in all fields.";
      settingsError.classList.add("show");
      return;
    }

    if (newPwd.length < 4) {
      newPassword.classList.add("error");
      settingsError.textContent = "New password must be at least 4 characters long.";
      settingsError.classList.add("show");
      newPassword.focus();
      return;
    }

    if (newPwd !== confirm) {
      confirmPassword.classList.add("error");
      newPassword.classList.add("error");
      settingsError.textContent = "New passwords do not match.";
      settingsError.classList.add("show");
      confirmPassword.focus();
      return;
    }

    // Disable button during verification
    settingsSubmit.disabled = true;
    settingsSubmit.textContent = "Verifying...";

    // Verify current password
    const isCurrentValid = await verifyPassword(current);
    if (!isCurrentValid) {
      currentPassword.classList.add("error");
      settingsError.textContent = "Current password is incorrect.";
      settingsError.classList.add("show");
      currentPassword.value = "";
      settingsSubmit.disabled = false;
      settingsSubmit.textContent = "Change Password";
      setTimeout(() => currentPassword.focus(), 100);
      return;
    }

    // Change password
    try {
      const newPasswordHash = await hashPassword(newPwd);
      chrome.storage.sync.set({ blockerPassword: newPasswordHash }, () => {
        settingsSubmit.disabled = false;
        settingsSubmit.textContent = "Change Password";
        
        // Show success
        [currentPassword, newPassword, confirmPassword].forEach(input => {
          input.classList.remove("error");
          input.classList.add("success");
        });
        settingsSuccess.classList.add("show");
        settingsError.classList.remove("show");
        
        // Clear fields after delay
        setTimeout(() => {
          currentPassword.value = "";
          newPassword.value = "";
          confirmPassword.value = "";
          hideSettingsModal();
        }, 2000);
      });
    } catch (error) {
      settingsSubmit.disabled = false;
      settingsSubmit.textContent = "Change Password";
      settingsError.textContent = "Error changing password. Please try again.";
      settingsError.classList.add("show");
    }
  });

  // Handle Enter key in settings fields
  [currentPassword, newPassword, confirmPassword].forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        settingsSubmit.click();
      }
    });
  });

  // Disable blocker function
  function disableBlocker() {
    chrome.storage.sync.set({ blockerEnabled: false }, () => {
      updateUI(false);
      // Remove rules when disabled
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1, 2, 3, 4],
      });
    });
  }

  // Enable blocker function
  function enableBlocker() {
    chrome.storage.sync.set({ blockerEnabled: true }, () => {
      updateUI(true);
      // Update rules based on new state
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
    });
  }

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

  // Load current state
  chrome.storage.sync.get(["blockerEnabled"], (result) => {
    const isEnabled = result.blockerEnabled !== false; // Default to enabled
    updateUI(isEnabled);
  });

  // Show set password modal
  function showSetPasswordModal() {
    setPasswordModal.classList.add("show");
    setNewPassword.value = "";
    setConfirmPassword.value = "";
    [setNewPassword, setConfirmPassword].forEach(input => {
      input.classList.remove("error", "success");
    });
    setPasswordError.classList.remove("show");
    setPasswordSuccess.classList.remove("show");
    setPasswordStrength.className = "password-strength";
    setPasswordHint.style.display = "none";
    setTimeout(() => setNewPassword.focus(), 100);
  }

  // Hide set password modal
  function hideSetPasswordModal() {
    setPasswordModal.classList.remove("show");
    setNewPassword.value = "";
    setConfirmPassword.value = "";
    [setNewPassword, setConfirmPassword].forEach(input => {
      input.classList.remove("error", "success");
    });
    setPasswordError.classList.remove("show");
    setPasswordSuccess.classList.remove("show");
    setPasswordStrength.className = "password-strength";
    setPasswordHint.style.display = "none";
  }

  // Real-time password strength for set password
  setNewPassword.addEventListener("input", () => {
    const strengthInfo = checkPasswordStrength(setNewPassword.value);
    setPasswordStrength.className = "password-strength";
    if (strengthInfo.strength) {
      setPasswordStrength.classList.add(strengthInfo.strength);
      setPasswordHint.textContent = strengthInfo.hint;
      setPasswordHint.style.display = "block";
    } else {
      setPasswordHint.style.display = "none";
    }
    setNewPassword.classList.remove("error", "success");
    if (setNewPassword.value.length > 0) {
      const strength = checkPasswordStrength(setNewPassword.value);
      if (strength.strength === "strong") {
        setNewPassword.classList.add("success");
      }
    }
  });

  // Real-time confirm password validation for set password
  setConfirmPassword.addEventListener("input", () => {
    setConfirmPassword.classList.remove("error", "success");
    if (setConfirmPassword.value.length > 0) {
      if (setConfirmPassword.value === setNewPassword.value) {
        setConfirmPassword.classList.add("success");
      } else {
        setConfirmPassword.classList.add("error");
      }
    }
  });

  // Handle set password submit
  setPasswordSubmit.addEventListener("click", async () => {
    const newPwd = setNewPassword.value.trim();
    const confirm = setConfirmPassword.value.trim();

    // Reset states
    [setNewPassword, setConfirmPassword].forEach(input => {
      input.classList.remove("error", "success");
    });
    setPasswordError.classList.remove("show");
    setPasswordSuccess.classList.remove("show");

    // Validation
    if (!newPwd || !confirm) {
      setPasswordError.textContent = "Please fill in all fields.";
      setPasswordError.classList.add("show");
      if (!newPwd) setNewPassword.classList.add("error");
      if (!confirm) setConfirmPassword.classList.add("error");
      return;
    }

    if (newPwd.length < 4) {
      setNewPassword.classList.add("error");
      setPasswordError.textContent = "Password must be at least 4 characters long.";
      setPasswordError.classList.add("show");
      setNewPassword.focus();
      return;
    }

    if (newPwd !== confirm) {
      setConfirmPassword.classList.add("error");
      setNewPassword.classList.add("error");
      setPasswordError.textContent = "Passwords do not match.";
      setPasswordError.classList.add("show");
      setConfirmPassword.focus();
      return;
    }

    // Set password
    try {
      setPasswordSubmit.disabled = true;
      setPasswordSubmit.textContent = "Setting...";
      
      const newPasswordHash = await hashPassword(newPwd);
      chrome.storage.sync.set({ blockerPassword: newPasswordHash }, () => {
        setPasswordSubmit.disabled = false;
        setPasswordSubmit.textContent = "Set Password";
        
        // Show success
        [setNewPassword, setConfirmPassword].forEach(input => {
          input.classList.remove("error");
          input.classList.add("success");
        });
        setPasswordSuccess.classList.add("show");
        setPasswordError.classList.remove("show");
        
        // Hide modal after delay
        setTimeout(() => {
          hideSetPasswordModal();
        }, 1500);
      });
    } catch (error) {
      setPasswordSubmit.disabled = false;
      setPasswordSubmit.textContent = "Set Password";
      setPasswordError.textContent = "Error setting password. Please try again.";
      setPasswordError.classList.add("show");
    }
  });

  // Handle set password cancel/skip
  setPasswordCancel.addEventListener("click", () => {
    hideSetPasswordModal();
  });
  setPasswordClose.addEventListener("click", () => {
    hideSetPasswordModal();
  });

  // Handle Enter key in set password fields
  [setNewPassword, setConfirmPassword].forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        setPasswordSubmit.click();
      }
    });
  });

  // Check on load if password is set
  async function checkPasswordOnLoad() {
    const passwordSet = await isPasswordSet();
    if (!passwordSet) {
      // Show set password modal after a short delay
      setTimeout(() => {
        showSetPasswordModal();
      }, 500);
    }
  }

  // Toggle button click handler
  toggleBtn.addEventListener("click", async () => {
    chrome.storage.sync.get(["blockerEnabled"], async (result) => {
      const currentState = result.blockerEnabled !== false;
      const newState = !currentState;

      if (newState) {
        // Enabling - no authentication needed
        enableBlocker();
      } else {
        // Disabling - check if password is set
        const passwordSet = await isPasswordSet();
        if (!passwordSet) {
          // Show set password modal instead
          showSetPasswordModal();
        } else {
          // Show authentication modal
          showAuthModal();
        }
      }
    });
  });

  // Check password on load
  checkPasswordOnLoad();
});
