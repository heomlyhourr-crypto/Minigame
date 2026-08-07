// ==========================================
// 1. FIREBASE INITIALIZATION
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
function sendDepositApprovalToAdmin(chatId, amt, userId, userName, receiptUrl = "") {
  if (!BOT_TOKEN) return;
  
  let msg = `📥 <b>សំណើបញ្ចូលប្រាក់ (KHQR)</b>\n` +
            `User ID: ID-${userId}\n` +
            `ឈ្មោះ: ${userName}\n` +
            `ចំនួន: <b>${amt.toLocaleString()} ៛</b>`;
            
  if (receiptUrl) {
      msg += `\nវិកាយប័ត្រ: ${receiptUrl}`;
  }

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "❌ មិនយល់ព្រម", callback_data: `deposit_reject_${userId}_${amt}` },
        { text: "✅ យល់ព្រម", callback_data: `deposit_accept_${userId}_${amt}` }
      ]
    ]
  };

  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      chat_id: chatId, 
      text: msg, 
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard
    })
  }).catch(err => console.error("Error sending TG message:", err));
}

function sendWithdrawApprovalToAdmin(chatId, amt, userId, userName, remainingBal, bankUrl) {
  if (!BOT_TOKEN) return;

  const msg = `📤 <b>សំណើដកប្រាក់</b>\n` +
              `User ID: ID-${userId}\n` +
              `ឈ្មោះ: ${userName}\n` +
              `ចំនួនទឹកប្រាក់: <b>${amt.toLocaleString()} ៛</b>\n` +
              `URL ធនាគារ: ${bankUrl}\n` +
              `សមតុល្យនៅសល់: <b>${remainingBal.toLocaleString()} ៛</b>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "❌ មិនយល់ព្រម (សងប្រាក់វិញ)", callback_data: `withdraw_reject_${userId}_${amt}` },
        { text: "✅ យល់ព្រម (បញ្ជាក់ការដក)", callback_data: `withdraw_accept_${userId}_${amt}` }
      ]
    ]
  };

  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      chat_id: chatId, 
      text: msg, 
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard
    })
  }).catch(err => console.error("Error sending TG message:", err));
}

// ==========================================
// 3. GLOBAL VARIABLES & WEBAPP INIT
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
let isRevealed = true; 
let currentWinAmount = 0;
let userIdNum = 6995747279;
let userName = "អ្នកប្រើប្រាស់";
let savedTickets = []; 

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

    document.getElementById("buy-ticket-btn").addEventListener("click", () => {
        if (currentBalance < ticketPrice) {
            alert("សមតុល្យប្រាក់មិនគ្រប់គ្រាន់ទេ!");
            return;
        }

        currentBalance -= ticketPrice;
        userRef.update({ balance: currentBalance });

        if (!isRevealed) {
            savedTickets.push(ticketPrice);
            updateTicketBadge();
            alert(`✅ បានទិញសន្លឹកតម្លៃ ${ticketPrice.toLocaleString()}៛ ទុកក្នុងស្តុករួចរាល់! (${savedTickets.length} សន្លឹកក្នុងស្តុក)`);
            return;
        }

        isRevealed = false;
        generateGameData(ticketPrice);
        initScratchCard();
    });

    document.getElementById("auto-scratch-btn").addEventListener("click", () => {
        revealFullCard();
    });

    injectExtraWalletUI();
    setupModals();
    setupAdminLogic();
    setupWalletLogic();
    resetEmptyCard();
});
// ==========================================
// 4. UI & LOBBY LOGIC
// ==========================================
function openGame(gameId) {
    if (gameId === 'game1') {
        const lobby = document.getElementById('game-lobby-view');
        const gameView = document.getElementById('game1-view');
        const footer = document.getElementById('game-footer');

        if (lobby) lobby.style.display = 'none';
        if (gameView) gameView.classList.remove('hidden');
        if (footer) footer.classList.remove('hidden');
        
        resetEmptyCard();
    }
}


function backToLobby() {
    document.getElementById('game1-view').classList.add('hidden');
    document.getElementById('game-footer').classList.add('hidden');
    document.getElementById('game-lobby-view').classList.remove('hidden');
}

function injectExtraWalletUI() {
    const modalBody = document.querySelector('#wallet-modal .modal-body');
    if (modalBody && !document.getElementById('khqr-section-added')) {
        const extraDiv = document.createElement('div');
        extraDiv.id = 'khqr-section-added';
        extraDiv.innerHTML = '<hr style="border-color:#334155; margin:12px 0;">' +
            '<h4 style="color:#f59e0b; margin-bottom:6px;">💳 បញ្ចូលទឹកប្រាក់</h4>' +
            '<div style="font-size:11px; color:#94a3b8; margin-bottom:6px;">វាយបញ្ចូលទឹកប្រាក់ ឬជ្រើសរើសដើម្បីបន្ត</div>' +
            '<input type="number" id="khqr-amount" placeholder="ចំនួនទឹកប្រាក់បង់ (៛)" class="admin-input" style="margin-bottom:6px;">' +
            '<input type="text" id="receipt-url" placeholder="បញ្ជាក់វិកាយប័ត្រ (បញ្ជូល Image URL)" class="admin-input" style="margin-bottom:6px;">' +
            '<div id="dynamic-action-container">' +
            '<button id="submit-qr-btn" class="btn-emerald" style="width:100%; padding:8px; border-radius:8px; background:#059669; color:#fff; font-weight:700; border:none; cursor:pointer;">រួចរាល់ (ធ្វើវិកាយប័ត្រជូន Admin)</button>' +
            '</div>';
        modalBody.appendChild(extraDiv);

        // ភ្ជាប់ព្រឹត្តិការណ៍ចុចប៊ូតុងភ្លាមៗនៅពេលបង្កើតរួច
        const submitQrBtn = document.getElementById("submit-qr-btn");
        const actionContainer = document.getElementById("dynamic-action-container");

        if (submitQrBtn && actionContainer) {
            submitQrBtn.addEventListener("click", () => {
                const amount = document.getElementById("khqr-amount").value;
                if (!amount) {
                    alert("សូមបញ្ចូលចំនួនទឹកប្រាក់ជាមុនសិន!");
                    return;
                }

                actionContainer.innerHTML = '<div style="background:#1e293b; padding:10px; border-radius:8px; text-align:center; border:1px solid #334155;">' +
                    '<p style="color:#f59e0b; font-size:12px; margin-bottom:8px; font-weight:bold;">⏳ កំពុងពិនិត្យមើល និងនាំទៅកាន់ធនាគារ...</p>' +
                    '</div>';

                // បើកលីងធនាគារភ្លាមៗ
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openLink) {
                    window.Telegram.WebApp.openLink('https://abr.ge/ium8cp');
                } else {
                    window.location.href = 'https://abr.ge/ium8cp';
                }
            });
        }
    }
}

function updateTicketBadge() {
    const buyBtn = document.getElementById("buy-ticket-btn");
    if (buyBtn) {
        if (savedTickets.length > 0) {
            buyBtn.innerHTML = `ទិញសន្លឹកឆ្នោត (${ticketPrice.toLocaleString()} ៛) <span style="background:red; color:#fff; padding:2px 6px; border-radius:10px; font-size:11px;">ស្តុក: ${savedTickets.length}</span>`;
        } else {
            buyBtn.innerHTML = `ទិញសន្លឹកឆ្នោត <span id="buy-price-tag">${ticketPrice.toLocaleString()} ៛</span>`;
        }
    }
}

function resetEmptyCard() {
    const targetEl = document.getElementById("target-number");
    if (targetEl) targetEl.textContent = "--";

    const grid = document.getElementById("prize-grid");
    if (grid) {
        grid.innerHTML = "";
        for (let i = 0; i < 6; i++) {
            let item = document.createElement("div");
            item.style.cssText = "background:#1e293b; color:#64748b; padding:10px; text-align:center; border-radius:6px; font-weight:bold;";
            item.innerHTML = `<div>--</div><div style="font-size:11px;">-----</div>`;
            grid.appendChild(item);
        }
    }

    const footerMsg = document.getElementById("ticket-footer-msg");
    if (footerMsg) footerMsg.innerHTML = `<span id="prize-text">សូមចុចទិញសន្លឹកឆ្នោតដើម្បីចាប់ផ្តើម!</span>`;
    
    const canvas = document.getElementById('scratch-canvas');
    if (canvas) {
        canvas.style.display = 'none';
    }
}

// ==========================================
// 5. MODAL & WALLET LOGIC
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

            sendDepositApprovalToAdmin(ADMIN_CHAT_ID, amt, userIdNum, userName);

            alert("✅ សំណើបញ្ចូលប្រាក់ត្រូវបានផ្ញើជូន Admin!");
            amtInput.value = "";
            document.getElementById("wallet-modal").classList.add("hidden");
        });
    }

    const submitQrBtn = document.getElementById("submit-qr-btn");
    if (submitQrBtn) {
        submitQrBtn.addEventListener("click", () => {
            const amtInput = document.getElementById("khqr-amount");
            const receiptInput = document.getElementById("receipt-url");
            const amt = parseInt(amtInput ? amtInput.value : 0);
            const receiptUrl = receiptInput ? receiptInput.value : "";

            if (isNaN(amt) || amt <= 0) {
                alert("សូមបញ្ចូលចំនួនទឹកប្រាក់បង់តាម KHQR!");
                return;
            }

            database.ref('deposits').push({
                userId: userIdNum,
                userName: userName,
                amount: amt,
                type: 'KHQR',
                receiptUrl: receiptUrl,
                status: 'pending',
                timestamp: Date.now()
            });

            sendDepositApprovalToAdmin(ADMIN_CHAT_ID, amt, userIdNum, userName, receiptUrl);

            alert("✅ បានផ្ញើវិកាយប័ត្រ និងសំណើ KHQR ជូន Admin រួចរាល់!");
            if (amtInput) amtInput.value = "";
            if (receiptInput) receiptInput.value = "";
            document.getElementById("wallet-modal").classList.add("hidden");
        });
    }

    const submitWithdrawBtn = document.getElementById("submit-withdraw-btn");
    if (submitWithdrawBtn) {
        submitWithdrawBtn.addEventListener("click", () => {
            const withdrawInput = document.getElementById("withdraw-amount");
            const bankUrlInput = document.getElementById("bank-url");
            const amt = parseInt(withdrawInput ? withdrawInput.value : 0);
            const bankUrl = bankUrlInput ? bankUrlInput.value.trim() : "";
            
            if (isNaN(amt) || amt <= 0) {
                alert("សូមបញ្ចូលចំនួនប្រាក់ដកឱ្យបានត្រឹមត្រូវ!");
                return;
            }

            if (!bankUrl) {
                alert("សូមវាយបញ្ចូល URL ធនាគាររបស់អ្នកសម្រាប់ទទួលប្រាក់!");
                return;
            }

            if (currentBalance < amt) {
                alert("សមតុល្យប្រាក់របស់អ្នកមិនគ្រប់គ្រាន់សម្រាប់ដកទេ!");
                return;
            }

            let newBalance = currentBalance - amt;
            const userRef = database.ref("users/" + userIdNum);

            userRef.update({ balance: newBalance }).then(() => {
                database.ref('withdrawals').push({
                    userId: userIdNum,
                    userName: userName,
                    amount: amt,
                    bankUrl: bankUrl,
                    status: 'pending',
                    timestamp: Date.now()
                });

                sendWithdrawApprovalToAdmin(ADMIN_CHAT_ID, amt, userIdNum, userName, newBalance, bankUrl);

                alert("✅ សំណើដកប្រាក់ត្រូវបានដាក់ស្នើ និងកាត់ទឹកប្រាក់ជោគជ័យ!");
                if (withdrawInput) withdrawInput.value = "";
                if (bankUrlInput) bankUrlInput.value = "";
                document.getElementById("wallet-modal").classList.add("hidden");
            }).catch((error) => {
                console.error("Error updating balance:", error);
                alert("មានបញ្ហាក្នុងការកាត់ប្រាក់ សូមព្យាយាមម្ដងទៀត!");
            });
        });
    }
}

// ==========================================
// 6. ADMIN PANEL LOGIC
// ==========================================
// ==========================================
// 6. ADMIN PANEL LOGIC (Updated)
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

    // Add Balance by User ID
    const addBalBtn = document.getElementById("admin-add-balance-btn");
    if (addBalBtn) {
        addBalBtn.addEventListener("click", () => {
            const targetId = document.getElementById("admin-target-userid").value.trim();
            const amount = parseInt(document.getElementById("admin-adjust-amount").value);

            if (!targetId || isNaN(amount) || amount <= 0) {
                alert("សូមបញ្ចូល User ID និងចំនួនទឹកប្រាក់ឱ្យបានត្រឹមត្រូវ!");
                return;
            }

            const targetUserRef = database.ref("users/" + targetId);
            targetUserRef.once("value").then(snapshot => {
                if (snapshot.exists()) {
                    const currentBal = snapshot.val().balance || 0;
                    const newBal = currentBal + amount;
                    targetUserRef.update({ balance: newBal }).then(() => {
                        alert(`✅ បានបន្ថែមទឹកប្រាក់ ${amount.toLocaleString()} ៛ ជូន User ID: ${targetId} ជោគជ័យ!`);
                    });
                } else {
                    alert("រកមិនឃើញ User ID ນេះនៅក្នុងប្រព័ន្ធទេ!");
                }
            });
        });
    }

    // Deduct Balance by User ID
    const deductBalBtn = document.getElementById("admin-deduct-balance-btn");
    if (deductBalBtn) {
        deductBalBtn.addEventListener("click", () => {
            const targetId = document.getElementById("admin-target-userid").value.trim();
            const amount = parseInt(document.getElementById("admin-adjust-amount").value);

            if (!targetId || isNaN(amount) || amount <= 0) {
                alert("សូមបញ្ចូល User ID និងចំនួនទឹកប្រាក់ឱ្យបានត្រឹមត្រូវ!");
                return;
            }

            const targetUserRef = database.ref("users/" + targetId);
            targetUserRef.once("value").then(snapshot => {
                if (snapshot.exists()) {
                    const currentBal = snapshot.val().balance || 0;
                    const newBal = Math.max(0, currentBal - amount);
                    targetUserRef.update({ balance: newBal }).then(() => {
                        alert(`✅ បានកាត់ទឹកប្រាក់ ${amount.toLocaleString()} ៛ ពី User ID: ${targetId} ជោគជ័យ!`);
                    });
                } else {
                    alert("រកមិនឃើញ User ID នេះនៅក្នុងប្រព័ន្ធទេ!");
                }
            });
        });
    }

    // Search User Stats & History
    const searchBtn = document.getElementById("admin-search-btn");
    if (searchBtn) {
        searchBtn.addEventListener("click", () => {
            const searchId = document.getElementById("admin-search-userid").value.trim();
            const resultDiv = document.getElementById("admin-user-stats-result");

            if (!searchId) {
                alert("សូមបញ្ចូល ID User ដែលត្រូវស្វែងរក!");
                return;
            }

            database.ref("users/" + searchId).once("value").then(snapshot => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const name = userData.name || "Unknown";
                    const bal = userData.balance || 0;
                    resultDiv.innerHTML = `
                        <div><b>ID:</b> ${searchId} (${name})</div>
                        <div>សមតុល្យបច្ចុប្បន្ន: <span style="color:#fbbf24;">${bal.toLocaleString()} ៛</span></div>
                        <div>ស្ថានភាព: សកម្មធម្មតា</div>
                    `;
                } else {
                    resultDiv.innerHTML = `<div style="color:#f87171;">រកមិនឃើញទិន្នន័យសម្រាប់ User ID: ${searchId} ទេ</div>`;
                }
            });
        });
    }
}


// ==========================================
// 7. SCRATCH CARD GAME LOGIC
// ==========================================
function generateGameData(price) {
    targetNum = Math.floor(Math.random() * 90) + 10;
    const targetEl = document.getElementById("target-number");
    if (targetEl) targetEl.textContent = targetNum;

    const grid = document.getElementById("prize-grid");
    if (!grid) return;
    grid.innerHTML = "";
    
    currentWinAmount = 0;
    let isWin = Math.random() * 100 < winRate;

    let possiblePrizes = [price, price * 2, price * 5, price * 10];
    if (price >= 10000) {
        possiblePrizes = [10000, 20000, 50000, 100000];
    } else if (price >= 5000) {
        possiblePrizes = [5000, 10000, 20000, 50000];
    }

    for (let i = 0; i < 6; i++) {
        let randNum = Math.floor(Math.random() * 90) + 10;
        let randomPrize = possiblePrizes[Math.floor(Math.random() * possiblePrizes.length)];

        if (isWin && i === 0) {
            randNum = targetNum;
            currentWinAmount = randomPrize;
        }

        let item = document.createElement("div");
        item.style.cssText = "background:#1e293b; color:#fff; padding:10px; text-align:center; border-radius:6px; font-weight:bold;";
        item.innerHTML = `<div>${randNum}</div><div style="color:#f59e0b; font-size:11px;">${randomPrize.toLocaleString()}៛</div>`;
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

    setTimeout(() => {
        if (savedTickets.length > 0) {
            let nextPrice = savedTickets.shift(); 
            updateTicketBadge();
            isRevealed = false;
            generateGameData(nextPrice);
            initScratchCard();
        }
    }, 1500);
}