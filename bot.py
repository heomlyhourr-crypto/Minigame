# Let's generate a complete, updated script.js file that implements the 15-box lottery ticket layout (as seen in image 2), 
# with numbers and prizes associated with each box, maintaining win rates and price tiers (1,000៛, 2,000៛, 4,000៛, 5,000៛, 10,000៛).
# Prizes distribution scale based on user's instruction: 
# 2,000៛ (15), 4,000៛ (15), 6,000៛ (10), 10,000៛ (10), 100,000៛ (5), up to 1,000,000៛ / 100,000,000៛ (2) scaled/scaled down by ticket price tier, or proportional.
# Let's write the code clearly.

js_code = 
// --- CONFIGURATION & FIREBASE INITIALIZATION ---
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
const db = firebase.database();

const tg = window.Telegram.WebApp;
tg.expand();

let currentUser = {
    id: "USER_" + Math.floor(Math.random() * 900000 + 100000),
    name: "Player",
    balance: 136000,
    winRate: 50
};

let currentPrice = 10000;
let currentBank = 'ABA';

const bankData = {
    ABA: {
        name: "KONGKEA MACH (ABA)",
        qr: "https://drive.google.com/uc?export=view&id=1gxc0NeP-oc4JGXvqdk-jsqjLQp3y6EDr"
    },
    ACLEDA: {
        name: "KONGKEA MACH (ACLEDA)",
        qr: "https://drive.google.com/uc?export=view&id=1gxc0NeP-oc4JGXvqdk-jsqjLQp3y6EDr"
    }
};

// DOM Elements
const userNameEl = document.getElementById('user-name');
const userCodeEl = document.getElementById('user-code');
const userBalanceEl = document.getElementById('user-balance');
const targetNumberEl = document.getElementById('target-number');
const winningNumbersContainer = document.getElementById('winning-numbers-container'); // Top 2 cups / numbers
const prizeGridEl = document.getElementById('prize-grid'); // 15 boxes
const ticketFooterMsg = document.getElementById('ticket-footer-msg');
const buyTicketBtn = document.getElementById('buy-ticket-btn');
const buyPriceTag = document.getElementById('buy-price-tag');
const ticketPriceDisplay = document.getElementById('ticket-price-display');

const walletModal = document.getElementById('wallet-modal');
const historyModal = document.getElementById('history-modal');
const adminModal = document.getElementById('admin-modal');

window.addEventListener('DOMContentLoaded', () => {
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const tgUser = tg.initDataUnsafe.user;
        currentUser.id = "ID-" + tgUser.id;
        currentUser.name = tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : "");
    }

    if(userNameEl) userNameEl.innerText = currentUser.name;
    if(userCodeEl) userCodeEl.innerText = currentUser.id;

    const userRef = db.ref('users/' + currentUser.id);
    userRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            currentUser.balance = data.balance !== undefined ? data.balance : 136000;
            currentUser.winRate = data.winRate !== undefined ? data.winRate : 50;
        } else {
            userRef.set({
                name: currentUser.name,
                balance: 136000,
                winRate: 50
            });
            currentUser.balance = 136000;
            currentUser.winRate = 50;
        }
        updateUIBalance();
        checkAdminAccess();
    });

    setupEventListeners();
    generateNewTicket();
});

function updateUIBalance() {
    if(userBalanceEl) userBalanceEl.innerText = currentUser.balance.toLocaleString() + " ៛";
}

function checkAdminAccess() {
    const adminBtn = document.getElementById('admin-btn');
    if(adminBtn) adminBtn.style.display = 'block';
}

// --- 15-BOX LOTTERY GAME LOGIC ---
let targetNums = []; // Winning numbers (e.g., 2 numbers on top)
let boxDataList = []; // 15 boxes, each has {number, prize, scratched}

// Prize pool proportional to ticket price
function getPrizePool(price) {
    let multiplier = price / 1000;
    return [
        2000 * multiplier, 4000 * multiplier, 6000 * multiplier, 10000 * multiplier, 
        20000 * multiplier, 50000 * multiplier, 100000 * multiplier, 200000 * multiplier,
        500000 * multiplier, 1000000 * multiplier, 5000000 * multiplier, 10000000 * multiplier,
        20000000 * multiplier, 50000000 * multiplier, 100000000 * multiplier
    ];
}

function generateNewTicket() {
    if(ticketFooterMsg) {
        ticketFooterMsg.innerText = "សូមកោសប្រអប់ទាំង ១៥ ដើម្បីផ្ទៀងផ្ទាត់សំណាង!";
        ticketFooterMsg.style.color = "#fbbf24";
    }

    // Generate 2 target winning numbers (top cups)
    targetNums = [
        Math.floor(Math.random() * 90 + 10),
        Math.floor(Math.random() * 90 + 10)
    ];
    
    // Render target numbers on top
    const targetContainer = document.getElementById('target-numbers-container');
    if(targetContainer) {
        targetContainer.innerHTML = `
            <div class="target-badge">លេខឈ្នះទី១: <b>${targetNums[0]}</b></div>
            <div class="target-badge">លេខឈ្នះទី២: <b>${targetNums[1]}</b></div>
        `;
    }

    boxDataList = [];
    if(prizeGridEl) prizeGridEl.innerHTML = '';

    const willWin = Math.random() * 100 < currentUser.winRate;
    const winningBoxIndex = willWin ? Math.floor(Math.random() * 15) : -1;
    const matchedTarget = willWin ? targetNums[Math.floor(Math.random() * targetNums.length)] : null;

    const possiblePrizes = getPrizePool(currentPrice);

    for (let i = 0; i < 15; i++) {
        let num;
        if (i === winningBoxIndex) {
            num = matchedTarget;
        } else {
            do {
                num = Math.floor(Math.random() * 90 + 10);
            } while (targetNums.includes(num));
        }

        let prize = possiblePrizes[Math.floor(Math.random() * possiblePrizes.length)];
        if (i === winningBoxIndex) {
            prize = currentPrice * (Math.floor(Math.random() * 10) + 5); // Winning big prize
        }

        boxDataList.push({ id: i, number: num, prize: prize, scratched: false });

        // Create 15 boxes with canvas or scratch cover effect
        const boxWrapper = document.createElement('div');
        boxWrapper.className = 'scratch-box-item';
        boxWrapper.innerHTML = `
            <div class="box-content" id="content-${i}">
                <div class="box-num">${num}</div>
                <div class="box-prize">${prize.toLocaleString()} ៛</div>
            </div>
            <canvas class="box-canvas" id="canvas-${i}" width="80" height="70"></canvas>
        `;
        prizeGridEl.appendChild(boxWrapper);

        initBoxCanvas(i);
    }
}

function initBoxCanvas(index) {
    const canvas = document.getElementById(`canvas-${index}`);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡ កោស ⚡', canvas.width / 2, canvas.height / 2);
    
    ctx.globalCompositeOperation = 'destination-out';

    let isScratching = false;

    const scratchMove = (e) => {
        if (!isScratching) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();

        checkScratchComplete(index);
    };

    canvas.addEventListener('mousedown', () => isScratching = true);
    canvas.addEventListener('mousemove', scratchMove);
    window.addEventListener('mouseup', () => isScratching = false);

    canvas.addEventListener('touchstart', () => isScratching = true);
    canvas.addEventListener('touchmove', scratchMove);
    window.addEventListener('touchend', () => isScratching = false);
}

function checkScratchComplete(index) {
    boxDataList[index].scratched = true;
    
    // Check if any scratched box matches targetNums
    const box = boxDataList[index];
    if (targetNums.includes(box.number)) {
        ticketFooterMsg.innerHTML = `🎉 សូមអបអរសាទរ! ឈ្នះទឹកប្រាក់: <b style="color:#22c55e;">${box.prize.toLocaleString()} ៛</b>`;
        currentUser.balance += box.prize;
        db.ref('users/' + currentUser.id).update({ balance: currentUser.balance });
        updateUIBalance();
    }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    const closeBtn = document.getElementById('close-btn');
    if(closeBtn) closeBtn.addEventListener('click', () => tg.close());

    // Price buttons
    document.querySelectorAll('.price-btn').forEach(btn => {
        if(btn.id !== 'auto-scratch-btn') {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.price-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentPrice = parseInt(e.target.dataset.price);
                if(buyPriceTag) buyPriceTag.innerText = currentPrice.toLocaleString() + " ៛";
                if(ticketPriceDisplay) ticketPriceDisplay.innerText = currentPrice.toLocaleString() + " ៛";
                generateNewTicket();
            });
        }
    });

    // Scratch All Button
    const autoScratchBtn = document.getElementById('auto-scratch-btn');
    if(autoScratchBtn) {
        autoScratchBtn.addEventListener('click', () => {
            boxDataList.forEach((box, i) => {
                const canvas = document.getElementById(`canvas-${i}`);
                if(canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            });
            // Check total win
            let totalWin = 0;
            boxDataList.forEach(box => {
                if(targetNums.includes(box.number)) {
                    totalWin += box.prize;
                }
            });
            if(totalWin > 0) {
                ticketFooterMsg.innerHTML = `🎉 ឈ្នះសរុប: <b style="color:#22c55e;">${totalWin.toLocaleString()} ៛</b>`;
                currentUser.balance += totalWin;
            } else {
                ticketFooterMsg.innerHTML = "❌ អហង្គសំណាង! សូមព្យាយាមម្ដងទៀត។";
            }
            db.ref('users/' + currentUser.id).update({ balance: currentUser.balance });
            updateUIBalance();
        });
    }

    // Buy ticket
    if(buyTicketBtn) {
        buyTicketBtn.addEventListener('click', () => {
            if (currentUser.balance < currentPrice) {
                alert('សមតុល្យប្រាក់របស់អ្នកមិនគ្រប់គ្រាន់ទេ!');
                return;
            }
            currentUser.balance -= currentPrice;
            db.ref('users/' + currentUser.id).update({ balance: currentUser.balance });
            updateUIBalance();
            generateNewTicket();
        });
    }

    // Modals
    const walletBtn = document.getElementById('wallet-btn');
    if(walletBtn) walletBtn.addEventListener('click', () => walletModal.classList.remove('hidden'));
    
    const historyBtn = document.getElementById('history-btn');
    if(historyBtn) historyBtn.addEventListener('click', () => historyModal.classList.remove('hidden'));

    const adminBtn = document.getElementById('admin-btn');
    if(adminBtn) adminBtn.addEventListener('click', () => adminModal.classList.remove('hidden'));

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-backdrop').classList.add('hidden');
        });
    });
}
"""

with open("script.js", "w", encoding="utf-8") as f:
    f.write(js_code)

print("Generated script.js successfully!")

