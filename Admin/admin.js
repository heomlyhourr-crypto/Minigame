// ==========================================
// FIREBASE CONFIG
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

// ==========================================
// INITIALIZE FIREBASE
// ==========================================
if (typeof firebase !== "undefined" && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== "undefined") ? firebase.database() : null;

// ==========================================
// GLOBAL VARIABLES & DOM REFERENCES
// ==========================================
let users = [];
let totalDeposit = 0;
let totalWithdraw = 0;
let selectedUser = null;
let games = [];

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

// ==========================================
// FORMAT MONEY (រៀល ៛ & ដុល្លារ $)
// ==========================================
function money(value) {
    const num = Number(value || 0);
    return num.toLocaleString("km-KH") + " ៛";
}

function moneyUSD(value) {
    const num = Number(value || 0);
    return "$" + num.toFixed(2);
}

// ==========================================
// DATE
// ==========================================
function updateDate() {
    const date = new Date();
    const dateElement = document.getElementById("date");
    const currentDateElement = document.getElementById("currentDate");

    if (dateElement) {
        dateElement.textContent = date.toLocaleString();
    }
    if (currentDateElement) {
        currentDateElement.textContent = date.toLocaleDateString("km-KH", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }
}

// ==========================================
// TOAST NOTIFICATION & MESSAGE
// ==========================================
function showToast(message) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(function() {
        toast.classList.remove("show");
    }, 2200);
}

// Alias សម្រាប់រក្សា Compatibility ជាមួយកូដចាស់
function showMessage(message) {
    showToast(message);
}

// ==========================================
// LOAD USERS FROM FIREBASE
// ==========================================
function loadUsers() {
    if (!db) {
        console.warn("Firebase is not initialized.");
        return;
    }

    db.ref("users").on(
        "value",
        function(snapshot) {
            const data = snapshot.val();
            users = [];

            if (data) {
                Object.keys(data).forEach(function(id) {
                    const user = data[id] || {};
                    users.push({
                        id: id,
                        balance: Number(user.balance || 0),
                        win: Number(user.win || 0),
                        lose: Number(user.lose || 0),
                        total: Number(user.total || 0)
                    });
                });
            }

            updateStats();
            renderUserTable();
        },
        function(error) {
            console.error("Firebase Error:", error);
            showToast("មិនអាចភ្ជាប់ Firebase បានទេ!");
        }
    );
}

// ==========================================
// UPDATE DASHBOARD STATS
// ==========================================
function updateStats() {
    let balance = 0;
    users.forEach(function(user) {
        balance += Number(user.balance || 0);
    });

    const totalUsers = document.getElementById("totalUsers");
    const totalBalance = document.getElementById("totalBalance");
    const deposit = document.getElementById("totalDeposit");
    const withdraw = document.getElementById("totalWithdraw");
    const transactionDeposit = document.getElementById("transactionDeposit");
    const transactionWithdraw = document.getElementById("transactionWithdraw");

    if (totalUsers) totalUsers.textContent = users.length;
    if (totalBalance) totalBalance.textContent = money(balance);
    if (deposit) deposit.textContent = money(totalDeposit);
    if (withdraw) withdraw.textContent = money(totalWithdraw);
    if (transactionDeposit) transactionDeposit.textContent = money(totalDeposit);
    if (transactionWithdraw) transactionWithdraw.textContent = money(totalWithdraw);
}

// ==========================================
// SEARCH USER
// ==========================================
function searchUser() {
    const input = document.getElementById("userIdInput");
    const result = document.getElementById("userResult");
    if (!input || !result) return;

    const id = input.value.trim();

    if (!id) {
        showToast("សូមបញ្ចូល User ID");
        return;
    }

    const user = users.find(function(item) {
        return item.id === id;
    });

    if (!user) {
        result.classList.remove("hidden");
        result.innerHTML = `
            <div class="empty-state">
                ❌
                <p>មិនរកឃើញ User ID: ${id}</p>
            </div>
        `;
        selectedUser = null;
        return;
    }

    selectedUser = user;
    result.classList.remove("hidden");
    result.innerHTML = `
        <div class="user-result-top">
            <div>
                <div class="result-id">ID ${user.id}</div>
                <small>Firebase User</small>
            </div>
            <div class="result-balance">${money(user.balance)}</div>
        </div>
        <div class="result-stats">
            <div class="result-stat">
                <span>ឈ្នះ</span>
                <strong>${money(user.win)}</strong>
            </div>
            <div class="result-stat">
                <span>ចាញ់</span>
                <strong>${money(user.lose)}</strong>
            </div>
            <div class="result-stat">
                <span>សរុប</span>
                <strong>${money(user.total)}</strong>
            </div>
        </div>
    `;
}

// ==========================================
// ADD MONEY (បញ្ចូលប្រាក់ FIREBASE)
// ==========================================
function addMoney() {
    const idInput = document.getElementById("userIdInput");
    const amountInput = document.getElementById("moneyAmount");
    if (!idInput || !amountInput) return;

    const id = idInput.value.trim();
    const amount = Number(amountInput.value);

    if (!id) {
        showToast("សូមបញ្ចូល User ID");
        return;
    }

    if (!amount || amount <= 0) {
        showToast("សូមបញ្ចូលចំនួនទឹកប្រាក់");
        return;
    }

    const user = users.find(function(item) {
        return item.id === id;
    });

    if (!user) {
        showToast("មិនរកឃើញ User");
        return;
    }

    const newBalance = Number(user.balance || 0) + amount;
    const newTotal = Number(user.total || 0) + amount;

    if (!db) return;

    db.ref("users/" + id).update({
        balance: newBalance,
        total: newTotal
    })
    .then(function() {
        totalDeposit += amount;
        amountInput.value = "";
        showToast("បានបន្ថែម " + money(amount) + " ជោគជ័យ");
        searchUser();
    })
    .catch(function(error) {
        console.error(error);
        showToast("Update Firebase បរាជ័យ");
    });
}

// ==========================================
// REMOVE MONEY (ដកប្រាក់ FIREBASE)
// ==========================================
function removeMoney() {
    const idInput = document.getElementById("userIdInput");
    const amountInput = document.getElementById("moneyAmount");
    if (!idInput || !amountInput) return;

    const id = idInput.value.trim();
    const amount = Number(amountInput.value);

    if (!id) {
        showToast("សូមបញ្ចូល User ID");
        return;
    }

    if (!amount || amount <= 0) {
        showToast("សូមបញ្ចូលចំនួនទឹកប្រាក់");
        return;
    }

    const user = users.find(function(item) {
        return item.id === id;
    });

    if (!user) {
        showToast("មិនរកឃើញ User");
        return;
    }

    const oldBalance = Number(user.balance || 0);

    if (amount > oldBalance) {
        showToast("Balance របស់ User មិនគ្រប់គ្រាន់");
        return;
    }

    const newBalance = oldBalance - amount;

    if (!db) return;

    db.ref("users/" + id).update({
        balance: newBalance
    })
    .then(function() {
        totalWithdraw += amount;
        amountInput.value = "";
        showToast("បានដក " + money(amount) + " ជោគជ័យ");
        searchUser();
    })
    .catch(function(error) {
        console.error(error);
        showToast("Update Firebase បរាជ័យ");
    });
}

// ==========================================
// USER TABLE
// ==========================================
function renderUserTable(data = users) {
    const table = document.getElementById("userTable");
    if (!table) return;

    table.innerHTML = "";

    data.forEach(function(user) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td><span class="user-id">${user.id}</span></td>
            <td>${money(user.balance)}</td>
            <td>${money(user.win)}</td>
            <td>${money(user.lose)}</td>
            <td>${money(user.total)}</td>
            <td>
                <button class="more-btn" onclick="selectUser('${user.id}')">More</button>
            </td>
        `;

        table.appendChild(row);
    });
}

// ==========================================
// SELECT USER
// ==========================================
function selectUser(id) {
    showSectionByCode("dashboard");
    const input = document.getElementById("userIdInput");
    if (input) input.value = id;

    searchUser();
    showToast("បានជ្រើសរើស User " + id);
}

// ==========================================
// FILTER USERS
// ==========================================
function filterUsers() {
    const input = document.getElementById("tableSearch");
    if (!input) return;

    const value = input.value.trim().toLowerCase();
    const filtered = users.filter(function(user) {
        return user.id.toLowerCase().includes(value);
    });

    renderUserTable(filtered);
}

// ==========================================
// HISTORY
// ==========================================
function renderUserTable(data = users) {
    const table = document.getElementById("userTable");
    const countBadge = document.getElementById("userCountBadge");
    
    if (countBadge) {
        countBadge.textContent = `${data.length} Users`;
    }

    if (!table) return;

    if (data.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 25px; color: #64748b;">
                    ❌ មិនមានទិន្នន័យ User ឡើយ
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = data.map(function(user) {
        return `
            <tr>
                <td>
                    <span class="user-id-badge" title="${user.id}">${user.id}</span>
                </td>
                <td class="text-right" style="font-weight: 600; color: #38bdf8;">
                    ${money(user.balance)}
                </td>
                <td class="text-right" style="color: #22c55e;">
                    ${money(user.win)}
                </td>
                <td class="text-right" style="color: #f43f5e;">
                    ${money(user.lose)}
                </td>
                <td class="text-center">
                    <button class="btn-more-action" onclick="selectUser('${user.id}')">More</button>
                </td>
            </tr>
        `;
    }).join("");
}
// ==========================================
// REQUESTS (LOCAL STORAGE WALLET REQUESTS)
// ==========================================
function loadRequests() {
    const container = document.getElementById("requests");
    if (!container) return;

    const requests = JSON.parse(localStorage.getItem("walletRequests") || "[]");

    if (requests.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:20px; color:var(--muted, #8ea2b7); font-size:11px;">
                No Pending Requests
            </div>
        `;
        return;
    }

    const pending = requests.filter(function(item) {
        return item.status === "pending";
    });

    if (pending.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:20px; color:var(--muted, #8ea2b7); font-size:11px;">
                No Pending Requests
            </div>
        `;
        return;
    }

    container.innerHTML = pending.slice(0, 10).map(function(item) {
        return `
        <div class="request" id="${item.id}">
            <div class="request-icon">
                ${item.type === "deposit" ? "💰" : "💸"}
            </div>

            <div class="request-info">
                <strong>User #82931</strong>
                <small>${item.id}</small>
                <small>${item.date || ''}</small>
            </div>

            <div class="request-amount">
                <strong>${moneyUSD(item.amount)}</strong>

                <div class="request-actions">
                    <button class="approve" onclick="approveRequest('${item.id}')">✓</button>
                    <button class="reject" onclick="rejectRequest('${item.id}')">✕</button>
                </div>
            </div>
        </div>
        `;
    }).join("");
}

function approveRequest(id) {
    const requests = JSON.parse(localStorage.getItem("walletRequests") || "[]");
    const request = requests.find(function(item) {
        return item.id === id;
    });

    if (!request) return;

    request.status = "approved";

    let balance = Number(localStorage.getItem("balance")) || 1250;
    
    if (request.type === "deposit") {
        balance += Number(request.amount);
    } else if (request.type === "withdraw") {
        balance -= Number(request.amount);
    }
    
    localStorage.setItem("balance", balance);
    localStorage.setItem("walletRequests", JSON.stringify(requests));
    showToast("✓ Request Approved");
    loadRequests();
}

function rejectRequest(id) {
    const requests = JSON.parse(localStorage.getItem("walletRequests") || "[]");
    const request = requests.find(function(item) {
        return item.id === id;
    });

    if (!request) return;

    request.status = "rejected";

    localStorage.setItem("walletRequests", JSON.stringify(requests));
    showToast("Request Rejected");
    loadRequests();
}

// ==========================================
// GAME DATABASE
// ==========================================
function initGames() {
    games = JSON.parse(localStorage.getItem("games") || "[]");

    if (games.length === 0) {
        games = [
            { name: "Lucky Spin", logo: "🎰", winRate: 95, status: "Online" },
            { name: "Ocean King", logo: "🐟", winRate: 90, status: "Online" },
            { name: "Speed Race", logo: "🏎️", winRate: 88, status: "Online" }
        ];
        saveGames();
    }
    loadGames();
}

function loadGames() {
    const list = document.getElementById("gameList");
    if (!list) return;

    list.innerHTML = games.map(function(game) {
        return `
        <div class="game-admin">
            <div class="game-logo">${game.logo}</div>

            <div class="game-data">
                <strong>${game.name}</strong>
                <small>Win Rate: ${game.winRate}%</small>
            </div>

            <div class="game-status">${game.status}</div>
        </div>
        `;
    }).join("");
}

function openGameForm() {
    const form = document.getElementById("gameForm");
    if (form) form.classList.add("show");
}

function closeGameForm() {
    const form = document.getElementById("gameForm");
    if (form) form.classList.remove("show");
}

function addGame() {
    const nameEl = document.getElementById("gameName");
    const logoEl = document.getElementById("gameLogo");
    const imageEl = document.getElementById("gameImage");
    const linkEl = document.getElementById("gameLink");
    const winRateEl = document.getElementById("winRate");

    if (!nameEl) return;
    const name = nameEl.value.trim();

    if (!name) {
        showToast("Please enter Game Name");
        return;
    }

    games.push({
        name: name,
        logo: logoEl ? logoEl.value.trim() || "🎮" : "🎮",
        image: imageEl ? imageEl.value.trim() : "",
        link: linkEl ? linkEl.value.trim() : "",
        winRate: winRateEl ? Number(winRateEl.value) || 0 : 0,
        status: "Online"
    });

    saveGames();
    loadGames();
    closeGameForm();

    nameEl.value = "";
    if (logoEl) logoEl.value = "";
    if (imageEl) imageEl.value = "";
    if (linkEl) linkEl.value = "";
    if (winRateEl) winRateEl.value = "";

    showToast("✓ Game Added");
}

function saveGames() {
    localStorage.setItem("games", JSON.stringify(games));
}

// ==========================================
// UI NAVIGATION & SIDEBAR
// ==========================================
function showSection(sectionId, evt) {
    document.querySelectorAll(".page-section").forEach(function(section) {
        section.classList.add("hidden");
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove("hidden");
    }

    document.querySelectorAll(".side-item").forEach(function(button) {
        button.classList.remove("active");
    });

    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add("active");
    }

    const sb = document.getElementById("sidebar");
    const ov = document.getElementById("overlay");
    if (window.innerWidth <= 800 && sb && ov) {
        sb.classList.remove("open");
        ov.classList.remove("show");
    }
}

function showSectionByCode(sectionId) {
    document.querySelectorAll(".page-section").forEach(function(section) {
        section.classList.add("hidden");
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove("hidden");
    }
}

function toggleSidebar() {
    const sb = document.getElementById("sidebar");
    const ov = document.getElementById("overlay");
    if (sb) sb.classList.toggle("open");
    if (ov) ov.classList.toggle("show");
}

// ==========================================
// START APPLICATION
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    updateDate();
    loadRequests();
    initGames();
    loadUsers();
});