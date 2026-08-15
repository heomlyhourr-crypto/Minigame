"use strict";

/* =========================================
   CLASSIC SLOTS
   STEP 6.3
========================================= */


/* =========================================
   GAME CONFIG
========================================= */

const CONFIG = {

    startingBalance: 1000,

    minBet: 10,

    maxBet: 100,

    betStep: 10,

    spinTime: 1400,

    reelStopDelay: 350

};


/* =========================================
   SLOT SYMBOLS (PRESETS)
========================================= */

const SYMBOL_PRESETS = {

    classic: [

        {
            id: "cherry",
            icon: "🍒",
            multiplier: 2
        },

        {
            id: "lemon",
            icon: "🍋",
            multiplier: 3
        },

        {
            id: "orange",
            icon: "🍊",
            multiplier: 4
        },

        {
            id: "bell",
            icon: "🔔",
            multiplier: 5
        },

        {
            id: "diamond",
            icon: "💎",
            multiplier: 8
        },

        {
            id: "seven",
            icon: "7️⃣",
            multiplier: 15
        }

    ],

    fruit: [

        {
            id: "cherry",
            icon: "🍒",
            multiplier: 2
        },

        {
            id: "lemon",
            icon: "🍋",
            multiplier: 3
        },

        {
            id: "orange",
            icon: "🍊",
            multiplier: 4
        },

        {
            id: "watermelon",
            icon: "🍉",
            multiplier: 5
        },

        {
            id: "grape",
            icon: "🍇",
            multiplier: 8
        },

        {
            id: "star",
            icon: "⭐",
            multiplier: 15
        }

    ]

};

let SYMBOLS = SYMBOL_PRESETS.classic;


/* =========================================
   GAME STATE
========================================= */

const Game = {

    balance: CONFIG.startingBalance,

    bet: CONFIG.minBet,

    spinning: false,

    sound: true,

    reels: [],

    init() {

        this.detectGameMode();

        this.loadBalance();

        this.cacheElements();

        this.bindEvents();

        this.updateUI();

        this.showMessage(
            "សូមចុច SPIN",
            ""
        );

        console.log(
            "🎰 Classic Slots Ready"
        );

    },


    /* =====================================
       DETECT GAME MODE FROM URL
    ====================================== */

    detectGameMode() {

        const urlParams =
            new URLSearchParams(
                window.location.search
            );


        const gameType =
            urlParams.get("game");


        if (
            gameType &&
            (
                gameType.includes("fruit") ||
                gameType.includes("fruits")
            )
        ) {

            SYMBOLS =
                SYMBOL_PRESETS.fruit;

        } else {

            SYMBOLS =
                SYMBOL_PRESETS.classic;

        }

    },


    /* =====================================
       CACHE ELEMENTS
    ====================================== */

    cacheElements() {

        this.balanceEl =
            document.getElementById(
                "balance"
            );

        this.betAmountEl =
            document.getElementById(
                "betAmount"
            );

        this.betValueEl =
            document.getElementById(
                "betValue"
            );

        this.spinBtn =
            document.getElementById(
                "spinBtn"
            );

        this.minusBtn =
            document.getElementById(
                "betMinus"
            );

        this.plusBtn =
            document.getElementById(
                "betPlus"
            );

        this.resultBox =
            document.getElementById(
                "resultBox"
            );

        this.resultMessage =
            document.getElementById(
                "resultMessage"
            );

        this.soundBtn =
            document.getElementById(
                "soundBtn"
            );

        this.backBtn =
            document.getElementById(
                "backBtn"
            );

    },


    /* =====================================
       EVENTS
    ====================================== */

    bindEvents() {


        if (this.spinBtn) {

            this.spinBtn.addEventListener(
                "click",
                () => this.spin()
            );

        }


        if (this.minusBtn) {

            this.minusBtn.addEventListener(
                "click",
                () => {

                    this.changeBet(
                        -CONFIG.betStep
                    );

                }
            );

        }


        if (this.plusBtn) {

            this.plusBtn.addEventListener(
                "click",
                () => {

                    this.changeBet(
                        CONFIG.betStep
                    );

                }
            );

        }


        if (this.soundBtn) {

            this.soundBtn.addEventListener(
                "click",
                () => {

                    this.sound =
                        !this.sound;

                    this.soundBtn.textContent =
                        this.sound
                            ? "🔊"
                            : "🔇";

                }
            );

        }


        if (this.backBtn) {

            this.backBtn.addEventListener(
                "click",
                () => {

                    if (
                        window.history.length > 1 &&
                        document.referrer
                    ) {

                        window.history.back();

                    } else {

                        window.location.href =
                            "../../index.html";

                    }

                }
            );

        }

    },


    /* =====================================
       LOAD BALANCE
    ====================================== */

    loadBalance() {

        const saved =
            localStorage.getItem(
                "app_balance"
            ) ||
            localStorage.getItem(
                "classicSlotsBalance"
            );


        if (saved !== null) {

            const value =
                Number(saved);


            if (
                Number.isFinite(value) &&
                value >= 0
            ) {

                this.balance =
                    value;

            }

        }

    },


    /* =====================================
       SAVE BALANCE
    ====================================== */

    saveBalance() {

        localStorage.setItem(
            "app_balance",
            String(
                this.balance
            )
        );

        localStorage.setItem(
            "classicSlotsBalance",
            String(
                this.balance
            )
        );

    },


    /* =====================================
       CHANGE BET
    ====================================== */

    changeBet(amount) {

        if (this.spinning) {

            return;

        }


        let newBet =
            this.bet + amount;


        if (
            newBet <
            CONFIG.minBet
        ) {

            newBet =
                CONFIG.minBet;

        }


        if (
            newBet >
            CONFIG.maxBet
        ) {

            newBet =
                CONFIG.maxBet;

        }


        /*
         * Bet មិនអាចលើស Balance
         */

        if (
            this.balance >=
            CONFIG.minBet
        ) {

            newBet =
                Math.min(
                    newBet,
                    this.balance
                );

        }


        this.bet =
            newBet;


        this.updateUI();

    },


    /* =====================================
       SPIN
    ====================================== */

    async spin() {

        if (this.spinning) {

            return;

        }


        /*
         * Check Balance
         */

        if (
            this.balance <
            this.bet
        ) {

            this.showMessage(
                "💰 Credits មិនគ្រប់ទេ",
                "lose"
            );

            return;

        }


        /*
         * START
         */

        this.spinning =
            true;


        this.setControls(
            true
        );


        /*
         * Deduct Bet
         */

        this.balance -=
            this.bet;


        this.saveBalance();

        this.updateUI();


        this.showMessage(
            "🎰 កំពុង Spin...",
            ""
        );


        /*
         * Remove old win
         */

        this.clearWinAnimation();


        /*
         * Generate final result
         */

        const result =
            this.generateResult();


        /*
         * Animate
         */

        await this.animateReels(
            result
        );


        /*
         * Evaluate
         */

        const outcome =
            this.evaluateResult(
                result
            );


        /*
         * Reward
         */

        if (
            outcome.reward > 0
        ) {

            this.balance +=
                outcome.reward;


            this.saveBalance();

            this.updateUI();


            this.showWinAnimation();

            this.showMessage(
                outcome.message,
                "win"
            );

        } else {

            this.updateUI();

            this.showMessage(
                "😔 សំណាងល្អលើកក្រោយ",
                "lose"
            );

        }


        /*
         * END
         */

        this.spinning =
            false;


        this.setControls(
            false
        );

    },


    /* =====================================
       GENERATE RESULT
    ====================================== */

    generateResult() {

        const result = [];


        for (
            let i = 0;
            i < 3;
            i++
        ) {

            result.push(
                this.randomSymbol()
            );

        }


        return result;

    },


    /* =====================================
       RANDOM SYMBOL
    ====================================== */

    randomSymbol() {

        const index =
            Math.floor(
                Math.random() *
                SYMBOLS.length
            );


        return SYMBOLS[index];

    },


    /* =====================================
       ANIMATE REELS
    ====================================== */

    animateReels(result) {

        return new Promise(
            resolve => {

                const reelElements = [

                    document.getElementById(
                        "reel0"
                    ),

                    document.getElementById(
                        "reel1"
                    ),

                    document.getElementById(
                        "reel2"
                    )

                ];


                const symbolElements = [

                    document.getElementById(
                        "symbol0"
                    ),

                    document.getElementById(
                        "symbol1"
                    ),

                    document.getElementById(
                        "symbol2"
                    )

                ];


                /*
                 * Start spinning
                 */

                reelElements.forEach(
                    reel => {

                        if (reel) {

                            reel.classList.add(
                                "spinning"
                            );

                        }

                    }
                );


                /*
                 * Temporary symbols
                 */

                const interval =
                    setInterval(
                        () => {

                            symbolElements.forEach(
                                element => {

                                    if (element) {

                                        element.textContent =
                                            this.randomSymbol()
                                                .icon;

                                    }

                                }
                            );

                        },
                        80
                    );


                /*
                 * Stop Reel 1
                 */

                setTimeout(
                    () => {

                        this.setReelResult(
                            0,
                            result[0]
                        );

                    },
                    CONFIG.spinTime -
                    600
                );


                /*
                 * Stop Reel 2
                 */

                setTimeout(
                    () => {

                        this.setReelResult(
                            1,
                            result[1]
                        );

                    },
                    CONFIG.spinTime -
                    300
                );


                /*
                 * Stop Reel 3
                 */

                setTimeout(
                    () => {

                        this.setReelResult(
                            2,
                            result[2]
                        );


                        clearInterval(
                            interval
                        );


                        reelElements.forEach(
                            reel => {

                                if (reel) {

                                    reel.classList.remove(
                                        "spinning"
                                    );

                                }

                            }
                        );


                        resolve();

                    },
                    CONFIG.spinTime
                );

            }
        );

    },


    /* =====================================
       SET REEL
    ====================================== */

    setReelResult(
        index,
        symbol
    ) {

        const reel =
            document.getElementById(
                `reel${index}`
            );

        const element =
            document.getElementById(
                `symbol${index}`
            );


        if (element) {

            element.textContent =
                symbol.icon;

        }


        if (reel) {

            reel.classList.remove(
                "spinning"
            );

        }

    },


    /* =====================================
       EVALUATE RESULT
    ====================================== */

    evaluateResult(result) {

        const [a, b, c] =
            result;


        /*
         * THREE SAME
         */

        if (
            a.id === b.id &&
            b.id === c.id
        ) {

            const reward =
                this.bet *
                a.multiplier;


            return {

                reward: reward,

                message:
                    `🎉 JACKPOT! +${this.formatNumber(reward)}`

            };

        }


        /*
         * TWO SAME
         */

        if (
            a.id === b.id
        ) {

            const reward =
                Math.floor(
                    this.bet *
                    a.multiplier *
                    0.5
                );


            return {

                reward: reward,

                message:
                    `✨ ឈ្នះ +${this.formatNumber(reward)}`

            };

        }


        if (
            b.id === c.id
        ) {

            const reward =
                Math.floor(
                    this.bet *
                    b.multiplier *
                    0.5
                );


            return {

                reward: reward,

                message:
                    `✨ ឈ្នះ +${this.formatNumber(reward)}`

            };

        }


        if (
            a.id === c.id
        ) {

            const reward =
                Math.floor(
                    this.bet *
                    a.multiplier *
                    0.5
                );


            return {

                reward: reward,

                message:
                    `✨ ឈ្នះ +${this.formatNumber(reward)}`

            };

        }


        /*
         * NO WIN
         */

        return {

            reward: 0,

            message:
                "សំណាងល្អលើកក្រោយ"

        };

    },


    /* =====================================
       WIN ANIMATION
    ====================================== */

    showWinAnimation() {

        const reels =
            document.querySelectorAll(
                ".reel"
            );


        reels.forEach(
            reel => {

                reel.classList.remove(
                    "win"
                );


                /*
                 * Force animation restart
                 */

                void reel.offsetWidth;


                reel.classList.add(
                    "win"
                );

            }
        );

    },


    /* =====================================
       CLEAR WIN
    ====================================== */

    clearWinAnimation() {

        const reels =
            document.querySelectorAll(
                ".reel"
            );


        reels.forEach(
            reel => {

                reel.classList.remove(
                    "win"
                );

            }
        );


        if (this.resultBox) {

            this.resultBox.classList.remove(
                "win"
            );

            this.resultBox.classList.remove(
                "lose"
            );

        }

    },


    /* =====================================
       MESSAGE
    ====================================== */

    showMessage(
        message,
        type
    ) {

        if (!this.resultMessage) {

            return;

        }


        this.resultMessage.textContent =
            message;


        if (this.resultBox) {

            this.resultBox.classList.remove(
                "win"
            );

            this.resultBox.classList.remove(
                "lose"
            );


            if (type) {

                this.resultBox.classList.add(
                    type
                );

            }

        }

    },


    /* =====================================
       CONTROLS
    ====================================== */

    setControls(
        disabled
    ) {

        if (this.spinBtn) {

            this.spinBtn.disabled =
                disabled;

        }


        if (this.minusBtn) {

            this.minusBtn.disabled =
                disabled;

        }


        if (this.plusBtn) {

            this.plusBtn.disabled =
                disabled;

        }

    },


    /* =====================================
       UPDATE UI
    ====================================== */

    updateUI() {

        if (this.balanceEl) {

            this.balanceEl.textContent =
                this.formatNumber(
                    this.balance
                );

        }


        if (this.betAmountEl) {

            this.betAmountEl.textContent =
                this.formatNumber(
                    this.bet
                );

        }


        if (this.betValueEl) {

            this.betValueEl.textContent =
                this.formatNumber(
                    this.bet
                );

        }

    },


    /* =====================================
       FORMAT NUMBER
    ====================================== */

    formatNumber(number) {

        return new Intl.NumberFormat(
            "en-US"
        ).format(number);

    }

};


/* =========================================
   START GAME
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        Game.init();

    }
);
