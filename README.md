# KnC Music & Wellness

A browser-based single-page app that combines a rich music player with a home/gym workout planner, progress tracking, and wellness logging. Built with plain HTML, CSS, and JavaScript, the project runs entirely in the browser with no build step or package installation required.

## Overview

KnC Music & Wellness is a personal productivity and self-care dashboard designed for daily use. It gives you:

- a modern music player with queue management, equalizer, visualizer, lyrics, and sleep timer
- guided training routines for home and gym workouts
- progress tracking for workouts, streaks, and historical records
- wellness tools for hydration, calorie intake, weight tracking, and BMI monitoring

The app is designed as a static web application, so you can open it locally or deploy it to GitHub Pages with minimal setup.

## Highlights

### Music player

- audio playback with play/pause, previous/next, shuffle, and repeat
- track progress bar and seek controls
- adjustable playback speed and volume up to 200%
- visualizer modes and a 5-band equalizer with presets
- lyrics viewing and editing, including timestamped lyrics
- sleep timer with preset durations and end-of-track shutdown
- support for common browser audio formats like MP3, M4A, WAV, OGG, FLAC, AAC, and WMA
- theme switching with multiple color palettes

### Training and fitness

- home workout routines and gym workout selection
- custom exercise creation for both workout types
- workout progression and daily exercise completion tracking
- tabbed workout modes with structured, repeatable plans

### Reports and analytics

- calendar-based workout summary view
- training streak tracking and record statistics
- weight and BMI trend visualization
- body analytics and daily performance history

### Wellness tracking

- hydration tracking with quick-add water actions
- calorie logging and meal tracking
- daily wellness summaries for consistency and routine-building

## App structure

- `index.html` — main single-page application shell and UI sections
- `styles.css` — visual design, layout, themes, and responsive styling
- `app.js` — core application logic for playback, fitness tools, reporting, and local state

## Project files

- `index.html`: contains the full SPA interface, including music, training, report, and wellness views
- `styles.css`: full styling system for desktop and mobile layouts
- `app.js`: all interactive logic, state management, and browser-based persistence

## Running locally

Because this project is a static web app, you can run it in either of the following ways:

### Option 1: Open directly in a browser

Open `index.html` in a modern browser.

### Option 2: Serve it locally

From the project root, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

This is recommended for more consistent browser storage behavior and a smoother local experience.

## GitHub Pages deployment

You can deploy the app to GitHub Pages with the following steps:

1. Push this project to a GitHub repository.
2. Open your repository on GitHub.
3. Go to `Settings` → `Pages`.
4. Set the source to the `main` branch and root folder (`/`).
5. Save the configuration.

GitHub Pages will serve the static site using `index.html` as the entry file.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play or pause |
| Left / Right Arrow | Seek backward or forward |
| Up / Down Arrow | Adjust volume |
| `M` | Mute or unmute |
| `N` / `P` | Next or previous track |
| `E` / `L` | Open equalizer or lyrics |
| `Esc` | Close dialogs |

## Browser notes

- The app is designed for modern desktop and mobile browsers.
- Custom fonts are loaded from Google Fonts; internet access is needed for those styles unless the browser falls back to system fonts.
- Supported audio formats depend on the browser and OS codec support.

## License

This project does not currently include a license file. If you plan to share or reuse it publicly, consider adding an open-source license such as MIT.

## Author

Branham Simiyu

## Contributing

Contributions are welcome. If you want to improve the app, consider:

- improving the UI/UX design
- adding new workout plans or wellness data features
- enhancing the player controls and accessibility
- refining analytics or visualizations
- documenting more of the app behavior and workflows

## Summary

KnC Music & Wellness is a full-featured browser app that blends entertainment, fitness, and routine tracking into one polished experience. Its lightweight architecture makes it easy to run, customize, and deploy without a complex setup.
