// ====================================
// COACH ALERTS PAGE JAVASCRIPT
// ====================================

const API_BASE_URL = 'http://localhost:3000/api';

// WebSocket
let socket;

// DOM Elements
const profileBtn = document.getElementById('profileBtn');
const profileSidebar = document.getElementById('profileSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebar = document.getElementById('closeSidebar');
const logoutBtn = document.getElementById('logoutBtn');
const alertMessage = document.getElementById('alertMessage');
const charCount = document.getElementById('charCount');
const sendAlertBtn = document.getElementById('sendAlertBtn');
const btnText = document.getElementById('btnText');
const btnLoading = document.getElementById('btnLoading');
const successMessage = document.getElementById('successMessage');

// User data
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Verify coach user type
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.user.userType !== 'coach') {
            window.location.href = '/dashboard';
            return;
        }

        currentUser = data.user;
        updateUserInfo(currentUser);
    } catch (error) {
        localStorage.removeItem('token');
        window.location.href = '/';
        return;
    }

    // Set up event listeners
    profileBtn.addEventListener('click', toggleProfileSidebar);
    sidebarOverlay.addEventListener('click', closeProfileSidebar);
    closeSidebar.addEventListener('click', closeProfileSidebar);
    logoutBtn.addEventListener('click', handleLogout);
    alertMessage.addEventListener('input', updateCharCount);
    sendAlertBtn.addEventListener('click', sendAlert);

    // Setup logout modal
    setupLogoutModal();

    // Load alert history
    await loadAlertHistory();

    // Initialize WebSocket
    initializeWebSocket();
});

// Update user info
function updateUserInfo(user) {
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userName').textContent = user.name.split(' ')[0];
    document.getElementById('userAvatarLarge').textContent = initials;
    document.getElementById('userNameLarge').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
}

// Toggle/close sidebar
function toggleProfileSidebar() {
    profileSidebar.classList.toggle('active');
}

function closeProfileSidebar() {
    profileSidebar.classList.remove('active');
}

// Update character count
function updateCharCount() {
    const count = alertMessage.value.length;
    charCount.textContent = count;
}

// Send alert
async function sendAlert() {
    const message = alertMessage.value.trim();

    if (!message) {
        showToast('Please enter a message', 'warning');
        return;
    }

    // Disable button
    sendAlertBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    try {
        // Send via Socket.IO
        socket.emit('alert:send', { message });

        // Wait for confirmation
        socket.once('alert:sent', (data) => {
            console.log('Alert sent:', data);

            // Show success message
            successMessage.textContent = `✅ Alert sent to ${data.totalCount} members (${data.onlineCount} online, ${data.offlineCount} offline)`;
            successMessage.style.display = 'block';

            // Clear form
            alertMessage.value = '';
            updateCharCount();

            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);

            // Reload alert history
            loadAlertHistory();

            // Re-enable button
            sendAlertBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        });

        socket.once('error', (error) => {
            showToast('Failed to send alert: ' + error.message, 'error');
            sendAlertBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        });

    } catch (error) {
        console.error('Error sending alert:', error);
        showToast('Failed to send alert', 'error');
        sendAlertBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// Initialize WebSocket connection
function initializeWebSocket() {
    const token = localStorage.getItem('token');

    socket = io('http://localhost:3000', {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('WebSocket connected');
    });

    socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error.message);
    });

    socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
    });
}

// Load alert history
async function loadAlertHistory() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/alerts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        displayAlertHistory(data.alerts);
    } catch (error) {
        console.error('Error loading alert history:', error);
    }
}

// Display alert history
function displayAlertHistory(alerts) {
    const historyContainer = document.getElementById('alertHistory');

    if (!alerts || alerts.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📢</span>
                <p>No alerts sent yet</p>
            </div>
        `;
        return;
    }

    historyContainer.innerHTML = '';

    alerts.forEach(alert => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        const date = new Date(alert.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        historyItem.innerHTML = `
            <div class="history-header">
                <span>Sent on ${formattedDate}</span>
                <span>To: All Members</span>
            </div>
            <div class="history-message">${alert.message}</div>
        `;

        historyContainer.appendChild(historyItem);
    });
}

// Initialize WebSocket
function initializeWebSocket() {
    socket = io('http://localhost:3000');

    socket.on('connect', () => {
        console.log('Connected to WebSocket');
        if (currentUser) {
            socket.emit('user:register', currentUser._id);
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
    });
}

// Handle logout
function handleLogout() {
    const logoutModal = document.getElementById('logoutModal');
    logoutModal.classList.add('active');
}

// Setup logout modal events
function setupLogoutModal() {
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogout = document.getElementById('cancelLogout');
    const confirmLogout = document.getElementById('confirmLogout');

    cancelLogout.addEventListener('click', () => {
        logoutModal.classList.remove('active');
    });

    confirmLogout.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });

    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            logoutModal.classList.remove('active');
        }
    });
}

// Close sidebar/modal when pressing Escape, handle arrow keys for modal
document.addEventListener('keydown', (e) => {
    const logoutModal = document.getElementById('logoutModal');

    if (logoutModal && logoutModal.classList.contains('active')) {
        const cancelLogout = document.getElementById('cancelLogout');
        const confirmLogout = document.getElementById('confirmLogout');

        if (e.key === 'Escape') {
            logoutModal.classList.remove('active');
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            cancelLogout.focus();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            confirmLogout.focus();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (document.activeElement === cancelLogout) {
                cancelLogout.click();
            } else if (document.activeElement === confirmLogout) {
                confirmLogout.click();
            } else {
                cancelLogout.click();
            }
        }
    } else if (e.key === 'Escape') {
        closeProfileSidebar();
    }
});
