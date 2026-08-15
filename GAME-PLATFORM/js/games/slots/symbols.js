"use strict";


/* =========================================
   SLOT SYMBOLS
========================================= */

const SlotSymbols = [

    {
        id: "cherry",
        icon: "🍒",
        name: "Cherry",
        multiplier: 2
    },

    {
        id: "lemon",
        icon: "🍋",
        name: "Lemon",
        multiplier: 3
    },

    {
        id: "orange",
        icon: "🍊",
        name: "Orange",
        multiplier: 4
    },

    {
        id: "bell",
        icon: "🔔",
        name: "Bell",
        multiplier: 5
    },

    {
        id: "diamond",
        icon: "💎",
        name: "Diamond",
        multiplier: 8
    },

    {
        id: "seven",
        icon: "7️⃣",
        name: "Lucky Seven",
        multiplier: 15
    }

];

// បញ្ជូន SlotSymbols ទៅកាន់ Global Scope ដើម្បីឱ្យ game.js ទាញប្រើបាន
window.SlotSymbols = SlotSymbols;
