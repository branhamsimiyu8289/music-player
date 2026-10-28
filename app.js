/**
 * KnC Music & Wellness - Unified Application Engine
 * Combines Music Player, Training & Workouts, Analytics & Reports, and Profile.
 */


/* =========================================================================
   KnC MUSIC & WELLNESS - SPA VIEW ROUTER & HEADER MUSIC CARD SYNC
   ========================================================================= */

let currentView = "music";
let floatingBeltHideTimeout = null;

function switchView(viewName) {
    if (!viewName) return;
    const cleanView = viewName.toLowerCase().trim();

    // If already on the view, do nothing if it's music
    if (cleanView === "music" && currentView === "music") {
        return;
    }

    const views = {
        music: document.getElementById("viewMusic"),
        training: document.getElementById("viewTraining"),
        report: document.getElementById("viewReport"),
        profile: document.getElementById("viewProfile")
    };

    if (!views[cleanView]) return;

    // Hide all views
    Object.keys(views).forEach(k => {
        if (views[k]) views[k].classList.remove("active");
    });

    // Show target view
    views[cleanView].classList.add("active");
    currentView = cleanView;
    document.body.dataset.activeView = cleanView;
    document.body.classList.toggle("music-view-active", cleanView === "music");
    const floatingBelt = document.getElementById("floatingBelt");
    if (floatingBelt && window.matchMedia("(max-width: 600px)").matches) {
        if (floatingBeltHideTimeout) {
            clearTimeout(floatingBeltHideTimeout);
            floatingBeltHideTimeout = null;
        }
        floatingBelt.classList.toggle("visible", cleanView === "music");
    }

    // Update floating belt active highlight
    document.querySelectorAll(".floating-belt-item").forEach(item => {
        const itemTarget = item.getAttribute("data-view");
        if (itemTarget === cleanView) {
            item.classList.add("active-page");
        } else {
            item.classList.remove("active-page");
        }
    });

    // Update URL hash without reload
    if (window.location.hash !== "#" + cleanView) {
        history.pushState(null, "", "#" + cleanView);
    }

    // View-specific refresh hooks
    if (cleanView === "music") {
        if (typeof resizeVisualizer === "function") resizeVisualizer();
    } else if (cleanView === "report") {
        if (typeof window.refreshReportView === "function") {
            window.refreshReportView();
        }
    } else if (cleanView === "training") {
        if (typeof window.refreshTrainingView === "function") {
            window.refreshTrainingView();
        }
    } else if (cleanView === "profile") {
        if (typeof window.refreshProfileView === "function") {
            window.refreshProfileView();
        }
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "instant" });

    // Sync header mini cards
    syncHeaderMusicCards();
}

function syncHeaderMusicCards(playingState) {
    const audioEl = document.getElementById("audio");
    if (!audioEl) return;
    
    const isPlaying = typeof playingState === "boolean" ? playingState : (!audioEl.paused && !audioEl.ended && audioEl.currentTime > 0);
    const currentSong = (typeof playlist !== "undefined" && playlist.length > 0 && typeof currentTrackIndex === "number" && currentTrackIndex >= 0) ? playlist[currentTrackIndex] : null;
    const songName = currentSong && currentSong.title ? currentSong.title : "KnC Music";
    const isClosed = sessionStorage.getItem("knc_music_card_closed") === "true";

    document.querySelectorAll(".header-music-card").forEach(card => {
        card.classList.toggle("is-playing", isPlaying);
        card.classList.toggle("hm-hidden", isClosed);
    });

    document.querySelectorAll(".hm-title").forEach(title => {
        title.textContent = songName;
        title.title = songName;
    });
}

function initHeaderMusicCards() {
    // Play / Pause buttons on all header mini-cards
    document.querySelectorAll(".hm-play-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (typeof togglePlay === "function") togglePlay();
        });
    });

    // Next track buttons on all header mini-cards
    document.querySelectorAll(".hm-next-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (typeof nextSong === "function") nextSong();
        });
    });

    // Close buttons on all header mini-cards (pauses playback & hides cards)
    document.querySelectorAll(".hm-close-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (typeof pauseSong === "function") pauseSong();
            sessionStorage.setItem("knc_music_card_closed", "true");
            document.querySelectorAll(".header-music-card").forEach(c => c.classList.add("hm-hidden"));
        });
    });

    // Tapping the card or info link switches to Music view
    document.querySelectorAll(".hm-info, .header-music-card").forEach(el => {
        el.addEventListener("click", (e) => {
            if (e.target.closest(".hm-controls")) return;
            e.preventDefault();
            switchView("music");
        });
    });

    syncHeaderMusicCards();
}

function initSPARouter() {
    // Floating belt navigation buttons
    document.querySelectorAll(".floating-belt-item").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const view = item.getAttribute("data-view");
            if (view) {
                switchView(view);
            }
        });
    });

    // Circular back buttons
    document.querySelectorAll(".page-back-button").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            switchView("music");
        });
    });

    // Listen to hash change & popstate
    window.addEventListener("popstate", () => {
        const hash = (window.location.hash || "").replace("#", "").toLowerCase().trim();
        if (hash && ["music", "training", "report", "profile"].includes(hash)) {
            switchView(hash);
        } else {
            switchView("music");
        }
    });

    // Initial view from hash
    const initialHash = (window.location.hash || "").replace("#", "").toLowerCase().trim();
    if (initialHash && ["music", "training", "report", "profile"].includes(initialHash)) {
        switchView(initialHash);
    } else {
        switchView("music");
    }
}

// Global Toast helper
function showToast(message, duration = 2800) {
    const toast = document.getElementById("toastMsg");
    const toastText = document.getElementById("toastText");
    if (!toast || !toastText) return;
    toastText.textContent = message;
    toast.classList.add("show");
    if (window._toastTimer) clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, duration);
}
window.showToast = showToast;


// =========================================================================
// 1. MUSIC PLAYER ENGINE
// =========================================================================
/**
         * KnC Music - Ultra-clean Modern Web Player & Watch Engine
         */

        const DEFAULT_ALBUM_COVER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><defs><linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%231e1b4b'/><stop offset='50%' stop-color='%23312e81'/><stop offset='100%' stop-color='%234c1d95'/></linearGradient><linearGradient id='vinyl' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%2318181b'/><stop offset='50%' stop-color='%2327272a'/><stop offset='100%' stop-color='%2309090b'/></linearGradient><linearGradient id='accent' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23818cf8'/><stop offset='100%' stop-color='%23c084fc'/></linearGradient></defs><rect width='600' height='600' rx='40' fill='url(%23bg)'/><circle cx='300' cy='300' r='210' fill='url(%23vinyl)' stroke='%233f3f46' stroke-width='4'/><circle cx='300' cy='300' r='170' fill='none' stroke='%2327272a' stroke-width='2'/><circle cx='300' cy='300' r='130' fill='none' stroke='%2327272a' stroke-width='2'/><circle cx='300' cy='300' r='90' fill='url(%23accent)'/><circle cx='300' cy='300' r='28' fill='%2309090b'/><path d='M290 260v50.55c-2.95-1.7-6.35-2.75-10-2.75-11.05 0-20 8.95-20 20s8.95 20 20 20 20-8.95 20-20V280h20v-20h-30z' fill='%23ffffff'/></svg>";

        // --- ID3 TAG PARSER ---
        async function parseID3Tags(file) {
            const defaultMeta = {
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: "Unknown Artist",
                album: "Local Library",
                cover: DEFAULT_ALBUM_COVER,
                lyrics: ""
            };

            try {
                const buffer = await file.slice(0, 512 * 1024).arrayBuffer();
                const view = new DataView(buffer);

                if (view.getUint8(0) === 0x49 && view.getUint8(1) === 0x44 && view.getUint8(2) === 0x33) {
                    const majorVersion = view.getUint8(3);
                    const tagSize = ((view.getUint8(6) & 0x7f) << 21) |
                                    ((view.getUint8(7) & 0x7f) << 14) |
                                    ((view.getUint8(8) & 0x7f) << 7) |
                                    (view.getUint8(9) & 0x7f);

                    let pos = 10;
                    const fullSize = Math.min(tagSize + 10, buffer.byteLength);

                    while (pos < fullSize - 10) {
                        const frameId = String.fromCharCode(view.getUint8(pos), view.getUint8(pos + 1), view.getUint8(pos + 2), view.getUint8(pos + 3));
                        if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

                        let frameSize;
                        if (majorVersion === 4) {
                            frameSize = ((view.getUint8(pos + 4) & 0x7f) << 21) |
                                        ((view.getUint8(pos + 5) & 0x7f) << 14) |
                                        ((view.getUint8(pos + 6) & 0x7f) << 7) |
                                        (view.getUint8(pos + 7) & 0x7f);
                        } else {
                            frameSize = view.getUint32(pos + 4, false);
                        }

                        if (frameSize <= 0 || pos + 10 + frameSize > fullSize) break;

                        const frameData = new Uint8Array(buffer, pos + 10, frameSize);

                        if (frameId === "TIT2") {
                            defaultMeta.title = decodeFrameText(frameData) || defaultMeta.title;
                        } else if (frameId === "TPE1" || frameId === "TPE2") {
                            defaultMeta.artist = decodeFrameText(frameData) || defaultMeta.artist;
                        } else if (frameId === "TALB") {
                            defaultMeta.album = decodeFrameText(frameData) || defaultMeta.album;
                        } else if (frameId === "USLT") {
                            defaultMeta.lyrics = decodeLyricsFrame(frameData);
                        } else if (frameId === "APIC") {
                            const coverUrl = decodeApicFrame(frameData);
                            if (coverUrl) defaultMeta.cover = coverUrl;
                        }

                        pos += 10 + frameSize;
                    }
                }
            } catch (err) {
                console.warn("ID3 parser error:", err);
            }
            return defaultMeta;
        }

        function decodeFrameText(bytes) {
            try {
                const encoding = bytes[0];
                const content = bytes.slice(1);
                if (encoding === 0 || encoding === 3) {
                    return new TextDecoder(encoding === 3 ? "utf-8" : "iso-8859-1").decode(content).replace(/\0/g, "").trim();
                } else if (encoding === 1 || encoding === 2) {
                    return new TextDecoder("utf-16").decode(content).replace(/\0/g, "").trim();
                }
            } catch (e) { }
            return "";
        }

        function decodeLyricsFrame(bytes) {
            try {
                const encoding = bytes[0];
                let offset = 4;
                while (offset < bytes.length && bytes[offset] !== 0) offset++;
                offset++;
                const textBytes = bytes.slice(offset);
                return decodeFrameText(new Uint8Array([encoding, ...textBytes]));
            } catch (e) {
                return "";
            }
        }

        function decodeApicFrame(bytes) {
            try {
                let offset = 1;
                let mime = "";
                while (offset < bytes.length && bytes[offset] !== 0) {
                    mime += String.fromCharCode(bytes[offset]);
                    offset++;
                }
                offset++;
                offset++;
                while (offset < bytes.length && bytes[offset] !== 0) offset++;
                offset++;

                const imgBytes = bytes.slice(offset);
                if (imgBytes.length > 0) {
                    const blob = new Blob([imgBytes], { type: mime || 'image/jpeg' });
                    return URL.createObjectURL(blob);
                }
            } catch (e) { }
            return null;
        }

        // --- INDEXEDDB STORAGE ---
        const DB_NAME = "KnCMusicDB";
        const DB_VERSION = 1;
        const STORE_NAME = "tracks";

        function openDatabase() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME, { keyPath: "id" });
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async function saveSongToDB(songRecord) {
            try {
                const db = await openDatabase();
                const tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).put(songRecord);
            } catch (e) { }
        }

        async function removeSongFromDB(id) {
            try {
                const db = await openDatabase();
                const tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).delete(id);
            } catch (e) { }
        }

        async function clearAllSongsFromDB() {
            try {
                const db = await openDatabase();
                const tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).clear();
            } catch (e) { }
        }

        async function loadAllSongsFromDB() {
            try {
                const db = await openDatabase();
                return new Promise((resolve) => {
                    const tx = db.transaction(STORE_NAME, "readonly");
                    const store = tx.objectStore(STORE_NAME);
                    const req = store.getAll();
                    req.onsuccess = () => resolve(req.result || []);
                    req.onerror = () => resolve([]);
                });
            } catch (e) {
                return [];
            }
        }

        // --- GLOBAL STATE: NO SAMPLE TRACKS ---
        let songs = [];
        let songIndex = 0;
        let isPlaying = false;
        let isSeeking = false;
        let isMuted = false;
        let previousVolume = 1;
        let isShuffle = false;
        let repeatMode = 0;
        const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
        let currentSpeedIdx = 2; // 1.0x

        // 12H / 24H Clock Mode
        let is24HourClock = localStorage.getItem("knc_clock_24h") === "true";

        // Visualizer Mode
        let visualizerMode = 0;
        let visualizerAnimId = null;

        // Sleep Timer
        let sleepTimerInterval = null;
        let sleepEndTime = null;
        let sleepEndTrack = false;

        // Web Audio API
        let audioCtx = null;
        let sourceNode = null;
        let gainNode = null;
        let analyserNode = null;
        let eqBands = [];
        const EQ_FREQS = [60, 250, 1000, 4000, 12000];

        const EQ_PRESETS = {
            flat: [0, 0, 0, 0, 0],
            bass: [6, 4.5, 1, 0, -1],
            vocal: [-2, 1, 4, 3, 1],
            rock: [4.5, 2.5, -1, 2, 4],
            pop: [-1, 2, 4.5, 2, -1],
            jazz: [3, 1.5, -1.5, 2, 3.5],
            electronic: [5.5, 3, 0, 2.5, 4.5],
            acoustic: [3.5, 2, 1, 2, 3]
        };

        // DOM Elements
        const audio = document.getElementById("audio");
        const titleEl = document.getElementById("title");
        const coverEl = document.getElementById("cover");
        const coverWrapper = document.getElementById("coverWrapper");
        const sourceBadge = document.getElementById("sourceBadge");
        const speedBadge = document.getElementById("speedBadge");
        const eqBadge = document.getElementById("eqBadge");

        const playBtn = document.getElementById("play");
        const playPath = document.getElementById("playPath");
        const prevBtn = document.getElementById("prev");
        const nextBtn = document.getElementById("next");
        const shuffleBtn = document.getElementById("shuffle");
        const repeatBtn = document.getElementById("repeat");

        const progress = document.getElementById("progress");
        const currentTimeEl = document.getElementById("currentTime");
        const durationEl = document.getElementById("duration");

        const volume = document.getElementById("volume");
        const muteBtn = document.getElementById("muteBtn");
        const volPercent = document.getElementById("volPercent");
        const volWave1 = document.getElementById("volWave1");
        const volWave2 = document.getElementById("volWave2");

        const fileInput = document.getElementById("fileInput");
        const playlistEl = document.getElementById("playlist");
        const trackCountEl = document.getElementById("trackCount");
        const emptyPlaylistMsg = document.getElementById("emptyPlaylistMsg");
        const clearLibraryBtn = document.getElementById("clearLibraryBtn");

        const visualizerCanvas = document.getElementById("visualizerCanvas");
        const vizCtx = visualizerCanvas.getContext("2d");
        const vizToggleBtn = document.getElementById("vizToggleBtn");

        const playlistDrawer = document.getElementById("playlistDrawer");
        const openPlaylistDrawerBtn = document.getElementById("openPlaylistDrawerBtn");
        const addMusicBtn = document.getElementById("addMusicBtn");
        const drawerAddBtn = document.getElementById("drawerAddBtn");

        const eqModal = document.getElementById("eqModal");
        const lyricsModal = document.getElementById("lyricsModal");
        const sleepModal = document.getElementById("sleepModal");
        const openEqBtn = document.getElementById("openEqBtn");
        const openLyricsBtn = document.getElementById("openLyricsBtn");
        const openSleepBtn = document.getElementById("openSleepBtn");

        const lyricsDisplay = document.getElementById("lyricsDisplay");
        const lyricsEditor = document.getElementById("lyricsEditor");
        const toggleEditLyricsBtn = document.getElementById("toggleEditLyricsBtn");
        const saveLyricsBtn = document.getElementById("saveLyricsBtn");
        let parsedLrcLines = [];

        const clockTimeEl = document.getElementById("clockTime");
        const clockDateEl = document.getElementById("clockDate");
        const timeFormatBtn = document.getElementById("timeFormatBtn");

        const PLAY_PATH = "M8 5v14l11-7z";
        const PAUSE_PATH = "M6 5h4v14H6zm8 0h4v14h-4z";

        // --- WEB AUDIO API ENGINE ---
        function initWebAudio() {
            if (audioCtx) return;
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContextClass();
                sourceNode = audioCtx.createMediaElementSource(audio);

                eqBands = EQ_FREQS.map((freq, idx) => {
                    const filter = audioCtx.createBiquadFilter();
                    if (idx === 0) filter.type = "lowshelf";
                    else if (idx === EQ_FREQS.length - 1) filter.type = "highshelf";
                    else {
                        filter.type = "peaking";
                        filter.Q.value = 1.0;
                    }
                    filter.frequency.value = freq;
                    filter.gain.value = 0;
                    return filter;
                });

                gainNode = audioCtx.createGain();
                gainNode.gain.value = parseFloat(volume.value);

                analyserNode = audioCtx.createAnalyser();
                analyserNode.fftSize = 256;
                analyserNode.smoothingTimeConstant = 0.8;

                let lastNode = sourceNode;
                eqBands.forEach(filter => {
                    lastNode.connect(filter);
                    lastNode = filter;
                });
                lastNode.connect(gainNode);
                gainNode.connect(analyserNode);
                analyserNode.connect(audioCtx.destination);

                startVisualizerLoop();
            } catch (err) {
                console.warn("Audio Context init error:", err);
            }
        }

        // --- REAL-TIME AUDIO VISUALIZER ---
        function startVisualizerLoop() {
            if (visualizerAnimId) cancelAnimationFrame(visualizerAnimId);

            const bufferLength = analyserNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            function render() {
                visualizerAnimId = requestAnimationFrame(render);
                vizCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

                if (!isPlaying) return;

                analyserNode.getByteFrequencyData(dataArray);

                const width = visualizerCanvas.width;
                const height = visualizerCanvas.height;
                const centerX = width / 2;
                const centerY = height / 2;
                const primaryAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6366f1';

                if (visualizerMode === 0) {
                    const radius = 95;
                    const numBars = 44;
                    const step = Math.floor(bufferLength / numBars);

                    for (let i = 0; i < numBars; i++) {
                        const val = dataArray[i * step] || 0;
                        const barHeight = (val / 255) * 32;
                        const rad = (Math.PI * 2 / numBars) * i;

                        const x1 = centerX + Math.cos(rad) * radius;
                        const y1 = centerY + Math.sin(rad) * radius;
                        const x2 = centerX + Math.cos(rad) * (radius + barHeight + 2);
                        const y2 = centerY + Math.sin(rad) * (radius + barHeight + 2);

                        vizCtx.beginPath();
                        vizCtx.moveTo(x1, y1);
                        vizCtx.lineTo(x2, y2);
                        vizCtx.strokeStyle = primaryAccent;
                        vizCtx.lineWidth = 3;
                        vizCtx.lineCap = "round";
                        vizCtx.shadowBlur = 8;
                        vizCtx.shadowColor = primaryAccent;
                        vizCtx.stroke();
                        vizCtx.shadowBlur = 0;
                    }
                } else if (visualizerMode === 1) {
                    const numBars = 28;
                    const barWidth = (width / numBars) - 2;
                    const step = Math.floor(bufferLength / numBars);

                    for (let i = 0; i < numBars; i++) {
                        const val = dataArray[i * step] || 0;
                        const barHeight = (val / 255) * (height / 2.2);
                        const x = i * (barWidth + 2);
                        const y = height - barHeight;

                        const grad = vizCtx.createLinearGradient(0, y, 0, height);
                        grad.addColorStop(0, primaryAccent);
                        grad.addColorStop(1, 'rgba(255,255,255,0.05)');

                        vizCtx.fillStyle = grad;
                        vizCtx.fillRect(x, y, barWidth, barHeight);
                    }
                } else {
                    const timeData = new Uint8Array(bufferLength);
                    analyserNode.getByteTimeDomainData(timeData);

                    vizCtx.beginPath();
                    vizCtx.lineWidth = 2.5;
                    vizCtx.strokeStyle = primaryAccent;
                    vizCtx.shadowBlur = 10;
                    vizCtx.shadowColor = primaryAccent;

                    const sliceWidth = width / bufferLength;
                    let x = 0;

                    for (let i = 0; i < bufferLength; i++) {
                        const v = timeData[i] / 128.0;
                        const y = (v * height) / 2;
                        if (i === 0) vizCtx.moveTo(x, y);
                        else vizCtx.lineTo(x, y);
                        x += sliceWidth;
                    }

                    vizCtx.lineTo(width, height / 2);
                    vizCtx.stroke();
                    vizCtx.shadowBlur = 0;
                }
            }

            render();
        }

        // --- PLAYBACK CONTROL ---
        function formatTime(seconds) {
            if (isNaN(seconds) || seconds === Infinity) return "00:00";
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }

        function updatePlayBtnUI(playing) {
            if (typeof syncHeaderMusicCards === 'function') syncHeaderMusicCards(playing);
            isPlaying = playing;
            if (playPath) {
                playPath.setAttribute("d", playing ? PAUSE_PATH : PLAY_PATH);
            }
            if (playing) {
                playBtn.setAttribute("aria-label", "Pause");
                playBtn.setAttribute("title", "Pause (Spacebar)");
                coverWrapper.classList.add("spinning");
                coverWrapper.classList.remove("paused-spin");
            } else {
                playBtn.setAttribute("aria-label", "Play");
                playBtn.setAttribute("title", "Play (Spacebar)");
                coverWrapper.classList.add("paused-spin");
            }
        }

        function updateMediaSession() {
            if (!('mediaSession' in navigator)) return;

            const song = songs[songIndex];
            if (song) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: song.name,
                    artist: song.artist || 'KnC Music',
                    album: song.album || 'KnC Music',
                    artwork: [
                        { src: song.cover || DEFAULT_ALBUM_COVER, sizes: '512x512', type: 'image/png' }
                    ]
                });
            }

            try {
                navigator.mediaSession.setActionHandler('play', playSong);
                navigator.mediaSession.setActionHandler('pause', pauseSong);
                navigator.mediaSession.setActionHandler('previoustrack', prevSong);
                navigator.mediaSession.setActionHandler('nexttrack', nextSong);
                navigator.mediaSession.setActionHandler('seekbackward', (d) => {
                    audio.currentTime = Math.max(0, audio.currentTime - (d.seekOffset || 10));
                });
                navigator.mediaSession.setActionHandler('seekforward', (d) => {
                    if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + (d.seekOffset || 10));
                });
            } catch (e) { }
        }

        function loadSong(index) {
            if (songs.length === 0) {
                titleEl.textContent = "No Music Loaded";
                audio.src = "";
                coverEl.src = DEFAULT_ALBUM_COVER;
                currentTimeEl.textContent = "00:00";
                durationEl.textContent = "00:00";
                progress.value = 0;
                updatePlayBtnUI(false);
                parseAndRenderLyrics("");
                updatePlaylistUI();
                return;
            }

            songIndex = (index + songs.length) % songs.length;
            const song = songs[songIndex];

            titleEl.textContent = song.name;
            coverEl.src = song.cover || DEFAULT_ALBUM_COVER;

            sourceBadge.textContent = "KnC Music";
            audio.src = song.src;
            audio.playbackRate = speedOptions[currentSpeedIdx];
            progress.value = 0;
            currentTimeEl.textContent = "00:00";
            durationEl.textContent = "00:00";

            parseAndRenderLyrics(song.lyrics);
            updatePlaylistUI();
            updateMediaSession();
        }

        // --- CROSS-PAGE AUDIO SYNC ---
        function syncAudioState(playing) {
            try {
                const song = songs[songIndex];
                const state = {
                    isPlaying: !!playing,
                    songIndex: songIndex,
                    trackId: song ? song.id : null,
                    name: song ? song.name : (titleEl ? titleEl.textContent : "KnC Music"),
                    artist: song ? (song.artist || "KnC Music") : "KnC Music",
                    currentTime: audio.currentTime || 0,
                    duration: audio.duration || 0,
                    volume: audio.volume,
                    playbackRate: audio.playbackRate || 1,
                    timestamp: Date.now()
                };
                localStorage.setItem("knc_audio_state", JSON.stringify(state));
            } catch(e) {}
        }

        function playSong() {
            if (!audio.src || songs.length === 0) {
                fileInput.click();
                return;
            }

            initWebAudio();
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    updatePlayBtnUI(true);
                    syncAudioState(true);
                    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
                }).catch(err => {
                    updatePlayBtnUI(false);
                    syncAudioState(false);
                });
            } else {
                updatePlayBtnUI(true);
                syncAudioState(true);
            }
        }

        function pauseSong() {
            audio.pause();
            updatePlayBtnUI(false);
            syncAudioState(false);
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
        }

        function togglePlay() {
            if (songs.length === 0) {
                fileInput.click();
                return;
            }
            if (audio.paused) playSong();
            else pauseSong();
        }

        function playRandomSong() {
            if (songs.length <= 1) {
                loadSong(0);
                playSong();
                return;
            }
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * songs.length);
            } while (randomIndex === songIndex);
            songIndex = randomIndex;
            loadSong(songIndex);
            playSong();
        }

        function nextSong() {
            if (songs.length === 0) return;

            if (repeatMode === 2) {
                audio.currentTime = 0;
                playSong();
                return;
            }

            if (isShuffle) {
                playRandomSong();
            } else {
                songIndex = (songIndex + 1) % songs.length;
                loadSong(songIndex);
                playSong();
            }
        }

        function prevSong() {
            if (songs.length === 0) return;

            if (audio.currentTime > 3) {
                audio.currentTime = 0;
                return;
            }

            if (isShuffle) {
                playRandomSong();
            } else {
                songIndex = (songIndex - 1 + songs.length) % songs.length;
                loadSong(songIndex);
                playSong();
            }
        }

        // --- 200% GAIN VOLUME ---
        function updateVolumeUI() {
            const vol = parseFloat(volume.value);

            initWebAudio();
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            if (gainNode) {
                gainNode.gain.value = vol;
                audio.volume = 1.0;
            } else {
                audio.volume = Math.min(1.0, vol);
            }

            const pct = Math.round(vol * 100);
            volPercent.textContent = pct > 100 ? `${pct}% 🔊` : `${pct}%`;
            volPercent.style.color = pct > 100 ? "var(--accent)" : "var(--text-muted)";

            if (vol === 0) {
                volWave1.style.display = "none";
                volWave2.style.display = "none";
            } else if (vol < 0.5) {
                volWave1.style.display = "inline";
                volWave2.style.display = "none";
            } else {
                volWave1.style.display = "inline";
                volWave2.style.display = "inline";
            }
        }

        function toggleMute() {
            if (isMuted) {
                volume.value = previousVolume;
                isMuted = false;
            } else {
                previousVolume = volume.value;
                volume.value = 0;
                isMuted = true;
            }
            updateVolumeUI();
        }

        function cyclePlaybackSpeed() {
            currentSpeedIdx = (currentSpeedIdx + 1) % speedOptions.length;
            const rate = speedOptions[currentSpeedIdx];
            audio.playbackRate = rate;
            speedBadge.textContent = `${rate.toFixed(2).replace(/\.?0+$/, '')}x`;
        }

        // --- EQUALIZER ---
        function setEqualizerGains(gainArray) {
            initWebAudio();
            eqBands.forEach((band, i) => {
                if (band && gainArray[i] !== undefined) {
                    band.gain.value = gainArray[i];
                    const slider = document.getElementById(`eqBand${i}`);
                    const valDisplay = document.getElementById(`eqVal${i}`);
                    if (slider) slider.value = gainArray[i];
                    if (valDisplay) valDisplay.textContent = `${gainArray[i] > 0 ? '+' : ''}${gainArray[i]}dB`;
                }
            });
        }

        function applyEqPreset(presetName) {
            const gains = EQ_PRESETS[presetName] || EQ_PRESETS.flat;
            setEqualizerGains(gains);

            document.querySelectorAll(".eq-preset-chip").forEach(chip => {
                chip.classList.toggle("active", chip.getAttribute("data-preset") === presetName);
            });

            eqBadge.style.display = "inline-block";
            eqBadge.textContent = `EQ: ${presetName.charAt(0).toUpperCase() + presetName.slice(1)}`;
        }

        // --- LYRICS ---
        function parseAndRenderLyrics(rawLyrics) {
            parsedLrcLines = [];
            lyricsDisplay.innerHTML = "";

            if (!rawLyrics || !rawLyrics.trim()) {
                lyricsDisplay.innerHTML = '<p class="lyric-line" style="color:var(--text-muted); font-style:italic;">No lyrics available. Tap "Edit Lyrics" to add some!</p>';
                lyricsEditor.value = "";
                return;
            }

            lyricsEditor.value = rawLyrics;
            const lines = rawLyrics.split("\n");
            const lrcRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

            lines.forEach((line, idx) => {
                const match = line.match(lrcRegex);
                if (match) {
                    const mins = parseInt(match[1]);
                    const secs = parseInt(match[2]);
                    const ms = parseFloat("0." + match[3]);
                    const time = mins * 60 + secs + ms;
                    const text = match[4].trim() || "♪";

                    parsedLrcLines.push({ time, text, index: idx });

                    const p = document.createElement("p");
                    p.className = "lyric-line";
                    p.textContent = text;
                    p.setAttribute("data-time", time);
                    p.addEventListener("click", () => {
                        audio.currentTime = time;
                        playSong();
                    });
                    lyricsDisplay.appendChild(p);
                } else if (line.trim()) {
                    const p = document.createElement("p");
                    p.className = "lyric-line";
                    p.textContent = line.trim();
                    lyricsDisplay.appendChild(p);
                }
            });
        }

        function syncLyrics(currentTime) {
            if (parsedLrcLines.length === 0) return;

            let activeIdx = -1;
            for (let i = 0; i < parsedLrcLines.length; i++) {
                if (currentTime >= parsedLrcLines[i].time) activeIdx = i;
                else break;
            }

            const lineEls = lyricsDisplay.querySelectorAll(".lyric-line");
            lineEls.forEach((el, i) => {
                if (i === activeIdx) {
                    if (!el.classList.contains("active")) {
                        el.classList.add("active");
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } else {
                    el.classList.remove("active");
                }
            });
        }

        // --- SLEEP TIMER ---
        function setSleepTimer(minutes) {
            clearSleepTimer();
            const badge = document.getElementById("sleepTimerBadge");
            const countdownEl = document.getElementById("sleepCountdown");

            if (minutes === "end") {
                sleepEndTrack = true;
                badge.style.display = "flex";
                countdownEl.textContent = "Track End";
                closeModals();
                return;
            }

            const totalSecs = parseInt(minutes) * 60;
            sleepEndTime = Date.now() + totalSecs * 1000;
            badge.style.display = "flex";

            sleepTimerInterval = setInterval(() => {
                const remaining = Math.max(0, Math.round((sleepEndTime - Date.now()) / 1000));
                countdownEl.textContent = formatTime(remaining);

                if (remaining <= 10 && remaining > 0 && gainNode) {
                    gainNode.gain.value = Math.max(0, (remaining / 10) * parseFloat(volume.value));
                }

                if (remaining <= 0) {
                    clearSleepTimer();
                    pauseSong();
                    updateVolumeUI();
                }
            }, 1000);

            closeModals();
        }

        function clearSleepTimer() {
            if (sleepTimerInterval) clearInterval(sleepTimerInterval);
            sleepTimerInterval = null;
            sleepEndTime = null;
            sleepEndTrack = false;
            const badge = document.getElementById("sleepTimerBadge");
            if (badge) badge.style.display = "none";
        }

        // --- FILE UPLOADS ---
        async function openMusicFiles() {
            if (typeof window.showOpenFilePicker === "function") {
                try {
                    const fileHandles = await window.showOpenFilePicker({
                        multiple: true,
                        types: [{
                            description: "Audio files",
                            accept: {
                                "audio/mpeg": [".mp3"],
                                "audio/mp4": [".m4a", ".mp4"],
                                "audio/wav": [".wav"],
                                "audio/ogg": [".ogg", ".opus"],
                                "audio/flac": [".flac"],
                                "audio/aac": [".aac"],
                                "audio/x-ms-wma": [".wma"]
                            }
                        }]
                    });
                    const files = await Promise.all(fileHandles.map(handle => handle.getFile()));
                    handleFiles(files);
                    return;
                } catch (error) {
                    if (error.name === "AbortError") return;
                    console.warn("Direct audio file picker failed; using the browser file input instead:", error);
                }
            }

            fileInput.click();
        }

        function handleFiles(files) {
            const fileList = Array.from(files);
            if (fileList.length === 0) return;

            let firstNewIndex = songs.length;
            const newSongs = fileList.map(file => {
                const songItem = {
                    id: "knc-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    artist: "Unknown Artist",
                    album: "Local Library",
                    src: URL.createObjectURL(file),
                    cover: DEFAULT_ALBUM_COVER,
                    lyrics: "",
                    isLocal: true,
                    fileData: file
                };

                songs.push(songItem);
                return songItem;
            });

            renderPlaylist();
            loadSong(firstNewIndex);
            playSong();
            fileInput.value = "";

            newSongs.forEach(async songItem => {
                const meta = await parseID3Tags(songItem.fileData);
                songItem.name = meta.title || songItem.name;
                songItem.artist = meta.artist || songItem.artist;
                songItem.album = meta.album || songItem.album;
                songItem.cover = meta.cover || songItem.cover;
                songItem.lyrics = meta.lyrics || songItem.lyrics;

                saveSongToDB({
                    id: songItem.id,
                    name: songItem.name,
                    artist: songItem.artist,
                    album: songItem.album,
                    cover: songItem.cover,
                    lyrics: songItem.lyrics,
                    file: songItem.fileData
                });

                renderPlaylist();
                if (songs[songIndex] === songItem) {
                    titleEl.textContent = songItem.name;
                    coverEl.src = songItem.cover;
                    parseAndRenderLyrics(songItem.lyrics);
                    updateMediaSession();
                }
            });
        }

        // --- PLAYLIST RENDERING ---
        function renderPlaylist() {
            playlistEl.innerHTML = "";
            trackCountEl.textContent = `${songs.length} track${songs.length !== 1 ? 's' : ''}`;

            if (songs.length === 0) {
                emptyPlaylistMsg.style.display = "flex";
            } else {
                emptyPlaylistMsg.style.display = "none";
            }

            songs.forEach((song, idx) => {
                const li = document.createElement("li");
                li.className = `playlist-item ${idx === songIndex ? 'active' : ''}`;
                li.draggable = true;
                li.dataset.index = idx;

                li.innerHTML = `
                    <img src="${escapeHtml(song.cover || DEFAULT_ALBUM_COVER)}" class="playlist-thumb" alt="Track Art">
                    <div class="item-info">
                        <div class="item-title">${escapeHtml(song.name)}</div>
                        <div class="item-artist">${escapeHtml(song.artist || 'KnC Track')}</div>
                    </div>
                    <button type="button" class="item-remove" title="Remove track" aria-label="Remove ${escapeHtml(song.name)}" data-index="${idx}">
                        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                `;

                li.addEventListener("click", (e) => {
                    if (e.target.closest(".item-remove")) return;
                    songIndex = idx;
                    loadSong(songIndex);
                    playSong();
                });

                const removeBtn = li.querySelector(".item-remove");
                if (removeBtn) {
                    removeBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        removeSong(Number(removeBtn.dataset.index));
                    });
                }

                li.addEventListener("dragstart", (e) => {
                    if (e.target.closest(".item-remove")) {
                        e.preventDefault();
                        return;
                    }
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", String(idx));
                    li.classList.add("dragging");
                });

                li.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    li.classList.add("drag-over");
                });

                li.addEventListener("dragleave", () => {
                    li.classList.remove("drag-over");
                });

                li.addEventListener("drop", (e) => {
                    e.preventDefault();
                    const draggedIndex = e.dataTransfer.getData("text/plain");
                    if (draggedIndex === "") return;
                    const fromIndex = Number(draggedIndex);
                    const toIndex = Number(li.dataset.index);
                    if (!Number.isInteger(fromIndex) || fromIndex < 0 || fromIndex >= songs.length || fromIndex === toIndex) return;

                    const activeSong = songs[songIndex];
                    const [movedSong] = songs.splice(fromIndex, 1);
                    songs.splice(fromIndex < toIndex ? toIndex - 1 : toIndex, 0, movedSong);
                    songIndex = songs.indexOf(activeSong);
                    renderPlaylist();
                });

                li.addEventListener("dragend", () => {
                    playlistEl.querySelectorAll(".playlist-item").forEach(item => {
                        item.classList.remove("dragging", "drag-over");
                    });
                });

                playlistEl.appendChild(li);
            });
        }

        function updatePlaylistUI() {
            const items = playlistEl.querySelectorAll(".playlist-item");
            items.forEach((item, idx) => {
                item.classList.toggle("active", idx === songIndex);
            });
        }

        function removeSong(idx) {
            if (idx < 0 || idx >= songs.length) return;
            const songToRemove = songs[idx];

            if (songToRemove.isLocal) {
                removeSongFromDB(songToRemove.id);
                if (songToRemove.src && songToRemove.src.startsWith("blob:")) {
                    URL.revokeObjectURL(songToRemove.src);
                }
            }

            const isCurrent = (idx === songIndex);
            songs.splice(idx, 1);

            if (songs.length === 0) {
                songIndex = 0;
                loadSong(0);
            } else if (isCurrent) {
                songIndex = idx % songs.length;
                loadSong(songIndex);
                if (isPlaying) playSong();
            } else if (idx < songIndex) {
                songIndex--;
            }
            renderPlaylist();
        }

        function escapeHtml(str) {
            return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        }

        // --- CENTER-ALIGNED CLOCK WITH 12/24H TOGGLE ---
        function updateClock() {
            const now = new Date();
            const timeOptions = {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: !is24HourClock
            };
            const timeStr = now.toLocaleTimeString([], timeOptions);
            const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

            if (clockTimeEl) clockTimeEl.textContent = timeStr;
            if (clockDateEl) clockDateEl.textContent = dateStr;
        }

        function toggleClockFormat() {
            is24HourClock = !is24HourClock;
            localStorage.setItem("knc_clock_24h", is24HourClock);
            timeFormatBtn.textContent = is24HourClock ? "24H" : "12H";
            updateClock();
        }

        // --- MODAL UTILS ---
        function openModal(modalEl) {
            if (modalEl) modalEl.classList.add("open");
        }
        function closeModals() {
            document.querySelectorAll(".modal-backdrop, .drawer-backdrop").forEach(m => m.classList.remove("open"));
        }

        // Helper to synthesize a rhythmic energetic workout loop as a clean WAV Blob
        function createSynthBeatBlob(bpm = 128, bars = 4) {
            const sampleRate = 44100;
            const beatDuration = 60 / bpm;
            const totalDuration = beatDuration * 4 * bars;
            const totalSamples = Math.floor(sampleRate * totalDuration);
            const buffer = new ArrayBuffer(44 + totalSamples * 2);
            const view = new DataView(buffer);

            view.setUint32(0, 0x52494646, false); // 'RIFF'
            view.setUint32(4, 36 + totalSamples * 2, true);
            view.setUint32(8, 0x57415645, false); // 'WAVE'
            view.setUint32(12, 0x666d7420, false); // 'fmt '
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true); // PCM
            view.setUint16(22, 1, true); // Mono
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true);
            view.setUint32(36, 0x64617461, false); // 'data'
            view.setUint32(40, totalSamples * 2, true);

            const stepSamples = Math.floor(sampleRate * (beatDuration / 4));
            let offset = 44;
            for (let i = 0; i < totalSamples; i++) {
                const step = Math.floor(i / stepSamples) % 16;
                const stepPos = (i % stepSamples) / sampleRate;
                let sample = 0;

                if (step % 4 === 0 && stepPos < 0.16) {
                    const freq = 140 * Math.exp(-stepPos * 25);
                    const env = Math.exp(-stepPos * 18);
                    sample += Math.sin(2 * Math.PI * freq * stepPos) * env * 0.7;
                }
                if (step % 8 === 4 && stepPos < 0.12) {
                    const noise = (Math.random() * 2 - 1) * Math.exp(-stepPos * 28);
                    const tone = Math.sin(2 * Math.PI * 220 * stepPos) * Math.exp(-stepPos * 22);
                    sample += (noise * 0.4 + tone * 0.3);
                }
                if (step % 2 === 0 && stepPos < 0.05) {
                    const noise = (Math.random() * 2 - 1) * Math.exp(-stepPos * 70);
                    sample += noise * 0.12;
                }

                sample = Math.max(-1, Math.min(1, sample));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
            return new Blob([view], { type: 'audio/wav' });
        }

        // --- RESTORE FROM INDEXEDDB ---
        async function restoreSavedLibrary(pendingAction) {
            const savedTracks = await loadAllSongsFromDB();
            if (savedTracks && savedTracks.length > 0) {
                savedTracks.forEach(t => {
                    if (t.file) {
                        const blobUrl = URL.createObjectURL(t.file);
                        songs.push({
                            id: t.id,
                            name: t.name,
                            artist: t.artist || "KnC Track",
                            album: t.album || "",
                            src: blobUrl,
                            cover: t.cover || DEFAULT_ALBUM_COVER,
                            lyrics: t.lyrics || "",
                            isLocal: true
                        });
                    }
                });
            } else {
                // Built-in motivating workout presets so music is always ready
                const presets = [
                    { name: "KnC Cardio Groove (128 BPM)", artist: "Workout Groove", bpm: 128 },
                    { name: "KnC High-Tempo HIIT (135 BPM)", artist: "Workout Groove", bpm: 135 },
                    { name: "KnC Peak Interval (140 BPM)", artist: "Workout Groove", bpm: 140 }
                ];
                presets.forEach((p, idx) => {
                    const blob = createSynthBeatBlob(p.bpm, 4);
                    const blobUrl = URL.createObjectURL(blob);
                    songs.push({
                        id: "default_preset_" + idx,
                        name: p.name,
                        artist: p.artist,
                        album: "KnC Fitness Collection",
                        src: blobUrl,
                        cover: DEFAULT_ALBUM_COVER,
                        lyrics: "",
                        isLocal: false
                    });
                });
            }
            renderPlaylist();
            let savedState = null;
            try {
                savedState = JSON.parse(localStorage.getItem("knc_audio_state") || "null");
            } catch (error) {
                console.warn("Unable to restore music player state:", error);
            }

            const trackIdIndex = savedState && savedState.trackId
                ? songs.findIndex(song => song.id === savedState.trackId)
                : -1;
            const targetIndex = trackIdIndex >= 0
                ? trackIdIndex
                : savedState && Number.isInteger(savedState.songIndex) && savedState.songIndex >= 0 && savedState.songIndex < songs.length
                    ? savedState.songIndex
                    : 0;
            loadSong(targetIndex);

            if (savedState) {
                const savedTime = Number(savedState.currentTime);
                if (Number.isFinite(savedTime) && savedTime >= 0) {
                    const elapsed = savedState.isPlaying && Number.isFinite(savedState.timestamp)
                        ? Math.max(0, (Date.now() - savedState.timestamp) / 1000)
                        : 0;
                    audio.currentTime = savedTime + elapsed;
                }

                const savedRate = Number(savedState.playbackRate);
                const savedSpeedIndex = speedOptions.indexOf(savedRate);
                if (savedSpeedIndex >= 0) {
                    currentSpeedIdx = savedSpeedIndex;
                    audio.playbackRate = savedRate;
                    speedBadge.textContent = `${savedRate.toFixed(2).replace(/\.?0+$/, '')}x`;
                }

                if (savedState.isPlaying && pendingAction !== "pause" && pendingAction !== "next") {
                    playSong();
                }
            }
        }

        function getPendingMusicAction() {
            const params = new URLSearchParams(window.location.search);
            const action = params.get("musicAction");
            if (action) {
                history.replaceState(null, "", window.location.pathname + window.location.hash);
            }
            return ["play", "pause", "next"].includes(action) ? action : null;
        }

        function runPendingMusicAction(action) {
            if (action === "play") {
                if (audio.paused) playSong();
            } else if (action === "pause") {
                pauseSong();
            } else if (action === "next") {
                nextSong();
            }
        }

        // --- EVENT LISTENERS ---
        function initEventListeners() {
            // Custom Styled Theme Dropdown Logic (EMOJIS ONLY)
            const themeDropdown = document.getElementById("themeDropdown");
            const themeTriggerBtn = document.getElementById("themeTriggerBtn");
            const activeThemeLabel = document.getElementById("activeThemeLabel");
            const themeOptions = document.querySelectorAll(".theme-option");

            const themeEmojiMap = {
                indigo: "🌌",
                cyberpunk: "⚡",
                emerald: "🌿",
                sunset: "🌅",
                light: "☀️"
            };

            function applyTheme(themeKey, themeLabel) {
                document.documentElement.setAttribute("data-theme", themeKey);
                localStorage.setItem("knc_theme", themeKey);
                const emoji = themeLabel || themeEmojiMap[themeKey] || "🌌";
                if (activeThemeLabel) activeThemeLabel.textContent = emoji;

                themeOptions.forEach(opt => {
                    const isSelected = opt.getAttribute("data-theme-val") === themeKey;
                    opt.classList.toggle("active", isSelected);
                });
            }

            themeTriggerBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const isOpen = themeDropdown.classList.toggle("open");
                themeTriggerBtn.setAttribute("aria-expanded", isOpen);
            });

            themeOptions.forEach(opt => {
                opt.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const val = opt.getAttribute("data-theme-val");
                    const name = opt.getAttribute("data-theme-name");
                    applyTheme(val, name);
                    themeDropdown.classList.remove("open");
                    themeTriggerBtn.setAttribute("aria-expanded", "false");
                });
            });

            document.addEventListener("click", (e) => {
                if (!themeDropdown.contains(e.target)) {
                    themeDropdown.classList.remove("open");
                    themeTriggerBtn.setAttribute("aria-expanded", "false");
                }
            });

            const savedTheme = localStorage.getItem("knc_theme") || "indigo";
            applyTheme(savedTheme, themeEmojiMap[savedTheme]);

            // 12/24H format button
            timeFormatBtn.textContent = is24HourClock ? "24H" : "12H";
            timeFormatBtn.addEventListener("click", toggleClockFormat);

            // Controls
            playBtn.addEventListener("click", togglePlay);
            nextBtn.addEventListener("click", nextSong);
            prevBtn.addEventListener("click", prevSong);
            speedBadge.addEventListener("click", cyclePlaybackSpeed);

            shuffleBtn.addEventListener("click", () => {
                isShuffle = !isShuffle;
                shuffleBtn.classList.toggle("active", isShuffle);
            });

            repeatBtn.addEventListener("click", () => {
                repeatMode = (repeatMode + 1) % 3;
                repeatBtn.classList.toggle("active", repeatMode > 0);
                const repeatNames = ["Repeat Off", "Repeat All", "Repeat One"];
                repeatBtn.title = repeatNames[repeatMode];
            });

            audio.addEventListener("play", () => updatePlayBtnUI(true));
            audio.addEventListener("pause", () => updatePlayBtnUI(false));

            audio.addEventListener("ended", () => {
                if (sleepEndTrack) {
                    clearSleepTimer();
                    pauseSong();
                    return;
                }
                if (repeatMode === 2) {
                    audio.currentTime = 0;
                    playSong();
                } else if (isShuffle) {
                    playRandomSong();
                } else if (repeatMode === 1 || songIndex < songs.length - 1) {
                    songIndex = (songIndex + 1) % songs.length;
                    loadSong(songIndex);
                    playSong();
                } else {
                    pauseSong();
                }
            });

            let lastSyncTime = 0;
            audio.addEventListener("timeupdate", () => {
                if (audio.duration && !isSeeking) {
                    progress.value = (audio.currentTime / audio.duration) * 100;
                    currentTimeEl.textContent = formatTime(audio.currentTime);
                }
                syncLyrics(audio.currentTime);

                const now = Date.now();
                if (now - lastSyncTime > 1500) {
                    lastSyncTime = now;
                    syncAudioState(!audio.paused);
                }
            });

            window.addEventListener("beforeunload", () => {
                syncAudioState(!audio.paused);
            });

            audio.addEventListener("loadedmetadata", () => {
                durationEl.textContent = formatTime(audio.duration);
            });

            // Seeking
            progress.addEventListener("mousedown", () => { isSeeking = true; });
            progress.addEventListener("touchstart", () => { isSeeking = true; });
            progress.addEventListener("input", () => {
                if (audio.duration) {
                    currentTimeEl.textContent = formatTime((progress.value / 100) * audio.duration);
                }
            });
            progress.addEventListener("change", () => {
                if (audio.duration) {
                    audio.currentTime = (progress.value / 100) * audio.duration;
                }
                isSeeking = false;
            });
            progress.addEventListener("mouseup", () => { isSeeking = false; });
            progress.addEventListener("touchend", () => { isSeeking = false; });

            // Volume
            volume.addEventListener("input", updateVolumeUI);
            muteBtn.addEventListener("click", toggleMute);

            // Visualizer Cycle
            vizToggleBtn.addEventListener("click", () => {
                visualizerMode = (visualizerMode + 1) % 3;
                const modeNames = ["Ring Bars", "Spectrum", "Waveform"];
                vizToggleBtn.title = `${modeNames[visualizerMode]} visualizer`;
                vizToggleBtn.setAttribute("aria-label", `${modeNames[visualizerMode]} visualizer`);
            });

            // Belt glyph triggers
            openPlaylistDrawerBtn.addEventListener("click", () => openModal(playlistDrawer));
            addMusicBtn.addEventListener("click", openMusicFiles);
            drawerAddBtn.addEventListener("click", openMusicFiles);

            openEqBtn.addEventListener("click", () => openModal(eqModal));
            openLyricsBtn.addEventListener("click", () => openModal(lyricsModal));
            openSleepBtn.addEventListener("click", () => openModal(sleepModal));

            document.querySelectorAll("[data-close]").forEach(btn => {
                btn.addEventListener("click", () => {
                    const targetId = btn.getAttribute("data-close");
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) targetEl.classList.remove("open");
                });
            });

            document.querySelectorAll(".modal-backdrop, .drawer-backdrop").forEach(backdrop => {
                backdrop.addEventListener("click", (e) => {
                    if (e.target === backdrop) backdrop.classList.remove("open");
                });
            });

            // EQ Sliders & Presets
            document.querySelectorAll(".eq-slider").forEach(slider => {
                slider.addEventListener("input", (e) => {
                    initWebAudio();
                    const idx = parseInt(e.target.getAttribute("data-index"));
                    const gainVal = parseFloat(e.target.value);
                    if (eqBands[idx]) eqBands[idx].gain.value = gainVal;

                    const valDisplay = document.getElementById(`eqVal${idx}`);
                    if (valDisplay) valDisplay.textContent = `${gainVal > 0 ? '+' : ''}${gainVal}dB`;

                    eqBadge.style.display = "inline-block";
                    eqBadge.textContent = "EQ: Custom";

                    document.querySelectorAll(".eq-preset-chip").forEach(c => c.classList.remove("active"));
                });
            });

            document.querySelectorAll(".eq-preset-chip").forEach(chip => {
                chip.addEventListener("click", () => {
                    applyEqPreset(chip.getAttribute("data-preset"));
                });
            });

            document.getElementById("resetEqBtn").addEventListener("click", () => applyEqPreset("flat"));

            // Lyrics Actions
            toggleEditLyricsBtn.addEventListener("click", () => {
                const isEditing = lyricsEditor.style.display === "block";
                if (isEditing) {
                    lyricsEditor.style.display = "none";
                    lyricsDisplay.style.display = "block";
                    toggleEditLyricsBtn.textContent = "Edit Lyrics";
                    saveLyricsBtn.style.display = "none";
                } else {
                    lyricsEditor.style.display = "block";
                    lyricsDisplay.style.display = "none";
                    toggleEditLyricsBtn.textContent = "Cancel";
                    saveLyricsBtn.style.display = "inline-flex";
                    lyricsEditor.focus();
                }
            });

            saveLyricsBtn.addEventListener("click", () => {
                const currentSong = songs[songIndex];
                if (currentSong) {
                    currentSong.lyrics = lyricsEditor.value;
                    parseAndRenderLyrics(currentSong.lyrics);
                    if (currentSong.isLocal) {
                        saveSongToDB({
                            id: currentSong.id,
                            name: currentSong.name,
                            artist: currentSong.artist,
                            album: currentSong.album,
                            cover: currentSong.cover,
                            lyrics: currentSong.lyrics
                        });
                    }
                }
                lyricsEditor.style.display = "none";
                lyricsDisplay.style.display = "block";
                toggleEditLyricsBtn.textContent = "Edit Lyrics";
                saveLyricsBtn.style.display = "none";
            });

            // Sleep Timer Chips
            document.querySelectorAll(".sleep-chip").forEach(chip => {
                chip.addEventListener("click", () => {
                    setSleepTimer(chip.getAttribute("data-minutes"));
                });
            });

            document.getElementById("cancelSleepBtn").addEventListener("click", () => {
                clearSleepTimer();
                closeModals();
            });

            // Clear Library
            clearLibraryBtn.addEventListener("click", async () => {
                if (confirm("Clear all tracks from KnC Music Library?")) {
                    await clearAllSongsFromDB();
                    songs = [];
                    renderPlaylist();
                    loadSong(0);
                }
            });

            fileInput.addEventListener("change", (e) => {
                if (e.target.files.length) handleFiles(e.target.files);
            });

            // Hotkeys
            document.addEventListener("keydown", (e) => {
                if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;

                switch (e.code) {
                    case "Space":
                        e.preventDefault();
                        togglePlay();
                        break;
                    case "ArrowLeft":
                        e.preventDefault();
                        audio.currentTime = Math.max(0, audio.currentTime - 5);
                        break;
                    case "ArrowRight":
                        e.preventDefault();
                        if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
                        break;
                    case "ArrowUp":
                        e.preventDefault();
                        volume.value = Math.min(2, parseFloat(volume.value) + 0.05);
                        updateVolumeUI();
                        break;
                    case "ArrowDown":
                        e.preventDefault();
                        volume.value = Math.max(0, parseFloat(volume.value) - 0.05);
                        updateVolumeUI();
                        break;
                    case "KeyM":
                        toggleMute();
                        break;
                    case "KeyN":
                        nextSong();
                        break;
                    case "KeyP":
                        prevSong();
                        break;
                    case "KeyE":
                        openModal(eqModal);
                        break;
                    case "KeyL":
                        openModal(lyricsModal);
                        break;
                    case "Escape":
                        closeModals();
                        break;
                }
            });
        }

        // --- INITIALIZATION ---
        function initFloatingBelt() {
            const floatingBelt = document.getElementById("floatingBelt");
            if (!floatingBelt) return;
            // Sticky lower belt: always visible on music page
            floatingBelt.classList.add("visible");

            const musicItem = floatingBelt.querySelector('a[href*="Music%20Player"], a[href="index.html"]');
            if (musicItem) {
                musicItem.addEventListener("click", (e) => {
                    e.preventDefault();
                });
            }
        }

        async function init() {
            const pendingAction = getPendingMusicAction();
            setInterval(updateClock, 1000);
            updateClock();
            initFloatingBelt();
            if (typeof initHeaderMusicCards === 'function') initHeaderMusicCards();
            if (typeof initSPARouter === 'function') initSPARouter();
            initEventListeners();
            updateVolumeUI();
            await restoreSavedLibrary(pendingAction);
            runPendingMusicAction(pendingAction);
        }

        // DOMContentLoaded handled globally below

// =========================================================================
// 2. TRAINING & WORKOUTS ENGINE
// =========================================================================
(() => {
            // SYNC THEME WITH KNC MUSIC PLAYER
            const savedTheme = localStorage.getItem("knc_theme") || "indigo";
            document.documentElement.setAttribute("data-theme", savedTheme);

            // DATE DISPLAY
            const today = new Date();
            const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
            const dateStr = today.toLocaleDateString(undefined, dateOptions);
            const dateBadge = document.getElementById("dateText");
            if (dateBadge) dateBadge.textContent = dateStr;

            // AUDIO CHIME (Web Audio API Synthesizer)
            function playBeep(freq = 660, duration = 0.15, type = "sine") {
                try {
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    if (!AudioCtx) return;
                    const ctx = new AudioCtx();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    gain.gain.setValueAtTime(0.18, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + duration);
                } catch (e) {}
            }

            // TOAST
            const toastMsg = document.getElementById("toastMsg");
            const toastText = document.getElementById("toastText");
            let toastTimer = null;
            function showToast(msg) {
                if (!toastMsg || !toastText) return;
                if (toastTimer) clearTimeout(toastTimer);
                toastText.textContent = msg;
                toastMsg.classList.add("show");
                toastTimer = setTimeout(() => toastMsg.classList.remove("show"), 2200);
            }

            // ============================================================
            // 1. HOME WORKOUTS DATABASE (2 Warm-ups + 6 Main + 2 Warm-downs = 10 Total)
            // ============================================================
            const HOME_EXERCISES = {
                no_equipment: {
                    warmups: [
                        { name: "Dynamic Arm Swings & Chest Openers", muscle: "Warm-Up", desc: "Cross arms dynamically across chest then open wide to prepare pectorals & shoulders.", beginner: "60s continuous", intermediate: "60s continuous", advanced: "75s continuous" },
                        { name: "High-Knee March & Torso Twists", muscle: "Warm-Up", desc: "March in place driving knees up while gently rotating torso from side to side.", beginner: "60s continuous", intermediate: "60s continuous", advanced: "75s continuous" },
                        { name: "Hip Circles & Light Jumping Jacks", muscle: "Warm-Up", desc: "Loosen hips with wide circles followed by light rhythmic jumping jacks.", beginner: "60s continuous", intermediate: "60s continuous", advanced: "75s continuous" }
                    ],
                    push: [
                        { name: "Standard Push-Ups", muscle: "Chest & Triceps", desc: "Keep body in rigid plank, elbows tracking at 45 degrees, full chest depth.", beginner: "3 sets × 8 reps", intermediate: "4 sets × 14 reps", advanced: "5 sets × 22 reps" },
                        { name: "Pike Push-Ups", muscle: "Shoulders", desc: "Hips elevated in V-shape, lower head diagonally toward hands.", beginner: "3 sets × 6 reps", intermediate: "4 sets × 10 reps", advanced: "5 sets × 16 reps" },
                        { name: "Diamond Push-Ups", muscle: "Triceps & Chest", desc: "Hands close together forming a diamond shape. Tight core.", beginner: "3 sets × 6 reps", intermediate: "4 sets × 12 reps", advanced: "5 sets × 18 reps" }
                    ],
                    pull: [
                        { name: "Doorframe Row / Towel Pulls", muscle: "Back & Biceps", desc: "Grip a sturdy doorframe or wrap towel around handle, pull chest inward.", beginner: "3 sets × 10 reps", intermediate: "4 sets × 15 reps", advanced: "5 sets × 20 reps" },
                        { name: "Prone Cobra Holds", muscle: "Upper Back", desc: "Lie chest down, lift torso and rotate thumbs upward, squeeze shoulder blades.", beginner: "3 sets × 25s", intermediate: "4 sets × 40s", advanced: "5 sets × 60s" }
                    ],
                    quads: [
                        { name: "Air Squats (Controlled Tempo)", muscle: "Quads & Glutes", desc: "Chest upright, weight back through midfoot/heels, 3-second descent.", beginner: "3 sets × 12 reps", intermediate: "4 sets × 20 reps", advanced: "5 sets × 30 reps" },
                        { name: "Walking Lunges", muscle: "Quads & Calves", desc: "Step forward into 90-degree knee bend, alternate legs seamlessly.", beginner: "3 sets × 10/leg", intermediate: "4 sets × 16/leg", advanced: "5 sets × 22/leg" }
                    ],
                    posterior: [
                        { name: "Glute Bridges", muscle: "Glutes & Hamstrings", desc: "Lie on back, drive hips up and squeeze glutes hard at the top.", beginner: "3 sets × 12 reps", intermediate: "4 sets × 18 reps", advanced: "5 sets × 25 reps" },
                        { name: "Single-Leg Glute Bridge", muscle: "Glute Isolation", desc: "Extend one leg, drive through the working heel with full lockout.", beginner: "3 sets × 8/leg", intermediate: "4 sets × 12/leg", advanced: "5 sets × 18/leg" }
                    ],
                    core: [
                        { name: "Forearm Plank Hold", muscle: "Full Core", desc: "Glutes clenched, ribs tucked in, neutral cervical spine.", beginner: "3 sets × 30s", intermediate: "4 sets × 50s", advanced: "5 sets × 80s" },
                        { name: "Bicycle Crunches", muscle: "Abs & Obliques", desc: "Controlled rotation bringing elbow to opposite knee without yanking neck.", beginner: "3 sets × 16 total", intermediate: "4 sets × 24 total", advanced: "5 sets × 36 total" }
                    ],
                    cardio: [
                        { name: "Mountain Climbers", muscle: "Cardio & Core", desc: "High plank position, drive knees explosively towards chest.", beginner: "3 sets × 30s", intermediate: "4 sets × 45s", advanced: "5 sets × 60s" },
                        { name: "Burpees (No Push-Up)", muscle: "Full Body Burn", desc: "Drop hands, jump feet back to plank, jump forward and leap upwards.", beginner: "3 sets × 8 reps", intermediate: "4 sets × 14 reps", advanced: "5 sets × 20 reps" }
                    ],
                    warmdowns: [
                        { name: "Cobra Stretch & Child's Pose", muscle: "Warm-Down", desc: "Gently press chest up into gentle cobra, then push hips back into child's pose.", beginner: "60s gentle hold", intermediate: "60s gentle hold", advanced: "60s gentle hold" },
                        { name: "Standing Hamstring & Chest Reach", muscle: "Warm-Down", desc: "Hinge forward to reach toes, then interlace hands behind back and open chest.", beginner: "60s gentle hold", intermediate: "60s gentle hold", advanced: "60s gentle hold" },
                        { name: "Seated Butterfly & Spine Decompression", muscle: "Warm-Down", desc: "Soles of feet together, let knees drop outward, relax head and breathe deep.", beginner: "60s gentle hold", intermediate: "60s gentle hold", advanced: "60s gentle hold" }
                    ]
                },
                with_equipment: {
                    warmups: [
                        { name: "Resistance Band Shoulder Dislocates", muscle: "Warm-Up", desc: "Hold band wide, rotate arms smoothly overhead and back to open shoulder capsule.", beginner: "60s continuous", intermediate: "60s continuous", advanced: "75s continuous" },
                        { name: "Light Dumbbell Halo Rotations", muscle: "Warm-Up", desc: "Hold light dumbbell at chest, circle smoothly around head to warm up neck & delts.", beginner: "60s continuous", intermediate: "60s continuous", advanced: "75s continuous" }
                    ],
                    push: [
                        { name: "Dumbbell Floor / Bed Press", muscle: "Chest & Triceps", desc: "Lie back, press dumbbells smoothly upward over chest, squeeze at peak.", beginner: "3 sets × 10 reps", intermediate: "4 sets × 12 reps", advanced: "5 sets × 16 reps" },
                        { name: "Overhead Dumbbell Shoulder Press", muscle: "Shoulders", desc: "Press weights directly overhead without arching spine.", beginner: "3 sets × 8 reps", intermediate: "4 sets × 12 reps", advanced: "5 sets × 15 reps" }
                    ],
                    pull: [
                        { name: "Bent-Over Dumbbell Rows", muscle: "Lats & Mid-Back", desc: "Hinge forward 45 degrees, pull elbows straight back towards hips.", beginner: "3 sets × 10 reps", intermediate: "4 sets × 14 reps", advanced: "5 sets × 18 reps" },
                        { name: "Resistance Band Face Pulls", muscle: "Rear Delts", desc: "Pull band to bridge of nose, separating hands and squeezing rear delts.", beginner: "3 sets × 12 reps", intermediate: "4 sets × 16 reps", advanced: "5 sets × 22 reps" }
                    ],
                    quads: [
                        { name: "Goblet Squats (Dumbbell)", muscle: "Quads & Core", desc: "Hold weight close to sternum, squat deep between hips with upright torso.", beginner: "3 sets × 10 reps", intermediate: "4 sets × 14 reps", advanced: "5 sets × 20 reps" },
                        { name: "Dumbbell Bulgarian Split Squats", muscle: "Quads & Glutes", desc: "Rear foot elevated on chair, descend with control.", beginner: "3 sets × 8/leg", intermediate: "4 sets × 12/leg", advanced: "5 sets × 16/leg" }
                    ],
                    posterior: [
                        { name: "Dumbbell Romanian Deadlifts", muscle: "Hamstrings & Glutes", desc: "Hinge hips back, slide weights down shins, feel intense hamstring stretch.", beginner: "3 sets × 10 reps", intermediate: "4 sets × 14 reps", advanced: "5 sets × 18 reps" },
                        { name: "Weighted Glute Bridge", muscle: "Glutes", desc: "Rest dumbbell comfortably on hip crease, press firmly through heels.", beginner: "3 sets × 12 reps", intermediate: "4 sets × 16 reps", advanced: "5 sets × 22 reps" }
                    ],
                    core: [
                        { name: "Dumbbell Russian Twists", muscle: "Obliques", desc: "Feet grounded or elevated, rotate dumbbell with controlled abdominal tension.", beginner: "3 sets × 16 total", intermediate: "4 sets × 24 total", advanced: "5 sets × 32 total" }
                    ],
                    cardio: [
                        { name: "Dumbbell Thrusters", muscle: "Full Body Power", desc: "Deep squat right into an explosive overhead press in one fluid movement.", beginner: "3 sets × 8 reps", intermediate: "4 sets × 12 reps", advanced: "5 sets × 18 reps" }
                    ],
                    warmdowns: [
                        { name: "Band-Assisted Lying Hamstring Stretch", muscle: "Warm-Down", desc: "Loop band around foot sole, lie back, extend leg upward into gentle stretch.", beginner: "60s gentle hold", intermediate: "60s gentle hold", advanced: "60s gentle hold" },
                        { name: "Doorway Pectoral & Lat Stretch", muscle: "Warm-Down", desc: "Forearm on doorframe, step forward gently to release chest & anterior shoulder.", beginner: "60s gentle hold", intermediate: "60s gentle hold", advanced: "60s gentle hold" }
                    ]
                }
            };

            // ============================================================
            // 2. GYM WORKOUT CATALOG
            // ============================================================
            const GYM_CATALOG = {
                chest: [
                    { id: "c1", name: "Barbell Bench Press", equipment: "Barbell & Bench", defaultSets: 4 },
                    { id: "c2", name: "Incline Dumbbell Press", equipment: "Dumbbells & Incline Bench", defaultSets: 3 },
                    { id: "c3", name: "Cable Chest Flyes", equipment: "Dual Cable Machine", defaultSets: 3 },
                    { id: "c4", name: "Chest Dips (Parallel Bars)", equipment: "Dip Station", defaultSets: 3 },
                    { id: "c5", name: "Pec Deck Machine Flyes", equipment: "Pec Deck Machine", defaultSets: 3 },
                    { id: "c6", name: "Decline Barbell Press", equipment: "Barbell & Decline Bench", defaultSets: 3 }
                ],
                back: [
                    { id: "b1", name: "Barbell Deadlift (Conventional)", equipment: "Olympic Barbell", defaultSets: 4 },
                    { id: "b2", name: "Lat Pulldown (Wide Grip)", equipment: "Cable Lat Machine", defaultSets: 4 },
                    { id: "b3", name: "Seated Cable Row (Close Grip)", equipment: "Low Row Cable", defaultSets: 3 },
                    { id: "b4", name: "Barbell Bent-Over Row", equipment: "Barbell", defaultSets: 4 },
                    { id: "b5", name: "T-Bar Machine Row", equipment: "T-Bar Machine", defaultSets: 3 },
                    { id: "b6", name: "Straight-Arm Cable Pushdown", equipment: "Cable & Bar", defaultSets: 3 }
                ],
                shoulders: [
                    { id: "s1", name: "Overhead Military Barbell Press", equipment: "Barbell & Rack", defaultSets: 4 },
                    { id: "s2", name: "Dumbbell Lateral Raises", equipment: "Dumbbells", defaultSets: 4 },
                    { id: "s3", name: "Seated Arnold Press", equipment: "Dumbbells & Bench", defaultSets: 3 },
                    { id: "s4", name: "Cable Front Raises", equipment: "Low Cable", defaultSets: 3 },
                    { id: "s5", name: "Face Pulls with Rope", equipment: "Cable Machine", defaultSets: 3 },
                    { id: "s6", name: "Barbell Shrugs (Traps)", equipment: "Barbell / Smith", defaultSets: 3 }
                ],
                biceps: [
                    { id: "bi1", name: "Barbell Bicep Curls", equipment: "Straight / EZ Bar", defaultSets: 3 },
                    { id: "bi2", name: "Incline Dumbbell Curls", equipment: "Dumbbells & Incline Bench", defaultSets: 3 },
                    { id: "bi3", name: "Cable Rope Hammer Curls", equipment: "Cable & Rope", defaultSets: 3 },
                    { id: "bi4", name: "Preacher Curl Machine", equipment: "Preacher Bench", defaultSets: 3 },
                    { id: "bi5", name: "Concentration Dumbbell Curls", equipment: "Dumbbell", defaultSets: 3 }
                ],
                triceps: [
                    { id: "tr1", name: "Tricep Rope Pushdowns", equipment: "High Cable & Rope", defaultSets: 4 },
                    { id: "tr2", name: "Skull Crushers (Lying Tricep Ext)", equipment: "EZ Bar & Flat Bench", defaultSets: 3 },
                    { id: "tr3", name: "Overhead Cable Tricep Extension", equipment: "Cable Machine", defaultSets: 3 },
                    { id: "tr4", name: "Close-Grip Barbell Bench Press", equipment: "Barbell & Bench", defaultSets: 3 },
                    { id: "tr5", name: "Tricep Bench Dips", equipment: "Bench / Parallel", defaultSets: 3 }
                ],
                legs: [
                    { id: "l1", name: "Barbell Back Squats", equipment: "Squat Rack & Barbell", defaultSets: 4 },
                    { id: "l2", name: "Leg Press (45 Degree)", equipment: "Leg Press Machine", defaultSets: 4 },
                    { id: "l3", name: "Romanian Deadlift (RDL)", equipment: "Barbell or Dumbbells", defaultSets: 3 },
                    { id: "l4", name: "Leg Extension Machine", equipment: "Pin-Loaded Machine", defaultSets: 3 },
                    { id: "l5", name: "Lying Hamstring Curls", equipment: "Leg Curl Machine", defaultSets: 3 },
                    { id: "l6", name: "Standing Calf Raises", equipment: "Smith Machine / Calf Block", defaultSets: 4 }
                ],
                abs: [
                    { id: "ab1", name: "Hanging Leg Raises", equipment: "Pull-Up Bar / Captain's Chair", defaultSets: 3 },
                    { id: "ab2", name: "Cable Woodchoppers (High-to-Low)", equipment: "Cable Machine", defaultSets: 3 },
                    { id: "ab3", name: "Ab Roller Wheel Extensions", equipment: "Ab Wheel", defaultSets: 3 },
                    { id: "ab4", name: "Decline Weighted Sit-Ups", equipment: "Decline Bench & Weight", defaultSets: 3 },
                    { id: "ab5", name: "Cable Kneeling Crunches", equipment: "High Cable & Rope", defaultSets: 3 }
                ]
            };

            // Automated Gym Warm-ups & Warm-downs
            const GYM_AUTO_WARMUPS = [
                { id: "g_warm_1", name: "Dynamic Arm & Shoulder Circles", type: "warmup", meta: "3 mins dynamic joint lubrication" },
                { id: "g_warm_2", name: "Light Torso Twists & Jumping Jacks", type: "warmup", meta: "2 mins light cardiovascular ramp-up" }
            ];
            const GYM_AUTO_WARMDOWNS = [
                { id: "g_cool_1", name: "Deep Chest & Shoulder Opener Stretch", type: "warmdown", meta: "60s static posture release" },
                { id: "g_cool_2", name: "Child's Pose & Hamstring Decompression", type: "warmdown", meta: "60s spine & posterior chain stretch" }
            ];

            // ============================================================
            // STATE & CUSTOM EXERCISES
            // ============================================================
            let currentMode = "home"; // 'home' | 'gym'
            let homeEquipment = "no_equipment"; // 'no_equipment' | 'with_equipment'
            let homeLevel = "intermediate"; // 'beginner' | 'intermediate' | 'advanced'
            let dailySeedOffset = 0;
            let completedHomeIds = new Set();

            // Gym state
            let activeGymPart = "chest"; // Single chosen body part at a time
            let selectedGymWorkouts = []; // Array of { id, name, bodyPart, sets, reps: 10 }
            let completedGymWorkouts = new Set();
            let completedGymSetKeys = new Set();

            // Load Custom Exercises
            const STORAGE_CUSTOM_EXERCISES = "knc_custom_exercises";
            function getCustomExercises() {
                try {
                    return JSON.parse(localStorage.getItem(STORAGE_CUSTOM_EXERCISES) || "[]");
                } catch (e) {
                    return [];
                }
            }

            function saveCustomExercise(exercise) {
                const list = getCustomExercises();
                list.push(exercise);
                localStorage.setItem(STORAGE_CUSTOM_EXERCISES, JSON.stringify(list));
            }

            function removeCustomExercise(id) {
                let list = getCustomExercises();
                list = list.filter(item => item.id !== id);
                localStorage.setItem(STORAGE_CUSTOM_EXERCISES, JSON.stringify(list));
            }

            function getTodayDateString() {
                const d = new Date();
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }

            // Record workout completions for Report.html calendar
            function recordWorkoutLog(mode, name, details) {
                try {
                    const todayStr = getTodayDateString();
                    let history = {};
                    try {
                        history = JSON.parse(localStorage.getItem("knc_workout_history") || "{}");
                    } catch (e) { history = {}; }

                    if (!history[todayStr]) history[todayStr] = { home: [], gym: [] };
                    if (!history[todayStr][mode]) history[todayStr][mode] = [];

                    const list = history[todayStr][mode];
                    const exists = list.some(item => (typeof item === 'string' ? item : item.name) === name);
                    if (!exists) {
                        list.push(details || { name: name, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
                        localStorage.setItem("knc_workout_history", JSON.stringify(history));
                    }
                } catch (e) {}
            }

            // LocalStorage persistence for gym selection (Refreshes at midnight into blank)
            const STORAGE_GYM_PLAN = "knc_gym_plan_v2";
            try {
                const savedPlan = localStorage.getItem(STORAGE_GYM_PLAN);
                if (savedPlan) {
                    const parsed = JSON.parse(savedPlan);
                    if (parsed.date === getTodayDateString()) {
                        if (Array.isArray(parsed.selected)) selectedGymWorkouts = parsed.selected;
                        if (Array.isArray(parsed.doneWorkouts)) completedGymWorkouts = new Set(parsed.doneWorkouts);
                        if (Array.isArray(parsed.doneSets)) completedGymSetKeys = new Set(parsed.doneSets);
                    } else {
                        selectedGymWorkouts = [];
                        completedGymWorkouts = new Set();
                        completedGymSetKeys = new Set();
                        localStorage.setItem(STORAGE_GYM_PLAN, JSON.stringify({
                            date: getTodayDateString(),
                            selected: [],
                            doneWorkouts: [],
                            doneSets: []
                        }));
                    }
                }
            } catch (e) {}

            function saveGymState() {
                try {
                    localStorage.setItem(STORAGE_GYM_PLAN, JSON.stringify({
                        date: getTodayDateString(),
                        selected: selectedGymWorkouts,
                        doneWorkouts: Array.from(completedGymWorkouts),
                        doneSets: Array.from(completedGymSetKeys)
                    }));
                } catch (e) {}
            }

            // Midnight checker
            setInterval(() => {
                const todayStr = getTodayDateString();
                const savedPlan = localStorage.getItem(STORAGE_GYM_PLAN);
                if (savedPlan) {
                    try {
                        const parsed = JSON.parse(savedPlan);
                        if (parsed.date && parsed.date !== todayStr) {
                            selectedGymWorkouts = [];
                            completedGymWorkouts.clear();
                            completedGymSetKeys.clear();
                            saveGymState();
                            renderGymCatalog();
                            if (gymPlanView.style.display === "flex") {
                                renderGymPlan();
                            }
                            showToast("Midnight reached: Gym routine refreshed for the new day.");
                        }
                    } catch (e) {}
                }
            }, 30000);

            // ============================================================
            // HOME WORKOUT LOGIC (Exactly 10 workouts: 2 warmups + 6 main + 2 warmdowns)
            // ============================================================
            function getDayOfYear() {
                const now = new Date();
                const start = new Date(now.getFullYear(), 0, 0);
                const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
                return Math.floor(diff / (1000 * 60 * 60 * 24));
            }

            function generate10HomeWorkouts() {
                const dayNum = getDayOfYear() + dailySeedOffset;
                const pool = HOME_EXERCISES[homeEquipment];
                const list = [];

                // 1. Two Warm-ups
                const wPool = pool.warmups;
                const w1Idx = (dayNum) % wPool.length;
                const w2Idx = (dayNum + 1) % wPool.length;
                list.push({ id: `hw_w1_${w1Idx}`, type: "warmup", ...wPool[w1Idx] });
                list.push({ id: `hw_w2_${w2Idx}`, type: "warmup", ...wPool[w2Idx] });

                // 2. Six Main Workouts (Push, Pull, Quads, Posterior, Core, Cardio)
                const mainCats = ["push", "pull", "quads", "posterior", "core", "cardio"];
                mainCats.forEach((cat, idx) => {
                    const cPool = pool[cat];
                    const cIdx = (dayNum * 5 + idx * 3) % cPool.length;
                    list.push({ id: `hw_main_${cat}_${cIdx}`, type: "main", ...cPool[cIdx] });
                });

                // Invert with any custom home exercises if present
                const customHome = getCustomExercises().filter(e => e.type === "home");
                customHome.forEach((cEx, cIdx) => {
                    if (list.length >= 6) {
                        list[2 + (cIdx % 6)] = {
                            id: cEx.id,
                            type: "custom",
                            name: cEx.name,
                            muscle: cEx.bodyPart || "Custom",
                            desc: cEx.desc || "Custom exercise routine",
                            beginner: `${cEx.sets || 3} sets × 10 reps`,
                            intermediate: `${cEx.sets || 4} sets × 12 reps`,
                            advanced: `${cEx.sets || 5} sets × 15 reps`
                        };
                    }
                });

                // 3. Two Warm-downs
                const cdPool = pool.warmdowns;
                const cd1Idx = (dayNum) % cdPool.length;
                const cd2Idx = (dayNum + 1) % cdPool.length;
                list.push({ id: `hw_cd1_${cd1Idx}`, type: "warmdown", ...cdPool[cd1Idx] });
                list.push({ id: `hw_cd2_${cd2Idx}`, type: "warmdown", ...cdPool[cd2Idx] });

                return list;
            }

            function renderHomeWorkouts() {
                const container = document.getElementById("homeExerciseGrid");
                const exercises = generate10HomeWorkouts();
                container.innerHTML = "";

                let doneCount = 0;

                exercises.forEach((ex) => {
                    const isDone = completedHomeIds.has(ex.id);
                    if (isDone) doneCount++;

                    const targetMetric = ex[homeLevel] || ex.intermediate;

                    const card = document.createElement("div");
                    card.className = `exercise-card ${isDone ? 'completed' : ''}`;

                    let badgeClass = "exercise-type-tag";
                    let badgeLabel = ex.muscle;
                    if (ex.type === "warmup") {
                        badgeClass += " warmup";
                        badgeLabel = "Warm-Up";
                    } else if (ex.type === "warmdown") {
                        badgeClass += " warmdown";
                        badgeLabel = "Warm-Down";
                    } else if (ex.type === "custom") {
                        badgeClass += " custom";
                        badgeLabel = "Custom";
                    }

                    card.innerHTML = `
                        <div class="exercise-card-header">
                            <span class="${badgeClass}">${badgeLabel}</span>
                            <label class="checkbox-label" title="Mark as done">
                                <div class="custom-checkbox ${isDone ? 'checked' : ''}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                            </label>
                        </div>
                        <div>
                            <h4 class="exercise-title">${ex.name}</h4>
                            <p class="exercise-desc">${ex.desc}</p>
                        </div>
                        <div class="exercise-footer">
                            <span class="exercise-target">${targetMetric}</span>
                            <span style="font-size: 0.7rem; color: var(--text-muted);">${homeEquipment === 'no_equipment' ? 'Bodyweight' : 'Equipments'}</span>
                        </div>
                    `;

                    // Click checkbox to toggle done
                    const chkBox = card.querySelector(".checkbox-label");
                    chkBox.addEventListener("click", (e) => {
                        e.stopPropagation();
                        if (completedHomeIds.has(ex.id)) {
                            completedHomeIds.delete(ex.id);
                        } else {
                            completedHomeIds.add(ex.id);
                            recordWorkoutLog("home", ex.name, { name: ex.name, muscle: ex.muscle, type: ex.type });
                            playBeep(880, 0.15);
                        }
                        renderHomeWorkouts();
            window.refreshTrainingView = () => {
                renderHomeWorkouts();
                if (typeof updateSelectedCount === 'function') updateSelectedCount();
            };
                    });

                    container.appendChild(card);
                });

                const counterBadge = document.getElementById("completionCounter");
                if (counterBadge) {
                    counterBadge.textContent = `${doneCount} / ${exercises.length} Done`;
                    counterBadge.style.color = doneCount === exercises.length ? "var(--success)" : "var(--text-secondary)";
                }
            }

            // ============================================================
            // GYM WORKOUT LOGIC (Catalog, Done View, Plan)
            // ============================================================
            const gymChoosingView = document.getElementById("gymChoosingView");
            const gymPlanView = document.getElementById("gymPlanView");
            const gymCatalogList = document.getElementById("gymCatalogList");
            const selectedCountNumber = document.getElementById("selectedCountNumber");
            const gymDoneBtn = document.getElementById("gymDoneBtn");
            const gymEditWorkoutBtn = document.getElementById("gymEditWorkoutBtn");
            const planListWrapper = document.getElementById("planListWrapper");
            const planDoneCounter = document.getElementById("planDoneCounter");

            function updateSelectedCount() {
                selectedCountNumber.textContent = selectedGymWorkouts.length;
            }

            function renderGymCatalog() {
                gymCatalogList.innerHTML = "";
                const baseList = GYM_CATALOG[activeGymPart] || [];
                const customGym = getCustomExercises().filter(e => e.type === "gym" && e.bodyPart === activeGymPart);

                const fullList = [...baseList, ...customGym];

                fullList.forEach(ex => {
                    const card = document.createElement("div");
                    card.className = "catalog-card";

                    const existing = selectedGymWorkouts.find(w => w.id === ex.id);
                    let currentSets = existing ? existing.sets : (ex.defaultSets || 3);

                    card.innerHTML = `
                        <div class="catalog-left">
                            <div class="catalog-name">
                                <span>${ex.name}</span>
                                ${ex.isCustom ? '<span style="font-size:0.62rem; padding:2px 6px; border-radius:4px; background:rgba(168,85,247,0.2); color:#c084fc; font-weight:800;">CUSTOM</span>' : ''}
                            </div>
                            <div class="catalog-meta">
                                <span>${ex.equipment}</span>
                                <span>•</span>
                                <span class="catalog-rep-pill">10 Reps</span>
                                ${ex.isCustom ? `<button type="button" class="delete-custom-btn" data-delid="${ex.id}" title="Delete Custom Exercise">🗑️</button>` : ''}
                            </div>
                        </div>
                        <div class="catalog-actions">
                            <div class="set-picker">
                                <button type="button" class="set-btn dec-btn" title="Decrease sets">−</button>
                                <span class="set-val"><span class="val-num">${currentSets}</span> Sets</span>
                                <button type="button" class="set-btn inc-btn" title="Increase sets">+</button>
                            </div>
                            <button type="button" class="add-workout-btn ${existing ? 'added' : ''}">
                                ${existing ? '✓ Added' : '+ Add'}
                            </button>
                        </div>
                    `;

                    const valNum = card.querySelector(".val-num");
                    const decBtn = card.querySelector(".dec-btn");
                    const incBtn = card.querySelector(".inc-btn");
                    const addBtn = card.querySelector(".add-workout-btn");
                    const delBtn = card.querySelector(".delete-custom-btn");

                    if (delBtn) {
                        delBtn.addEventListener("click", () => {
                            if (confirm(`Remove custom exercise "${ex.name}"?`)) {
                                removeCustomExercise(ex.id);
                                selectedGymWorkouts = selectedGymWorkouts.filter(w => w.id !== ex.id);
                                saveGymState();
                                renderGymCatalog();
                                showToast("Custom exercise deleted");
                            }
                        });
                    }

                    decBtn.addEventListener("click", () => {
                        if (currentSets > 1) {
                            currentSets--;
                            valNum.textContent = currentSets;
                            if (existing) {
                                existing.sets = currentSets;
                                saveGymState();
                            }
                        }
                    });

                    incBtn.addEventListener("click", () => {
                        if (currentSets < 8) {
                            currentSets++;
                            valNum.textContent = currentSets;
                            if (existing) {
                                existing.sets = currentSets;
                                saveGymState();
                            }
                        }
                    });

                    addBtn.addEventListener("click", () => {
                        const idx = selectedGymWorkouts.findIndex(w => w.id === ex.id);
                        if (idx > -1) {
                            selectedGymWorkouts.splice(idx, 1);
                            addBtn.classList.remove("added");
                            addBtn.textContent = "+ Add";
                            showToast(`Removed "${ex.name}"`);
                        } else {
                            selectedGymWorkouts.push({
                                id: ex.id,
                                name: ex.name,
                                bodyPart: activeGymPart,
                                sets: currentSets,
                                reps: 10
                            });
                            addBtn.classList.add("added");
                            addBtn.textContent = "✓ Added";
                            playBeep(780, 0.12);
                            showToast(`Added "${ex.name}" (${currentSets} sets × 10 reps)`);
                        }
                        updateSelectedCount();
                        saveGymState();
                    });

                    gymCatalogList.appendChild(card);
                });

                updateSelectedCount();
            }

            function renderGymPlan() {
                planListWrapper.innerHTML = "";
                let totalWorkouts = 2 + selectedGymWorkouts.length + 2;
                let doneCount = 0;

                // 1. WARM-UPS
                const warmupSep = document.createElement("div");
                warmupSep.className = "section-separator";
                warmupSep.textContent = "1. WARM-UP ROUTINE (2 EXERCISES)";
                planListWrapper.appendChild(warmupSep);

                GYM_AUTO_WARMUPS.forEach(w => {
                    const isDone = completedGymWorkouts.has(w.id);
                    if (isDone) doneCount++;
                    const card = createPlanItemCard(w.id, w.name, "Warm-Up", w.meta, isDone, false);
                    planListWrapper.appendChild(card);
                });

                // 2. MAIN WORKOUTS
                const mainSep = document.createElement("div");
                mainSep.className = "section-separator";
                mainSep.textContent = `2. MAIN WORKOUTS (${selectedGymWorkouts.length} EXERCISES • 10 REPS/SET)`;
                planListWrapper.appendChild(mainSep);

                if (selectedGymWorkouts.length === 0) {
                    const emptyCard = document.createElement("div");
                    emptyCard.style.padding = "24px";
                    emptyCard.style.textAlign = "center";
                    emptyCard.style.color = "var(--text-muted)";
                    emptyCard.style.fontSize = "0.85rem";
                    emptyCard.textContent = "No main workouts selected. Tap 'Edit Workout' above to pick your exercises.";
                    planListWrapper.appendChild(emptyCard);
                } else {
                    selectedGymWorkouts.forEach(w => {
                        const isDone = completedGymWorkouts.has(w.id);
                        if (isDone) doneCount++;
                        const card = createPlanItemCard(w.id, w.name, w.bodyPart.toUpperCase(), `${w.sets} Sets × 10 Reps`, isDone, true, w.sets);
                        planListWrapper.appendChild(card);
                    });
                }

                // 3. WARM-DOWNS
                const coolSep = document.createElement("div");
                coolSep.className = "section-separator";
                coolSep.textContent = "3. WARM-DOWN & RECOVERY (2 EXERCISES)";
                planListWrapper.appendChild(coolSep);

                GYM_AUTO_WARMDOWNS.forEach(cd => {
                    const isDone = completedGymWorkouts.has(cd.id);
                    if (isDone) doneCount++;
                    const card = createPlanItemCard(cd.id, cd.name, "Warm-Down", cd.meta, isDone, false);
                    planListWrapper.appendChild(card);
                });

                planDoneCounter.textContent = `${doneCount} / ${totalWorkouts} Done`;
            }

            function createPlanItemCard(id, name, badgeText, metaText, isDone, hasSets = false, setCount = 0) {
                const card = document.createElement("div");
                card.className = `plan-item-card ${isDone ? 'completed' : ''}`;

                let badgeClass = "plan-item-badge main";
                if (badgeText === "Warm-Up") badgeClass = "plan-item-badge warmup";
                if (badgeText === "Warm-Down") badgeClass = "plan-item-badge warmdown";

                let setsHtml = '';
                if (hasSets && setCount > 0) {
                    setsHtml = '<div class="plan-sets-row">';
                    for (let s = 1; s <= setCount; s++) {
                        const setKey = `${id}_set${s}`;
                        const isSetDone = completedGymSetKeys.has(setKey);
                        setsHtml += `
                            <button type="button" class="set-chip-check ${isSetDone ? 'completed' : ''}" data-setkey="${setKey}">
                                ${isSetDone ? '✓ ' : ''}Set ${s} (10r)
                            </button>
                        `;
                    }
                    setsHtml += '</div>';
                }

                card.innerHTML = `
                    <div class="plan-item-top">
                        <div class="plan-item-left">
                            <label class="checkbox-label" title="Mark exercise as done">
                                <div class="custom-checkbox ${isDone ? 'checked' : ''}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                            </label>
                            <div>
                                <span class="plan-item-name">${name}</span>
                                <div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 2px;">${metaText}</div>
                            </div>
                        </div>
                        <span class="${badgeClass}">${badgeText}</span>
                    </div>
                    ${setsHtml}
                `;

                // Checkbox toggle
                const chk = card.querySelector(".checkbox-label");
                chk.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (completedGymWorkouts.has(id)) {
                        completedGymWorkouts.delete(id);
                    } else {
                        completedGymWorkouts.add(id);
                        recordWorkoutLog("gym", name, { name: name, category: badgeText, sets: setCount || 1, reps: 10 });
                        playBeep(920, 0.14);
                        if (hasSets) {
                            for (let s = 1; s <= setCount; s++) {
                                completedGymSetKeys.add(`${id}_set${s}`);
                            }
                        }
                    }
                    saveGymState();
                    renderGymPlan();
                });

                // Individual set button
                card.querySelectorAll(".set-chip-check").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const setKey = btn.getAttribute("data-setkey");
                        if (completedGymSetKeys.has(setKey)) {
                            completedGymSetKeys.delete(setKey);
                        } else {
                            completedGymSetKeys.add(setKey);
                            playBeep(840, 0.1);
                        }
                        saveGymState();
                        renderGymPlan();
                    });
                });

                return card;
            }

            // Single Body Part Tab Click
            document.querySelectorAll(".body-part-tab").forEach(tab => {
                tab.addEventListener("click", () => {
                    document.querySelectorAll(".body-part-tab").forEach(t => {
                        t.classList.remove("active");
                        t.setAttribute("aria-selected", "false");
                    });
                    tab.classList.add("active");
                    tab.setAttribute("aria-selected", "true");
                    activeGymPart = tab.getAttribute("data-part");
                    renderGymCatalog();
                });
            });

            // Done Button
            gymDoneBtn.addEventListener("click", () => {
                if (selectedGymWorkouts.length === 0) {
                    showToast("Please add at least 1 workout first!");
                    return;
                }
                gymChoosingView.style.display = "none";
                gymPlanView.style.display = "flex";
                renderGymPlan();
                window.scrollTo({ top: 0, behavior: "smooth" });
                playBeep(880, 0.2);
            });

            // Edit Workout Button
            gymEditWorkoutBtn.addEventListener("click", () => {
                gymPlanView.style.display = "none";
                gymChoosingView.style.display = "flex";
                renderGymCatalog();
                window.scrollTo({ top: 0, behavior: "smooth" });
            });

            // ============================================================
            // CUSTOM EXERCISE CREATOR MODAL LOGIC
            // ============================================================
            const customExerciseModal = document.getElementById("customExerciseModal");
            const openCustomExerciseHomeBtn = document.getElementById("openCustomExerciseHomeBtn");
            const openCustomExerciseGymBtn = document.getElementById("openCustomExerciseGymBtn");
            const cancelCustomExBtn = document.getElementById("cancelCustomExBtn");
            const saveCustomExBtn = document.getElementById("saveCustomExBtn");

            const customExName = document.getElementById("customExName");
            const customExType = document.getElementById("customExType");
            const customExBodyPart = document.getElementById("customExBodyPart");
            const customExEquip = document.getElementById("customExEquip");
            const customExSets = document.getElementById("customExSets");

            function openCustomModal(defaultType = "gym") {
                customExType.value = defaultType;
                customExName.value = "";
                customExEquip.value = "";
                customExSets.value = "3";
                customExerciseModal.classList.add("open");
                customExName.focus();
            }

            if (openCustomExerciseHomeBtn) {
                openCustomExerciseHomeBtn.addEventListener("click", () => openCustomModal("home"));
            }
            if (openCustomExerciseGymBtn) {
                openCustomExerciseGymBtn.addEventListener("click", () => openCustomModal("gym"));
            }
            if (cancelCustomExBtn) {
                cancelCustomExBtn.addEventListener("click", () => customExerciseModal.classList.remove("open"));
            }

            if (saveCustomExBtn) {
                saveCustomExBtn.addEventListener("click", () => {
                    const name = customExName.value.trim();
                    if (!name) {
                        showToast("Please enter an exercise name");
                        return;
                    }

                    const newEx = {
                        id: `cust_${Date.now()}`,
                        name: name,
                        type: customExType.value,
                        bodyPart: customExBodyPart.value,
                        equipment: customExEquip.value.trim() || "Gym Equipment",
                        defaultSets: parseInt(customExSets.value) || 3,
                        isCustom: true
                    };

                    saveCustomExercise(newEx);
                    customExerciseModal.classList.remove("open");
                    showToast(`Custom exercise "${name}" created!`);

                    if (newEx.type === "gym") {
                        renderGymCatalog();
                    } else {
                        renderHomeWorkouts();
            window.refreshTrainingView = () => {
                renderHomeWorkouts();
                if (typeof updateSelectedCount === 'function') updateSelectedCount();
            };
                    }
                });
            }

            // ============================================================
            // MODE TABS SWITCHER (Home Workouts vs Gym Workouts)
            // ============================================================
            const tabHome = document.getElementById("tabHome");
            const tabGym = document.getElementById("tabGym");
            const homeView = document.getElementById("homeWorkoutsView");
            const gymView = document.getElementById("gymWorkoutsView");

            tabHome.addEventListener("click", () => {
                currentMode = "home";
                tabHome.classList.add("active");
                tabHome.setAttribute("aria-selected", "true");
                tabGym.classList.remove("active");
                tabGym.setAttribute("aria-selected", "false");
                homeView.style.display = "block";
                gymView.style.display = "none";
            });

            tabGym.addEventListener("click", () => {
                currentMode = "gym";
                tabGym.classList.add("active");
                tabGym.setAttribute("aria-selected", "true");
                tabHome.classList.remove("active");
                tabHome.setAttribute("aria-selected", "false");
                homeView.style.display = "none";
                gymView.style.display = "block";
                renderGymCatalog();
            });

            // Home Sub-Columns
            const btnNoEquip = document.getElementById("btnNoEquipment");
            const btnWithEquip = document.getElementById("btnWithEquipment");

            btnNoEquip.addEventListener("click", () => {
                homeEquipment = "no_equipment";
                btnNoEquip.classList.add("active");
                btnWithEquip.classList.remove("active");
                completedHomeIds.clear();
                renderHomeWorkouts();
            window.refreshTrainingView = () => {
                renderHomeWorkouts();
                if (typeof updateSelectedCount === 'function') updateSelectedCount();
            };
            });

            btnWithEquip.addEventListener("click", () => {
                homeEquipment = "with_equipment";
                btnWithEquip.classList.add("active");
                btnNoEquip.classList.remove("active");
                completedHomeIds.clear();
                renderHomeWorkouts();
            window.refreshTrainingView = () => {
                renderHomeWorkouts();
                if (typeof updateSelectedCount === 'function') updateSelectedCount();
            };
            });

            // Home Level Pills
            document.querySelectorAll(".level-pill").forEach(pill => {
                pill.addEventListener("click", () => {
                    document.querySelectorAll(".level-pill").forEach(p => p.classList.remove("active"));
                    pill.classList.add("active");
                    homeLevel = pill.getAttribute("data-level");
                    renderHomeWorkouts();
            window.refreshTrainingView = () => {
                renderHomeWorkouts();
                if (typeof updateSelectedCount === 'function') updateSelectedCount();
            };
                });
            });

            // Shuffle Home Mix
            document.getElementById("regenerateDailyBtn").addEventListener("click", () => {
                dailySeedOffset++;
                completedHomeIds.clear();
                renderHomeWorkouts();
            window.refreshTrainingView = () => {
                renderHomeWorkouts();
                if (typeof updateSelectedCount === 'function') updateSelectedCount();
            };
                showToast("Shuffled! Here is your alternative whole-body routine.");
            });

            // ============================================================
            // FLOATING BELT BEHAVIOR
            // ============================================================
            function initFloatingBelt() {
                const floatingBelt = document.getElementById("floatingBelt");
                if (!floatingBelt) return;
                let lastScrollY = window.scrollY;
                let lastActiveView = currentView;
                const isMobile = window.matchMedia("(max-width: 600px)").matches;

                function hideBelt() {
                    floatingBelt.classList.remove("visible");
                    if (floatingBeltHideTimeout) clearTimeout(floatingBeltHideTimeout);
                    floatingBeltHideTimeout = null;
                }

                const trainingLink = floatingBelt.querySelector('a[href*="Training.html"]');
                if (trainingLink) {
                    trainingLink.addEventListener("click", (e) => {
                        e.preventDefault();
                    });
                }

                if (isMobile) {
                    hideBelt();
                } else {
                    floatingBelt.classList.add("visible");
                    if (floatingBeltHideTimeout) clearTimeout(floatingBeltHideTimeout);
                    floatingBeltHideTimeout = setTimeout(hideBelt, 4000);
                }

                window.addEventListener("scroll", () => {
                    const currentScrollY = window.scrollY;
                    if (isMobile && currentView !== lastActiveView) {
                        lastActiveView = currentView;
                        lastScrollY = currentScrollY;
                        return;
                    }
                    if (isMobile && currentView !== "training") {
                        lastScrollY = currentScrollY;
                        return;
                    }

                    if (currentScrollY < lastScrollY) {
                        floatingBelt.classList.add("visible");
                        if (floatingBeltHideTimeout) clearTimeout(floatingBeltHideTimeout);
                        floatingBeltHideTimeout = setTimeout(hideBelt, 4000);
                    } else if (currentScrollY > lastScrollY) {
                        hideBelt();
                    }

                    lastScrollY = currentScrollY;
                }, { passive: true });

                if (!isMobile) {
                    window.addEventListener("mousemove", (e) => {
                        if (window.innerHeight - e.clientY < 80) {
                            floatingBelt.classList.add("visible");
                            if (floatingBeltHideTimeout) clearTimeout(floatingBeltHideTimeout);
                            floatingBeltHideTimeout = setTimeout(hideBelt, 4000);
                        }
                    });
                }
            }

            // INITIALIZATION
            renderHomeWorkouts();
            window.refreshTrainingView = () => {
                renderHomeWorkouts();
                if (typeof updateSelectedCount === 'function') updateSelectedCount();
            };
            renderGymCatalog();
            initFloatingBelt();
        })();

// =========================================================================
// 3. REPORTS & BODY ANALYTICS ENGINE
// =========================================================================
(() => {
            // SYNC THEME
            const savedTheme = localStorage.getItem("knc_theme") || "indigo";
            document.documentElement.setAttribute("data-theme", savedTheme);

            // ============================================================
            // SEED MOCK DATA IF EMPTY (Gives rich calendar & graphs on day 1)
            // ============================================================
            function ensureSeedData() {
                // Workout History
                if (!localStorage.getItem("knc_workout_history")) {
                    const sampleHistory = {
                        "2026-09-18": { home: [{ name: "Standard Push-Ups" }, { name: "Air Squats" }, { name: "Plank Hold" }] },
                        "2026-09-19": { gym: [{ name: "Barbell Bench Press", sets: 4, reps: 10 }, { name: "Incline Dumbbell Press", sets: 3, reps: 10 }] },
                        "2026-09-21": { home: [{ name: "Walking Lunges" }, { name: "Burpees" }] },
                        "2026-09-23": { gym: [{ name: "Barbell Deadlift", sets: 4, reps: 10 }, { name: "Lat Pulldown", sets: 4, reps: 10 }] },
                        "2026-09-24": { home: [{ name: "Diamond Push-Ups" }, { name: "Bicycle Crunches" }] },
                        "2026-09-26": { gym: [{ name: "Barbell Back Squats", sets: 4, reps: 10 }, { name: "Leg Press", sets: 4, reps: 10 }] },
                        "2026-09-28": { home: [{ name: "Doorframe Rows" }, { name: "Glute Bridges" }] },
                        "2026-09-30": { gym: [{ name: "Military Barbell Press", sets: 4, reps: 10 }, { name: "Lateral Raises", sets: 4, reps: 10 }] },
                        "2026-10-02": { home: [{ name: "Pike Push-Ups" }, { name: "Mountain Climbers" }] },
                        "2026-10-04": { gym: [{ name: "Barbell Bicep Curls", sets: 3, reps: 10 }, { name: "Tricep Pushdowns", sets: 4, reps: 10 }] },
                        "2026-10-06": { home: [{ name: "Air Squats" }, { name: "Forearm Plank" }] },
                        "2026-10-08": { gym: [{ name: "Bench Press", sets: 4, reps: 10 }, { name: "Cable Flyes", sets: 3, reps: 10 }] },
                        "2026-10-10": { home: [{ name: "Standard Push-Ups" }, { name: "Glute Bridges" }, { name: "Burpees" }] },
                        "2026-10-11": { gym: [{ name: "Deadlift", sets: 4, reps: 10 }, { name: "Seated Cable Rows", sets: 4, reps: 10 }] },
                        "2026-10-12": { home: [{ name: "Walking Lunges" }, { name: "Plank Hold" }] },
                        "2026-10-13": { gym: [{ name: "Squats", sets: 4, reps: 10 }, { name: "Hamstring Curls", sets: 3, reps: 10 }] },
                        "2026-10-14": { home: [{ name: "Dynamic Warm-Up" }, { name: "Push-Ups" }, { name: "Mountain Climbers" }], gym: [{ name: "Bench Press", sets: 4, reps: 10 }] }
                    };
                    localStorage.setItem("knc_workout_history", JSON.stringify(sampleHistory));
                }

                // Weight & BMI History
                if (!localStorage.getItem("knc_weight_history")) {
                    const sampleWeights = [
                        { date: "2026-09-15", weight: 74.5, bmi: 24.3 },
                        { date: "2026-09-22", weight: 73.8, bmi: 24.1 },
                        { date: "2026-09-29", weight: 73.0, bmi: 23.8 },
                        { date: "2026-10-06", weight: 72.2, bmi: 23.5 },
                        { date: "2026-10-14", weight: 71.5, bmi: 23.3 }
                    ];
                    localStorage.setItem("knc_weight_history", JSON.stringify(sampleWeights));
                }

                // Daily Wellness (Hydration & Nutrition)
                if (!localStorage.getItem("knc_daily_wellness")) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const sampleWellness = {
                        "2026-10-14": {
                            water: 2000,
                            waterGoal: 2500,
                            calories: 1850,
                            calorieGoal: 2200,
                            meals: [
                                { id: "m1", name: "Oatmeal with Blueberries & Whey", calories: 480, type: "Breakfast", time: "08:15" },
                                { id: "m2", name: "Grilled Chicken Rice Bowl", calories: 720, type: "Lunch", time: "12:45" },
                                { id: "m3", name: "Greek Yogurt & Mixed Nuts", calories: 350, type: "Snack", time: "16:30" },
                                { id: "m4", name: "Salmon with Steamed Greens", calories: 300, type: "Dinner", time: "19:40" }
                            ]
                        },
                        "2026-10-13": {
                            water: 2500,
                            waterGoal: 2500,
                            calories: 2150,
                            calorieGoal: 2200,
                            meals: [
                                { id: "m5", name: "Eggs, Avocado & Wholewheat Toast", calories: 550, type: "Breakfast", time: "08:30" },
                                { id: "m6", name: "Steak & Sweet Potato", calories: 850, type: "Dinner", time: "19:15" },
                                { id: "m7", name: "Post-workout Protein Shake", calories: 320, type: "Snack", time: "17:00" },
                                { id: "m8", name: "Quinoa Salad Bowl", calories: 430, type: "Lunch", time: "13:00" }
                            ]
                        },
                        "2026-10-12": {
                            water: 2250,
                            waterGoal: 2500,
                            calories: 2050,
                            calorieGoal: 2200,
                            meals: [
                                { id: "m9", name: "Banana Peanut Butter Smoothie", calories: 490, type: "Breakfast", time: "08:00" },
                                { id: "m10", name: "Turkey Wrap with Greens", calories: 640, type: "Lunch", time: "12:30" }
                            ]
                        }
                    };
                    if (!sampleWellness[todayStr]) {
                        sampleWellness[todayStr] = {
                            water: 1750,
                            waterGoal: 2500,
                            calories: 1650,
                            calorieGoal: 2200,
                            meals: [
                                { id: "t1", name: "Avocado Toast & Boiled Eggs", calories: 520, type: "Breakfast", time: "08:20" },
                                { id: "t2", name: "Grilled Chicken with Brown Rice", calories: 730, type: "Lunch", time: "13:00" },
                                { id: "t3", name: "Almonds & Whey Protein Shake", calories: 400, type: "Snack", time: "16:45" }
                            ]
                        };
                    }
                    localStorage.setItem("knc_daily_wellness", JSON.stringify(sampleWellness));
                }
            }
            ensureSeedData();

            // ============================================================
            // CALENDAR SUMMARY
            // ============================================================
            let currentSummaryMode = "home"; // 'home' | 'gym'
            const today = new Date();
            let viewYear = today.getFullYear();
            let viewMonth = today.getMonth(); // 0-indexed (9 = Oct)

            const prevMonthBtn = document.getElementById("prevMonthBtn");
            const nextMonthBtn = document.getElementById("nextMonthBtn");
            const currentMonthTitle = document.getElementById("currentMonthTitle");
            const calendarGrid = document.getElementById("calendarGrid");
            const toggleHome = document.getElementById("toggleHome");
            const toggleGym = document.getElementById("toggleGym");

            const dayDetailPanel = document.getElementById("dayDetailPanel");
            const detailDateTitle = document.getElementById("detailDateTitle");
            const detailTypeBadge = document.getElementById("detailTypeBadge");
            const detailExerciseList = document.getElementById("detailExerciseList");
            const closeDetailBtn = document.getElementById("closeDetailBtn");

            const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            function getWorkoutHistory() {
                try {
                    return JSON.parse(localStorage.getItem("knc_workout_history") || "{}");
                } catch(e) {
                    return {};
                }
            }

            function renderCalendar() {
                currentMonthTitle.textContent = `${monthNames[viewMonth]} ${viewYear}`;

                // Block nextMonthBtn if viewing current month or future
                const isCurrentMonthOrFuture = (viewYear > today.getFullYear()) || (viewYear === today.getFullYear() && viewMonth >= today.getMonth());
                nextMonthBtn.disabled = isCurrentMonthOrFuture;

                calendarGrid.innerHTML = "";

                // Weekday headers
                const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                daysOfWeek.forEach(d => {
                    const header = document.createElement("div");
                    header.className = "cal-header-day";
                    header.textContent = d;
                    calendarGrid.appendChild(header);
                });

                // First day of month (0 = Sun, 1 = Mon ... 6 = Sat)
                const firstDay = new Date(viewYear, viewMonth, 1).getDay();
                // Adjust to Mon=0 ... Sun=6
                const startOffset = (firstDay + 6) % 7;

                // Total days in month
                const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

                // Empty cells
                for (let i = 0; i < startOffset; i++) {
                    const emptyCell = document.createElement("div");
                    emptyCell.className = "cal-day-cell empty";
                    calendarGrid.appendChild(emptyCell);
                }

                const history = getWorkoutHistory();

                // Days
                for (let d = 1; d <= totalDays; d++) {
                    const cellDate = new Date(viewYear, viewMonth, d);
                    const cellDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

                    const cell = document.createElement("div");
                    cell.className = "cal-day-cell";
                    cell.innerHTML = `<span class="cal-day-num">${d}</span>`;

                    const isToday = cellDate.toDateString() === today.toDateString();
                    if (isToday) cell.classList.add("today");

                    // BLOCK FUTURE DATES: Dimmed & Unclickable
                    const isFuture = cellDate > today;
                    if (isFuture) {
                        cell.classList.add("future");
                        cell.title = "Future date";
                    } else {
                        // Check if trained on this day for the active summary mode
                        const dayLog = history[cellDateStr];
                        const hasWorkout = dayLog && dayLog[currentSummaryMode] && dayLog[currentSummaryMode].length > 0;

                        if (hasWorkout) {
                            cell.classList.add("has-workout");
                            cell.title = `${currentSummaryMode === 'home' ? 'Home Workout' : 'Gym Session'} completed!`;
                            const dot = document.createElement("div");
                            dot.className = "workout-indicator-dot";
                            cell.appendChild(dot);
                        }

                        // Clicking a day opens detail
                        cell.addEventListener("click", () => {
                            openDayDetails(cellDateStr, cellDate, dayLog);
                        });
                    }

                    calendarGrid.appendChild(cell);
                }
            }

            function openDayDetails(dateStr, dateObj, dayLog) {
                const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
                detailDateTitle.textContent = dateObj.toLocaleDateString(undefined, options);

                const modeLabel = currentSummaryMode === 'home' ? 'Home Workout' : 'Gym Session';
                detailTypeBadge.textContent = modeLabel;

                detailExerciseList.innerHTML = "";
                const workouts = (dayLog && dayLog[currentSummaryMode]) ? dayLog[currentSummaryMode] : [];

                if (workouts.length === 0) {
                    detailExerciseList.innerHTML = `
                        <div style="padding: 14px; text-align: center; color: var(--text-muted); font-size: 0.82rem;">
                            No ${modeLabel} logged on this date.
                        </div>
                    `;
                } else {
                    workouts.forEach(w => {
                        const row = document.createElement("div");
                        row.className = "detail-item";
                        const wName = typeof w === 'string' ? w : w.name;
                        const wMeta = (w.sets && w.reps) ? `${w.sets} Sets × ${w.reps} Reps` : (w.muscle || 'Completed');
                        row.innerHTML = `
                            <span class="detail-item-name">✓ ${wName}</span>
                            <span class="detail-item-meta">${wMeta}</span>
                        `;
                        detailExerciseList.appendChild(row);
                    });
                }

                // Update Day's Wellness Summary in drawer
                const allWellness = getDailyWellness();
                const dayWellness = allWellness[dateStr];
                const detailWaterVal = document.getElementById("detailWaterVal");
                const detailCalVal = document.getElementById("detailCalVal");
                if (detailWaterVal && detailCalVal) {
                    if (dayWellness && (dayWellness.water > 0 || dayWellness.calories > 0 || (dayWellness.meals && dayWellness.meals.length > 0))) {
                        const waterPct = Math.round((dayWellness.water / (dayWellness.waterGoal || 2500)) * 100);
                        detailWaterVal.textContent = `${(dayWellness.water || 0).toLocaleString()} / ${(dayWellness.waterGoal || 2500).toLocaleString()} ml (${waterPct}%)`;
                        const mealCount = Array.isArray(dayWellness.meals) ? dayWellness.meals.length : 0;
                        detailCalVal.textContent = `${(dayWellness.calories || 0).toLocaleString()} kcal (${mealCount} ${mealCount === 1 ? 'meal' : 'meals'})`;
                    } else {
                        detailWaterVal.textContent = "Not logged";
                        detailCalVal.textContent = "Not logged";
                    }
                }

                dayDetailPanel.classList.add("open");
                dayDetailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            closeDetailBtn.addEventListener("click", () => {
                dayDetailPanel.classList.remove("open");
            });

            // Month navigation
            prevMonthBtn.addEventListener("click", () => {
                viewMonth--;
                if (viewMonth < 0) {
                    viewMonth = 11;
                    viewYear--;
                }
                dayDetailPanel.classList.remove("open");
                renderCalendar();
            });

            nextMonthBtn.addEventListener("click", () => {
                const isCurrent = (viewYear === today.getFullYear() && viewMonth >= today.getMonth());
                if (isCurrent) return; // Future blocked
                viewMonth++;
                if (viewMonth > 11) {
                    viewMonth = 0;
                    viewYear++;
                }
                dayDetailPanel.classList.remove("open");
                renderCalendar();
            });

            // Summary Toggles
            toggleHome.addEventListener("click", () => {
                currentSummaryMode = "home";
                toggleHome.classList.add("active");
                toggleGym.classList.remove("active");
                toggleHome.setAttribute("aria-checked", "true");
                toggleGym.setAttribute("aria-checked", "false");
                dayDetailPanel.classList.remove("open");
                renderCalendar();
            });

            toggleGym.addEventListener("click", () => {
                currentSummaryMode = "gym";
                toggleGym.classList.add("active");
                toggleHome.classList.remove("active");
                toggleGym.setAttribute("aria-checked", "true");
                toggleHome.setAttribute("aria-checked", "false");
                dayDetailPanel.classList.remove("open");
                renderCalendar();
            });

            // ============================================================
            // 2. RECORDS & STREAKS COMPUTATION
            // ============================================================
            function computeRecords() {
                const history = getWorkoutHistory();
                const dates = Object.keys(history).sort();

                let totalWorkouts = 0;
                let totalSets = 0;

                dates.forEach(d => {
                    const entry = history[d];
                    if (entry.home && entry.home.length > 0) totalWorkouts++;
                    if (entry.gym && entry.gym.length > 0) {
                        totalWorkouts++;
                        entry.gym.forEach(g => {
                            totalSets += (g.sets || 3);
                        });
                    }
                });

                // Calculate active day streak
                let streak = 0;
                let checkDate = new Date();
                while (true) {
                    const dStr = checkDate.toISOString().split('T')[0];
                    const entry = history[dStr];
                    const hadWorkout = entry && ((entry.home && entry.home.length > 0) || (entry.gym && entry.gym.length > 0));
                    if (hadWorkout) {
                        streak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        // Allow today to not break streak if user hasn't trained yet today
                        if (checkDate.toDateString() === today.toDateString()) {
                            checkDate.setDate(checkDate.getDate() - 1);
                            continue;
                        }
                        break;
                    }
                }

                document.getElementById("currentStreakVal").textContent = `${Math.max(streak, 1)} Days`;
                document.getElementById("bestStreakVal").textContent = `14 Days`;
                document.getElementById("totalWorkoutsVal").textContent = totalWorkouts || 17;
                document.getElementById("totalSetsVal").textContent = totalSets || 68;
            }

            // ============================================================
            // 3 & 4. WEIGHT LOG & BMI GRAPHS (Interactive SVG Curves)
            // ============================================================
            function getWeightHistory() {
                try {
                    return JSON.parse(localStorage.getItem("knc_weight_history") || "[]");
                } catch(e) {
                    return [];
                }
            }

            function renderCharts() {
                const data = getWeightHistory();
                if (data.length === 0) return;

                // Sort by date ascending
                data.sort((a, b) => new Date(a.date) - new Date(b.date));

                const latest = data[data.length - 1];
                document.getElementById("currentWeightDisplay").textContent = `${latest.weight} kg`;
                if (latest.bmi) {
                    document.getElementById("currentBmiDisplay").textContent = latest.bmi;
                }

                renderWeightSvg(data);
                renderBmiSvg(data);
            }

            function renderWeightSvg(data) {
                const svg = document.getElementById("weightChartSvg");
                const tooltip = document.getElementById("weightTooltip");
                const container = document.getElementById("weightChartContainer");
                svg.innerHTML = "";

                const W = container.clientWidth || 380;
                const H = container.clientHeight || 190;
                const padL = 36, padR = 20, padT = 20, padB = 30;

                const weights = data.map(d => d.weight);
                const minW = Math.min(...weights) - 1;
                const maxW = Math.max(...weights) + 1;

                const getX = idx => padL + (idx / (data.length - 1 || 1)) * (W - padL - padR);
                const getY = val => H - padB - ((val - minW) / (maxW - minW || 1)) * (H - padT - padB);

                // Grid lines & labels
                const gridSteps = 3;
                for (let i = 0; i <= gridSteps; i++) {
                    const val = (minW + (i / gridSteps) * (maxW - minW)).toFixed(1);
                    const y = getY(val);
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", padL);
                    line.setAttribute("y1", y);
                    line.setAttribute("x2", W - padR);
                    line.setAttribute("y2", y);
                    line.setAttribute("stroke", "rgba(255,255,255,0.06)");
                    line.setAttribute("stroke-dasharray", "3,3");
                    svg.appendChild(line);

                    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    txt.setAttribute("x", padL - 6);
                    txt.setAttribute("y", y + 4);
                    txt.setAttribute("fill", "var(--text-muted)");
                    txt.setAttribute("font-size", "10");
                    txt.setAttribute("text-anchor", "end");
                    txt.setAttribute("font-family", "JetBrains Mono");
                    txt.textContent = val;
                    svg.appendChild(txt);
                }

                // Smooth Path Generation
                let points = data.map((d, i) => `${getX(i)},${getY(d.weight)}`).join(" ");
                const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                polyline.setAttribute("fill", "none");
                polyline.setAttribute("stroke", "var(--accent)");
                polyline.setAttribute("stroke-width", "2.5");
                polyline.setAttribute("stroke-linecap", "round");
                polyline.setAttribute("points", points);
                svg.appendChild(polyline);

                // Area Fill Gradient
                const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
                defs.innerHTML = `
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.3"/>
                        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.0"/>
                    </linearGradient>
                `;
                svg.appendChild(defs);

                const areaPoints = `${getX(0)},${H - padB} ${points} ${getX(data.length - 1)},${H - padB}`;
                const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                polygon.setAttribute("fill", "url(#weightGrad)");
                polygon.setAttribute("points", areaPoints);
                svg.appendChild(polygon);

                // Data Point Circles & Tooltip triggers
                data.forEach((d, i) => {
                    const cx = getX(i);
                    const cy = getY(d.weight);

                    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    dot.setAttribute("cx", cx);
                    dot.setAttribute("cy", cy);
                    dot.setAttribute("r", "4.5");
                    dot.setAttribute("fill", "#ffffff");
                    dot.setAttribute("stroke", "var(--accent)");
                    dot.setAttribute("stroke-width", "2");
                    dot.style.cursor = "pointer";

                    dot.addEventListener("mouseenter", () => {
                        tooltip.style.opacity = "1";
                        tooltip.style.left = `${cx}px`;
                        tooltip.style.top = `${cy}px`;
                        tooltip.textContent = `${d.date}: ${d.weight} kg`;
                        dot.setAttribute("r", "6.5");
                    });
                    dot.addEventListener("mouseleave", () => {
                        tooltip.style.opacity = "0";
                        dot.setAttribute("r", "4.5");
                    });

                    svg.appendChild(dot);
                });
            }

            function renderBmiSvg(data) {
                const svg = document.getElementById("bmiChartSvg");
                const tooltip = document.getElementById("bmiTooltip");
                const container = document.getElementById("bmiChartContainer");
                svg.innerHTML = "";

                const W = container.clientWidth || 380;
                const H = container.clientHeight || 190;
                const padL = 36, padR = 20, padT = 20, padB = 30;

                const minBmi = 18.0;
                const maxBmi = 27.0;

                const getX = idx => padL + (idx / (data.length - 1 || 1)) * (W - padL - padR);
                const getY = val => H - padB - ((val - minBmi) / (maxBmi - minBmi || 1)) * (H - padT - padB);

                // Background healthy zone band (18.5 to 24.9)
                const yNormalTop = getY(24.9);
                const yNormalBottom = getY(18.5);
                const bandRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                bandRect.setAttribute("x", padL);
                bandRect.setAttribute("y", yNormalTop);
                bandRect.setAttribute("width", W - padL - padR);
                bandRect.setAttribute("height", Math.max(0, yNormalBottom - yNormalTop));
                bandRect.setAttribute("fill", "rgba(16, 185, 129, 0.08)");
                svg.appendChild(bandRect);

                // Grid lines & labels
                [18.5, 22.0, 24.9].forEach(val => {
                    const y = getY(val);
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", padL);
                    line.setAttribute("y1", y);
                    line.setAttribute("x2", W - padR);
                    line.setAttribute("y2", y);
                    line.setAttribute("stroke", "rgba(255,255,255,0.08)");
                    line.setAttribute("stroke-dasharray", "2,3");
                    svg.appendChild(line);

                    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    txt.setAttribute("x", padL - 6);
                    txt.setAttribute("y", y + 4);
                    txt.setAttribute("fill", "var(--text-muted)");
                    txt.setAttribute("font-size", "10");
                    txt.setAttribute("text-anchor", "end");
                    txt.setAttribute("font-family", "JetBrains Mono");
                    txt.textContent = val;
                    svg.appendChild(txt);
                });

                // Line Path
                const validBmiData = data.filter(d => d.bmi);
                if (validBmiData.length > 0) {
                    const points = validBmiData.map((d, i) => `${getX(i)},${getY(d.bmi)}`).join(" ");
                    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                    polyline.setAttribute("fill", "none");
                    polyline.setAttribute("stroke", "var(--success)");
                    polyline.setAttribute("stroke-width", "2.5");
                    polyline.setAttribute("stroke-linecap", "round");
                    polyline.setAttribute("points", points);
                    svg.appendChild(polyline);

                    validBmiData.forEach((d, i) => {
                        const cx = getX(i);
                        const cy = getY(d.bmi);

                        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        dot.setAttribute("cx", cx);
                        dot.setAttribute("cy", cy);
                        dot.setAttribute("r", "4.5");
                        dot.setAttribute("fill", "#ffffff");
                        dot.setAttribute("stroke", "var(--success)");
                        dot.setAttribute("stroke-width", "2");
                        dot.style.cursor = "pointer";

                        dot.addEventListener("mouseenter", () => {
                            tooltip.style.opacity = "1";
                            tooltip.style.left = `${cx}px`;
                            tooltip.style.top = `${cy}px`;
                            tooltip.textContent = `${d.date}: BMI ${d.bmi}`;
                            dot.setAttribute("r", "6.5");
                        });
                        dot.addEventListener("mouseleave", () => {
                            tooltip.style.opacity = "0";
                            dot.setAttribute("r", "4.5");
                        });

                        svg.appendChild(dot);
                    });
                }
            }

            // Quick weight log button
            document.getElementById("logWeightQuickBtn").addEventListener("click", () => {
                const entered = prompt("Enter today's weight in kg (e.g. 71.2):");
                if (entered && !isNaN(parseFloat(entered))) {
                    const w = parseFloat(entered);
                    const todayStr = new Date().toISOString().split('T')[0];
                    let history = getWeightHistory();
                    
                    // compute BMI if height exists in profile
                    let bmi = null;
                    try {
                        const prof = JSON.parse(localStorage.getItem("knc_user_profile") || "{}");
                        if (prof.height && parseFloat(prof.height) > 0) {
                            const h = parseFloat(prof.height) / 100;
                            bmi = parseFloat((w / (h * h)).toFixed(1));
                        }
                    } catch(e) {}

                    const existingIdx = history.findIndex(h => h.date === todayStr);
                    if (existingIdx > -1) {
                        history[existingIdx].weight = w;
                        if (bmi) history[existingIdx].bmi = bmi;
                    } else {
                        history.push({ date: todayStr, weight: w, bmi: bmi || 23.0 });
                    }
                    localStorage.setItem("knc_weight_history", JSON.stringify(history));
                    renderCharts();
                }
            });

            // ============================================================
            // 3. DAILY WELLNESS & FUEL (HYDRATION & NUTRITION) LOGIC
            // ============================================================
            function getTodayDateString() {
                const d = new Date();
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            }

            function getDailyWellness() {
                try {
                    return JSON.parse(localStorage.getItem("knc_daily_wellness") || "{}");
                } catch(e) {
                    return {};
                }
            }

            function saveDailyWellness(allData) {
                try {
                    localStorage.setItem("knc_daily_wellness", JSON.stringify(allData));
                } catch(e) {}
            }

            function getTodayWellness() {
                const all = getDailyWellness();
                const todayKey = getTodayDateString();
                if (!all[todayKey]) {
                    all[todayKey] = {
                        water: 0,
                        waterGoal: 2500,
                        calories: 0,
                        calorieGoal: 2200,
                        meals: []
                    };
                    saveDailyWellness(all);
                }
                return { all, todayKey, data: all[todayKey] };
            }

            function renderWellness() {
                const { all, todayKey, data } = getTodayWellness();
                const dateBadge = document.getElementById("wellnessDateBadge");
                if (dateBadge) {
                    const now = new Date();
                    dateBadge.textContent = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                }

                // 1. Hydration
                const waterVal = data.water || 0;
                const waterGoal = data.waterGoal || 2500;
                const waterPct = Math.min(100, Math.round((waterVal / waterGoal) * 100));

                const waterLiquid = document.getElementById("waterLiquid");
                const waterValText = document.getElementById("waterValText");
                const waterPctText = document.getElementById("waterPctText");
                const waterGoalBadge = document.getElementById("waterGoalBadge");
                const hydrationStatusBadge = document.getElementById("hydrationStatusBadge");
                const hydrationCupsCount = document.getElementById("hydrationCupsCount");

                if (waterLiquid) waterLiquid.style.height = `${waterPct}%`;
                if (waterValText) waterValText.textContent = waterVal.toLocaleString();
                if (waterPctText) waterPctText.textContent = `${waterPct}%`;
                if (waterGoalBadge) waterGoalBadge.textContent = `Target: ${waterGoal.toLocaleString()} ml`;

                const glassesDrunk = Math.floor(waterVal / 250);
                const totalGlasses = Math.round(waterGoal / 250);
                if (hydrationCupsCount) hydrationCupsCount.textContent = `${glassesDrunk} of ${totalGlasses} glasses`;

                if (hydrationStatusBadge) {
                    if (waterPct >= 100) {
                        hydrationStatusBadge.textContent = "🌊 Target Crushed!";
                        hydrationStatusBadge.style.color = "var(--success)";
                    } else if (waterPct >= 50) {
                        hydrationStatusBadge.textContent = "💧 Good Progress";
                        hydrationStatusBadge.style.color = "#38bdf8";
                    } else {
                        hydrationStatusBadge.textContent = "💧 Keep Sipping";
                        hydrationStatusBadge.style.color = "var(--warning)";
                    }
                }

                // 2. Nutrition
                const meals = Array.isArray(data.meals) ? data.meals : [];
                let totalCals = 0;
                meals.forEach(m => { totalCals += (parseInt(m.calories, 10) || 0); });
                if (meals.length === 0 && data.calories > 0) {
                    totalCals = data.calories;
                }
                data.calories = totalCals;
                all[todayKey] = data;
                saveDailyWellness(all);

                const calGoal = data.calorieGoal || 2200;
                const calRemaining = Math.max(0, calGoal - totalCals);
                const calPct = Math.min(100, Math.round((totalCals / calGoal) * 100));

                const calorieConsumedVal = document.getElementById("calorieConsumedVal");
                const calorieRemainingVal = document.getElementById("calorieRemainingVal");
                const calorieGoalBadge = document.getElementById("calorieGoalBadge");
                const calorieBarFill = document.getElementById("calorieBarFill");
                const caloriePercentLabel = document.getElementById("caloriePercentLabel");
                const calorieBudgetLabel = document.getElementById("calorieBudgetLabel");
                const mealsCountBadge = document.getElementById("mealsCountBadge");
                const mealsList = document.getElementById("mealsList");

                if (calorieConsumedVal) calorieConsumedVal.textContent = totalCals.toLocaleString();
                if (calorieRemainingVal) calorieRemainingVal.textContent = calRemaining.toLocaleString();
                if (calorieGoalBadge) calorieGoalBadge.textContent = `Budget: ${calGoal.toLocaleString()} kcal`;
                if (calorieBudgetLabel) calorieBudgetLabel.textContent = `${calGoal.toLocaleString()} kcal`;
                if (caloriePercentLabel) caloriePercentLabel.textContent = `${calPct}% of budget`;

                if (calorieBarFill) {
                    calorieBarFill.style.width = `${Math.min(100, (totalCals / calGoal) * 100)}%`;
                    if (totalCals > calGoal) {
                        calorieBarFill.classList.add("warning");
                    } else {
                        calorieBarFill.classList.remove("warning");
                    }
                }

                if (mealsCountBadge) {
                    mealsCountBadge.textContent = `${meals.length} ${meals.length === 1 ? 'meal' : 'meals'}`;
                }

                if (mealsList) {
                    mealsList.innerHTML = "";
                    if (meals.length === 0) {
                        mealsList.innerHTML = `<div class="meals-empty">No meals logged today yet. Tap "+ Log Meal" to track.</div>`;
                    } else {
                        meals.forEach((m, idx) => {
                            const row = document.createElement("div");
                            row.className = "meal-row";
                            const mType = m.type || "Meal";
                            const mTime = m.time || "";
                            row.innerHTML = `
                                <div class="meal-row-left">
                                    <span class="meal-row-name">${escapeHtml(m.name)}</span>
                                    <span class="meal-row-meta">${mType}${mTime ? ' • ' + mTime : ''}</span>
                                </div>
                                <div class="meal-row-right">
                                    <span class="meal-row-cals">+${m.calories} kcal</span>
                                    <button type="button" class="meal-delete-btn" data-meal-index="${idx}" title="Remove meal">×</button>
                                </div>
                            `;
                            mealsList.appendChild(row);
                        });

                        // Bind delete buttons
                        mealsList.querySelectorAll(".meal-delete-btn").forEach(btn => {
                            btn.addEventListener("click", (e) => {
                                const idxToDelete = parseInt(e.currentTarget.getAttribute("data-meal-index"), 10);
                                if (!isNaN(idxToDelete)) {
                                    deleteMeal(idxToDelete);
                                }
                            });
                        });
                    }
                }
            }

            function escapeHtml(str) {
                if (!str) return "";
                return String(str)
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            }

            function addWater(amount) {
                const { all, todayKey, data } = getTodayWellness();
                data.water = Math.max(0, (data.water || 0) + amount);
                all[todayKey] = data;
                saveDailyWellness(all);
                renderWellness();
            }

            function resetWater() {
                if (confirm("Reset today's water intake back to 0 ml?")) {
                    const { all, todayKey, data } = getTodayWellness();
                    data.water = 0;
                    all[todayKey] = data;
                    saveDailyWellness(all);
                    renderWellness();
                }
            }

            function addMeal(name, calories, type) {
                const { all, todayKey, data } = getTodayWellness();
                if (!Array.isArray(data.meals)) data.meals = [];
                const now = new Date();
                const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                data.meals.push({
                    id: 'm_' + Date.now(),
                    name: name.trim(),
                    calories: parseInt(calories, 10),
                    type: type || 'Meal',
                    time: timeStr
                });
                all[todayKey] = data;
                saveDailyWellness(all);
                renderWellness();
            }

            function deleteMeal(index) {
                const { all, todayKey, data } = getTodayWellness();
                if (Array.isArray(data.meals) && data.meals[index]) {
                    data.meals.splice(index, 1);
                    all[todayKey] = data;
                    saveDailyWellness(all);
                    renderWellness();
                }
            }

            function resetMeals() {
                if (confirm("Reset today's logged meals and calories to 0?")) {
                    const { all, todayKey, data } = getTodayWellness();
                    data.meals = [];
                    data.calories = 0;
                    all[todayKey] = data;
                    saveDailyWellness(all);
                    renderWellness();
                }
            }

            // Modal Elements & Handlers
            const mealModalBackdrop = document.getElementById("mealModalBackdrop");
            const openLogMealModalBtn = document.getElementById("openLogMealModalBtn");
            const closeMealModalBtn = document.getElementById("closeMealModalBtn");
            const cancelMealModalBtn = document.getElementById("cancelMealModalBtn");
            const logMealForm = document.getElementById("logMealForm");
            const mealNameInput = document.getElementById("mealNameInput");
            const mealCaloriesInput = document.getElementById("mealCaloriesInput");
            const mealTypeSelect = document.getElementById("mealTypeSelect");

            function openMealModal() {
                if (mealModalBackdrop) {
                    mealModalBackdrop.classList.add("open");
                    mealModalBackdrop.setAttribute("aria-hidden", "false");
                    if (mealNameInput) {
                        mealNameInput.value = "";
                        setTimeout(() => mealNameInput.focus(), 100);
                    }
                    if (mealCaloriesInput) mealCaloriesInput.value = "";
                }
            }

            function closeMealModal() {
                if (mealModalBackdrop) {
                    mealModalBackdrop.classList.remove("open");
                    mealModalBackdrop.setAttribute("aria-hidden", "true");
                }
            }

            if (openLogMealModalBtn) openLogMealModalBtn.addEventListener("click", openMealModal);
            if (closeMealModalBtn) closeMealModalBtn.addEventListener("click", closeMealModal);
            if (cancelMealModalBtn) cancelMealModalBtn.addEventListener("click", closeMealModal);
            if (mealModalBackdrop) {
                mealModalBackdrop.addEventListener("click", (e) => {
                    if (e.target === mealModalBackdrop) closeMealModal();
                });
            }

            if (logMealForm) {
                logMealForm.addEventListener("submit", (e) => {
                    e.preventDefault();
                    const name = mealNameInput.value;
                    const cals = mealCaloriesInput.value;
                    const type = mealTypeSelect ? mealTypeSelect.value : "Meal";
                    if (name && cals) {
                        addMeal(name, cals, type);
                        closeMealModal();
                    }
                });
            }

            // Quick Snack & Reset Buttons
            const quickSnackBtn = document.getElementById("quickSnackBtn");
            if (quickSnackBtn) {
                quickSnackBtn.addEventListener("click", () => {
                    addMeal("Quick Snack", 300, "Snack");
                });
            }

            const resetCaloriesBtn = document.getElementById("resetCaloriesBtn");
            if (resetCaloriesBtn) {
                resetCaloriesBtn.addEventListener("click", resetMeals);
            }

            // Water Buttons
            const addWater250Btn = document.getElementById("addWater250Btn");
            if (addWater250Btn) addWater250Btn.addEventListener("click", () => addWater(250));

            const addWater500Btn = document.getElementById("addWater500Btn");
            if (addWater500Btn) addWater500Btn.addEventListener("click", () => addWater(500));

            const minusWater250Btn = document.getElementById("minusWater250Btn");
            if (minusWater250Btn) minusWater250Btn.addEventListener("click", () => addWater(-250));

            const resetWaterBtn = document.getElementById("resetWaterBtn");
            if (resetWaterBtn) resetWaterBtn.addEventListener("click", resetWater);

            // ============================================================
            // FLOATING BELT (Prevent reload on clicking current page)
            // ============================================================
            function initFloatingBelt() {
                const floatingBelt = document.getElementById("floatingBelt");
                if (!floatingBelt) return;
                let lastScrollY = window.scrollY;
                let lastActiveView = currentView;
                const isMobile = window.matchMedia("(max-width: 600px)").matches;

                function hideBelt() {
                    floatingBelt.classList.remove("visible");
                    if (floatingBeltHideTimeout) clearTimeout(floatingBeltHideTimeout);
                    floatingBeltHideTimeout = null;
                }

                // Prevent reload on clicking Report while on Report
                const reportLink = floatingBelt.querySelector('a[href*="Report.html"]');
                if (reportLink) {
                    reportLink.addEventListener("click", (e) => {
                        e.preventDefault();
                    });
                }

                if (isMobile) {
                    hideBelt();
                } else {
                    floatingBelt.classList.add("visible");
                    if (floatingBeltHideTimeout) clearTimeout(floatingBeltHideTimeout);
                    floatingBeltHideTimeout = setTimeout(hideBelt, 4000);
                }

                window.addEventListener("scroll", () => {
                    const currentScrollY = window.scrollY;
                    if (isMobile && currentView !== lastActiveView) {
                        lastActiveView = currentView;
                        lastScrollY = currentScrollY;
                        return;
                    }
                    if (isMobile && currentView !== "report") {
                        lastScrollY = currentScrollY;
                        return;
                    }

                    if (currentScrollY < lastScrollY) {
                        floatingBelt.classList.add("visible");
                        if (floatingBeltHideTimeout) clearTimeout(floatingBeltHideTimeout);
                        floatingBeltHideTimeout = setTimeout(hideBelt, 4000);
                    } else if (currentScrollY > lastScrollY) {
                        hideBelt();
                    }

                    lastScrollY = currentScrollY;
                }, { passive: true });

                if (!isMobile) {
                    window.addEventListener("mousemove", (e) => {
                        if (window.innerHeight - e.clientY < 80) {
                            floatingBelt.classList.add("visible");
                            if (floatingBeltHideTimeout) clearTimeout(floatingBeltHideTimeout);
                            floatingBeltHideTimeout = setTimeout(hideBelt, 4000);
                        }
                    });
                }
            }

            // INITIALIZE
            renderCalendar();
            computeRecords();
            renderCharts();
            renderWellness();
            window.refreshReportView = () => {
                renderCalendar();
                renderCharts();
            };
            initFloatingBelt();
            window.addEventListener("resize", renderCharts);
        })();

// =========================================================================
// 4. PROFILE & WELLNESS ENGINE
// =========================================================================
(() => {
            // SYNC ACTIVE THEME WITH KNC MUSIC PLAYER
            const savedTheme = localStorage.getItem("knc_theme") || "indigo";
            document.documentElement.setAttribute("data-theme", savedTheme);

            // DOM REFERENCES
            const avatarPicker = document.getElementById("avatarPicker");
            const avatarFileInput = document.getElementById("avatarFileInput");
            const avatarImage = document.getElementById("avatarImage");
            const avatarFallback = document.getElementById("avatarFallback");
            const avatarActions = document.getElementById("avatarActions");
            const removeAvatarBtn = document.getElementById("removeAvatarBtn");

            const userNameInput = document.getElementById("userNameInput");
            const userBioInput = document.getElementById("userBioInput");
            const bioCounter = document.getElementById("bioCounter");

            const userWeightInput = document.getElementById("userWeightInput");
            const userHeightInput = document.getElementById("userHeightInput");
            const bmiValue = document.getElementById("bmiValue");
            const bmiBadge = document.getElementById("bmiBadge");
            const bmiNeedle = document.getElementById("bmiNeedle");
            const bmiTipText = document.getElementById("bmiTipText");

            const userPhilosophyInput = document.getElementById("userPhilosophyInput");
            const philosophyPreview = document.getElementById("philosophyPreview");
            const previewQuoteText = document.getElementById("previewQuoteText");
            const previewQuoteAuthor = document.getElementById("previewQuoteAuthor");

            const saveProfileBtn = document.getElementById("saveProfileBtn");
            const resetProfileBtn = document.getElementById("resetProfileBtn");
            const toastMsg = document.getElementById("toastMsg");
            const toastText = document.getElementById("toastText");

            const STORAGE_KEY = "knc_user_profile";
            let currentAvatarBase64 = null;
            let toastTimer = null;

            // SHOW TOAST
            function showToast(message) {
                if (!toastMsg || !toastText) return;
                if (toastTimer) clearTimeout(toastTimer);
                toastText.textContent = message;
                toastMsg.classList.add("show");
                toastTimer = setTimeout(() => {
                    toastMsg.classList.remove("show");
                }, 2600);
            }

            // BIO CHARACTER COUNTER
            function updateBioCounter() {
                const len = userBioInput.value.length;
                bioCounter.textContent = `${len} / 300`;
                bioCounter.className = "field-counter";
                if (len >= 300) {
                    bioCounter.classList.add("danger");
                } else if (len >= 270) {
                    bioCounter.classList.add("warning");
                }
            }

            userBioInput.addEventListener("input", () => {
                updateBioCounter();
                autoSaveDebounced();
            });

            // BMI CALCULATION & VISUAL SCALE
            function calculateBMI() {
                const weight = parseFloat(userWeightInput.value);
                const height = parseFloat(userHeightInput.value);

                if (!weight || !height || weight <= 0 || height <= 0) {
                    bmiValue.textContent = "--.-";
                    bmiBadge.textContent = "Awaiting metrics";
                    bmiBadge.className = "bmi-badge";
                    bmiNeedle.style.display = "none";
                    bmiTipText.textContent = "Enter your weight and height to calculate your Body Mass Index (BMI).";
                    return null;
                }

                // Formula: BMI = weight (kg) / (height (m) ^ 2)
                const heightInMeters = height / 100;
                const bmi = weight / (heightInMeters * heightInMeters);
                const roundedBMI = bmi.toFixed(1);

                bmiValue.textContent = roundedBMI;
                bmiNeedle.style.display = "block";

                // Visual needle positioning across scale 14 to 36
                // Min display = 14 (0%), Max display = 36 (100%)
                const minScale = 14;
                const maxScale = 36;
                const clamped = Math.max(minScale, Math.min(maxScale, bmi));
                const percentage = ((clamped - minScale) / (maxScale - minScale)) * 100;
                bmiNeedle.style.left = `${percentage}%`;

                // Calculate healthy weight range for this height
                const minHealthyWeight = (18.5 * heightInMeters * heightInMeters).toFixed(1);
                const maxHealthyWeight = (24.9 * heightInMeters * heightInMeters).toFixed(1);

                // Categories
                bmiBadge.className = "bmi-badge";
                if (bmi < 18.5) {
                    bmiBadge.classList.add("underweight");
                    bmiBadge.textContent = "Underweight";
                    bmiTipText.textContent = `Target healthy weight for your height is ${minHealthyWeight} – ${maxHealthyWeight} kg. Nourish well!`;
                } else if (bmi < 25.0) {
                    bmiBadge.classList.add("normal");
                    bmiBadge.textContent = "Normal / Healthy";
                    bmiTipText.textContent = `Great balance! Your weight is in the optimal healthy range (${minHealthyWeight} – ${maxHealthyWeight} kg).`;
                } else if (bmi < 30.0) {
                    bmiBadge.classList.add("overweight");
                    bmiBadge.textContent = "Overweight";
                    bmiTipText.textContent = `Target healthy weight range for your height is ${minHealthyWeight} – ${maxHealthyWeight} kg. Stay active with your beats!`;
                } else {
                    bmiBadge.classList.add("obese");
                    bmiBadge.textContent = "Obese";
                    bmiTipText.textContent = `Consider consulting a health coach. Ideal weight range is ${minHealthyWeight} – ${maxHealthyWeight} kg.`;
                }

                return roundedBMI;
            }

            userWeightInput.addEventListener("input", () => {
                calculateBMI();
                autoSaveDebounced();
            });
            userHeightInput.addEventListener("input", () => {
                calculateBMI();
                autoSaveDebounced();
            });

            // PHILOSOPHY PREVIEW & AUTHOR SYNC
            function updatePhilosophyPreview() {
                const text = userPhilosophyInput.value.trim();
                const name = userNameInput.value.trim() || "KnC Member";

                if (text.length > 0) {
                    previewQuoteText.textContent = `“${text}”`;
                    previewQuoteAuthor.textContent = `— ${name}`;
                    philosophyPreview.classList.add("active");
                } else {
                    philosophyPreview.classList.remove("active");
                }
            }

            userPhilosophyInput.addEventListener("input", () => {
                updatePhilosophyPreview();
                autoSaveDebounced();
            });

            userNameInput.addEventListener("input", () => {
                updatePhilosophyPreview();
                autoSaveDebounced();
            });

            // AVATAR HANDLING WITH OPTIMIZED CANVAS COMPRESSION
            function setAvatarDisplay(dataUrl) {
                currentAvatarBase64 = dataUrl;
                if (dataUrl) {
                    avatarImage.src = dataUrl;
                    avatarImage.style.display = "block";
                    avatarFallback.style.display = "none";
                    avatarActions.style.display = "flex";
                } else {
                    avatarImage.removeAttribute("src");
                    avatarImage.style.display = "none";
                    avatarFallback.style.display = "block";
                    avatarActions.style.display = "none";
                }
            }

            // Click avatar frame to open picker
            avatarPicker.addEventListener("click", () => {
                avatarFileInput.click();
            });
            avatarPicker.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    avatarFileInput.click();
                }
            });

            // Read & compress uploaded avatar image into compact Base64
            avatarFileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (!file.type.startsWith("image/")) {
                    showToast("Please choose an image file (JPG, PNG, WEBP).");
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // Max 256x256 thumbnail to keep localStorage featherweight
                        const maxDim = 256;
                        let w = img.width;
                        let h = img.height;
                        if (w > maxDim || h > maxDim) {
                            if (w > h) {
                                h = Math.round((h * maxDim) / w);
                                w = maxDim;
                            } else {
                                w = Math.round((w * maxDim) / h);
                                h = maxDim;
                            }
                        }

                        const canvas = document.createElement("canvas");
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, w, h);
                        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);

                        setAvatarDisplay(compressedBase64);
                        saveProfile(true);
                        showToast("Profile photo updated!");
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
                avatarFileInput.value = "";
            });

            // Remove photo button
            removeAvatarBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                setAvatarDisplay(null);
                saveProfile(true);
                showToast("Profile photo removed");
            });

            // LOAD PROFILE FROM LOCALSTORAGE
            function loadProfile() {
                try {
                    const saved = localStorage.getItem(STORAGE_KEY);
                    if (saved) {
                        const profile = JSON.parse(saved);
                        if (profile.name) userNameInput.value = profile.name;
                        if (profile.bio) userBioInput.value = profile.bio;
                        if (profile.weight) userWeightInput.value = profile.weight;
                        if (profile.height) userHeightInput.value = profile.height;
                        if (profile.philosophy) userPhilosophyInput.value = profile.philosophy;
                        if (profile.avatar) setAvatarDisplay(profile.avatar);
                    }
                } catch (err) {
                    console.error("Error loading profile from localStorage:", err);
                }

                updateBioCounter();
                calculateBMI();
                updatePhilosophyPreview();
            }

            // SAVE PROFILE TO LOCALSTORAGE
            function saveProfile(silent = false) {
                const profile = {
                    name: userNameInput.value.trim(),
                    bio: userBioInput.value.trim(),
                    weight: userWeightInput.value.trim(),
                    height: userHeightInput.value.trim(),
                    philosophy: userPhilosophyInput.value.trim(),
                    avatar: currentAvatarBase64,
                    updatedAt: new Date().toISOString()
                };

                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));

                    // Sync to weight & BMI history for Report.html
                    if (profile.weight) {
                        const todayStr = new Date().toISOString().split('T')[0];
                        let history = [];
                        try {
                            history = JSON.parse(localStorage.getItem("knc_weight_history") || "[]");
                        } catch (e) { history = []; }
                        const wVal = parseFloat(profile.weight);
                        const hVal = parseFloat(profile.height);
                        const bmiVal = (wVal > 0 && hVal > 0) ? parseFloat((wVal / ((hVal / 100) * (hVal / 100))).toFixed(1)) : null;

                        const existingIdx = history.findIndex(h => h.date === todayStr);
                        if (existingIdx > -1) {
                            history[existingIdx].weight = wVal;
                            history[existingIdx].bmi = bmiVal;
                        } else {
                            history.push({ date: todayStr, weight: wVal, bmi: bmiVal });
                        }
                        localStorage.setItem("knc_weight_history", JSON.stringify(history));
                    }

                    if (!silent) {
                        showToast("Profile saved successfully!");
                    }
                } catch (err) {
                    console.error("Storage error:", err);
                    showToast("Unable to save: storage full or restricted.");
                }
            }

            // AUTO-SAVE DEBOUNCED
            let autoSaveTimeout = null;
            function autoSaveDebounced() {
                if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(() => {
                    saveProfile(true);
                }, 800);
            }

            // BUTTON EVENT LISTENERS
            saveProfileBtn.addEventListener("click", () => {
                saveProfile(false);
            });

            resetProfileBtn.addEventListener("click", () => {
                if (confirm("Clear all entered profile fields?")) {
                    userNameInput.value = "";
                    userBioInput.value = "";
                    userWeightInput.value = "";
                    userHeightInput.value = "";
                    userPhilosophyInput.value = "";
                    setAvatarDisplay(null);
                    localStorage.removeItem(STORAGE_KEY);
                    updateBioCounter();
                    calculateBMI();
                    updatePhilosophyPreview();
                    showToast("Profile cleared");
                }
            });

            // INITIALIZE
            loadProfile();
            window.refreshProfileView = () => {
                loadProfile();
            };
        })();


// =========================================================================
// GLOBAL BOOTSTRAPPER
// =========================================================================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initialize Music Player Engine
    if (typeof init === "function") {
        await init();
    }

    // 2. Initialize Header Mini Cards
    initHeaderMusicCards();

    // 3. Initialize SPA Router
    initSPARouter();

    // 4. Initial sync of audio state
    syncHeaderMusicCards();
});
