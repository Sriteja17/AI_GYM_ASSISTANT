// ====================================
// LOGIN PAGE JAVASCRIPT
// ====================================

const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const signinForm = document.getElementById('signinForm');
const signupForm = document.getElementById('signupForm');
const alertContainer = document.getElementById('alertContainer');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
        verifyTokenAndRedirect();
    }

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // Form submissions
    signinForm.addEventListener('submit', handleSignIn);
    signupForm.addEventListener('submit', handleSignUp);
});

// Switch between Sign In and Sign Up tabs
function switchTab(tab) {
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    if (tab === 'signin') {
        signinForm.classList.add('active');
        signupForm.classList.remove('active');
    } else {
        signupForm.classList.add('active');
        signinForm.classList.remove('active');
    }

    // Clear alerts
    alertContainer.innerHTML = '';
}

// Handle Sign In
async function handleSignIn(e) {
    e.preventDefault();

    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;
    const userType = document.querySelector('input[name="signin-userType"]:checked').value;

    // Validation
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    const btn = document.getElementById('signinBtn');
    btn.classList.add('loading');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, userType })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Sign in failed');
        }

        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showAlert('Login successful! Redirecting...', 'success');

        // Redirect based on user type and profile
        setTimeout(() => {
            if (data.user.userType === 'coach') {
                window.location.href = '/coach/dashboard';
            } else if (data.user.userType === 'member' && !data.user.isProfileComplete) {
                window.location.href = '/profile-setup';
            } else {
                window.location.href = '/dashboard';
            }
        }, 1000);

    } catch (error) {
        console.error('Sign in error:', error);
        showAlert(error.message, 'error');
    } finally {
        btn.classList.remove('loading');
    }
}

// Handle Sign Up
async function handleSignUp(e) {
    e.preventDefault();

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const userType = document.querySelector('input[name="signup-userType"]:checked').value;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }

    const btn = document.getElementById('signupBtn');
    btn.classList.add('loading');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, confirmPassword, userType })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Sign up failed');
        }

        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showAlert('Account created successfully! Redirecting...', 'success');

        // Redirect based on user type
        setTimeout(() => {
            if (data.user.userType === 'coach') {
                window.location.href = '/coach/dashboard';
            } else if (data.user.userType === 'member') {
                window.location.href = '/profile-setup';
            }
        }, 1000);

    } catch (error) {
        console.error('Sign up error:', error);
        showAlert(error.message, 'error');
    } finally {
        btn.classList.remove('loading');
    }
}

// Verify token and redirect if valid
async function verifyTokenAndRedirect() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();

            // Redirect based on user type and profile
            if (data.user.userType === 'coach') {
                window.location.href = '/coach/dashboard';
            } else if (data.user.userType === 'member' && !data.user.profile?.isProfileComplete) {
                window.location.href = '/profile-setup';
            } else {
                window.location.href = '/dashboard';
            }
        } else {
            // Invalid token, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    } catch (error) {
        console.error('Token verification error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    alert.innerHTML = `
    <span>${icon}</span>
    <span>${message}</span>
  `;

    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}
