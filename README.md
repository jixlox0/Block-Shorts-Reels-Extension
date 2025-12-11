# Block Shorts & Reels - Chrome Extension

A Chrome extension that automatically blocks YouTube Shorts and Instagram Reels URLs, redirecting them to their respective homepages to help you stay focused and avoid distractions.

## Features

- 🚫 Automatically blocks YouTube Shorts URLs
- 🚫 Automatically blocks Instagram Reels URLs
- 🔄 Redirects Shorts links to YouTube homepage
- 🔄 Redirects Reels links to Instagram homepage
- ⚙️ Simple toggle to enable/disable blocking
- 🎯 Works on both `youtube.com/shorts/*` and `youtu.be/shorts/*` URLs
- 🎯 Works on both `instagram.com/reel/*` and `instagram.com/reels/*` URLs

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the `block-yt-shorts` directory
6. The extension should now be installed and active!

## Usage

1. Click the extension icon in your Chrome toolbar
2. You'll see the current status (Active/Inactive)
3. Use the toggle button to enable or disable blocking
4. When active, any attempt to visit a YouTube Shorts or Instagram Reels URL will automatically redirect to the respective homepage

## How It Works

The extension uses Chrome's `declarativeNetRequest` API to intercept and redirect YouTube Shorts and Instagram Reels URLs before they load. It also uses the `webNavigation` API and content scripts to catch client-side navigation and button clicks.

## Files Structure

```
block-yt-shorts/
├── manifest.json           # Extension configuration
├── background.js           # Service worker for URL blocking
├── content-youtube.js      # Content script for YouTube
├── content-instagram.js    # Content script for Instagram
├── popup.html              # Extension popup UI
├── popup.js                # Popup functionality
└── README.md               # This file
```

## Permissions

This extension requires:

- `declarativeNetRequest` - To block/redirect URLs
- `storage` - To save your preferences
- `host_permissions` for YouTube and Instagram domains - To intercept URLs

## Development

To modify the extension:

1. Make your changes to the files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## License

MIT License - Feel free to use and modify as needed.

## Notes

- The extension redirects Shorts to the YouTube homepage and Reels to the Instagram homepage. You can modify `background.js` to redirect to different URLs if desired.
- Chrome will use a default icon for the extension in the toolbar.
- The extension works on both direct URL navigation and when clicking Shorts/Reels buttons on the respective platforms.
