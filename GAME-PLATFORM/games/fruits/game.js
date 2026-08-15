"use strict";

/* =========================================
   FRUIT SLOTS GAME LOGIC
========================================= */

const FRUIT_CONFIG = {
    symbols: ['🍒', '🍋', '🍊', '🍉', '🍇', '⭐'],
    multipliers: {
        '🍒': 2,
        '🍋': 3,
        '🍊': 4,
        '🍉': 5,
        '🍇': 8,
        '⭐': 15
    },
    minBet: 10,
    maxBet: 100,
    betStep: 10
};

let state = {
    balance: parseInt(localStorage.getItem("app_balance")) || 1000,
    bet: 10,
    isSpinning: false,
    soundEnabled: true
};

/* DOM ELEMENTS */
const DOM = {
    balance: document.getElementById("balance"),
    betAmount: document.getElementById("betAmount"),
    betValue: document.getElementById("betValue"),
    resultBox: document.getElementById("resultBox"),
    resultMessage: document.getElementById("resultMessage"),
    spinBtn: document.getElementById("spinBtn"),
    betMinus: document.getElementById("betMinus"),
    betPlus: document.getElementById("betPlus"),
    backBtn: document.getElementById("backBtn"),
    soundBtn: document.getElementById("soundBtn"),
    symbols: [
        document.getElementById("symbol0"),
        document.getElementById("symbol1"),
        document.getElementById("symbol2")
    ]
};

/* FORMAT NUMBER */
function formatNum(num) {
    return new Intl.NumberFormat("en-US").format(num);
}

/* UPDATE UI */
function updateUI() {
    DOM.balance.textContent = formatNum(state.balance);
    DOM.betAmount.textContent = formatNum(state.bet);
    DOM.betValue.textContent = formatNum(state.bet);
    localStorage.setItem("app_balance", state.balance);
}

/* BET CONTROLS */
DOM.betMinus.addEventListener("click", () => {
    if (state.isSpinning) return;
    if (state.bet > FRUIT_CONFIG.minBet) {
        state.bet -= FRUIT_CONFIG.betStep;
        updateUI();
    }
});

DOM.betPlus.addEventListener("click", () => {
    if (state.isSpinning) return;
    if (state.bet < FRUIT_CONFIG.maxBet) {
        state.bet += FRUIT_CONFIG.betStep;
        updateUI();
    }
});

/* BACK & SOUND BUTTON */
DOM.backBtn.addEventListener("click", () => {
    window.location.href = "../../../index.html";
});

DOM.soundBtn.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    DOM.soundBtn.textContent = state.soundEnabled ? "🔊" : "🔇";
});

/* SPIN LOGIC */
function getRandomSymbol() {
    const idx = Math.floor(Math.random() * FRUIT_CONFIG.symbols.length);
    return FRUIT_CONFIG.symbols[idx];
}

DOM.spinBtn.addEventListener("click", startSpin);

function startSpin() {
    if (state.isSpinning) return;

    if (state.balance < state.bet) {
        DOM.resultMessage.textContent = "❌ Balance មិនគ្រប់គ្រាន់!";
        return;
    }

    // Deduct Bet
    state.balance -= state.bet;
    state.isSpinning = true;
    DOM.spinBtn.disabled = true;
    DOM.resultBox.classList.remove("win");
    DOM.resultMessage.textContent = "🎰 កំពុង Spin...";
    updateUI();

    // Start Reels Blur & Spin Animation
    DOM.symbols.forEach(sym => sym.classList.add("blur"));

    let spinCount = 0;
    const interval = setInterval(() => {
        DOM.symbols.forEach(sym => {
            sym.textContent = getRandomSymbol();
        });
        spinCount++;

        if (spinCount > 15) {
            clearInterval(interval);
            stopSpin();
        }
    }, 80);
}

function stopSpin() {
    const results = [
        getRandomSymbol(),
        getRandomSymbol(),
        getRandomSymbol()
    ];

    DOM.symbols.forEach((sym, idx) => {
        sym.classList.remove("blur");
        sym.textContent = results[idx];
    });

    checkWin(results);
}

function checkWin(results) {
    state.isSpinning = false;
    DOM.spinBtn.disabled = false;

    const [s1, s2, s3] = results;

    // Check 3 Symbols Match
    if (s1 === s2 && s2 === s3) {
        const multiplier = FRUIT_CONFIG.multipliers[s1] || 2;
        const winAmount = state.bet * multiplier;
        state.balance += winAmount;

        DOM.resultBox.classList.add("win");
        DOM.resultMessage.textContent = `🎉 BIG WIN! ឈ្នះ +${formatNum(winAmount)} (${s1} x${multiplier})`;
    } 
    // Check 2 Symbols Match (Small Reward)
    else if (s1 === s2 || s2 === s3 || s1 === s3) {
        const winAmount = Math.floor(state.bet * 0.5);
        state.balance += winAmount;
        DOM.resultMessage.textContent = `✨ ត្រូវ ២ ផ្លែ! ទទួលបានវិញ +${formatNum(winAmount)}`;
    } 
    else {
        DOM.resultMessage.textContent = "មិនត្រូវទេ! សាកល្បងម្តងទៀត 🍀";
    }

    updateUI();
}

/* INITIAL LOAD */
updateUI();
