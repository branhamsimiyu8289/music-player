# KnC Music

KnC Music is a browser-based music player and personal wellness app built with HTML, CSS, and vanilla JavaScript. It runs as a static site and does not require a build step or package installation.

## Pages

- **Music player** (`index.html`): Add and play local audio files, manage a persistent playlist, view album art and lyrics, and use the audio tools.
- **Training** (`Training.html`): Browse home and gym workout routines.
- **Profile** (`Profile.html`): Save profile details and a profile picture.
- **Report** (`Report.html`): Review workout history and body analytics.

The pages share local browser storage where appropriate. Your music files and personal data are stored in your browser, not uploaded to a server. Browser storage is tied to the site origin, so data saved locally will not automatically carry over to a deployed GitHub Pages site.

## Music player features

- Audio playback controls, shuffle, repeat, playback speed, and volume up to 200%.
- Three audio visualizer modes and a five-band equalizer with sound presets.
- Reads available ID3 track details, embedded cover art, and lyrics from audio files.
- Saves the playlist, track metadata, and edited lyrics in IndexedDB.
- Displays plain or timestamped lyrics, with synchronized highlighting and click-to-seek.
- Sleep timer with preset durations or an end-of-track option.
- Five color themes, a live clock, and 12/24-hour display.
- Keyboard shortcuts:

  | Key | Action |
  | --- | --- |
  | <kbd>Space</kbd> | Play or pause |
  | <kbd>Left</kbd> / <kbd>Right</kbd> | Seek backward or forward 5 seconds |
  | <kbd>Up</kbd> / <kbd>Down</kbd> | Raise or lower volume |
  | <kbd>M</kbd> | Mute or unmute |
  | <kbd>N</kbd> / <kbd>P</kbd> | Next or previous track |
  | <kbd>E</kbd> / <kbd>L</kbd> | Open equalizer or lyrics |
  | <kbd>Esc</kbd> | Close open dialogs |

Available audio formats depend on the browser. The player accepts common formats such as MP3, M4A, WAV, OGG, FLAC, AAC, and WMA.

## Run locally

Open `index.html` in a modern browser. No build tools or dependencies are required.

For the most consistent browser storage behavior, serve the folder over localhost:

```powershell
py -m http.server 8000
```

Then open <http://localhost:8000>.

The app loads its fonts from Google Fonts, so the custom fonts require an internet connection. System fonts are used as a fallback.

## Publish with GitHub Pages

1. Create a GitHub repository and add the project files to its root.
2. Push the files to the repository's `main` branch.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and the `/ (root)` folder, then save.

GitHub Pages will use `index.html` as the site entry point. The site is static and does not need a GitHub Actions workflow.

## Project files

- `index.html` — Music player entry point.
- `Training.html`, `Profile.html`, `Report.html` — Additional app pages.
- `navigation.js`, `navigation.css` — Shared page navigation behavior and styles.
- `styles.css` — Standalone stylesheet not currently linked by the HTML pages.
