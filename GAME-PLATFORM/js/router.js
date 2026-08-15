"use strict";

/* =========================================
   //GAME PLATFORM
   SIMPLE GLOBAL ROUTER
========================================= */

const Router = {

    currentPage: "home",

    pages: [
        "home",
        "games",
        "wallet",
        "profile",
        "history",
        "settings"
    ],


    init: function () {

        console.log("🚀 Router Started");

        this.bindNavigation();

        this.loadInitialPage();

    },


    /* =====================================
       NAVIGATION
    ====================================== */

    navigate: function (page) {

        console.log("➡️ Navigate:", page);

        if (!this.pages.includes(page)) {

            console.warn(
                "Unknown page:",
                page
            );

            page = "home";

        }


        this.currentPage = page;


        this.showPage(page);

        this.updateNavigation(page);


        /*
         * Games Catalog
         */

        if (
            page === "games" &&
            typeof GameCatalog !== "undefined"
        ) {

            if (
                GameCatalog.games.length === 0
            ) {

                GameCatalog.init();

            } else {

                GameCatalog.render();

            }

        }


        /*
         * Update URL
         */

        try {

            history.pushState(
                {
                    page: page
                },
                "",
                "#" + page
            );

        } catch (error) {

            console.log(error);

        }


        window.scrollTo(
            0,
            0
        );

    },


    /* =====================================
       SHOW PAGE
    ====================================== */

    showPage: function (page) {

        console.log(
            "📄 Showing Page:",
            page
        );


        /*
         * Hide all pages
         */

        document
            .querySelectorAll(
                "[data-page-view]"
            )
            .forEach(
                function (element) {

                    element.style.display =
                        "none";

                }
            );


        /*
         * Show selected page
         */

        const selectedPage =
            document.querySelector(
                '[data-page-view="' +
                page +
                '"]'
            );


        if (selectedPage) {

            selectedPage.style.display =
                "block";

        } else {

            console.error(
                "❌ Page not found:",
                page
            );

        }

    },


    /* =====================================
       ACTIVE NAVIGATION
    ====================================== */

    updateNavigation: function (page) {

        document
            .querySelectorAll(
                "[data-page]"
            )
            .forEach(
                function (button) {

                    button.classList.toggle(
                        "active",
                        button.dataset.page ===
                        page
                    );

                }
            );

    },


    /* =====================================
       CLICK EVENTS
    ====================================== */

    bindNavigation: function () {

        document.addEventListener(
            "click",
            function (event) {

                const button =
                    event.target.closest(
                        "[data-page]"
                    );


                if (!button) {

                    return;

                }


                event.preventDefault();

                event.stopPropagation();


                const page =
                    button.getAttribute(
                        "data-page"
                    );


                console.log(
                    "🖱️ Click:",
                    page
                );


                Router.navigate(page);

            },
            true
        );

    },


    /* =====================================
       INITIAL PAGE
    ====================================== */

    loadInitialPage: function () {

        let page =
            window.location.hash
                .replace("#", "")
                .trim();


        if (
            !this.pages.includes(page)
        ) {

            page = "home";

        }


        this.currentPage = page;


        this.showPage(page);

        this.updateNavigation(page);


        /*
         * Load Games
         */

        if (
            page === "games" &&
            typeof GameCatalog !==
            "undefined"
        ) {

            GameCatalog.init();

        }

    }

};


/* =========================================
   BROWSER BACK / FORWARD
========================================= */

window.addEventListener(
    "popstate",
    function () {

        Router.loadInitialPage();

    }
);


/* =========================================
   START ROUTER
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        Router.init();

    }
);