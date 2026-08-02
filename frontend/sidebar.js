// ====================================
// SHARED SIDEBAR FUNCTIONALITY
// ====================================

// This file contains common functionality for the profile sidebar
// that is used across all pages

const API_BASE_URL = 'http://localhost:3000/api';

// Initialize sidebar functionality
function initializeSidebar() {
    const profileBtn = document.getElementById('profileBtn');
    const profileSidebar = document.getElementById('profileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebar = document.getElementById('closeSidebar');
    const logoutBtn = document.getElementById('logoutBtn');
    const personalDetailsBtn = document.getElementById('personalDetailsBtn');

    // Set up event listeners
    if (profileBtn) {
        profileBtn.addEventListener('click', toggleProfileSidebar);
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeProfileSidebar);
    }
    if (closeSidebar) {
        closeSidebar.addEventListener('click', closeProfileSidebar);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    if (personalDetailsBtn) {
        personalDetailsBtn.addEventListener('click', togglePersonalDetails);
    }

    // Close sidebar on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeProfileSidebar();
        }
    });
}

// Toggle profile sidebar
function toggleProfileSidebar() {
    const profileSidebar = document.getElementById('profileSidebar');
    profileSidebar.classList.toggle('active');
}

// Close profile sidebar
function closeProfileSidebar() {
    const profileSidebar = document.getElementById('profileSidebar');
    profileSidebar.classList.remove('active');
}

// Toggle Personal Details Panel
function togglePersonalDetails() {
    const panel = document.getElementById('personalDetailsPanel');
    const btn = document.getElementById('personalDetailsBtn');

    panel.classList.toggle('hidden');
    btn.classList.toggle('active');
}

// Update user info in sidebar
function updateSidebarUserInfo(user) {
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    // Update navbar
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userName').textContent = user.name.split(' ')[0];

    // Update sidebar
    document.getElementById('userAvatarLarge').textContent = initials;
    document.getElementById('userNameLarge').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;

    // Update user badge
    const badge = document.getElementById('userBadge');
    badge.textContent = user.userType === 'coach' ? 'Coach' : 'Member';
    if (user.userType === 'coach') {
        badge.style.background = 'rgba(236, 72, 153, 0.1)';
        badge.style.borderColor = 'rgba(236, 72, 153, 0.3)';
        badge.style.color = '#f472b6';
    }
}

// Update Personal Details in Panel
function updatePersonalDetails(user) {
    if (user && user.userType === 'member' && user.profile) {
        document.getElementById('detailHeight').textContent = `${user.profile.height} cm`;
        document.getElementById('detailWeight').textContent = `${user.profile.weight} kg`;
        document.getElementById('detailAge').textContent = `${user.profile.age} years`;
        document.getElementById('detailLevel').textContent = user.profile.experienceLevel || 'N/A';
        document.getElementById('detailAvailability').textContent = user.profile.availability || 'N/A';
    } else if (user.userType === 'coach') {
        // Hide Personal Details button for coaches
        const personalDetailsBtn = document.getElementById('personalDetailsBtn');
        if (personalDetailsBtn) {
            personalDetailsBtn.style.display = 'none';
        }
    }
}

// Load user data
async function loadUserData() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        const user = data.user;

        // Update sidebar
        updateSidebarUserInfo(user);
        updatePersonalDetails(user);

        return user;

    } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem('token');
        window.location.href = '/';
        return null;
    }
}

// Handle logout
function handleLogout() {
    const logoutModal = document.getElementById('logoutModal');
    if (logoutModal) {
        logoutModal.classList.add('active');

        // Set up confirm button
        const confirmBtn = document.getElementById('confirmLogout');
        const cancelBtn = document.getElementById('cancelLogout');

        const handleConfirm = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        };

        const handleCancel = () => {
            logoutModal.classList.remove('active');
        };

        confirmBtn.onclick = handleConfirm;
        cancelBtn.onclick = handleCancel;
        logoutModal.onclick = (e) => {
            if (e.target === logoutModal) handleCancel();
        };
    } else {
        // Fallback
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    }
}

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return false;
    }
    return true;
}
