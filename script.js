// ==================== 1. CONFIG & INITIALIZATION ====================
const BOT_TOKEN = "8884525036:AAHuEGGkgZyZMxXGMZvU9evCwTndG2Jp9Bs";
const ADMIN_CHAT_ID = "6995747279";

const firebaseConfig = {
    apiKey: "AIzaSyCcGDjnR4gjlvW5eKMJClFSmvZePi7lQh0",
    authDomain: "mini-shopping-9582e.firebaseapp.com",
    databaseURL: "https://mini-shopping-9582e-default-rtdb.firebaseio.com",
    projectId: "mini-shopping-9582e",
    storageBucket: "mini-shopping-9582e.firebasestorage.app",
    messagingSenderId: "2435912321",
    appId: "1:2435912321:web:733f2065458b76b03e7380"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) { tg.ready(); tg.expand(); }

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id') || (tg && tg.initDataUnsafe?.user ? tg.initDataUnsafe.user.id.toString() : 'guest');
const userName = urlParams.get('name') || (tg && tg.initDataUnsafe?.user ? tg.initDataUnsafe.user.first_name : 'អតិថិជន');

const userRef = db.ref('users/' + userId);
const POOL_REF = db.ref('system_pool');

// Game State
const state = {
    balance: 0,
    userCode: '',
    selectedPrice: 1000,
    globalWinRate: 30,
    ticketActive: false,
    isScratchedEnough: false,
    soundEnabled: true,
    targetNumber: 0,
    prizeCells: [],
    totalWonInCurrentTicket: 0
};

// ==================== 2. SOUND EFFECTS SYNTHESIZER ====================
const AudioFX = {
    ctx: null,
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
    },
    playScratch() {
        if (!state.soundEnabled) return;
        this.init();
        try {
            const bufferSize = this.ctx.sampleRate * 0.04;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
            const whiteNoise = this.ctx.createBufferSource();
            whiteNoise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass'; filter.frequency.value = 1000;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
            whiteNoise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
            whiteNoise.start();
        } catch(e) {}
    },
    playWin() {
        if (!state.soundEnabled) return;
        this.init();
        try {
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, now + idx * 0.1);
                gain.gain.setValueAtTime(0.2, now + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
                osc.connect(gain); gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.1); osc.stop(now + idx * 0.1 + 0.3);
            });
        } catch(e) {}
    },
    playClick() {
        if (!state.soundEnabled) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + 0.05);
        } catch(e) {}
    }
};

// ==================== 3. FIREBASE REALTIME LISTENERS ====================
if (userId === ADMIN_CHAT_ID) {
    document.getElementById('admin-btn').style.display = 'inline-flex';
}

userRef.on('value', (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        state.balance = data.balance || 0;
        state.userCode = data.code || '';
    } else {
        state.userCode = 'ID-' + Math.floor(100000 + Math.random() * 900000);
        state.balance = 0;
        userRef.set({
            name: userName, code: state.userCode, balance: 0,
            totalDeposit: 0, totalWithdraw: 0, joinedAt: Date.now(),
            role: userId === ADMIN_CHAT_ID ? 'admin' : 'user'
        });
    }
    document.getElementById('user-name').innerText = userName;
    document.getElementById('user-code').innerText = state.userCode;
    document.getElementById('user-balance').innerText = state.balance.toLocaleString();
});

db.ref('settings/winRate').on('value', (snapshot) => {
    if (snapshot.exists()) state.globalWinRate = parseInt(snapshot.val());
});

function checkAndResetWeeklyPool() {
    POOL_REF.once('value').then(snapshot => {
        const data = snapshot.val() || {};
        const now = Date.now();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        if (!data.lastReset || (now - data.lastReset) >= SEVEN_DAYS) {
            POOL_REF.set({ poolAmount: 0, lastReset: now });
        }
    });
}
checkAndResetWeeklyPool();

function sendTelegramMessage(chatId, text) {
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
    }).catch(err => console.error("Error sending TG:", err));
}

// ==================== 4. CANVAS & SCRATCH ENGINE ====================
const canvas = document.getElementById('scratch-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    if (!state.ticketActive) drawInitialCover("ចុច 'ទិញសន្លឹកឆ្នោត' ដើម្បីចាប់ផ្តើម");
}

function drawInitialCover(msg) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 15px "Kantumruy Pro", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
}

function drawScratchFoil() {
    const w = canvas.width, h = canvas.height;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#94a3b8'); grad.addColorStop(0.5, '#64748b'); grad.addColorStop(1, '#475569');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(w * 0.1, h * 0.4, w * 0.8, h * 0.2, 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fef08a'; ctx.font = 'bold 15px "Kantumruy Pro", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('កោសទីនេះដើម្បីមើលរង្វាន់', w / 2, h * 0.47);
    ctx.restore();
}

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ==================== 5. PRIZE POOL & GENERATE TICKET ====================
function buyTicket() {
    AudioFX.playClick();
    if (state.balance < state.selectedPrice) {
        return alert("សមតុល្យទឹកប្រាក់មិនគ្រប់គ្រាន់ទេ! សូមបញ្ចូលប្រាក់បន្ថែម");
    }

    state.balance -= state.selectedPrice;
    userRef.update({ balance: state.balance });

    const houseContribution = state.selectedPrice * 0.50;
    POOL_REF.transaction(poolData => {
        if (!poolData) poolData = { poolAmount: 0, lastReset: Date.now() };
        poolData.poolAmount = (poolData.poolAmount || 0) + houseContribution;
        return poolData;
    }, (error, committed, snapshot) => {
        if (committed) {
            const currentPool = snapshot.val().poolAmount;
            generateTicketLogic(currentPool);
        }
    });
}

function generateTicketLogic(currentPool) {
    state.targetNumber = getRandomInt(11, 99);
    document.getElementById('target-number').textContent = state.targetNumber;

    const winAttempt = (Math.random() * 100) < state.globalWinRate;
    let winningIndex = -1;
    let chosenMultiplier = 1;

    if (winAttempt) {
        const multipliers = [1, 2, 5, 10];
        chosenMultiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
        const potentialWin = state.selectedPrice * chosenMultiplier;

        if (currentPool >= potentialWin) {
            winningIndex = Math.floor(Math.random() * 9);
            POOL_REF.child('poolAmount').transaction(amt => (amt || 0) - potentialWin);
        }
    }

    state.prizeCells = [];
    state.totalWonInCurrentTicket = 0;
    const gridEl = document.getElementById('prize-grid');
    gridEl.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        let cellNum, prizeVal;
        if (i === winningIndex) {
            cellNum = state.targetNumber;
            prizeVal = state.selectedPrice * chosenMultiplier;
            state.totalWonInCurrentTicket += prizeVal;
        } else {
            do { cellNum = getRandomInt(11, 99); } while (cellNum === state.targetNumber);
            prizeVal = state.selectedPrice * [1, 2, 5][Math.floor(Math.random() * 3)];
        }

        state.prizeCells.push({ number: cellNum, prize: prizeVal, isMatch: (cellNum === state.targetNumber) });

        const cellDiv = document.createElement('div');
        cellDiv.className = 'prize-cell';
        cellDiv.id = `cell-${i}`;
        cellDiv.innerHTML = `
            <div class="cell-label">លេខផ្គូផ្គង</div>
            <div class="cell-num">${cellNum}</div>
            <div class="cell-prize">${prizeVal.toLocaleString()}៛</div>
        `;
        gridEl.appendChild(cellDiv);
    }

    state.ticketActive = true;
    state.isScratchedEnough = false;

    drawScratchFoil();
    document.getElementById('buy-ticket-btn').disabled = true;
    const footerMsg = document.getElementById('ticket-footer-msg');
    footerMsg.textContent = 'សូមកោសក្រឡាខាងលើដើម្បីផ្ទៀងផ្ទាត់លេខ!';
    footerMsg.style.backgroundColor = 'rgba(69, 26, 3, 0.9)';
}

// ==================== 6. SCRATCH TOUCH LOGIC ====================
let isScratching = false;

function scratch(e) {
    if (!isScratching || !state.ticketActive || state.isScratchedEnough) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();

    AudioFX.playScratch();
    checkScratchPercentage();
}

function checkScratchPercentage() {
    if (state.isScratchedEnough || !state.ticketActive) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparentPixels = 0;
    for (let i = 3; i < imageData.length; i += 32) {
        if (imageData[i] === 0) transparentPixels++;
    }
    if ((transparentPixels / (imageData.length / 32)) * 100 > 40) revealEntireTicket();
}

function revealEntireTicket() {
    if (state.isScratchedEnough) return;
    state.isScratchedEnough = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let totalWin = 0;
    state.prizeCells.forEach((cell, idx) => {
        const cellEl = document.getElementById(`cell-${idx}`);
        if (cell.isMatch) {
            totalWin += cell.prize;
            cellEl.classList.add('winner-cell');
        }
    });

    const footerMsg = document.getElementById('ticket-footer-msg');
    if (totalWin > 0) {
        state.balance += totalWin;
        userRef.update({ balance: state.balance });
        AudioFX.playWin();
        footerMsg.textContent = `🎉 អបអរសាទរ! អ្នកបានឈ្នះ ${totalWin.toLocaleString()} ៛`;
        footerMsg.style.backgroundColor = '#059669';
    } else {
        footerMsg.textContent = '❌ សោកស្ដាយ! សន្លឹកឆ្នោតនេះមិនមានរង្វាន់ទេ';
        footerMsg.style.backgroundColor = '#881337';
    }

    db.ref('history/' + userId).push({
        price: state.selectedPrice, winAmount: totalWin,
        resultText: totalWin > 0 ? 'ឈ្នះរង្វាន់' : 'មិនត្រូវរង្វាន់', timestamp: Date.now()
    });

    state.ticketActive = false;
    document.getElementById('buy-ticket-btn').disabled = false;
}

// ==================== 7. EVENT LISTENERS & MODALS ====================
document.getElementById('buy-ticket-btn').addEventListener('click', buyTicket);

document.querySelectorAll('.price-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.id === 'auto-scratch-btn') return;
        AudioFX.playClick();
        document.querySelectorAll('.price-btn').forEach(b => { if (b.id !== 'auto-scratch-btn') b.classList.remove('active'); });
        btn.classList.add('active');
        state.selectedPrice = parseInt(btn.dataset.price);
        document.getElementById('buy-price-tag').textContent = `${state.selectedPrice.toLocaleString()} ៛`;
        document.getElementById('ticket-price-display').textContent = `${state.selectedPrice.toLocaleString()}៛`;
    });
});

document.getElementById('auto-scratch-btn').addEventListener('click', () => {
    AudioFX.playClick();
    if (state.ticketActive && !state.isScratchedEnough) revealEntireTicket();
});

canvas.addEventListener('mousedown', (e) => { isScratching = true; scratch(e); });
canvas.addEventListener('mousemove', scratch);
window.addEventListener('mouseup', () => isScratching = false);
canvas.addEventListener('touchstart', (e) => { isScratching = true; scratch(e); }, { passive: false });
canvas.addEventListener('touchmove', scratch, { passive: false });
window.addEventListener('touchend', () => isScratching = false);

// Modals Open/Close
const openM = id => { AudioFX.playClick(); document.getElementById(id).classList.remove('hidden'); };
const closeM = id => { AudioFX.playClick(); document.getElementById(id).classList.add('hidden'); };

document.getElementById('wallet-btn').addEventListener('click', () => openM('wallet-modal'));
document.getElementById('history-btn').addEventListener('click', () => { openM('history-modal'); loadHistory(); });
document.getElementById('admin-btn').addEventListener('click', () => { openM('admin-modal'); loadAdminSettings(); });
document.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
}));

// Deposit / Withdraw Requests
document.getElementById('submit-deposit-btn').addEventListener('click', () => {
    const amt = parseInt(document.getElementById('deposit-amount').value);
    if (isNaN(amt) || amt <= 0) return alert('សូមបញ្ចូលចំនួនប្រាក់ត្រឹមត្រូវ!');
    db.ref('deposits').push({ userId, userCode: state.userCode, userName, amount: amt, status: 'pending', timestamp: Date.now() });
    sendTelegramMessage(ADMIN_CHAT_ID, `<b>📥 សំណើបញ្ចូលប្រាក់</b>\nUser ID: ${state.userCode}\nឈ្មោះ: ${userName}\nចំនួន: <b>${amt.toLocaleString()} ៛</b>`);
    alert('✅ សំណើបញ្ចូលប្រាក់ត្រូវបានផ្ញើជូន Admin!');
    document.getElementById('deposit-amount').value = ''; closeM('wallet-modal');
});

document.getElementById('submit-withdraw-btn').addEventListener('click', () => {
    const amt = parseInt(document.getElementById('withdraw-amount').value);
    if (isNaN(amt) || amt <= 0) return alert('សូមបញ្ចូលចំនួនប្រាក់ត្រឹមត្រូវ!');
    if (amt > state.balance) return alert('❌ សមតុល្យប្រាក់មិនគ្រប់គ្រាន់ទេ!');
    state.balance -= amt;
    userRef.child('balance').set(state.balance);
    userRef.child('totalWithdraw').transaction(val => (val || 0) + amt);
    sendTelegramMessage(ADMIN_CHAT_ID, `<b>📤 សំណើដកប្រាក់</b>\n<b>User ID:</b> ${state.userCode}\n<b>ចំនួន:</b> ${amt.toLocaleString()} ៛`);
    alert(`✅ សំណើដកប្រាក់ ${amt.toLocaleString()} ៛ ត្រូវបានផ្ញើជូន Admin!`);
    document.getElementById('withdraw-amount').value = ''; closeM('wallet-modal');
});

// Load History & Admin
function loadHistory() {
    db.ref('history/' + userId).limitToLast(15).once('value', snapshot => {
        const list = document.getElementById('history-list');
        list.innerHTML = '';
        if (!snapshot.exists()) return list.innerHTML = '<div class="empty-history">មិនទាន់មានប្រវត្តិលេងនៅឡើយទេ</div>';
        let arr = []; snapshot.forEach(c => arr.unshift(c.val()));
        list.innerHTML = arr.map(item => `
            <div class="history-item">
                <div>
                    <div style="font-weight:700; color:#fff;">ទិញឆ្នោត: ${item.price.toLocaleString()} ៛</div>
                    <div style="font-size:10px; color:#94a3b8;">${new Date(item.timestamp).toLocaleTimeString('km-KH')}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:800; color:${item.winAmount > 0 ? '#34d399' : '#94a3b8'}">${item.winAmount > 0 ? '+' + item.winAmount.toLocaleString() + ' ៛' : '0 ៛'}</div>
                    <div style="font-size:10px; color:${item.winAmount > 0 ? '#10b981' : '#f87171'}">${item.resultText}</div>
                </div>
            </div>
        `).join('');
    });
}

function loadAdminSettings() {
    document.getElementById('admin-win-rate').value = state.globalWinRate;
    db.ref('users').once('value', snapshot => {
        const tbody = document.getElementById('admin-user-table');
        tbody.innerHTML = '';
        if (!snapshot.exists()) return;
        snapshot.forEach(child => {
            const u = child.val();
            tbody.innerHTML += `<tr>
                <td><b>${u.code || 'N/A'}</b></td>
                <td style="color:#ffb703;">${(u.balance || 0).toLocaleString()}</td>
                <td style="color:#10b981;">${(u.totalDeposit || 0).toLocaleString()}</td>
                <td style="color:#ef4444;">${(u.totalWithdraw || 0).toLocaleString()}</td>
            </tr>`;
        });
    });
}

document.getElementById('save-winrate-btn').addEventListener('click', () => {
    const rate = parseInt(document.getElementById('admin-win-rate').value);
    if (isNaN(rate) || rate < 0 || rate > 100) return alert('សូមបញ្ចូលភាគរយពី 0 ដល់ 100!');
    db.ref('settings/winRate').set(rate).then(() => alert('✅ រក្សាទុក Win Rate ' + rate + '% ជោគជ័យ!'));
});

const handleAdminBalance = action => {
    let targetCode = document.getElementById('admin-target-id').value.trim();
    const amount = parseInt(document.getElementById('admin-target-amount').value);
    if (!targetCode || isNaN(amount) || amount <= 0) return alert('សូមបញ្ចូល ID និងចំនួនប្រាក់!');
    if (!targetCode.startsWith("ID-")) targetCode = "ID-" + targetCode;

    db.ref('users').orderByChild('code').equalTo(targetCode).once('value', snapshot => {
        if (!snapshot.exists()) return alert('❌ មិនរកឃើញ User ឡើយ!');
        snapshot.forEach(userChild => {
            const foundUserId = userChild.key;
            let newBalance = userChild.val().balance || 0;
            if (action === "add") {
                newBalance += amount;
                db.ref('users/' + foundUserId + '/totalDeposit').transaction(v => (v || 0) + amount);
                sendTelegramMessage(foundUserId, `🟢 <b>បានបញ្ចូលទឹកប្រាក់:</b> ${amount.toLocaleString()} ៛\n<b>ID:</b> ${targetCode}`);
            } else {
                newBalance = Math.max(0, newBalance - amount);
            }
            db.ref('users/' + foundUserId).update({ balance: newBalance }).then(() => {
                alert(`✅ ${actio