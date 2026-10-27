(() => {
    const STORAGE_KEY = "knc_audio_state";
    const CLOSED_KEY = "knc_music_card_closed";
    const card = document.getElementById("headerMusicCard");

    if (!card) return;

    const title = document.getElementById("hmTitle");
    const playButton = document.getElementById("hmPlayBtn");
    const nextButton = document.getElementById("hmNextBtn");
    const closeButton = document.getElementById("hmCloseBtn");

    function getSavedState() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        } catch (error) {
            console.warn("Unable to read music player state:", error);
            return null;
        }
    }

    function updateCard() {
        const state = getSavedState();
        const isPlaying = !!(state && state.isPlaying);
        const songName = state && state.name ? state.name : "KnC Music";
        card.classList.toggle("is-playing", isPlaying);
        card.classList.toggle("hm-hidden", sessionStorage.getItem(CLOSED_KEY) === "true");
        title.textContent = songName;
        title.title = songName;
    }

    function openPlayer(action) {
        const destination = new URL("index.html", window.location.href);
        destination.searchParams.set("musicAction", action);
        window.location.assign(destination.href);
    }

    playButton.addEventListener("click", () => {
        const state = getSavedState();
        openPlayer(state && state.isPlaying ? "pause" : "play");
    });
    nextButton.addEventListener("click", () => openPlayer("next"));

    closeButton.addEventListener("click", () => {
        sessionStorage.setItem(CLOSED_KEY, "true");
        card.classList.add("hm-hidden");
    });

    window.addEventListener("storage", event => {
        if (event.key === STORAGE_KEY) updateCard();
    });
    window.addEventListener("focus", updateCard);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") updateCard();
    });

    updateCard();
})();
