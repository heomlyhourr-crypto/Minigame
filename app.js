// ==========================================
// 1. FIREBASE CONFIG & INITIALIZE (ដាក់លើគេបង្អស់)
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCcGDjnR4gjlvW5eKMJClFSmvZePi7lQh0",
    authDomain: "mini-shopping-9582e.firebaseapp.com",
    databaseURL: "https://mini-shopping-9582e-default-rtdb.firebaseio.com",
    projectId: "mini-shopping-9582e",
    storageBucket: "mini-shopping-9582e.appspot.com",
    messagingSenderId: "1785688834718",
    appId: "1:1785688834718:web:b03e7380"
};

if (typeof firebase !== "undefined" && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== "undefined") ? firebase.database() : null;

// ==========================================
// 2. GAME APP & WALLET GLOBAL CONFIG (កូដដើមរបស់អ្នក)
// ==========================================
let balance = Number(localStorage.getItem("balance")) || 1250;
let mode = "deposit";
const currentUserId = "82931"; 
let currentReceiptBase64 = "";
/* =========================================
   BALANCE & REALTIME FIREBASE LISTENERS
========================================= */
function updateBalance() {
    const element = document.getElementById("balance");
    if (!element) return;

    element.textContent = balance.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function initFirebaseBalance() {
    if (typeof db !== "undefined" && db) {
        // ទាញយក និងស្តាប់ការផ្លាស់ប្តូរ Balance តាម Realtime ពី Firebase
        db.ref("users/" + currentUserId + "/balance").on("value", function(snapshot) {
            const val = snapshot.val();
            if (val !== null && val !== undefined) {
                balance = Number(val);
                saveBalance();
                updateBalance();
            }
        });
    }
}
// ==========================================
// 1. មុខងារបិទ/បើក MODAL 
// ==========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("hidden");
        modal.style.display = "flex";
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("hidden");
        modal.style.display = "none";
    }
}

// ==========================================
// 2. មុខងារ PREVIEW រូបភាព RECEIPT (DEPOSIT)
// ==========================================
function previewDepositImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentReceiptBase64 = e.target.result;
            const preview = document.getElementById("receiptPreview");
            if (preview) {
                preview.src = currentReceiptBase64;
                preview.style.display = "block";
                preview.classList.remove("hidden");
            }
        };
        reader.readAsDataURL(file);
    }
}

// ==========================================
// 3. មុខងារបញ្ជូនសំណើ ដាក់ប្រាក់ (DEPOSIT)
// ==========================================
function submitDepositWithImage() {
    const amountInput = document.getElementById("depositAmount");
    const amount = Number(amountInput ? amountInput.value : 0);

    if (!amount || amount <= 0) {
        return showMessage("សូមបញ្ចូលចំនួនទឹកប្រាក់ឱ្យបានត្រឹមត្រូវ!");
    }

    if (!currentReceiptBase64) {
        return showMessage("សូមជ្រើសរើសរូបភាពវិក្កយបត្រ (Receipt)!");
    }

    if (!db) return showMessage("មិនទាន់ភ្ជាប់ Firebase ទេ!");

    const newReqRef = db.ref("requests").push();
    newReqRef.set({
        id: newReqRef.key,
        userId: currentUserId,
        type: "deposit",
        amount: amount,
        receipt: currentReceiptBase64,
        status: "pending",
        createdAt: new Date().toLocaleString()
    })
    .then(function() {
        showMessage("✓ បានផ្ញើសំណើដាក់ប្រាក់ជោគជ័យ!");
        closeModal("depositModal");
        
        // Clear Inputs
        if (amountInput) amountInput.value = "";
        currentReceiptBase64 = "";
        const preview = document.getElementById("receiptPreview");
        if (preview) preview.style.display = "none";
    })
    .catch(function(err) {
        console.error(err);
        showMessage("ផ្ញើសំណើបរាជ័យ!");
    });
}

// ==========================================
// 4. មុខងារបញ្ជូនសំណើ ដកប្រាក់ (WITHDRAW) - កាត់លុយភ្លាមៗ
// ==========================================
function submitWithdrawFromModal() {
    const amountInput = document.getElementById("withdrawAmount");
    const bankInput = document.getElementById("withdrawBankDetails");

    const amount = Number(amountInput ? amountInput.value : 0);
    const bankDetails = bankInput ? bankInput.value.trim() : "";

    if (!amount || amount <= 0) {
        return showMessage("សូមបញ្ចូលចំនួនទឹកប្រាក់ដកឱ្យបានត្រឹមត្រូវ!");
    }

    if (!bankDetails) {
        return showMessage("សូមបញ្ចូលព័ត៌មានកុងធនាគារ!");
    }

    if (!db) return showMessage("មិនទាន់ភ្ជាប់ Firebase ទេ!");

    // 1. ពិនិត្យមើល Balance ពី Firebase
    db.ref("users/" + currentUserId + "/balance").once("value").then(function(snapshot) {
        const currentBalance = Number(snapshot.val() || 0);

        if (amount > currentBalance) {
            showMessage("ទឹកប្រាក់ក្នុង Wallet មិនគ្រប់គ្រាន់ទេ!");
            return null;
        }

        // 2. កាត់ប្រាក់ចេញ (-) ភ្លាមៗ
        const newBalance = currentBalance - amount;
        return db.ref("users/" + currentUserId + "/balance").set(newBalance);
    })
    .then(function(result) {
        if (result === null) return; // បើប្រាក់មិនគ្រប់ មិនធ្វើការបន្តទេ

        // 3. បង្កើត Request ផ្ញើទៅ Admin
        const newReqRef = db.ref("requests").push();
        return newReqRef.set({
            id: newReqRef.key,
            userId: currentUserId,
            type: "withdraw",
            amount: amount,
            bankDetails: bankDetails,
            status: "pending",
            createdAt: new Date().toLocaleString()
        });
    })
    .then(function() {
        showMessage("✓ បានផ្ញើសំណើដកប្រាក់! ប្រាក់ត្រូវបានកាត់រៀបរយ។");
        closeModal("withdrawModal");

        // Clear Inputs
        if (amountInput) amountInput.value = "";
        if (bankInput) bankInput.value = "";
    })
    .catch(function(err) {
        console.error(err);
        showMessage("មានបញ្ហាក្នុងការដកប្រាក់!");
    });
}
// ==========================================
// FUNCTION SHOW MESSAGE / TOAST NOTIFICATION
// ==========================================
function showMessage(msg) {
    const toast = document.getElementById("toast");
    if (toast) {
        toast.innerText = msg;
        toast.classList.add("show");
        toast.style.display = "block";

        // បិទ Toast វិញបន្ទាប់ពី 3 វិនាទី
        setTimeout(function() {
            toast.classList.remove("show");
            toast.style.display = "none";
        }, 3000);
    } else {
        alert(msg);
    }
}

// ភ្ជាប់ showToast ទៅ showMessage ដើម្បីកុំឱ្យជួប Error ស្ទួន
function showToast(msg) {
    showMessage(msg);
}
// ==========================================
// USER APP - ទាញយកហ្គេម Realtime + បង្ហាញរូបភាព Background
// ==========================================
function loadUserGames() {
    const container = document.querySelector(".game-grid");
    if (!container || !db) return;

    db.ref("games").on("value", function(snapshot) {
        const games = snapshot.val();
        if (!games) return;

        let html = "";
        Object.keys(games).forEach(function(key) {
            const game = games[key];
            if (game.status === "offline") return; // មិនបង្ហាញហ្គេមដែល Offline

            const isUrl = game.image && (game.image.startsWith("http") || game.image.startsWith("data:image"));
            
            // កំណត់ Background ជារូបភាព ឬជា Color + Icon
            const bgStyle = isUrl 
                ? `background-image: url('${game.image}'); background-size: cover; background-position: center;`
                : `background: #1e293b; display: flex; align-items: center; justify-content: center; font-size: 40px;`;

            const iconContent = isUrl ? "" : (game.image || "🎮");

            html += `
            <div class="game-card" data-type="${game.category || 'slot'}">
                <div class="game-image" style="${bgStyle}">
                    <label>HOT</label>
                    ${iconContent}
                </div>
                <div class="game-info">
                    <strong>${game.name}</strong>
                    <small style="text-transform: capitalize;">${game.category || 'Slot'} · Win Rate: ${game.winRate || 90}%</small>
                    <button onclick="playGame('${game.name}')">PLAY</button>
                </div>
            </div>
            `;
        });

        if (html) {
            container.innerHTML = html;
        }
    });
}

// ហៅឱ្យដំណើរការពេល User បើក App
document.addEventListener("DOMContentLoaded", function() {
    loadUserGames();
});

/* =========================================
   GAME FUNCTIONS
========================================= */
function playGame(game) {
    showMessage("🎮 កំពុងបើក " + game + "...");
}

function filterGames(type, button) {
    const buttons = document.querySelectorAll(".category");
    buttons.forEach(function(item) {
        item.classList.remove("active");
    });

    if (button) button.classList.add("active");

    const games = document.querySelectorAll(".game-card");
    games.forEach(function(game) {
        const gameType = game.dataset.type;
        if (type === "all" || type === gameType) {
            game.style.display = "block";
        } else {
            game.style.display = "none";
        }
    });
}

/* =========================================
   MENU & NOTIFICATION
========================================= */
function openMenu() {
    const menu = document.getElementById("menu");
    if (menu) menu.classList.add("show");
}

function closeMenu() {
    const menu = document.getElementById("menu");
    if (menu) menu.classList.remove("show");
}

function showNotification() {
    showMessage("🔔 អ្នកមាន Notification ថ្មី");
}

function saveBalance() {
    localStorage.setItem("balance", balance);
}

/* =========================================
   WALLETS LOGIC (FOR WALLET.HTML & MODAL)
========================================= */
function initWallet() {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get("type");
    if (typeParam === "withdraw" || typeParam === "deposit") {
        mode = typeParam;
    }
    setMode(mode);
    loadHistory();

    const billInput = document.getElementById("bill");
    if (billInput) {
        billInput.addEventListener("change", function() {
            const file = this.files[0];
            if (!file) return;

            const preview = document.getElementById("preview");
            const reader = new FileReader();

            reader.onload = function(e) {
                if (preview) preview.innerHTML = `<img src="${e.target.result}">`;
            };
            reader.readAsDataURL(file);
        });
    }
}

function setMode(type) {
    mode = type;
    const depTab = document.getElementById("depositTab");
    const withTab = document.getElementById("withdrawTab");

    if (depTab) depTab.classList.toggle("active", type === "deposit");
    if (withTab) withTab.classList.toggle("active", type === "withdraw");
}

function sendRequest() {
    const amountInput = document.getElementById("amount");
    if (!amountInput) return;

    const amount = Number(amountInput.value);

    if (!amount || amount <= 0) {
        showMessage("សូមបញ្ចូលចំនួនទឹកប្រាក់");
        return;
    }

    if (mode === "withdraw" && amount > balance) {
        showMessage("ទឹកប្រាក់មិនគ្រប់គ្រាន់");
        return;
    }

    const requests = JSON.parse(localStorage.getItem("walletRequests") || "[]");

    requests.unshift({
        id: "REQ-" + Date.now().toString().slice(-6),
        type: mode,
        amount: amount,
        status: "pending",
        date: new Date().toLocaleString()
    });

    localStorage.setItem("walletRequests", JSON.stringify(requests));
    amountInput.value = "";
    
    const preview = document.getElementById("preview");
    if (preview) preview.innerHTML = "";

    showMessage("✓ បានផ្ញើទៅ Admin");
    loadHistory();
}

/* =========================================
   DEPOSIT WITH RECEIPT IMAGE (មុខងារបន្ថែមថ្មី)
========================================= */
// ១. មើលរូបភាព Preview
function previewDepositImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        currentReceiptBase64 = e.target.result;
        const previewImg = document.getElementById("receiptPreview");
        if (previewImg) {
            previewImg.src = currentReceiptBase64;
            previewImg.style.display = "block";
            previewImg.classList.remove("hidden");
        }
    };
    reader.readAsDataURL(file);
}

// ២. ផ្ញើស្នើដាក់ប្រាក់ + រូបភាព ទៅ Firebase Database
function submitDepositWithImage() {
    const amountInput = document.getElementById("depositAmount");
    const amount = amountInput ? Number(amountInput.value) : 0;

    if (!amount || amount <= 0) {
        showMessage("សូមបញ្ចូលចំនួនទឹកប្រាក់ឱ្យបានត្រឹមត្រូវ");
        return;
    }

    if (typeof db === "undefined" || !db) {
        showMessage("❌ មិនទាន់ភ្ជាប់ Firebase ទេ");
        return;
    }

    const reqId = "REQ-" + Math.floor(100000 + Math.random() * 900000);

    db.ref("requests/" + reqId).set({
        id: reqId,
        userId: currentUserId,
        amount: amount,
        type: "deposit",
        receipt: currentReceiptBase64, // Base64 Receipt
        date: new Date().toLocaleString("km-KH"),
        status: "pending"
    }).then(() => {
        showMessage("✅ បានផ្ញើស្នើសុំដាក់ប្រាក់ជោគជ័យ!");
        closeModal("depositModal");

        // Reset Input Forms
        if (amountInput) amountInput.value = "";
        currentReceiptBase64 = "";
        const previewImg = document.getElementById("receiptPreview");
        if (previewImg) previewImg.style.display = "none";
        
        const fileInput = document.getElementById("receiptFileInput");
        if (fileInput) fileInput.value = "";
    }).catch(err => {
        console.error("Deposit Submit Error:", err);
        showMessage("❌ មានបញ្ហាក្នុងការផ្ញើស្នើសុំ");
    });
}

/* =========================================
   LOAD TRANSACTION HISTORY FROM FIREBASE
========================================= */
function loadHistory() {
    const list = document.getElementById("historyList");
    if (!list) return;

    if (typeof db === "undefined" || !db) {
        list.innerHTML = `<div class="empty" style="text-align:center; padding:15px; color:#ef4444;">❌ មិនទាន់ភ្ជាប់ Firebase ទេ</div>`;
        return;
    }

    list.innerHTML = `<div class="empty" style="text-align:center; padding:15px; color:#94a3b8;">⏳ កំពុងទាញយក...</div>`;

    db.ref("transactions/" + currentUserId).on("value", function(snapshot) {
        const data = snapshot.val();

        if (!data) {
            list.innerHTML = `<div class="empty" style="text-align:center; padding:15px; color:#64748b;">មិនទាន់មានប្រវត្តិ</div>`;
            return;
        }

        const requests = Object.keys(data).map(key => data[key]).reverse();

        list.innerHTML = requests.slice(0, 15).map(function(item) {
            let statusClass = "pending";
            if (item.status === "approved" || item.status === "completed") statusClass = "approved";
            if (item.status === "rejected") statusClass = "rejected";

            const isDeposit = item.type === "deposit";
            const typeLabel = isDeposit ? "➕ Deposit" : "➖ Withdraw";

            return `
            <div class="history-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #1e293b;">
                <div>
                    <strong>${typeLabel}</strong>
                    <small style="display:block; color:#64748b; font-size:11px;">${item.date || item.id || ''}</small>
                </div>
                <div style="text-align: right;">
                    <b>$${Number(item.amount || 0).toFixed(2)}</b>
                    <small class="${statusClass}" style="display:block; font-size:11px;">${(item.status || "pending").toUpperCase()}</small>
                </div>
            </div>
            `;
        }).join("");
    });
}

function clearHistory() {
    if (db && confirm("តើអ្នកពិតជាចង់លុបប្រវត្តិប្រតិបត្តិការទាំងអស់មែនទេ?")) {
        db.ref("transactions/" + currentUserId).remove()
            .then(() => {
                showMessage("បានលុបប្រវត្តិរួចរាល់");
                loadHistory();
            })
            .catch(err => console.error("Clear Error:", err));
    }
}

/* =========================================
   MODAL & MENU CONTROL FUNCTIONS
========================================= */
function openHistoryFromMenu() {
    closeMenu();
    closeModal('menuModal');
    openModal('historyModal');
    loadHistory();
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("hidden");
        modal.style.display = "flex";
    } else {
        console.warn("រកមិនឃើញ Element ដែលមាន ID:", modalId);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("hidden");
        modal.style.display = "none";
    }
}

/* =========================================
   APP INIT & EXPORTS
========================================= */
document.addEventListener("DOMContentLoaded", function() {
    updateBalance();
    initFirebaseBalance();
    if (document.getElementById("historyList")) {
        initWallet();
    }
});

// Export ទៅកាន់ Window ដើម្បីឱ្យ HTML ចុច onclick បាន ១០០%
window.openModal = openModal;
window.closeModal = closeModal;
window.openHistoryFromMenu = openHistoryFromMenu;
window.previewDepositImage = previewDepositImage;
window.submitDepositWithImage = submitDepositWithImage;
window.loadHistory = loadHistory;
window.clearHistory = clearHistory;
window.openMenu = openMenu;
window.closeMenu = closeMenu;
window.showMessage = showMessage;
window.playGame = playGame;
window.filterGames = filterGames;