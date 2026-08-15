/* =========================================
   GAME CATALOG
   STEP 3
========================================= */

"use strict";


const GameCatalog = {

    games: [],

    currentCategory: "all",

    searchText: "",


    /* =====================================
       INITIALIZE
    ====================================== */

    async init() {

        try {

            await this.loadGames();

            this.setupEvents();

            this.render();

            console.log(
                "🎮 Game Catalog initialized"
            );

        } catch (error) {

            console.error(
                "Game Catalog Error:",
                error
            );

            this.showError();

        }

    },


    /* =====================================
       LOAD JSON
    ====================================== */

    async loadGames() {

        let response = await fetch("data/games.json");

        // Safe Fallback ប្រសិនបើទិន្នន័យស្ថិតនៅ 07-DATA/games.json
        if (!response.ok) {

            response = await fetch("07-DATA/games.json");

        }


        if (!response.ok) {

            throw new Error(
                "Unable to load games.json"
            );

        }


        const data =
            await response.json();


        this.games =
            Array.isArray(data.games)
                ? data.games
                : (Array.isArray(data) ? data : []);

    },


    /* =====================================
       FILTER
    ====================================== */

    getFilteredGames() {

        return this.games.filter(
            game => {

                const categoryMatch =

                    this.currentCategory ===
                    "all"

                    ||
                    game.category ===
                    this.currentCategory;


                const nameStr = game.name || game.title || "";
                const descStr = game.description || "";

                const searchMatch =

                    nameStr
                        .toLowerCase()
                        .includes(
                            this.searchText
                                .toLowerCase()
                        )

                    ||

                    descStr
                        .toLowerCase()
                        .includes(
                            this.searchText
                                .toLowerCase()
                        );


                return (
                    categoryMatch &&
                    searchMatch
                );

            }
        );

    },


    /* =====================================
       RENDER
    ====================================== */

    render() {

        const grid =
            document.getElementById(
                "catalogGrid"
            );


        const count =
            document.getElementById(
                "catalogCount"
            );


        if (!grid) {

            return;

        }


        const games =
            this.getFilteredGames();


        if (count) {

            count.textContent =
                `${games.length} Games`;

        }


        if (!games.length) {

            grid.innerHTML = `

                <div class="catalog-empty">

                    <div class="catalog-empty-icon">
                        🔍
                    </div>

                    <strong>
                        រកមិនឃើញហ្គេម
                    </strong>

                    <p>
                        សូមសាកល្បងពាក្យស្វែងរកផ្សេង
                    </p>

                </div>

            `;

            return;

        }


        grid.innerHTML =
            games
                .map(
                    game =>
                        this.createCard(
                            game
                        )
                )
                .join("");


        this.bindPlayButtons();

    },


    /* =====================================
       CREATE CARD
    ====================================== */

    createCard(game) {

        const available =
            game.status ===
            "available";


        const tagClass =
            game.tag === "NEW"
                ? "new"
                : game.status ===
                  "coming-soon"
                    ? "soon"
                    : "";


        const tagHTML =
            game.tag || !available

                ? `

                    <span
                        class="catalog-tag ${tagClass}"
                    >

                        ${
                            available
                                ? game.tag
                                : "SOON"
                        }

                    </span>

                  `

                : "";


        const rating =
            Number(game.rating || 0)
                .toFixed(1);


        const plays =
            Number(game.plays || 0);


        const playsText =
            plays > 0
                ? `${this.formatNumber(plays)} Plays`
                : "Coming Soon";


        const gameName = game.name || game.title || "";


        return `

            <article
                class="catalog-game-card"
                data-game-id="${game.id}"
            >

                <div
                    class="
                        catalog-game-cover
                        cover-${game.category}
                    "
                >

                    ${tagHTML}

                    <span
                        class="catalog-game-icon"
                    >
                        ${game.icon}
                    </span>

                </div>


                <div
                    class="catalog-game-body"
                >

                    <h3
                        class="catalog-game-title"
                    >
                        ${gameName}
                    </h3>


                    <p
                        class="
                            catalog-game-description
                        "
                    >
                        ${game.description || ""}
                    </p>


                    <div
                        class="catalog-game-meta"
                    >

                        <span
                            class="game-rating"
                        >
                            ⭐ ${rating}
                        </span>

                        <span
                            class="game-plays"
                        >
                            ${playsText}
                        </span>

                    </div>


                    <button
                        class="
                            catalog-play-button
                            ${available ? "" : "disabled"}
                        "
                        data-game-id="${game.id}"
                        ${available ? "" : "disabled"}
                    >

                        ${
                            available
                                ? "▶ លេងឥឡូវ"
                                : "🔒 មិនទាន់មាន"
                        }

                    </button>

                </div>

            </article>

        `;

    },


    /* =====================================
       BIND PLAY
    ====================================== */

    bindPlayButtons() {

        document
            .querySelectorAll(
                ".catalog-play-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            if (
                                button.disabled
                            ) {

                                return;

                            }


                            const gameId =
                                button.dataset
                                    .gameId;


                            this.openGame(
                                gameId
                            );

                        }
                    );

                }
            );

    },


    /* =====================================
       OPEN GAME
    ====================================== */

    openGame(gameId) {

        const game =
            this.games.find(
                item =>
                    item.id === gameId
            );


        if (!game) {

            return;

        }


        /*
         * =================================
         * URL ផ្ទាល់ខ្លួនពី JSON (ប្រសិនបើមាន)
         * =================================
         */

        if (game.url) {

            window.location.href = game.url;

            return;

        }


        /*
         * =================================
         * FRUIT SLOTS
         * =================================
         */

        if (
            gameId === "fruit-slots" ||
            gameId === "fruit" ||
            gameId === "fruits"
        ) {

            window.location.href = "games/fruits/index.html";

            return;

        }


        /*
         * =================================
         * CLASSIC SLOTS
         * =================================
         */

        if (
            game.category === "slots"
        ) {

            window.location.href =
                "games/slots/index.html?game=" +
                encodeURIComponent(
                    gameId
                );

            return;

        }


        /*
         * Other Games
         */

        if (
            typeof showToast ===
            "function"
        ) {

            showToast(
                `${game.name || game.title} Coming Soon`,
                "🎮"
            );

        }

    },


    /* =====================================
       SEARCH
    ====================================== */

    search(value) {

        this.searchText =
            value.trim();

        this.render();

    },


    /* =====================================
       CATEGORY
    ====================================== */

    setCategory(category) {

        this.currentCategory =
            category;

        this.updateFilterButtons();

        this.render();

    },


    /* =====================================
       FILTER BUTTON
    ====================================== */

    updateFilterButtons() {

        document
            .querySelectorAll(
                ".filter-button"
            )
            .forEach(
                button => {

                    button.classList.toggle(
                        "active",
                        button.dataset.category ===
                            this.currentCategory
                    );

                }
            );

    },


    /* =====================================
       NUMBER
    ====================================== */

    formatNumber(number) {

        return new Intl.NumberFormat(
            "en-US"
        ).format(number);

    },


    /* =====================================
       ERROR
    ====================================== */

    showError() {

        const grid =
            document.getElementById(
                "catalogGrid"
            );


        if (!grid) {

            return;

        }


        grid.innerHTML = `

            <div class="catalog-empty">

                <div class="catalog-empty-icon">
                    ⚠️
                </div>

                <strong>
                    មិនអាច Load Games បាន
                </strong>

                <p>
                    សូមពិនិត្យ data/games.json
                </p>

            </div>

        `;

    },


    /* =====================================
       EVENTS
    ====================================== */

    setupEvents() {

        const search =
            document.getElementById(
                "gameSearch"
            );


        if (search) {

            search.addEventListener(
                "input",
                event => {

                    this.search(
                        event.target.value
                    );

                }
            );

        }


        document
            .querySelectorAll(
                ".filter-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            this.setCategory(
                                button.dataset
                                    .category
                            );

                        }
                    );

                }
            );

    }

};


// បញ្ជូន GameCatalog ទៅកាន់ Global Scope
window.GameCatalog = GameCatalog;
