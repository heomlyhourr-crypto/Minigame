// ១. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCcGDjnR4gjlvW5eKMJClFSmvZePi7lQh0" // Key របស់អ្នកក្នុងរូប
    authDomain: "mini-shopping-9582e.firebaseapp.com",
    databaseURL: "https://mini-shopping-9582e-default-rtdb.firebaseio.com",
    projectId: "mini-shopping-9582e",
    storageBucket: "mini-shopping-9582e.appspot.com",
    messagingSenderId: "1785688834718",
    appId: "1:1785688834718:web:b03e7380..."
};

// ពិនិត្យការពារកុំឱ្យ Initialize firebase ពីរដង
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// ២. Telegram WebApp Initialization
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// ព័ត៌មាន User ពី Telegram
let user = tg?.initDataUnsafe?.user || {
    id: 6995747279,
    first_name: "អ្នកប្រើប្រាស់",
    last_name: ""
};

const userId = `ID-${user.id}`;
const userName = `${user.first_name} ${user.last_name || ''}`.trim();

// Variables សម្រាប់ Game
let currentBalance = 0;
let ticketPrice = 1000;
let winRate = 30; // default 30%
let isScratched = false;

// ៣. DOM Elements
document.addEventListener("DOMContentLoaded", () => {
    // បង្ហាញព័ត៌មាន User លើ UI
    const nameEl = document.getElementById("user-name");
    const codeEl = document.getElementById("user-code");
    const balanceEl = document.getElementById("user-balance");

    if (nameEl) nameEl.textContent = userName;
    if (codeEl) codeEl.textContent = userId;

    // ទាញយកទិន្នន័យពី Firebase Realtime Database
    const userRef = database.ref("users/" + user.id);
    userRef.on("value", (snapshot) => {
        const data = snapshot.val();
        if (data) {
            currentBalance = data.balance || 0;
        } else {
            // បង្កើត user ថ្មីបើមិនទាន់មានក្នុង database
            userRef.set({
                name: userName,
                balance: 0,
                created_at: new Date().toISOString()
            });
            currentBalance = 0;
        }
        if (balanceEl) balanceEl.textContent = currentBalance.toLocaleString();
    });

    // ទាញយក Win Rate ពី Admin Config
    database.ref("settings/winRate").on("value", (snapshot) => {
        if (snapshot.val() !== null) {
            winRate = snapshot.val();
        }
    });

    // កំណត់ Event សម្រាប់ប៊ូតុងជ្រើសរើសតម្លៃសន្លឹកឆ្នោត
    const priceBtns = document.querySelectorAll(".price-btn[data-price]");
    priceBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            priceBtns.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            ticketPrice = parseInt(e.target.getAttribute("data-price"));
            
            const displayTag = document.getElementById("ticket-price-display");
            const buyTag = document.getElementById("buy-price-tag");
            if (displayTag) displayTag.textContent = `${ticketPrice.toLocaleString()}៛`;
            if (buyTag) buyTag.textContent = `${ticketPrice.toLocaleString()} ៛`;
        });
    });

    // កំណត់ Event សម្រាប់ប៊ូតុង Close Telegram App
    const closeBtn = document.getElementById("close-btn");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            if (tg) tg.close();
        });
    }

    // Modal Control (Wallet, History, Admin)
    setupModals();
});

// ៤. មុខងារ Setup Modal Popups
function setupModals() {
    const modals = {
        wallet: { btn: "wallet-btn", modal: "wallet-modal" },
        history: { btn: "history-btn", modal: "history-modal" },
        admin: { btn: "admin-btn", modal: "admin-modal" }
    };

    Object.values(modals).forEach(item => {
        const btn = document.getElementById(item.btn);
        const modal = document.getElementById(item.modal);
        if (btn && modal) {
            btn.addEventListener("click", () => modal.classList.remove("hidden"));
        }
    });

    document.querySelectorAll(".close-modal").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.target.closest(".modal-backdrop").classList.add("hidden");
        });
    });
}
