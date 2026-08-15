"use strict";


/* =========================================
   PAYLINE ENGINE
========================================= */

const SlotPaylines = {


    evaluate(result, bet) {

        if (
            !result ||
            result.length !== 3
        ) {

            return {

                win: false,

                reward: 0,

                type: "none"

            };

        }


        const [a, b, c] =
            result;


        /*
         * THREE SAME
         */

        if (
            a.id === b.id &&
            b.id === c.id
        ) {

            return {

                win: true,

                reward:
                    bet * a.multiplier,

                type: "three",

                symbol: a

            };

        }


        /*
         * TWO SAME
         */

        if (
            a.id === b.id
        ) {

            return {

                win: true,

                reward:
                    Math.floor(
                        bet *
                        a.multiplier *
                        0.5
                    ),

                type: "two",

                symbol: a

            };

        }


        if (
            b.id === c.id
        ) {

            return {

                win: true,

                reward:
                    Math.floor(
                        bet *
                        b.multiplier *
                        0.5
                    ),

                type: "two",

                symbol: b

            };

        }


        if (
            a.id === c.id
        ) {

            return {

                win: true,

                reward:
                    Math.floor(
                        bet *
                        a.multiplier *
                        0.5
                    ),

                type: "two",

                symbol: a

            };

        }


        return {

            win: false,

                reward: 0,

                type: "none"

        };

    }

};


// បញ្ជូន SlotPaylines ទៅកាន់ Global Scope
window.SlotPaylines = SlotPaylines;
