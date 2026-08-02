// ====================================
// COMMON JS FOR ALL PAGES
// ====================================

// Define API_BASE_URL globally
window.API_BASE_URL = 'http://localhost:3000/api';
const API_BASE_URL = window.API_BASE_URL;

// Initialize common functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
        window.location.href = '/';
        return;
    }

    // Set up profile sidebar if it exists
    const profileBtn = document.getElementById('profileBtn');
    const profileSidebar = document.getElementById('profileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebar = document.getElementById('closeSidebar');
    const logoutBtn = document.getElementById('logoutBtn');

    if (profileBtn && profileSidebar) {
        profileBtn.addEventListener('click', () => {
            profileSidebar.classList.toggle('active');
        });

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                profileSidebar.classList.remove('active');
            });
        }

        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                profileSidebar.classList.remove('active');
            });
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Set up Personal Details toggle
    const personalDetailsBtn = document.getElementById('personalDetailsBtn');
    if (personalDetailsBtn) {
        personalDetailsBtn.addEventListener('click', togglePersonalDetails);
    }

    // Set up logout modal
    setupLogoutModal();

    // Set up notification bell and alerts
    setupNotificationBell();

    // Set up settings panel
    setupSettingsPanel();

    // Load user data for navbar and sidebar
    loadUserData();

    // Load alerts for members
    loadAlerts();

    // Initialize Global Notifications (Messages)
    setupGlobalNotifications();
});

// ====================================
// GLOBAL MESSAGE NOTIFICATIONS
// ====================================

let globalUnreadCount = 0;
let globalSocket = null;

async function setupGlobalNotifications() {
    await loadGlobalUnreadMessages();
    initializeGlobalSocket();
}

async function loadGlobalUnreadMessages() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        // We can use the conversations endpoint to get unread counts
        const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            globalUnreadCount = 0;
            if (data.conversations) {
                data.conversations.forEach(c => {
                    globalUnreadCount += (c.unreadCount || 0);
                });
            }
            updateGlobalBadgeDisplay();
        }
    } catch (error) {
        console.error('Error loading global unread messages:', error);
    }
}

function updateGlobalBadgeDisplay() {
    // Try to find the navbar link for messaging
    // Strategy 1: Exact href matching
    let messagesLink = document.querySelector('a[href="/coach/members"]') || document.querySelector('a[href="/coach"]');

    // Strategy 2: Text content matching (fallback)
    if (!messagesLink) {
        const links = document.querySelectorAll('.nav-link');
        for (const link of links) {
            const text = link.textContent.trim().toLowerCase();
            if (text.includes('coach') || text.includes('messages')) {
                messagesLink = link;
                break;
            }
        }
    }

    if (messagesLink) {
        let badge = messagesLink.querySelector('.nav-badge');

        if (globalUnreadCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'nav-badge';
                messagesLink.appendChild(badge);
            }
            badge.textContent = globalUnreadCount > 9 ? '9+' : globalUnreadCount;
            badge.style.display = 'flex';
        } else {
            if (badge) badge.remove();
        }
    } else {
        console.warn('Global Notifications: Could not find "Coach" or "Messages" nav link to attach badge.');
    }
}

function initializeGlobalSocket() {
    const token = localStorage.getItem('token');
    if (!token || typeof io === 'undefined') return;

    // Use existing socket if defined (e.g. by chat page) or create new
    // Note: Creating a new one is safer to ensure valid auth in common.js context
    if (!globalSocket) {
        globalSocket = io(window.location.origin, {
            auth: { token }
        });
    }

    globalSocket.on('message:received', (data) => {
        // If we are NOT on a chat page, OR if we are but it's not the active conversation
        // The chat pages (coach-members.js, member-coach-chat.js) handle the "active chat" logic.
        // Here we just want to ensure the badge increments if a new message comes in.

        // We can simplistically increment. If the chat page is active, it will mark seeing it 
        // and decrement it back (or we can expose a function to reset).

        // Check if we are the sender (shouldn't happen for received event, but safety)
        // data.senderId is the ID of the sender.

        globalUnreadCount++;
        updateGlobalBadgeDisplay();

        // Optional: Show a toast if not on chat page
        if (!window.location.pathname.includes('/coach')) {
            showToast(`New message from ${data.senderName || 'Coach'}`, 'info');
        }
    });
}

// Global functions for other scripts to update the count
window.updateUnreadCount = (count) => {
    globalUnreadCount = count;
    updateGlobalBadgeDisplay();
};

window.decrementUnreadCount = (amount) => {
    globalUnreadCount = Math.max(0, globalUnreadCount - amount);
    updateGlobalBadgeDisplay();
};

// Toggle Personal Details Panel
function togglePersonalDetails() {
    const panel = document.getElementById('personalDetailsPanel');
    const btn = document.getElementById('personalDetailsBtn');

    if (panel) panel.classList.toggle('hidden');
    if (btn) btn.classList.toggle('active');
}

// Toggle Settings Panel - for pages with edit form
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    const btn = document.getElementById('settingsBtn');
    const arrow = btn?.querySelector('.arrow');

    if (panel) {
        panel.classList.toggle('hidden');
        if (arrow) {
            arrow.style.transform = panel.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }
}

// Handle saving personal details
async function handleSaveDetails(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) return;

    const form = event.target;
    const saveBtn = form.querySelector('button[type="submit"]');
    const originalText = saveBtn?.textContent || 'Save Changes';

    // Get form values
    const height = document.getElementById('editHeight')?.value;
    const weight = document.getElementById('editWeight')?.value;
    const age = document.getElementById('editAge')?.value;
    const experienceLevel = document.getElementById('editLevel')?.value;
    const availability = document.getElementById('editAvailability')?.value;

    // Show loading state
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                height: parseInt(height),
                weight: parseInt(weight),
                age: parseInt(age),
                experienceLevel,
                availability: parseInt(availability)
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        const data = await response.json();

        // Update the display values
        updatePersonalDetailsDisplay(data.user?.profile || {
            height, weight, age, experienceLevel, availability
        });

        // Show success message
        if (typeof showToast === 'function') {
            showToast('Profile updated successfully!', 'success');
        }

        // Collapse the settings panel
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) {
            settingsPanel.classList.add('hidden');
            const arrow = document.querySelector('#settingsBtn .arrow');
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        }

    } catch (error) {
        console.error('Error updating profile:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to update profile', 'error');
        }
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }
}

// Update personal details display after save
function updatePersonalDetailsDisplay(profile) {
    const detailHeight = document.getElementById('detailHeight');
    const detailWeight = document.getElementById('detailWeight');
    const detailAge = document.getElementById('detailAge');
    const detailLevel = document.getElementById('detailLevel');
    const detailAvailability = document.getElementById('detailAvailability');

    if (detailHeight) detailHeight.textContent = `${profile.height} cm`;
    if (detailWeight) detailWeight.textContent = `${profile.weight} kg`;
    if (detailAge) detailAge.textContent = `${profile.age} years`;
    if (detailLevel) detailLevel.textContent = profile.experienceLevel || 'N/A';
    if (detailAvailability) detailAvailability.textContent = `${profile.availability} days/week`;
}

// Setup settings panel event listeners
function setupSettingsPanel() {
    const settingsBtn = document.getElementById('settingsBtn');
    const editDetailsForm = document.getElementById('editDetailsForm');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', toggleSettings);
    }

    if (editDetailsForm) {
        editDetailsForm.addEventListener('submit', handleSaveDetails);
    }
}

// Load user data
async function loadUserData() {
    const token = localStorage.getItem('token');
    if (!token) {
        hideLoadingOverlay();
        return;
    }

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
        updateUserInfo(data.user);
    } catch (error) {
        console.error('Error loading user data:', error);
    } finally {
        hideLoadingOverlay();
    }
}

// Hide loading overlay
function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

// Update user info in UI
function updateUserInfo(user) {
    if (!user) return;

    // Get initials for avatar
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    // Update navbar elements if they exist
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');

    if (userAvatar) userAvatar.textContent = initials;
    if (userName) userName.textContent = user.name.split(' ')[0];

    // Update sidebar elements if they exist
    const userAvatarLarge = document.getElementById('userAvatarLarge');
    const userNameLarge = document.getElementById('userNameLarge');
    const userEmail = document.getElementById('userEmail');
    const userBadge = document.getElementById('userBadge');

    if (userAvatarLarge) userAvatarLarge.textContent = initials;
    if (userNameLarge) userNameLarge.textContent = user.name;
    if (userEmail) userEmail.textContent = user.email;

    if (userBadge) {
        userBadge.textContent = user.userType === 'coach' ? 'Coach' : 'Member';
        if (user.userType === 'coach') {
            userBadge.style.background = 'rgba(236, 72, 153, 0.1)';
            userBadge.style.borderColor = 'rgba(236, 72, 153, 0.3)';
            userBadge.style.color = '#f472b6';
        }
    }

    // Update personal details for members
    if (user.userType === 'member' && user.profile) {
        const detailHeight = document.getElementById('detailHeight');
        const detailWeight = document.getElementById('detailWeight');
        const detailAge = document.getElementById('detailAge');
        const detailLevel = document.getElementById('detailLevel');
        const detailAvailability = document.getElementById('detailAvailability');

        if (detailHeight) detailHeight.textContent = `${user.profile.height} cm`;
        if (detailWeight) detailWeight.textContent = `${user.profile.weight} kg`;
        if (detailAge) detailAge.textContent = `${user.profile.age} years`;
        if (detailLevel) detailLevel.textContent = user.profile.experienceLevel || 'N/A';
        if (detailAvailability) detailAvailability.textContent = user.profile.availability || 'N/A';

        // Also populate the edit form fields if they exist
        const editHeight = document.getElementById('editHeight');
        const editWeight = document.getElementById('editWeight');
        const editAge = document.getElementById('editAge');
        const editLevel = document.getElementById('editLevel');
        const editAvailability = document.getElementById('editAvailability');

        if (editHeight) editHeight.value = user.profile.height || '';
        if (editWeight) editWeight.value = user.profile.weight || '';
        if (editAge) editAge.value = user.profile.age || '';
        if (editLevel) editLevel.value = user.profile.experienceLevel || 'beginner';
        if (editAvailability) editAvailability.value = user.profile.availability || '';
    } else if (user.userType === 'coach') {
        // Hide Personal Details button and Settings button for coaches
        const personalDetailsBtn = document.getElementById('personalDetailsBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        if (personalDetailsBtn) personalDetailsBtn.style.display = 'none';
        if (settingsBtn) settingsBtn.style.display = 'none';
    }
}

// Handle logout - show modal
function handleLogout() {
    const logoutModal = document.getElementById('logoutModal');
    if (logoutModal) {
        logoutModal.classList.add('active');
    } else {
        // Fallback if modal doesn't exist
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    }
}

// Setup logout modal events
function setupLogoutModal() {
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogout = document.getElementById('cancelLogout');
    const confirmLogout = document.getElementById('confirmLogout');

    if (!logoutModal || !cancelLogout || !confirmLogout) return;

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

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    const logoutModal = document.getElementById('logoutModal');
    const profileSidebar = document.getElementById('profileSidebar');

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
    } else if (e.key === 'Escape' && profileSidebar) {
        profileSidebar.classList.remove('active');
        const alertsPopup = document.getElementById('alertsPopup');
        if (alertsPopup) alertsPopup.classList.remove('active');
    }
});

// ====================================
// ALERTS FUNCTIONALITY
// ====================================

let alerts = [];

// Setup notification bell
function setupNotificationBell() {
    const notificationBtn = document.getElementById('notificationBtn');
    const markAllRead = document.getElementById('markAllRead');

    if (notificationBtn) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const alertsPopup = document.getElementById('alertsPopup');
            if (alertsPopup) alertsPopup.classList.toggle('active');
        });
    }

    if (markAllRead) {
        markAllRead.addEventListener('click', markAllAlertsAsRead);
    }

    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('notificationWrapper');
        const alertsPopup = document.getElementById('alertsPopup');
        if (wrapper && alertsPopup && !wrapper.contains(e.target)) {
            alertsPopup.classList.remove('active');
        }
    });
}

// Load alerts from API
async function loadAlerts() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/alerts`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch alerts');
        }

        const data = await response.json();
        alerts = data.alerts || [];
        displayAlerts();
        updateNotificationBadge();
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

// Display alerts in popup
function displayAlerts() {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;

    if (!alerts || alerts.length === 0) {
        alertsList.innerHTML = `
            <div class="alerts-empty">
                <span style="font-size: 2rem;">📭</span>
                <p>No alerts yet</p>
            </div>
        `;
        return;
    }

    alertsList.innerHTML = alerts.map(alert => {
        const time = formatAlertTime(alert.createdAt);
        const unreadClass = alert.isRead ? '' : 'unread';

        return `
            <div class="alert-item ${unreadClass}" data-alert-id="${alert._id}" onclick="markAlertAsRead('${alert._id}')">
                <div class="alert-coach">From: ${alert.coachName}</div>
                <div class="alert-message">${escapeHtmlText(alert.message)}</div>
                <div class="alert-time">${time}</div>
            </div>
        `;
    }).join('');
}

// Update notification badge count
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    const unreadCount = alerts.filter(a => !a.isRead).length;
    badge.textContent = unreadCount;

    if (unreadCount > 0) {
        badge.classList.add('visible');
    } else {
        badge.classList.remove('visible');
    }
}

// Mark single alert as read
async function markAlertAsRead(alertId) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        await fetch(`${API_BASE_URL}/alerts/${alertId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const alert = alerts.find(a => a._id === alertId);
        if (alert) alert.isRead = true;

        displayAlerts();
        updateNotificationBadge();
    } catch (error) {
        console.error('Error marking alert as read:', error);
    }
}

// Mark all alerts as read
async function markAllAlertsAsRead() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const unreadAlerts = alerts.filter(a => !a.isRead);

        for (const alert of unreadAlerts) {
            await fetch(`${API_BASE_URL}/alerts/${alert._id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            alert.isRead = true;
        }

        displayAlerts();
        updateNotificationBadge();
    } catch (error) {
        console.error('Error marking all alerts as read:', error);
    }
}

// Format alert time
function formatAlertTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Escape HTML to prevent XSS
function escapeHtmlText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ====================================
// REUSABLE CONFIRM MODAL
// ====================================

/**
 * Show a custom styled confirmation modal
 * @param {Object} options - Modal options
 * @param {string} options.icon - Emoji icon for the modal
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {string} options.confirmText - Text for confirm button
 * @param {string} options.cancelText - Text for cancel button  
 * @param {string} options.confirmClass - CSS class for confirm button (btn-danger, btn-primary)
 * @returns {Promise<boolean>} - Resolves true if confirmed, false if cancelled
 */
function showConfirmModal(options = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const iconEl = document.getElementById('confirmModalIcon');
        const titleEl = document.getElementById('confirmModalTitle');
        const messageEl = document.getElementById('confirmModalMessage');
        const confirmBtn = document.getElementById('confirmModalConfirm');
        const cancelBtn = document.getElementById('confirmModalCancel');

        if (!modal) {
            // Fallback to browser confirm if modal not found
            resolve(confirm(options.message || 'Are you sure?'));
            return;
        }

        // Set content
        iconEl.textContent = options.icon || '❓';
        titleEl.textContent = options.title || 'Confirm Action';
        messageEl.textContent = options.message || 'Are you sure you want to continue?';
        confirmBtn.textContent = options.confirmText || 'Confirm';
        cancelBtn.textContent = options.cancelText || 'Cancel';

        // Set button class
        confirmBtn.className = 'btn ' + (options.confirmClass || 'btn-danger');

        // Show modal
        modal.classList.add('active');

        // Handle confirm
        const handleConfirm = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(true);
        };

        // Handle cancel
        const handleCancel = () => {
            modal.classList.remove('active');
            cleanup();
            resolve(false);
        };

        // Handle keyboard navigation
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                // Move focus to Cancel button
                e.preventDefault();
                cancelBtn.focus();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                // Move focus to Confirm button
                e.preventDefault();
                confirmBtn.focus();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (document.activeElement === confirmBtn) {
                    handleConfirm();
                } else if (document.activeElement === cancelBtn) {
                    handleCancel();
                } else {
                    // Default to cancel if nothing focused
                    handleCancel();
                }
            }
        };

        // Handle overlay click
        const handleOverlayClick = (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        };

        // Cleanup listeners
        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            document.removeEventListener('keydown', handleKeydown);
            modal.removeEventListener('click', handleOverlayClick);
        };

        // Add listeners
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        document.addEventListener('keydown', handleKeydown);
        modal.addEventListener('click', handleOverlayClick);

        // Focus cancel button by default (safer option)
        cancelBtn.focus();
    });
}

// ====================================
// TOAST NOTIFICATION SYSTEM
// ====================================

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms (default 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }

    // Toast icons
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    // Toast colors
    const colors = {
        success: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)',
        error: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)',
        warning: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%)',
        info: 'linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%)'
    };

    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${colors[type] || colors.info};
        color: white;
        padding: 14px 20px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        font-weight: 500;
        font-size: 0.95rem;
        pointer-events: auto;
        animation: toastSlideIn 0.3s ease-out;
        max-width: 350px;
        backdrop-filter: blur(10px);
    `;

    toast.innerHTML = `
        <span style="font-size: 1.3rem;">${icons[type] || icons.info}</span>
        <span>${message}</span>
    `;

    // Add animation keyframes if not exists
    if (!document.getElementById('toastStyles')) {
        const style = document.createElement('style');
        style.id = 'toastStyles';
        style.textContent = `
            @keyframes toastSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes toastSlideOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    toastContainer.appendChild(toast);

    // Remove after duration
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease-out forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Make functions global
window.markAlertAsRead = markAlertAsRead;
window.showConfirmModal = showConfirmModal;
window.showToast = showToast;

