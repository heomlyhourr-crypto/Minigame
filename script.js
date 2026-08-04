// 1. Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCcGDjnR4gjlvW5eKMJClFSmvZePi7lQh0",
    authDomain: "mini-shopping-9582e.firebaseapp.com",
    databaseURL: "https://mini-shopping-9582e-default-rtdb.firebaseio.com",
    projectId: "mini-shopping-9582e",
    storageBucket: "mini-shopping-9582e.appspot.com",
    messagingSenderId: "1785688834718",
    appId: "1:1785688834718:web:b03e7380"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// 2. Telegram WebApp Init
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

let currentBalance = 0;
let ticketPrice = 1000;
let winRate = 30;
let targetNum = 0;

// កំណត់ Telegram ID របស់ Admin (ដាក់ ID របស់អ្នកនៅទីនេះ)
const ADMIN_IDS = [6995747279]; 

document.addEventListener("DOMContentLoaded", () => {
    let tgUser = tg?.initDataUnsafe?.user;
    let userIdNum = tgUser?.id || 6995747279;
    let userName = tgUser ? (tgUser.username ? `@${tgUser.username}` : `${tgUser.first_name} ${tgUser.last_name || ''}`.trim()) : "អ្នកប្រើប្រាស់";

    document.getElementById("user-name").textContent = userName;
    document.getElementById("user-code").textContent = `ID-${userIdNum}`;

    // ពិនិត្យមើលថាជា Admin ឬអត់ (បើជា Admin នឹងបង្ហាញប៊ូតុង Admin Panel)
    if (ADMIN_IDS.includes(userIdNum)) {
        const adminBtn = document.getElementById("admin-btn");
        if (adminBtn) adminBtn.style.display = "inline-block";
    }

    // Firebase User Realtime Listener
    const userRef = database.ref("users/" + userIdNum);
    userRef.on("value", (snapshot) => {
        const data = snapshot.val();
        if (data) {
            currentBalance = data.balance || 0;
        } else {
            currentBalance = 10000; // ផ្តល់ប្រាក់ដើម 10,000៛
            userRef.set({
                name: userName,
                balance: 10000,
                created_at: new Date().toISOString()
            });
        }
        document.getElementById("user-balance").textContent = currentBalance.toLocaleString();
    });

    // ប៊ូតុងជ្រើសរើសថ្លៃសន្លឹកឆ្នោត
    const priceBtns = document.querySelectorAll(".price-btn[data-price]");
    priceBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            priceBtns.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            ticketPrice = parseInt(e.target.getAttribute("data-price"));
            document.getElementById("ticket-price-display").textContent = `${ticketPrice.toLocaleString()}៛`;
            document.getElementById("buy-price-tag").textContent = `${ticketPrice.toLocaleString()} ៛`;
        });
    });

    // Event ពេលចុច "ទិញសន្លឹកឆ្នោត"
    document.getElementById("buy-ticket-btn").addEventListener("click", () => {
        if (currentBalance < ticketPrice) {
            alert("សមតុល្យប្រាក់មិនគ្រប់គ្រាន់ទេ!");
            return;
        }

        currentBalance -= ticketPrice;
        userRef.update({ balance: currentBalance });

        generateGameData();
        initCanvas();
    });

    // ប៊ូតុង កោសទាំងអស់
    document.getElementById("auto-scratch-btn").addEventListener("click", () => {
        const canvas = document.getElementById("scratch-canvas");
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });

    // Setup មុខងារ Modal និង Admin
    setupModals();
    setupAdminLogic();
});

// ៣. មុខងារ Admin Panel Logic ពេញលេញ
function setupAdminLogic() {
    // កត់ត្រា និងទាញយក Win Rate ពី Firebase
    const winRateRef = database.ref("settings/winRate");
    winRateRef.on("value", (snap) => {
        if (snap.val() !== null) {
            winRate = snap.val();
            const input = document.getElementById("admin-win-rate");
            if (input) input.value = winRate;
        }
    });

    // រក្សាទុក Win Rate ថ្មី
    const saveWinBtn = document.getElementById("save-winrate-btn");
    if (saveWinBtn) {
        saveWinBtn.addEventListener("click", () => {
            const val = parseInt(document.getElementById("admin-win-rate").value);
            if (!isNaN(val)) {
                winRateRef.set(val).then(() => alert("រក្សាទុក Win Rate ជោគជ័យ!"));
            }
        });
    }

    // ទាញយក List អ្នកលេងទាំងអស់បង្ហាញក្នុង តារាង Admin
    const userTable = document.getElementById("admin-user-table");
    database.ref("users").on("value", (snapshot) => {
        if (!userTable) return;
        userTable.innerHTML = "";
        const data = snapshot.val();
        
        for (let id in data) {
            let u = data[id];
            let row = document.createElement("tr");
            row.style.borderBottom = "1px solid #334155";
            row.innerHTML = `
                <td style="padding:6px;">ID-${id}</td>
                <td style="color:#10b981;">${(u.balance || 0).toLocaleString()}៛</td>
                <td><button onclick="quickAddMoney('${id}', 5000)" style="background:#10b981; color:#fff; border:none; border-radius:3px; padding:2px 6px;">+5K</button></td>
                <td><button onclick="quickAddMoney('${id}', -5000)" style="background:#ef4444; color:#fff; border:none; border-radius:3px; padding:2px 6px;">-5K</button></td>
            `;
            userTable.appendChild(row);
        }
    });

    // បញ្ចូលប្រាក់តាម Target ID Manual
    document.getElementById("admin-add-btn")?.addEventListener("click", () => modifyUserBalance(true));
    document.getElementById("admin-deduct-btn")?.addEventListener("click", () => modifyUserBalance(false));
}

// មុខងារបន្ថែម/ដកប្រាក់ Admin 
function modifyUserBalance(isAdd) {
    let targetInput = document.getElementById("admin-target-id").value.trim();
    let amount = parseInt(document.getElementById("admin-target-amount").value);

    // លុបអក្សរ "ID-" ចេញ ប្រសិនបើ Admin វាយបញ្ចូល
    let rawId = targetInput.replace("ID-", "");

    if (!rawId || isNaN(amount)) {
        alert("សូមបញ្ចូល ID និង ចំនួនប្រាក់ឱ្យបានត្រឹមត្រូវ!");
        return;
    }

    const ref = database.ref("users/" + rawId + "/balance");
    ref.get().then((snap) => {
        let current = snap.val() || 0;
        let newBal = isAdd ? (current + amount) : (current - amount);
        if (newBal < 0) newBal = 0;
        
        ref.set(newBal).then(() => {
            alert(`ធ្វើបច្ចុប្បន្នភាពប្រាក់ ID-${rawId} ជោគជ័យ! សមតុល្យថ្មី៖ ${newBal.toLocaleString()}៛`);
        });
    });
}

// មុខងារ Quick Add ក្នុងតារាង Admin
window.quickAddMoney = function(targetId, amount) {
    const ref = database.ref("users/" + targetId + "/balance");
    ref.get().then((snap) => {
        let current = snap.val() || 0;
        let newBal = current + amount;
        if (newBal < 0) newBal = 0;
        ref.set(newBal);
    });
};

// បង្កើតលេខរង្វាន់
function generateGameData() {
    targetNum = Math.floor(Math.random() * 90) + 10;
    document.getElementById("target-number").textContent = targetNum;

    const grid = document.getElementById("prize-grid");
    grid.innerHTML = "";
    
    for (let i = 0; i < 6; i++) {
        let randNum = Math.floor(Math.random() * 90) + 10;
        let item = document.createElement("div");
        item.style.cssText = "background:#1e293b; color:#fff; padding:10px; text-align:center; border-radius:6px; font-weight:bold;";
        item.innerHTML = `<div>${randNum}</div><div style="color:#f59e0b; font-size:11px;">${(ticketPrice * 2).toLocaleString()}៛</div>`;
        grid.appendChild(item);
    }
}

// គូរស្រទាប់ប្រាក់សម្រាប់កោស
function initCanvas() {
    const canvas = document.getElementById("scratch-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    canvas.width = canvas.offsetWidth || 300;
    canvas.height = canvas.offsetHeight || 180;

    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#475569";
    ctx.font = "16px Kantumruy Pro";
    ctx.fillText("កោសទីនេះ", canvas.width / 2 - 35, canvas.height / 2);

    let isDrawing = false;
    
    function scratch(e) {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    canvas.addEventListener("mousedown", () => isDrawing = true);
    canvas.addEventListener("mouseup", () => isDrawing = false);
    canvas.addEventListener("mousemove", scratch);

    canvas.addEventListener("touchstart", () => isDrawing = true);
    canvas.addEventListener("touchend", () => isDrawing = false);
    canvas.addEventListener("touchmove", scratch);
}

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
