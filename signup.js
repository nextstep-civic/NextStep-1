import {
  ensureUsername
} from "./username-service.js";
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { syncMemberRecord } from './member-sync.js';

const firebaseConfig = {
  apiKey: "AIzaSyArZYz6UMheUgBVrNeWvxWml-0zDTbNur0",
  authDomain: "nextstep-12b9a.firebaseapp.com",
  projectId: "nextstep-12b9a",
  storageBucket: "nextstep-12b9a.firebasestorage.app",
  messagingSenderId: "630600034259",
  appId: "1:630600034259:web:6b6284e147a6f79cda7126",
  measurementId: "G-WH3JL7Y7BR"
};

// Initialize Firebase
let app;
let auth;
let googleProvider;

try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Local persistence set successfully');
    })
    .catch((error) => {
      console.warn('Local storage restricted, falling back to session persistence...', error);
      return setPersistence(auth, browserSessionPersistence);
    })
    .catch((fallbackError) => {
      console.error('Could not set any persistence:', fallbackError);
    });

  window.firebaseAuth = auth;
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}
await ensureUsername(
  db,
  userCredential.user,
  fullName
);
// Show message function
function showMessage(message, type) {
  console.log('Showing message:', type, message);

  const form = document.getElementById('signup-form');
  if (!form) return;

  const card = form.closest('.login-card');

  // Remove existing messages
  const existingMessage = card.querySelector('.message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create new message
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type} show`;
  messageDiv.textContent = message;

  // Insert at the top of the form
  form.insertBefore(messageDiv, form.firstChild);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    messageDiv.classList.remove('show');
    setTimeout(() => messageDiv.remove(), 400);
  }, 5000);
}

// Error messages dictionary
function getErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
    'auth/unauthorized-domain': 'This domain is not authorized. Please contact support.'
  };

  if (!code) {
    return 'An unexpected error occurred. Please try again.';
  }

  return messages[code] || `Error: ${code}. Please try again.`;
}

// Flag to prevent double redirects
let isRedirecting = false;

// Initialize after DOM loads
window.addEventListener('DOMContentLoaded', function () {
  console.log('DOM loaded, initializing signup page...');

  const signupForm = document.getElementById('signup-form');
  const googleSignupBtn = document.getElementById('google-signup');

  console.log('Elements found:', {
    signupForm: !!signupForm,
    googleSignupBtn: !!googleSignupBtn
  });

  // Handle Signup Form
  if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      console.log('Signup form submitted');

      if (!auth) {
        showMessage('Authentication service not ready. Please refresh the page.', 'error');
        return;
      }

      if (isRedirecting) {
        console.log('Already redirecting, ignoring submit');
        return;
      }

      const nameInput = document.getElementById('signup-name');
      const emailInput = document.getElementById('signup-email');
      const passwordInput = document.getElementById('signup-password');
      const confirmPasswordInput = document.getElementById('signup-confirm-password');

      if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
        console.error('One or more signup inputs not found');
        return;
      }

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const submitBtn = signupForm.querySelector('.submit-button');

      console.log('Attempting signup for:', email);

      if (!name || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
      }

      if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
      }

      // Disable button
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Creating account...</span>';
      }

      try {
        console.log('Calling createUserWithEmailAndPassword...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Account created!');
        console.log('User:', user.email);
        console.log('User ID:', user.uid);

        // Set display name
        await updateProfile(user, { displayName: name });

        // Create member record in Firestore
        try {
          await syncMemberRecord(user);
          console.log('Member record synced');
        } catch (syncError) {
          console.warn('Member record sync failed:', syncError);
        }

        showMessage(`Welcome to NextStep, ${name}!`, 'success');

        // Set flag and redirect
        isRedirecting = true;
        console.log('Redirecting to index.html in 1 second...');
        setTimeout(() => {
          console.log('Redirecting NOW');
          window.location.href = 'index.html';
        }, 1000);

      } catch (error) {
        console.error('Signup error:', error.code, error.message);
        showMessage(getErrorMessage(error.code), 'error');

        // Re-enable button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Create Account</span><span class="button-icon">→</span>';
        }
      }
    });
  }

  // Handle Google Signup
  if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', async function (e) {
      e.preventDefault();
      console.log('Google signup clicked');

      if (!auth) {
        showMessage('Authentication service not ready. Please refresh the page.', 'error');
        return;
      }

      if (isRedirecting) {
        console.log('Already redirecting, ignoring click');
        return;
      }

      try {
        console.log('Opening Google popup...');
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        console.log('Google signup successful!');
        console.log('User:', user.email);
        console.log('User ID:', user.uid);

        // Create member record in Firestore
        try {
          await syncMemberRecord(user);
          console.log('Member record synced');
        } catch (syncError) {
          console.warn('Member record sync failed:', syncError);
        }

        showMessage(`Welcome, ${user.displayName || 'User'}!`, 'success');

        // Set flag and redirect
        isRedirecting = true;
        console.log('Redirecting to index.html in 1 second...');
        setTimeout(() => {
          console.log('Redirecting NOW');
          window.location.href = 'index.html';
        }, 1000);

      } catch (error) {
        console.error('Google signup error:', error.code, error.message);
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          showMessage(getErrorMessage(error.code), 'error');
        }
      }
    });
  }

  console.log('Signup page initialization complete');
});
