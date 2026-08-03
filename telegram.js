// ចាប់យក Telegram Web App Object
const tg = window.Telegram ? window.Telegram.WebApp : null;

let userId = "demo_user_123";
let userName = "អ្នកលេង Demo";

if (tg) {
  tg.expand(); // ពង្រីកអេក្រង់ឱ្យពេញទូរស័ព្ទ

  if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    userId = tg.initDataUnsafe.user.id.toString();
    userName = tg.initDataUnsafe.user.first_name || "អ្នកលេង";
  }
}

// បង្ហាញឈ្មោះនៅលើ Screen
document.addEventListener("DOMContentLoaded", () => {
  const nameEl = document.getElementById("user-name");
  if (nameEl) nameEl.innerText = userName;
});
