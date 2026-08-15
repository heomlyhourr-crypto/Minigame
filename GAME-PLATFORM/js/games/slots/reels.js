"use strict";


/* =========================================
   REEL ENGINE
========================================= */

const SlotReels = {


    getRandomSymbol() {

        const symbols =
            typeof SlotSymbols !== "undefined"
                ? SlotSymbols
                : (window.SlotSymbols || []);


        if (!symbols.length) {

            return {
                id: "default",
                icon: "❓",
                name: "Unknown",
                multiplier: 0
            };

        }


        const index =
            Math.floor(
                Math.random() *
                symbols.length
            );

                return symbols[index];
    },

    // 📍 បន្ថែមចាប់ពី Line 40 ត្រង់នេះ៖
    startAnimation() {
        document.querySelectorAll('.catalog-game-cover, .reel-item, .slot-reel').forEach(reel => {
            reel.classList.add('reel-animating');
        });
    },

    stopAnimation() {
        document.querySelectorAll('.catalog-game-cover, .reel-item, .slot-reel').forEach(reel => {
            reel.classList.remove('reel-animating');
        });
    },

    getResult() {


        const count =
            typeof SlotConfig !== "undefined"
                ? SlotConfig.reelCount
                : (window.SlotConfig?.reelCount || 3);


        const result = [];

        for (
            let i = 0;
            i < count;
            i++
        ) {

            result.push(
                this.getRandomSymbol()
            );

        }

        return result;

    },


    setSymbol(
        reelIndex,
        symbol
    ) {

        const reel =
            document.getElementById(
                `reel${reelIndex}`
            );


        if (!reel) {

            return;

        }


        const element =
            reel.querySelector(
                ".reel-symbol"
            );


        if (!element) {

            return;

        }


        element.textContent =
            symbol?.icon || "❓";

    },


    startAnimation() {

        document
            .querySelectorAll(
                ".reel"
            )
            .forEach(
                reel => {

                    reel.classList.add(
                        "spinning"
                    );

                }
            );

    },


    stopAnimation() {

        document
            .querySelectorAll(
                ".reel"
            )
            .forEach(
                reel => {

                    reel.classList.remove(
                        "spinning"
                    );

                }
            );

    }

};


// បញ្ជូន SlotReels ទៅកាន់ Global Scope ដើម្បីឱ្យ game.js ទាញប្រើបានរលូន
window.SlotReels = SlotReels;
