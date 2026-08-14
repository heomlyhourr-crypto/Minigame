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
            <div class="empty-state" style="text-align:center; padding: 15px; color:#ef4444;">
                ❌ <p>មិនរកឃើញ User ID: ${id}</p>
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
                <small style="color:#94a3b8;">Firebase User</small>
            </div>
            <div class="result-balance">${money(user.balance)}</div>
        </div>
        <div class="result-stats" style="display:flex; justify-size:space-between; margin-top:10px; background:#1e293b; padding:10px; border-radius:8px;">
            <div class="result-stat" style="flex:1; text-align:center;">
                <span style="font-size:12px; color:#94a3b8;">ឈ្នះ</span><br>
                <strong style="color:#22c55e;">${money(user.win)}</strong>
            </div>
            <div class="result-stat" style="flex:1; text-align:center;">
                <span style="font-size:12px; color:#94a3b8;">ចាញ់</span><br>
                <strong style="color:#ef4444;">${money(user.lose)}</strong>
            </div>
            <div class="result-stat" style="flex:1; text-align:center;">
                <span style="font-size:12px; color:#94a3b8;">សរុប</span><br>
                <strong style="color:#38bdf8;">${money(user.total)}</strong>
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
// USER TABLE & BADGE
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
                    <button class="btn-more-action" style="padding:4px 12px; background:#3b82f6; border:none; border-radius:4px; color:#fff; cursor:pointer;" onclick="selectUser('${user.id}')">More</button>
                </td>
            </tr>
        `;
    }).join("");
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
// ទាញយក និងបង្ហាញ Realtime Requests + ព័ត៌មានធនាគារ (ADMIN)
// ==========================================
function loadRequests() {
    const container = document.getElementById("requests");
    if (!container || !db) return;

    db.ref("requests").on("value", function(snapshot) {
        const data = snapshot.val();

        if (!data) {
            container.innerHTML = `
                <div style="text-align:center; padding:20px; color:#8ea2b7; font-size:11px;">
                    No Pending Requests
                </div>
            `;
            return;
        }

        const pendingList = [];
        Object.keys(data).forEach(function(key) {
            const req = data[key] || {};
            if (req.status === "pending") {
                pendingList.push(req);
            }
        });

        if (pendingList.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:20px; color:#8ea2b7; font-size:11px;">
                    No Pending Requests
                </div>
            `;
            return;
        }

        container.innerHTML = pendingList.slice(0, 10).map(function(item) {
            const receiptHtml = item.receipt 
                ? `<img src="${item.receipt}" onclick="viewReceiptImage('${item.receipt}')" style="width:38px; height:38px; border-radius:6px; object-fit:cover; cursor:pointer; margin-right:8px; border:1px solid #334155;" title="Click to view receipt">` 
                : '';

            const typeLabel = item.type === "deposit" 
                ? `<span style="color:#22c55e; font-size:11px; font-weight:bold;">💰 ដាក់ប្រាក់</span>`
                : `<span style="color:#ef4444; font-size:11px; font-weight:bold;">💸 ដកប្រាក់</span>`;

            // 🎯 បន្ថែមការបង្ហាញព័ត៌មានកុងធនាគារ (Bank Details) ប្រសិនបើជា Request ដកប្រាក់
            const bankInfoHtml = (item.type === "withdraw" && item.bankDetails) 
                ? `<div style="color:#38bdf8; font-size:11px; font-weight:600; margin-top:2px; background:#1e293b; padding:2px 6px; border-radius:4px; display:inline-block;">🏦 ${item.bankDetails}</div>` 
                : '';

            return `
            <div class="request" id="${item.id}" style="display:flex; align-items:center; justify-content:space-between; padding:10px; background:#0f172a; border-radius:8px; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    ${receiptHtml}
                    <div class="request-info">
                        <strong style="display:block; font-size:13px; color:#fff;">User #${item.userId || 'User'}</strong>
                        <div>${typeLabel}</div>
                        ${bankInfoHtml}
                        <small style="color:#64748b; font-size:10px; display:block; margin-top:3px;">${item.createdAt || ''}</small>
                    </div>
                </div>

                <div class="request-amount" style="text-align:right;">
                    <strong style="display:block; font-size:14px; color:#38bdf8;">${moneyUSD(item.amount)}</strong>

                    <div class="request-actions" style="margin-top:6px; display:flex; gap:4px; justify-content:flex-end;">
                        <button class="approve" style="background:#22c55e; border:none; color:#fff; border-radius:4px; padding:3px 10px; cursor:pointer; font-size:12px;" onclick="approveRequest('${item.id}', '${item.userId}', '${item.type}', ${item.amount})">✓</button>
                        <button class="reject" style="background:#ef4444; border:none; color:#fff; border-radius:4px; padding:3px 10px; cursor:pointer; font-size:12px;" onclick="rejectRequest('${item.id}', '${item.userId}', '${item.type}', ${item.amount})">✕</button>
                    </div>
                </div>
            </div>
            `;
        }).join("");
    }, function(error) {
        console.error("Firebase loadRequests Error:", error);
    });
}

// ==========================================
// ADMIN APPROVE (យល់ព្រម)
// ==========================================
function approveRequest(id, userId, type, amount) {
    if (!db) return;

    const numAmount = Number(amount);

    if (type === "deposit") {
        // ដាក់ប្រាក់: បូកប្រាក់ (+) ចូលក្នុង Firebase របស់ User
        db.ref("users/" + userId + "/balance").transaction(function(currentBalance) {
            return (Number(currentBalance) || 0) + numAmount;
        }, function(error, committed) {
            if (committed) {
                db.ref("requests/" + id + "/status").set("approved");
                showToast("✓ បានអនុម័តការដាក់ប្រាក់ " + moneyUSD(numAmount));
            }
        });
    } else if (type === "withdraw") {
        // ដកប្រាក់: លុយត្រូវបានកាត់ចេញពី User រួចហើយ! គ្រាន់តែប្តូរ Status
        db.ref("requests/" + id + "/status").set("approved")
        .then(function() {
            showToast("✓ បានអនុម័តការដកប្រាក់ " + moneyUSD(numAmount));
        })
        .catch(function(err) {
            console.error(err);
            showToast("Update Request បរាជ័យ");
        });
    }
}

// ==========================================
// ADMIN REJECT (បដិសេធ / បរាជ័យ - REFUND)
// ==========================================
function rejectRequest(id, userId, type, amount) {
    if (!db) return;

    const numAmount = Number(amount);

    if (type === "withdraw") {
        // ដកប្រាក់បរាជ័យ: វេរប្រាក់ (Refund +) ត្រឡប់ទៅ Wallet User វិញ!
        db.ref("users/" + userId + "/balance").transaction(function(currentBalance) {
            return (Number(currentBalance) || 0) + numAmount;
        }, function(error, committed) {
            if (committed) {
                db.ref("requests/" + id + "/status").set("rejected");
                showToast("✕ បានបដិសេធ! ប្រាក់ " + moneyUSD(numAmount) + " ត្រូវវេរត្រឡប់ទៅ User វិញ");
            }
        });
    } else if (type === "deposit") {
        // ដាក់ប្រាក់បរាជ័យ: គ្រាន់តែប្តូរ Status ជា rejected
        db.ref("requests/" + id + "/status").set("rejected")
        .then(function() {
            showToast("✕ បានបដិសេធសំណើដាក់ប្រាក់");
        })
        .catch(function(err) {
            console.error(err);
            showToast("Update Request បរាជ័យ");
        });
    }
}
// ==========================================
// 📷 RECEIPT IMAGE PREVIEW MODAL (បន្ថែមថ្មី)
// ==========================================
function viewReceiptImage(imgUrl) {
    const modal = document.getElementById("receiptImageModal");
    const modalImg = document.getElementById("modalReceiptImg");
    
    if (modal && modalImg) {
        modalImg.src = imgUrl;
        modal.style.display = "flex";
        modal.classList.remove("hidden");
    }
}

function closeImageModal() {
    const modal = document.getElementById("receiptImageModal");
    if (modal) {
        modal.style.display = "none";
        modal.classList.add("hidden");
    }
}

// ==========================================
// ADMIN GAME MANAGEMENT (LOAD, ADD, EDIT)
// ==========================================

// 1. ទាញយកបញ្ជីហ្គេមបង្ហាញលើ Admin Dashboard
function loadAdminGames() {
    const container = document.getElementById("adminGameList") || document.querySelector(".game-settings-list");
    if (!container || !db) return;

    db.ref("games").on("value", function(snapshot) {
        const games = snapshot.val();
        if (!games) {
            container.innerHTML = `<p style="color:#64748b; text-align:center;">មិនទាន់មានហ្គេមនៅឡើយទេ</p>`;
            return;
        }

        let html = "";
        Object.keys(games).forEach(function(key) {
            const game = games[key];
            
            // ពិនិត្យមើលថាតើ game.image ជា Link URL ឬជា Emoji
            const isUrl = game.image && (game.image.startsWith("http") || game.image.startsWith("data:image"));
            const imageDisplay = isUrl 
                ? `<img src="${game.image}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`
                : `<span style="font-size:24px;">${game.image || '🎮'}</span>`;

            html += `
            <div class="game-item" style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:#0f172a; border-radius:10px; margin-bottom:8px; border:1px solid #1e293b;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:45px; height:45px; background:#1e293b; border-radius:8px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                        ${imageDisplay}
                    </div>
                    <div>
                        <strong style="color:#fff; font-size:14px; display:block;">${game.name}</strong>
                        <small style="color:#64748b; font-size:11px;">Win Rate: ${game.winRate || 0}% · <span style="color:#38bdf8;">${game.category || 'slot'}</span></small>
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="color:${game.status === 'online' ? '#22c55e' : '#ef4444'}; font-size:12px; font-weight:bold;">${game.status || 'online'}</span>
                    <button onclick="openGameModal('${key}')" style="background:#3b82f6; border:none; color:#fff; border-radius:6px; padding:5px 10px; font-size:12px; cursor:pointer;">✏️ កែ</button>
                </div>
            </div>
            `;
        });

        container.innerHTML = html;
    });
}

// 2. បើក Modal កែសម្រួល ឬ បន្ថែមហ្គេម
function openGameModal(gameId) {
    const modal = document.getElementById("gameModal");
    if (!modal) return;

    if (gameId) {
        // Mode កែសម្រួល (Edit)
        db.ref("games/" + gameId).once("value").then(function(snapshot) {
            const game = snapshot.val();
            if (game) {
                document.getElementById("editGameId").value = gameId;
                document.getElementById("gameNameInput").value = game.name || "";
                document.getElementById("gameImageInput").value = game.image || "";
                document.getElementById("gameWinRateInput").value = game.winRate || 90;
                document.getElementById("gameCategorySelect").value = game.category || "slot";
                document.getElementById("gameStatusSelect").value = game.status || "online";
                document.getElementById("gameModalTitle").innerText = "✏️ កែសម្រួលហ្គេម";
            }
        });
    } else {
        // Mode បន្ថែមថ្មី (Add)
        document.getElementById("editGameId").value = "";
        document.getElementById("gameNameInput").value = "";
        document.getElementById("gameImageInput").value = "";
        document.getElementById("gameWinRateInput").value = "90";
        document.getElementById("gameModalTitle").innerText = "➕ បន្ថែមហ្គេមថ្មី";
    }

    modal.style.display = "flex";
    modal.classList.remove("hidden");
}

function closeGameModal() {
    const modal = document.getElementById("gameModal");
    if (modal) {
        modal.style.display = "none";
        modal.classList.add("hidden");
    }
}

// 3. រក្សាទុកទិន្នន័យ (Save to Firebase)
function saveGameData() {
    const gameId = document.getElementById("editGameId").value || "game_" + Date.now();
    const name = document.getElementById("gameNameInput").value.trim();
    const image = document.getElementById("gameImageInput").value.trim();
    const winRate = Number(document.getElementById("gameWinRateInput").value) || 0;
    const category = document.getElementById("gameCategorySelect").value;
    const status = document.getElementById("gameStatusSelect").value;

    if (!name) return alert("សូមបញ្ចូលឈ្មោះហ្គេម!");

    db.ref("games/" + gameId).set({
        id: gameId,
        name: name,
        image: image || "🎮",
        winRate: winRate,
        category: category,
        status: status
    }).then(function() {
        closeGameModal();
        if (typeof showToast === "function") showToast("✓ រក្សាទុកហ្គេមជោគជ័យ!");
    }).catch(function(err) {
        console.error(err);
        alert("រក្សាទុកបរាជ័យ!");
    });
}

// ហៅ loadAdminGames នៅពេល Admin ទំព័រ Load រួច
document.addEventListener("DOMContentLoaded", function() {
    loadAdminGames();
});
// ==========================================
// 🛠️ ដោះស្រាយ Error: openGameForm is not defined
// ==========================================
function openGameForm(gameId = null) {
    // ប្រសិនបើមាន openGameModal ស្រាប់ ឱ្យវាហៅប្រើ openGameModal
    if (typeof openGameModal === "function") {
        openGameModal(gameId);
        return;
    }

    // ប្រសិនបើគ្មានទេ វានឹងបើក Modal ដោយផ្ទាល់
    const modal = document.getElementById("gameModal") || document.getElementById("gameFormModal");
    if (modal) {
        modal.style.display = "flex";
        modal.classList.remove("hidden");
    } else {
        alert("រកមិនឃើញ Modal សម្រាប់បញ្ចូលហ្គេមទេ! សូមពិនិត្យមើល ID ក្នុង HTML");
    }
}

// មុខងារបិទ Form/Modal
function closeGameForm() {
    const modal = document.getElementById("gameModal") || document.getElementById("gameFormModal");
    if (modal) {
        modal.style.display = "none";
        modal.classList.add("hidden");
    }
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

    document.querySelectorAll(".nav-item, .side-item").forEach(function(button) {
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
    loadAdminGames();
    loadUsers();

    // បិទ Sidebar ពេលចុច Overlay
    const ov = document.getElementById("overlay");
    if (ov) {
        ov.addEventListener("click", function() {
            toggleSidebar();
        });
    }
});