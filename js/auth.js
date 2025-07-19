// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCwkRk12HxQlQS2DH12lcolRNvF2ALprZM",
  authDomain: "comix-9be69.firebaseapp.com",
  projectId: "comix-9be69",
  storageBucket: "comix-9be69.appspot.com",
  messagingSenderId: "346083786632",
  appId: "1:346083786632:web:f95c8c3dacafe47f23843d"
};

// Initialize Firebase Services
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Make globally available
window.firebaseApp = { app, auth, db, storage };

// Auth State Listener
auth.onAuthStateChanged((user) => {
  const authForms = document.getElementById('auth-forms');
  const adminDashboard = document.getElementById('admin-dashboard');
  const logoutBtn = document.getElementById('logout-btn');

  if (user) {
    authForms?.classList.add('hidden');
    adminDashboard?.classList.remove('hidden');
    logoutBtn?.classList.remove('hidden');
  } else {
    authForms?.classList.remove('hidden');
    adminDashboard?.classList.add('hidden');
    logoutBtn?.classList.add('hidden');
  }
});

// Login Function
async function adminLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const loginError = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');

  if (!email || !password) {
    loginError.textContent = 'Please fill all fields';
    return;
  }

  loginBtn.disabled = true;
  loginBtn.innerHTML = '<div class="loading-spinner"></div> Logging in...';

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    loginError.textContent = getAuthError(error.code);
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
}

// Logout
function adminLogout() {
  auth.signOut().then(() => {
    window.location.href = 'index.html';
  });
}

// Handle Auth Errors
function getAuthError(code) {
  const errors = {
    'auth/user-not-found': 'User not found',
    'auth/wrong-password': 'Invalid password',
    'auth/email-already-in-use': 'Email already registered',
    'auth/weak-password': 'Password must be 6+ characters'
  };
  return errors[code] || 'Authentication failed';
}

// DOM Events
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn')?.addEventListener('click', adminLogin);
  document.getElementById('login-form')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') adminLogin();
  });
  document.getElementById('logout-btn')?.addEventListener('click', adminLogout);
});
