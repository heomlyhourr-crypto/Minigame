"use strict";


/* =========================================
   BONUS ENGINE
========================================= */

const SlotBonus = {


    check(result) {

        if (!result) {

            return false;

        }


        /*
         * Demo bonus trigger:
         * Three Lucky Seven
         */

        if (
            result.length === 3 &&
            result.every(
                symbol =>
                    symbol.id === "seven"
            )
        ) {

            return true;

        }


        return false;

    },


    getBonusReward(bet) {

        return bet * 25;

    }

};


// បញ្ជូន SlotBonus ទៅកាន់ Global Scope
window.SlotBonus = SlotBonus;
