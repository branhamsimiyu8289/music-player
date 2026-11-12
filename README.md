# KnC Music & Wellness

KnC Music & Wellness is a browser-based single-page application that combines a modern music player with a workout planner, progress tracking, and wellness management tools. Built with plain HTML, CSS, and JavaScript, the project is designed for personal productivity, routine building, and daily self-care.

## Overview

KnC Music & Wellness is a personal dashboard for everyday use. It helps users:

- listen to music with queue management, equalizer controls, visualizer modes, lyrics, and a sleep timer
- follow guided home and gym workout routines
- track progress across workouts, streaks, and historical activity
- monitor wellness habits such as hydration, calorie intake, weight, and BMI

The application is intentionally lightweight and static, making it easy to run locally or deploy to GitHub Pages with minimal setup.

## Key Features

### Music Player

- audio playback controls including play/pause, previous/next, shuffle, and repeat
- track progress bar and seek functionality
- adjustable playback speed and volume up to 200%
- visualizer modes and a 5-band equalizer with presets
- lyrics viewing and editing, including timestamped lyrics
- sleep timer with preset durations and automatic shutdown at the end of a track
- support for common browser audio formats such as MP3, M4A, WAV, OGG, FLAC, AAC, and WMA
- theme switching with multiple color palettes

### Training and Fitness

- home workout routines and gym workout selection
- custom exercise creation for both workout types
- workout progression and daily exercise completion tracking
- tabbed workout modes with structured, repeatable plans

### Reports and Analytics

- calendar-based workout summary view
- training streak tracking and historical statistics
- weight and BMI trend visualization
- body analytics and daily performance history

### Wellness Tracking

- hydration tracking with quick-add water actions
- calorie logging and meal tracking
- daily wellness summaries to support consistency and habit formation

## Project Structure

- `index.html` — main single-page application shell and UI structure
- `styles.css` — visual design, layout, themes, and responsive styling
- `app.js` — core application logic for playback, fitness tools, reporting, and browser state management

## Running Locally

Because this project is a static web application, it can be run in either of the following ways:

### Option 1: Open Directly in a Browser

Open `index.html` in a modern browser.

### Option 2: Serve It Locally

From the project root, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

This method is recommended for more consistent browser storage behavior and a smoother local experience.

## GitHub Pages Deployment

You can deploy the app to GitHub Pages using the following steps:

1. Push the project to a GitHub repository.
2. Open the repository in GitHub.
3. Navigate to `Settings` → `Pages`.
4. Set the source to the `main` branch and root folder (`/`).
5. Save the configuration.

GitHub Pages will serve the static site using `index.html` as the entry file.

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play or pause |
| Left / Right Arrow | Seek backward or forward |
| Up / Down Arrow | Adjust volume |
| `M` | Mute or unmute |
| `N` / `P` | Next or previous track |
| `E` / `L` | Open equalizer or lyrics |
| `Esc` | Close dialogs |

## Browser Notes

- The app is designed for modern desktop and mobile browsers.
- Custom fonts are loaded from Google Fonts; internet access is required for those styles unless the browser falls back to system fonts.
- Supported audio formats depend on the browser and operating system codec support.

## License

This project does not currently include a license file. If you plan to share or reuse it publicly, consider adding an open-source license such as MIT.

## Author

Branham Simiyu

## Contributing

Contributions are welcome. If you would like to improve the app, consider:

- enhancing the user interface and user experience
- adding new workout plans or wellness tracking features
- improving audio controls and accessibility
- refining analytics and visualizations
- documenting additional workflows and application behavior

## Summary

KnC Music & Wellness is a comprehensive browser application that blends music, fitness, and wellness tracking into a single, polished experience. Its lightweight architecture makes it easy to run, customize, and deploy while supporting practical daily routines and personal productivity.
