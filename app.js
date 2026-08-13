/* =========================================
   GAME APP & WALLET
========================================= */

// BALANCE
let balance = Number(localStorage.getItem("balance")) || 1250;
let mode = "deposit";

function updateBalance() {
    const element = document.getElementById("balance");
    if (!element) return;

    element.textContent = balance.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/* =========================================
   TOAST
========================================= */
function showMessage(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(function() {
        toast.classList.remove("show");
    }, 1800);
}

/* =========================================
   NAVIGATION & ROUTING
========================================= */
function goWallet(type) {
    if (type === "deposit") {
        window.location.href = "wallet.html?type=deposit";
        return;
    }
    if (type === "withdraw") {
        window.location.href = "wallet.html?type=withdraw";
        return;
    }
}

function goBack() {
    window.location.href = "index.html";
}

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
   WALLETS LOGIC (FOR WALLET.HTML)
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

// =========================================
// LOAD TRANSACTION HISTORY FROM FIREBASE
// =========================================
function loadHistory() {
    const list = document.getElementById("historyList");
    if (!list) return;

    // ពិនិត្យមើលថា Firebase បានភ្ជាប់រួចរាល់ឬនៅ
    if (typeof db === "undefined" || !db) {
        list.innerHTML = `<div class="empty" style="text-align:center; padding:15px; color:#ef4444;">❌ មិនទាន់ភ្ជាប់ Firebase ទេ</div>`;
        return;
    }

    list.innerHTML = `<div class="empty" style="text-align:center; padding:15px; color:#94a3b8;">⏳ កំពុងទាញយក...</div>`;

    // យក ID របស់ User ដែលកំពុង Login (ឧទាហរណ៍៖ "82931")
    const userId = typeof currentUserId !== "undefined" ? currentUserId : "82931";

    // ទាញយកប្រវត្តិពី Firebase Path: transactions/USER_ID
    db.ref("transactions/" + userId).on("value", function(snapshot) {
        const data = snapshot.val();

        if (!data) {
            list.innerHTML = `<div class="empty" style="text-align:center; padding:15px; color:#64748b;">មិនទាន់មានប្រវត្តិ</div>`;
            return;
        }

        // បង្វែរ Object ពី Firebase ទៅជា Array រួចតម្រៀបពីថ្មីទៅចាស់
        const requests = Object.keys(data).map(key => data[key]).reverse();

        list.innerHTML = requests.slice(0, 15).map(function(item) {
            let statusClass = "pending";
            if (item.status === "approved" || item.status === "completed") statusClass = "approved";
            if (item.status === "rejected") statusClass = "rejected";

            const isDeposit = item.type === "deposit";
            const typeLabel = isDeposit ? "➕ Deposit" : "➖ Withdraw";

            return `
            <div class="history-item">
                <div>
                    <strong>${typeLabel}</strong>
                    <small style="display:block; color:#64748b; font-size:11px;">${item.date || item.id || ''}</small>
                </div>
                <div style="text-align: right;">
                    <b>$${Number(item.amount || 0).toFixed(2)}</b>
                    <small class="${statusClass}" style="display:block;">${(item.status || "pending").toUpperCase()}</small>
                </div>
            </div>
            `;
        }).join("");
    });
}

// មុខងារលុបប្រវត្តិក្នុង Firebase (ប្រសិនបើចង់ឱ្យ User លុបប្រវត្តិខ្លួនឯង)
function clearHistory() {
    const userId = typeof currentUserId !== "undefined" ? currentUserId : "82931";
    
    if (db && confirm("តើអ្នកពិតជាចង់លុបប្រវត្តិប្រតិបត្តិការទាំងអស់មែនទេ?")) {
        db.ref("transactions/" + userId).remove()
            .then(() => {
                if (typeof showMessage === "function") showMessage("បានលុបប្រវត្តិរួចរាល់");
                loadHistory();
            })
            .catch(err => console.error("Clear Error:", err));
    }
}

/* =========================================
   APP INIT
========================================= */
document.addEventListener("DOMContentLoaded", function() {
    updateBalance();
    if (document.getElementById("historyList")) {
        initWallet();
    }
});
// =========================================
// FUNCTION បើក HISTORY ចេញពី MENU
// =========================================
function openHistoryFromMenu() {
    // ១. បិទផ្ទាំង Menu ជាមុនសិន
    closeModal('menuModal');
    
    // ២. បើកផ្ទាំង History Modal
    const historyModal = document.getElementById("historyModal");
    if (historyModal) {
        historyModal.classList.remove("hidden");
    }

    // ៣. ទាញយកទិន្នន័យមកបង្ហាញ
    if (typeof loadHistory === "function") {
        loadHistory();
    } else if (typeof showHistory === "function") {
        showHistory();
    }
}

// Export ទៅ Window ដើម្បីឱ្យ HTML ហៅប្រើបាន ១០០%
window.openHistoryFromMenu = openHistoryFromMenu;
// =========================================
// MODAL CONTROL FUNCTIONS (បើក/បិទ POPUP)
// =========================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("hidden");
        // ករណីបើ Style ប្រើ display: none
        if (getComputedStyle(modal).display === "none") {
            modal.style.display = "flex";
        }
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

// ភ្ជាប់ទៅ Window ដើម្បីឱ្យ HTML ហៅប្រើតាម onclick បាន ១០០%
window.openModal = openModal;
window.closeModal = closeModal;
