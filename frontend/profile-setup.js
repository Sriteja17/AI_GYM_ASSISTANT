// ====================================
// PROFILE SETUP PAGE JAVASCRIPT
// ====================================

const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const profileForm = document.getElementById('profileForm');
const alertContainer = document.getElementById('alertContainer');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const formInputs = document.querySelectorAll('.form-input');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Update progress on input change
    formInputs.forEach(input => {
        input.addEventListener('input', updateProgress);
    });

    // Form submission
    profileForm.addEventListener('submit', handleProfileSubmit);

    // Initial progress calculation
    updateProgress();
});

// Update progress bar
function updateProgress() {
    const height = document.getElementById('height').value;
    const weight = document.getElementById('weight').value;
    const age = document.getElementById('age').value;

    let filledFields = 0;
    const totalFields = 3;

    if (height) filledFields++;
    if (weight) filledFields++;
    if (age) filledFields++;

    const progress = (filledFields / totalFields) * 100;
    progressFill.style.width = `${progress}%`;
    progressPercent.textContent = Math.round(progress);
}

// Handle profile form submission
async function handleProfileSubmit(e) {
    e.preventDefault();

    const height = document.getElementById('height').value;
    const weight = document.getElementById('weight').value;
    const age = document.getElementById('age').value;
    const experienceLevel = document.querySelector('input[name="experienceLevel"]:checked').value;
    const availability = document.querySelector('input[name="availability"]:checked').value;

    // Validation
    if (!height || !weight || !age) {
        showAlert('Please fill in all personal details', 'error');
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.classList.add('loading');

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/auth/complete-profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                height: parseFloat(height),
                weight: parseFloat(weight),
                age: parseInt(age),
                experienceLevel,
                availability
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to complete profile');
        }

        // Update local storage
        localStorage.setItem('user', JSON.stringify(data.user));

        showAlert('Profile completed successfully! 🎉', 'success');

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1500);

    } catch (error) {
        console.error('Profile completion error:', error);
        showAlert(error.message, 'error');
    } finally {
        btn.classList.remove('loading');
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
