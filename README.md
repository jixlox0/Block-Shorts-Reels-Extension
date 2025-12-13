# Block Shorts & Reels - Chrome Extension

A powerful Chrome extension that automatically blocks YouTube Shorts and Instagram Reels to help you stay focused and avoid distractions. Features advanced blocking mechanisms, password protection, and a beautiful user interface.

## Features

### Core Blocking

#### YouTube Shorts

- 🚫 **Automatically blocks YouTube Shorts URLs** - Redirects `/shorts/*` URLs to YouTube homepage
- 🚫 **Hides Shorts navigation button** - Removes Shorts from the YouTube sidebar navigation
- 🚫 **Blocks Shorts on homepage** - Replaces Shorts sections on YouTube homepage with "Shorts Blocked" cards
- 🚫 **Intercepts Shorts clicks** - Prevents clicking on any Shorts links or thumbnails
- 🔄 **Smart redirects** - Automatically redirects to YouTube homepage when Shorts are detected

#### Instagram Reels

- 🚫 **Automatically blocks Instagram Reels URLs** - Redirects `/reel/*` and `/reels/*` URLs to Instagram homepage
- 🚫 **Blocks Reels in chat** - Replaces reel thumbnails in Instagram chat with "Reel Blocked" cards
- 🚫 **Blocks modal popups** - Prevents reels from playing in popup modals (shows alert then closes)
- 🚫 **Blocks post URLs with reels** - Detects and blocks Instagram post URLs that contain reels
- 🚫 **Blocks Reels on Explore page** - Shows "Reel Blocked" cards on Explore page instead of blank content
- ⚠️ **Alert modals** - Displays informative alerts when reels are blocked from chat
- 🎯 **Smart page detection** - Excludes Profile pages while blocking on Explore and other pages

### Universal Features

- 🔄 **Smart redirects** - Redirects blocked content to respective homepages
- ⚙️ **Toggle control** - Easy enable/disable toggle in the extension popup
- 🔄 **Dynamic content detection** - Monitors and blocks dynamically loaded content
- 🎯 **Multiple blocking layers** - Network-level, navigation, and DOM-level blocking

### Advanced Features

- 🔐 **Password Protection** - Set a password to protect the blocker settings from being disabled
- 🔐 **Configurable Password** - Change your password anytime through the settings
- 🎨 **Beautiful UI** - Modern, Instagram-styled interface with gradients and animations
- 📱 **Blocked Content Cards** - Shows custom "Shorts Blocked" and "Reel Blocked" cards instead of blank content
- ⚠️ **Alert Modals** - Displays informative alerts when reels are blocked from chat
- 🎯 **Smart Page Detection** - Excludes Profile pages while blocking on Explore and other pages
- 🔒 **Inspection Protection** - Blocks developer tools inspection for enhanced security
- ✅ **Real-time Validation** - Password strength indicator and real-time input validation
- 🔄 **History API Interception** - Catches client-side navigation to prevent bypassing blocks
- 🎯 **Click Interception** - Prevents clicks on Shorts/Reels links before navigation occurs

### Platform Support

#### YouTube Shorts

- ✅ Blocks `/shorts/*` URLs (both `youtube.com/shorts/*` and `youtu.be/shorts/*`)
- ✅ Hides Shorts navigation button in sidebar
- ✅ Blocks Shorts sections on homepage
- ✅ Intercepts clicks on Shorts links and thumbnails
- ✅ Monitors URL changes and history navigation
- ✅ Works with YouTube's single-page application architecture

#### Instagram Reels

- ✅ Blocks `/reel/*` and `/reels/*` URLs
- ✅ Blocks reels in chat messages (shows blocked cards)
- ✅ Blocks reels in modal popups (shows alert then closes)
- ✅ Blocks post URLs containing reels
- ✅ Shows blocked cards on Explore page
- ✅ Excludes Profile pages (allows viewing user profiles)
- ✅ Works with Instagram's dynamic content loading

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the `block-reels-shorts` directory
6. The extension should now be installed and active!

## Usage

### First Time Setup

1. Click the extension icon in your Chrome toolbar
2. If no password is set, you'll be prompted to create one
3. Set a password (minimum 4 characters) or click "Skip" to proceed without one
4. The extension is enabled by default

### Daily Use

1. **Enable/Disable Blocking:**

   - Click the extension icon
   - Use the toggle button to enable or disable blocking
   - If disabling, you'll need to enter your password (if set)

2. **Change Password:**

   - Click the extension icon
   - Click "⚙️ Change Password"
   - Enter your current password and set a new one

3. **What Gets Blocked:**

   **YouTube Shorts:**

   - Direct navigation to `/shorts/*` URLs
   - Shorts navigation button in sidebar
   - Shorts sections on homepage (replaced with blocked cards)
   - Clicks on Shorts links and thumbnails

   **Instagram Reels:**

   - Direct navigation to `/reel/*` and `/reels/*` URLs
   - Reels in chat messages (replaced with blocked cards)
   - Reels in popup modals (shows alert then closes)
   - Reels on Explore page (shows blocked cards)
   - Post URLs containing reels
   - Note: Profile pages are excluded to allow viewing user profiles

### Blocking Behavior

#### YouTube Shorts

- **Direct URLs** → Automatically redirects to YouTube homepage
- **Navigation button** → Hidden from sidebar
- **Homepage sections** → Replaced with "Shorts Blocked" cards
- **Link clicks** → Intercepted and redirected to homepage
- **History navigation** → Monitored and redirected if Shorts detected
- **Dynamic content** → Continuously monitored for new Shorts content

#### Instagram Reels

- **Direct URLs** → Redirects to Instagram homepage
- **Chat reels** → Shows "Reel Blocked" card instead of thumbnail
- **Modal popups** → Shows alert modal, then closes and navigates to homepage
- **Explore page** → Shows "Reel Blocked" cards instead of blank content
- **Post URLs** → Detects and blocks post URLs containing reels
- **Profile pages** → Reels are NOT blocked (to allow viewing user profiles)
- **Dynamic content** → Continuously monitored for new Reels content

## How It Works

The extension uses multiple layers of blocking:

1. **Network-Level Blocking:** Uses Chrome's `declarativeNetRequest` API to intercept and redirect URLs before they load
2. **Navigation Interception:** Uses `webNavigation` API to catch navigation events
3. **Content Scripts:** Injected scripts monitor DOM changes and intercept:
   - Client-side navigation (history API)
   - Button clicks
   - Video play events
   - Modal popups
4. **Dynamic Detection:** Uses `MutationObserver` to detect dynamically loaded content
5. **Password Protection:** Secure SHA-256 hashing for password storage

## Files Structure

```
block-reels-shorts/
├── manifest.json           # Extension configuration
├── background.js           # Service worker for URL blocking
├── content-youtube.js     # Content script for YouTube (blocks Shorts)
├── content-instagram.js   # Content script for Instagram (blocks Reels)
├── popup.html             # Extension popup UI
├── popup.js               # Popup functionality (auth, settings)
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

## Permissions

This extension requires:

- `declarativeNetRequest` - To block/redirect URLs at the network level
- `storage` - To save user preferences and password (synced across devices)
- `webNavigation` - To intercept navigation events
- `tabs` - To manage tab navigation
- `host_permissions` for YouTube and Instagram domains - To inject content scripts

## Security Features

- 🔐 **Password Hashing:** Passwords are hashed using SHA-256 before storage
- 🔒 **Inspection Protection:** Blocks common developer tool shortcuts
- 🔒 **Context Menu Blocking:** Prevents right-click inspection
- 🔒 **Console Override:** Disables console methods to prevent inspection

## Development

To modify the extension:

1. Make your changes to the files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

### Key Files

- **`content-instagram.js`:** Instagram Reels blocking logic, modal detection, chat blocking, Explore page handling, Profile page exclusion
- **`content-youtube.js`:** YouTube Shorts blocking logic, navigation button hiding, homepage section blocking, click interception
- **`popup.js`:** UI logic, authentication, password management, settings
- **`background.js`:** Network-level URL blocking rules for both platforms

## Configuration

### Password Requirements

- Minimum 4 characters
- Can contain letters, numbers, and special characters
- Password strength indicator helps create strong passwords

### Storage

The extension uses `chrome.storage.sync` to store:

- `blockerEnabled` - Boolean flag for blocker state
- `blockerPassword` - SHA-256 hashed password

## Troubleshooting

### Extension not blocking content?

1. Check if the extension is enabled (green status in popup)
2. Refresh the page after enabling
3. Clear browser cache if issues persist
4. Check browser console for any errors

### Password not working?

1. Make sure you're entering the correct password
2. Try changing the password through settings
3. If forgotten, you can skip password protection (but will need to set a new one to disable blocker)

### Shorts/Reels still showing?

**For YouTube Shorts:**

1. Make sure the extension is enabled (green status in popup)
2. Refresh the YouTube page
3. The extension monitors dynamically loaded content, so it should catch new Shorts sections
4. Check if you're on the homepage (Shorts sections are only blocked on homepage)

**For Instagram Reels:**

1. Make sure the extension is enabled
2. Refresh the Instagram page
3. The extension monitors dynamically loaded content, so it should catch new messages
4. If reels are on a Profile page, they won't be blocked (this is intentional)

## License

MIT License - Feel free to use and modify as needed.

## Version

Current version: **1.1.0**

## Notes

### YouTube Shorts

- The extension redirects Shorts to the YouTube homepage
- Shorts navigation button is hidden from the sidebar
- Shorts sections on the homepage are replaced with blocked cards
- All clicks on Shorts links are intercepted before navigation
- Works with YouTube's single-page application (SPA) architecture

### Instagram Reels

- The extension redirects Reels to the Instagram homepage
- Reels in chat are replaced with blocked cards
- Reels in modals show an alert before closing
- Profile pages are excluded from blocking to allow viewing user profiles
- Explore page shows blocked cards instead of blank content

### General

- The extension works on both direct URL navigation and when clicking Shorts/Reels buttons
- Password protection is optional - you can skip it during setup
- All passwords are hashed using SHA-256 for security
- The extension syncs settings across devices using Chrome sync storage
- Both platforms use multiple layers of blocking for maximum effectiveness
