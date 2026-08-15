/* =========================================
   //GAME PLATFORM STEP 2 APP CORE
========================================= */

"use strict";


/* =========================================
   STATE
========================================= */

const AppState = {

    // ទាញយក Balance ចាស់ពី Storage (បើគ្មាន យក 10000)
    balance: parseInt(localStorage.getItem("app_balance")) || 10000,

    currentPage: "home",

    initialized: false

};


/* =========================================
   GAME PATHS CONFIG (កំណត់ផ្លូវ File ហ្គេម)
========================================= */
const GAME_ROUTES = {
    "classic-slots": "games/slots/index.html",
    "classic": "games/slots/index.html",
    "fruit-slots": "games/fruits/index.html",
    "fruit": "games/fruits/index.html",
    "fruits": "games/fruits/index.html"
};

/* =========================================
   DOM
========================================= */

const DOM = {

    balance:
        document.getElementById("balance"),

    toast:
        document.getElementById("toast"),

    toastMessage:
        document.getElementById("toastMessage"),

    toastIcon:
        document.getElementById("toastIcon"),

    notificationBadge:
        document.getElementById(
            "notificationBadge"
        ),

    navItems:
        document.querySelectorAll(
            ".nav-item"
        ),

    gameCards:
        document.querySelectorAll(
            ".game-card"
        ),

    quickCards:
        document.querySelectorAll(
            ".quick-card"
        ),

    categoryCards:
        document.querySelectorAll(
            ".category-card"
        )

};

/* =========================================
   FORMAT NUMBER
========================================= */

function formatNumber(value) {

    return new Intl.NumberFormat(
        "en-US"
    ).format(value);

}


/* =========================================
   BALANCE
========================================= */

function updateBalance() {

    if (!DOM.balance) {
        return;
    }

    // រក្សាទុក Balance ក្នុង LocalStorage
    localStorage.setItem("app_balance", AppState.balance);

    DOM.balance.textContent =
        formatNumber(
            AppState.balance
        );

    // បញ្ជូន Event ទៅ EventBus ប្រសិនបើមាន
    if (typeof window.eventBus !== "undefined") {
        window.eventBus.emit("balanceUpdated", AppState.balance);
    }

}


/* =========================================
   TOAST
========================================= */

let toastTimer = null;


function showToast(
    message,
    icon = "✓"
) {

    if (
        !DOM.toast ||
        !DOM.toastMessage
    ) {
        return;
    }


    DOM.toastMessage.textContent =
        message;


    if (DOM.toastIcon) {

        DOM.toastIcon.textContent =
            icon;

    }


    DOM.toast.classList.add(
        "show"
    );


    clearTimeout(toastTimer);


    toastTimer = setTimeout(() => {

        DOM.toast.classList.remove(
            "show"
        );

    }, 2200);

}


/* =========================================
   LAUNCH GAME HELPER (មុខងារបើកហ្គេម)
========================================= */

function launchGame(gameId) {

    const targetUrl = GAME_ROUTES[gameId];

    if (targetUrl) {
        showToast("កំពុងបើកហ្គេម...", "🎰");
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 500);
    } else {
        showToast(
            `ហ្គេម ${(gameId || "").toUpperCase()} នឹងបន្ថែមនៅ STEP បន្ទាប់`,
            "🎮"
        );
    }

}


/* =========================================
   NAVIGATION
========================================= */

function setActivePage(page) {

    AppState.currentPage =
        page;


    /* Update Nav Items Active Class */
    if (DOM.navItems) {

        DOM.navItems.forEach(
            item => {

                item.classList.toggle(
                    "active",
                    item.dataset.page === page
                );

            }
        );

    }


    /* Get All Page Sections */
    const pages =
        document.querySelectorAll(
            "[data-page-view]"
        );


    /* Hide All Pages & Show Only Selected Page */
    pages.forEach(
        pageSection => {

            if (
                pageSection.dataset.pageView === page
            ) {

                pageSection.style.display =
                    "block";

            } else {

                pageSection.style.display =
                    "none";

            }

        }
    );


    /*
     * GAMES CATALOG RENDER LOGIC
     */

    if (page === "games") {

        if (
            typeof GameCatalog !==
            "undefined"
        ) {

            if (
                GameCatalog.games &&
                GameCatalog.games.length === 0
            ) {

                GameCatalog.init();

            } else if (typeof GameCatalog.render === "function") {

                GameCatalog.render();

            }

        }

    }


    /* Reset Scroll Position to Top */
    window.scrollTo(0, 0);


    console.log(
        "Current page switched to:",
        page
    );

}


/* =========================================
   NAVIGATION EVENTS
========================================= */

if (DOM.navItems) {

    DOM.navItems.forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    const page =
                        item.dataset.page;


                    setActivePage(page);


                    /* Alert for upcoming features */
                    if (
                        page === "wallet" ||
                        page === "profile"
                    ) {

                        showToast(
                            `ទំព័រ ${page.toUpperCase()} នឹងបន្ថែមនៅ STEP បន្ទាប់`,
                            "🚧"
                        );

                    }

                }
            );

        }
    );

}


/* =========================================
   GAME CARDS CLICK EVENTS
========================================= */

if (DOM.gameCards) {

    DOM.gameCards.forEach(
        card => {

            card.addEventListener(
                "click",
                event => {

                    const game =
                        card.dataset.game;


                    /*
                     * Prevent duplicate action
                     * when Play button is clicked.
                     */

                    if (
                        event.target.closest(
                            ".play-button"
                        )
                    ) {

                        event.stopPropagation();
                        return;

                    }


                    console.log(
                        "Game selected:",
                        game
                    );

                    launchGame(game);

                }
            );

        }
    );

}

/* =========================================
   PLAY BUTTONS
========================================= */

document.addEventListener("click", event => {

    const playBtn = event.target.closest(".play-button");

    if (playBtn) {

        event.stopPropagation();

        const card = playBtn.closest("[data-game]");
        const gameId = card ? card.dataset.game : "classic-slots";

        launchGame(gameId);

    }

});


/* =========================================
   QUICK GAME
========================================= */

if (DOM.quickCards) {

    DOM.quickCards.forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    const game =
                        card.dataset.game;

                    launchGame(game);

                }
            );

        }
    );

}


/* =========================================
   CATEGORY
========================================= */

if (DOM.categoryCards) {

    DOM.categoryCards.forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    const category =
                        card.dataset.category;


                    /*
                     * ផ្លាស់ប្តូរទៅកាន់ទំព័រ Games Catalog ស្វ័យប្រវត្តិ
                     */
                    if (
                        typeof setActivePage === "function"
                    ) {

                        setActivePage("games");

                    }


                    showToast(
                        `ប្រភេទហ្គេម ${category ? category.toUpperCase() : ""}`,
                        "🎰"
                    );

                }
            );

        }
    );

}


/* =========================================
   WALLET & ACTION BUTTONS
========================================= */

document
    .getElementById("depositButton")
    ?.addEventListener(
        "click",
        () => {

            showToast(
                "Deposit System នឹងបន្ថែមនៅ STEP បន្ទាប់",
                "💰"
            );

        }
    );


document
    .getElementById("walletButton")
    ?.addEventListener(
        "click",
        () => {

            if (
                typeof setActivePage === "function"
            ) {

                setActivePage("wallet");

            }


            showToast(
                "គ្រប់គ្រង Wallet របស់អ្នក",
                "👛"
            );

        }
    );


document
    .getElementById("historyButton")
    ?.addEventListener(
        "click",
        () => {

            if (
                typeof setActivePage === "function"
            ) {

                setActivePage("history");

            }


            showToast(
                "ប្រវត្តិប្រតិបត្តិការលេងហ្គេម",
                "📜"
            );

        }
    );
/* =========================================
   PROFILE
========================================= */

document
    .getElementById("profileButton")
    ?.addEventListener(
        "click",
        () => {

            if (
                typeof setActivePage === "function"
            ) {

                setActivePage(
                    "profile"
                );

            }


            showToast(
                "ទំព័រ Profile របស់អ្នក",
                "👤"
            );

        }
    );


/* =========================================
   MENU
========================================= */

document
    .getElementById("menuButton")
    ?.addEventListener(
        "click",
        () => {

            showToast(
                "Menu នឹងបន្ថែមនៅពេលក្រោយ",
                "☰"
            );

        }
    );


/* =========================================
   NOTIFICATION
========================================= */

document
    .getElementById("notificationButton")
    ?.addEventListener(
        "click",
        () => {

            showToast(
                "មិនមាន Notification ថ្មីទេ",
                "🔔"
            );


            if (
                DOM.notificationBadge
            ) {

                DOM.notificationBadge.style.display =
                    "none";

            }

        }
    );


/* =========================================
   VIEW ALL GAMES
========================================= */

document
    .getElementById("viewAllGames")
    ?.addEventListener(
        "click",
        () => {

            if (
                typeof setActivePage === "function"
            ) {

                setActivePage(
                    "games"
                );

            }

        }
    );


/* =========================================
   DAILY REWARD
========================================= */

document
    .getElementById("claimRewardButton")
    ?.addEventListener(
        "click",
        () => {

            const reward = 100;


            if (
                typeof AppState !== "undefined"
            ) {

                AppState.balance +=
                    reward;

            }


            if (
                typeof updateBalance === "function"
            ) {

                updateBalance();

            }


            showToast(
                `ទទួលបាន +${reward} Coins 🎁`,
                "✓"
            );

        }
    );


/* =========================================
   INITIALIZE APP (COMBINED)
========================================= */

function initializeApp() {

    if (
        typeof AppState !== "undefined" &&
        AppState.initialized
    ) {

        return;

    }


    /* 1. Refresh DOM Elements (ប្រសិនបើមាន) */
    if (
        typeof DOM !== "undefined" &&
        typeof DOM.init === "function"
    ) {

        DOM.init();

    }


    /* 2. Update Balance លើ UI */
    if (
        typeof updateBalance === "function"
    ) {

        updateBalance();

    }


    /* 3. កំណត់ Page ដំបូង */
    if (
        typeof setActivePage === "function" &&
        typeof AppState !== "undefined"
    ) {

        setActivePage(
            AppState.currentPage || "home"
        );

    }


    /* 4. ដំណើរការ Router ប្រសិនបើមាន */
    if (
        typeof Router !== "undefined" &&
        typeof Router.init === "function"
    ) {

        Router.init();

    }


    if (
        typeof AppState !== "undefined"
    ) {

        AppState.initialized = true;

    }


    console.log(
        "🎮 Game Platform App Initialized Successfully!"
    );

}


/* =========================================
   START APPLICATION
========================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );

} else {

    initializeApp();

}
