let selectedPrice = 1000;
let currentBalance = 0;
let hasBought = false;
let isRevealed = false;
let currentWinAmount = 0;
let globalWinRate = 35; // Win Rate %

let userRef;

// 1. Sync ទិន្នន័យពី Firebase
function initUserDatabase() {
  if (typeof db === 'undefined') return;

  userRef = db.ref('users/' + userId);
  
  userRef.on('value', snapshot => {
    const data = snapshot.val();
    if (data) {
      currentBalance = data.balance || 0;
    } else {
      currentBalance = 10000; // ថែមលុយ Free 10,000៛ សម្រាប់ User ថ្មី
      userRef.set({ name: userName, balance: currentBalance });
    }
    document.getElementById('balance').innerText = currentBalance.toLocaleString();
  });

  // ទាញយក Win Rate ពី Admin
  db.ref('system_config/winRate').on('value', snapshot => {
    if (snapshot.exists()) globalWinRate = snapshot.val();
  });
}

// 2. ជ្រើសរើសតម្លៃសន្លឹកឆ្នោត
function selectPrice(price) {
  if (hasBought && !isRevealed) {
    alert('សូមកោសសន្លឹកឆ្នោតដែលបានទិញឱ្យរួចរាល់សិន!');
    return;
  }
  selectedPrice = price;
  
  document.querySelectorAll('.ticket-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

// 3. Function ចុចទិញសន្លឹកឆ្នោត (បញ្ហាដែលចុចមិនកើត)
function buyTicket() {
  if (currentBalance < selectedPrice) {
    alert('សមតុល្យប្រាក់មិនគ្រប់គ្រាន់ទេ! សូមបញ្ចូលប្រាក់បន្ថែម។');
    return;
  }

  // កាត់ប្រាក់ពី Account
  currentBalance -= selectedPrice;
  userRef.update({ balance: currentBalance });

  // កំណត់ស្ថានភាពថាបានទិញរួច
  hasBought = true;
  isRevealed = false;
  centerZoneScratched = 0;

  // គណនារង្វាន់ (ប្តូរតាម Win Rate)
  const isWin = Math.random() * 100 < globalWinRate;
  if (isWin) {
    const multipliers = [1.5, 2, 3, 5];
    const randMultiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
    currentWinAmount = selectedPrice * randMultiplier;
    document.getElementById('prize-text').innerText = `🎉 ឈ្នះ ${currentWinAmount.toLocaleString()} ៛`;
  } else {
    currentWinAmount = 0;
    document.getElementById('prize-text').innerText = "❌ ស្តាយណាស់! មិនត្រូវរង្វាន់ទេ";
  }

  // Reset ផ្ទាំង Canvas ឱ្យគ្របសំបកប្រាក់ឡើងវិញ
  initScratchCover();

  const buyBtn = document.getElementById('buy-btn');
  buyBtn.innerText = "កំពុងលេង (សូមកោសសន្លឹក)...";
  buyBtn.style.background = "#64748b";
}

// ពេល Load គេហទំព័រដំបូង
window.onload = () => {
  initUserDatabase();
  initScratchCover();
};
