// ==========================================
// 1. FIREBASE INITIALIZATION (ត្រូវនៅខាងលើគេបង្អស់)
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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

let BOT_TOKEN = "8840822540:AAHA_Tu065Ham9PIrp7BJS13wntlujoglqI";
let ADMIN_CHAT_ID = "6995747279";

// ទាញយកទិន្នន័យបម្រុងទុកពី Firebase (បើមាន)
database.ref('botToken').once('value').then((snapshot) => {
    if (snapshot.exists()) {
        const configData = snapshot.val();
        if (configData.botToken) BOT_TOKEN = configData.botToken;
        if (configData.adminChatId) ADMIN_CHAT_ID = configData.adminChatId.toString();
    }
}).catch(() => {});

// ==========================================
// 2. TELEGRAM MESSAGE SENDER
// ==========================================
function sendTelegramMessage(chatId, text) {
  if (!BOT_TOKEN) return;
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
  }).catch(err => console.error("Error sending TG message:", err));
}

// ==========================================
// 3. GLOBAL VARIABLES & TELEGRAM WEBAPP INIT
// ==========================================
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

let currentBalance = 0;
let ticketPrice = 1000;
let winRate = 30;
let targetNum = 0;
let isRevealed = false;
let currentWinAmount = 0;
let userIdNum = 6995747279;
let userName = "អ្នកប្រើប្រាស់";

const ADMIN_IDS = [6995747279]; 

document.addEventListener("DOMContentLoaded", () => {
    let tgUser = tg?.initDataUnsafe?.user;
    userIdNum = tgUser?.id || 6995747279;
    userName = tgUser ? (tgUser.username ? `@${tgUser.username}` : `${tgUser.first_name} ${tgUser.last_name || ''}`.trim()) : "អ្នកប្រើប្រាស់";

    const userNameEl = document.getElementById("user-name");
    const userCodeEl = document.getElementById("user-code");
    if (userNameEl) userNameEl.textContent = userName;
    if (userCodeEl) userCodeEl.textContent = `ID-${userIdNum}`;

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
            currentBalance = 10000;
            userRef.set({
                name: userName,
                balance: 10000,
                created_at: new Date().toISOString()
            });
        }
        const userBalEl = document.getElementById("user-balance");
        if (userBalEl) userBalEl.textContent = currentBalance.toLocaleString();
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

        isRevealed = false;
        generateGameData();
        initScratchCard();
    });

    // ប៊ូតុង កោសទាំងអស់
    document.getElementById("auto-scratch-btn").addEventListener("click", () => {
        revealFullCard();
    });

    // Setup មុខងារផ្សេងៗ
    setupModals();
    setupAdminLogic();
    setupWalletLogic();
    initScratchCard();
});

// ==========================================
// 4. MODAL & WALLET LOGIC
// ==========================================
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

    document.querySelectorAll(".close-modal, #close-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const modal = e.target.closest(".modal-backdrop");
            if (modal) modal.classList.add("hidden");
            if (e.target.id === "close-btn" && tg) tg.close();
        });
    });
}

function setupWalletLogic() {
    const submitDepositBtn = document.getElementById("submit-deposit-btn");
    if (submitDepositBtn) {
        submitDepositBtn.addEventListener("click", () => {
            const amtInput = document.getElementById("deposit-amount");
            const amt = parseInt(amtInput.value);
            if (isNaN(amt) || amt <= 0) {
                alert("សូមបញ្ចូលចំនួនប្រាក់ឱ្យបានត្រឹមត្រូវ!");
                return;
            }

            database.ref('deposits').push({
                userId: userIdNum,
                userName: userName,
                amount: amt,
                status: 'pending',
                timestamp: Date.now()
            });

            const msg = `📥 <b>សំណើបញ្ចូលប្រាក់</b>\nUser ID: ID-${userIdNum}\nឈ្មោះ: ${userName}\nចំនួន: <b>${amt.toLocaleString()} ៛</b>`;
            sendTelegramMessage(ADMIN_CHAT_ID, msg);

            alert("✅ សំណើបញ្ចូលប្រាក់ត្រូវបានផ្ញើជូន Admin!");
            amtInput.value = "";
            document.getElementById("wallet-modal").classList.add("hidden");
        });
    }
}

// ==========================================
// 5. ADMIN PANEL LOGIC
// ==========================================
function setupAdminLogic() {
    const winRateRef = database.ref("settings/winRate");
    winRateRef.on("value", (snap) => {
        if (snap.val() !== null) {
            winRate = snap.val();
            const input = document.getElementById("admin-win-rate");
            if (input) input.value = winRate;
        }
    });

    const saveWinBtn = document.getElementById("save-winrate-btn");
    if (saveWinBtn) {
        saveWinBtn.addEventListener("click", () => {
            const val = parseInt(document.getElementById("admin-win-rate").value);
            if (!isNaN(val)) {
                winRateRef.set(val).then(() => alert("រក្សាទុក Win Rate ជោគជ័យ!"));
            }
        });
    }

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

    document.getElementById("admin-add-btn")?.addEventListener("click", () => modifyUserBalance(true));
    document.getElementById("admin-deduct-btn")?.addEventListener("click", () => modifyUserBalance(false));
}

function modifyUserBalance(isAdd) {
    let targetInput = document.getElementById("admin-target-id").value.trim();
    let amount = parseInt(document.getElementById("admin-target-amount").value);
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
            alert(`ធ្វើបច្ចុប្បន្នភាពប្រាក់ ID-${rawId} ជោគជ័យ!`);
        });
    });
}

window.quickAddMoney = function(targetId, amount) {
    const ref = database.ref("users/" + targetId + "/balance");
    ref.get().then((snap) => {
        let current = snap.val() || 0;
        let newBal = current + amount;
        if (newBal < 0) newBal = 0;
        ref.set(newBal);
    });
};

// ==========================================
// 6. SCRATCH CARD GAME LOGIC
// ==========================================
function generateGameData() {
    targetNum = Math.floor(Math.random() * 90) + 10;
    const targetEl = document.getElementById("target-number");
    if (targetEl) targetEl.textContent = targetNum;

    const grid = document.getElementById("prize-grid");
    if (!grid) return;
    grid.innerHTML = "";
    
    currentWinAmount = 0;
    let isWin = Math.random() * 100 < winRate;

    for (let i = 0; i < 6; i++) {
        let randNum = Math.floor(Math.random() * 90) + 10;
        if (isWin && i === 0) {
            randNum = targetNum;
            currentWinAmount = ticketPrice * 2;
        }

        let item = document.createElement("div");
        item.style.cssText = "background:#1e293b; color:#fff; padding:10px; text-align:center; border-radius:6px; font-weight:bold;";
        item.innerHTML = `<div>${randNum}</div><div style="color:#f59e0b; font-size:11px;">${(ticketPrice * 2).toLocaleString()}៛</div>`;
        grid.appendChild(item);
    }

    const footerMsg = document.getElementById("ticket-footer-msg");
    if (footerMsg) footerMsg.innerHTML = `<span id="prize-text">សូមកោសដើម្បីមើលលទ្ធផល!</span>`;
}

let isDrawing = false;
let canvas, ctx;

function initScratchCard() {
    canvas = document.getElementById('scratch-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    canvas.style.display = 'block';
    canvas.style.opacity = '1';
    canvas.width = canvas.offsetWidth || 300;
    canvas.height = 200;

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'bold 20px Kantumruy Pro, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('កោសទីនេះដើម្បីផ្សងសំណាង', canvas.width / 2, canvas.height / 2);

    ctx.globalCompositeOperation = 'destination-out';

    canvas.onmousedown = () => isDrawing = true;
    canvas.onmousemove = scratchDraw;
    window.onmouseup = () => { isDrawing = false; checkRevealProgress(); };

    canvas.ontouchstart = () => isDrawing = true;
    canvas.ontouchmove = scratchDraw;
    window.ontouchend = () => { isDrawing = false; checkRevealProgress(); };
}

function scratchDraw(e) {
    if (!isDrawing || !canvas) return;
    e.preventDefault();
    
    let rect = canvas.getBoundingClientRect();
    let clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    let clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2, false);
    ctx.fill();
}

function checkRevealProgress() {
    if (isRevealed || !canvas || !ctx) return;

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) transparentPixels++;
    }

    let percentage = (transparentPixels / (pixels.length / 4)) * 100;

    if (percentage > 40) {
        revealFullCard();
    }
}

function revealFullCard() {
    if (isRevealed) return;
    isRevealed = true;
    
    if (canvas) {
        canvas.style.opacity = '0';
        setTimeout(() => { canvas.style.display = 'none'; }, 200);
    }

    const prizeText = document.getElementById('prize-text');
    if (prizeText) {
        if (currentWinAmount > 0) {
            prizeText.innerHTML = `🎉 សូមអបអរសាទរ!<br/>ឈ្នះទឹកប្រាក់: <span style="color:#ffb703;">${currentWinAmount.toLocaleString()} ៛</span>`;
            currentBalance += currentWinAmount;
            database.ref("users/" + userIdNum).update({ balance: currentBalance });
        } else {
            prizeText.innerHTML = `❌ សូមអភ័យទោស មិនត្រូវសំណាងទេ!`;
        }
    }
}
