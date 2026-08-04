// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCcGDjnR4gjlvW5eKMJClFSmvZePi7lQh0",
  authDomain: "mini-shopping-9582e.firebaseapp.com",
  databaseURL: "https://mini-shopping-9582e-default-rtdb.firebaseio.com",
  projectId: "mini-shopping-9582e",
  storageBucket: "mini-shopping-9582e.firebasestorage.app",
  messagingSenderId: "2435912321",
  appId: "1:2435912321:web:733f2065458b76b03e7380",
  measurementId: "G-BQZE2V7D5K"
};

// Initialize Firebase 
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  var db = firebase.database();
} else {
  console.error("Firebase SDK មិនទាន់បាន Load ក្នុង HTML ទេ!");
}

