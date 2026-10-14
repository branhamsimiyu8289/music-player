(() => {
    const homePage = new URL("index.html", window.location.href);
    const currentDirectory = window.location.pathname.slice(0, window.location.pathname.lastIndexOf("/") + 1);
    const previousPagePath = sessionStorage.getItem("knc_previous_page");
    sessionStorage.removeItem("knc_previous_page");
    const backButton = document.querySelector(".page-back-button");
    let navigatingBack = false;

    function hasLocalPreviousPage() {
        if (window.history.length <= 2) return false;

        if (previousPagePath && previousPagePath.startsWith(currentDirectory)) return true;
        if (!document.referrer) return false;

        const previousPage = new URL(document.referrer);
        return previousPage.protocol === window.location.protocol && previousPage.pathname.startsWith(currentDirectory);
    }

    function goBack(fromPopState = false) {
        if (hasLocalPreviousPage()) {
            navigatingBack = true;
            window.history.go(fromPopState ? -1 : -2);
            return;
        }

        window.location.replace(homePage.href);
    }

    if (backButton) {
        window.history.pushState({ pageBackFallback: true }, "", window.location.href);
        window.addEventListener("popstate", () => {
            if (navigatingBack) return;
            goBack(true);
        });
        backButton.addEventListener("click", goBack);
    }

    document.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");
        if (!link || link.target === "_blank") return;

        const destination = new URL(link.href, window.location.href);
        if (destination.protocol === window.location.protocol && destination.pathname.startsWith(currentDirectory)) {
            sessionStorage.setItem("knc_previous_page", window.location.pathname);
        }
    });
})();
