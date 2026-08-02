// ====================================
// MEMBER COACH CHAT JAVASCRIPT
// ====================================

// API_BASE_URL is defined globally in common.js
// Using window.API_BASE_URL directly

// WebSocket
let socket;

// State
let currentUser = null;
let selectedCoach = null;
let messages = [];
let coaches = [];
let typingTimeout;

// DOM Elements
const coachesList = document.getElementById('coachesList');
const chatWindow = document.getElementById('chatWindow');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Get current user
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Auth failed');
        }

        const data = await response.json();
        currentUser = data.user;

        // Redirect coaches to their dashboard
        if (currentUser.userType === 'coach') {
            window.location.href = '/coach/dashboard';
            return;
        }
    } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('token');
        window.location.href = '/';
        return;
    }

    // Load coaches
    await loadCoaches();

    // Initialize WebSocket
    initializeWebSocket();
});

// Load coaches list
async function loadCoaches() {
    const token = localStorage.getItem('token');

    try {
        console.log('Loading coaches from API...');
        const response = await fetch(`${window.API_BASE_URL}/users/coaches`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Coaches response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Coaches API error:', errorData);
            throw new Error(errorData.error || 'Failed to load coaches');
        }

        const data = await response.json();
        console.log('Coaches loaded:', data.coaches);
        coaches = data.coaches || [];

        // Fetch unread message counts
        await loadUnreadCounts();

        displayCoaches(coaches);

        // Update navbar badge
        updateNavbarBadge();
    } catch (error) {
        console.error('Error loading coaches:', error);
        coachesList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">❌</span>
                <p>Failed to load coaches</p>
                <small style="color: var(--text-muted);">${error.message}</small>
            </div>
        `;
    }
}

// Store for unread counts per coach
let unreadCounts = {};
let totalUnreadMessages = 0;

// Load unread message counts
async function loadUnreadCounts() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${window.API_BASE_URL}/messages/conversations`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            unreadCounts = {};
            totalUnreadMessages = 0;

            (data.conversations || []).forEach(conv => {
                if (conv.unreadCount > 0) {
                    unreadCounts[conv.partnerId] = conv.unreadCount;
                    totalUnreadMessages += conv.unreadCount;
                }
            });
        }
    } catch (error) {
        console.error('Error loading unread counts:', error);
    }
}

// Update navbar badge
function updateNavbarBadge() {
    // Look for the Coach nav link
    const coachNavLink = document.querySelector('a.nav-link[href="/coach"]');

    if (coachNavLink) {
        // Remove existing badge
        const existingBadge = coachNavLink.querySelector('.nav-badge');
        if (existingBadge) existingBadge.remove();

        // Add new badge if needed
        if (totalUnreadMessages > 0) {
            const badge = document.createElement('span');
            badge.className = 'nav-badge';
            badge.textContent = totalUnreadMessages > 9 ? '9+' : totalUnreadMessages;
            coachNavLink.appendChild(badge);
        }
    }

    // Sync with global common.js state
    if (window.updateUnreadCount) {
        window.updateUnreadCount(totalUnreadMessages);
    }
}

// Display coaches in sidebar
function displayCoaches(coachesArray) {
    if (!coachesArray || coachesArray.length === 0) {
        coachesList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">👨‍🏫</span>
                <p>No coaches available yet</p>
                <small style="color: var(--text-muted); margin-top: 8px; display: block;">
                    Coaches will appear here once they register
                </small>
            </div>
        `;
        return;
    }

    coachesList.innerHTML = coachesArray.map(coach => {
        const initials = coach.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const unreadCount = unreadCounts[coach._id] || 0;
        const unreadBadge = unreadCount > 0
            ? `<span class="unread-badge">${unreadCount > 9 ? '9+' : unreadCount}</span>`
            : '';

        const isSelected = selectedCoach && selectedCoach._id === coach._id;
        return `
            <div class="coach-item ${unreadCount > 0 ? 'has-unread' : ''} ${isSelected ? 'active' : ''}" data-coach-id="${coach._id}" onclick="selectCoach('${coach._id}')">
                <div class="coach-avatar">${initials}</div>
                <div class="coach-info">
                    <div class="coach-name">${coach.name}</div>
                    <div class="coach-status">
                        <span class="status-dot"></span>
                        <span>${unreadCount > 0 ? unreadCount + ' new messages' : 'Coach'}</span>
                    </div>
                </div>
                ${unreadBadge}
            </div>
        `;
    }).join('');
}

// Select coach to chat with
async function selectCoach(coachId) {
    const coach = coaches.find(c => c._id === coachId);
    if (!coach) return;

    selectedCoach = coach;

    // Update active state
    document.querySelectorAll('.coach-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-coach-id="${coachId}"]`)?.classList.add('active');

    // Build chat window
    buildChatWindow(coach);

    // Load conversation
    await loadConversation(coachId);
}

// Load conversation with coach
async function loadConversation(coachId) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${window.API_BASE_URL}/messages/conversation/${coachId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load conversation');
        }

        const data = await response.json();
        messages = data.messages || [];
        displayMessages();

        // Mark messages as read
        await markMessagesAsRead(coachId);
    } catch (error) {
        console.error('Error loading conversation:', error);
    }
}

// Build chat window
function buildChatWindow(coach) {
    const initials = coach.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    chatWindow.innerHTML = `
        <div class="chat-header">
            <div class="chat-user-avatar" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">${initials}</div>
            <div class="chat-user-info">
                <div class="chat-user-name">${coach.name}</div>
                <div class="chat-user-status">
                    <span class="status-dot"></span>
                    <span>Coach</span>
                </div>
            </div>
        </div>
        <div class="chat-messages" id="chatMessages">
            <div class="empty-state">
                <span class="empty-icon">💬</span>
                <p>No messages yet. Start chatting with your coach!</p>
            </div>
        </div>
        <div class="typing-indicator" id="typingIndicator">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span class="typing-text">${coach.name} is typing...</span>
        </div>
        <div class="chat-input-container">
            <div class="chat-input-wrapper">
                <textarea 
                    class="chat-input" 
                    id="messageInput" 
                    placeholder="Type a message..." 
                    rows="1"
                    onkeydown="handleKeyDown(event)"
                    oninput="handleTyping()"
                ></textarea>
                <button class="send-btn" id="sendBtn" onclick="sendMessage()">
                    ➤
                </button>
            </div>
        </div>
    `;
}

// Display messages
function displayMessages() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    if (!messages || messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">💬</span>
                <p>No messages yet. Start chatting with your coach!</p>
            </div>
        `;
        return;
    }

    chatMessages.innerHTML = messages.map(msg => {
        const isSent = msg.senderId._id === currentUser._id || msg.senderId === currentUser._id;
        const senderName = isSent ? currentUser.name : (msg.senderId.name || selectedCoach?.name || 'Coach');
        const initials = senderName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const time = formatMessageTime(msg.createdAt);

        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <div class="message-avatar">${initials}</div>
                <div class="message-content">
                    <div class="message-bubble">${escapeHtml(msg.message)}</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
    }).join('');

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle key down
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Handle typing
function handleTyping() {
    if (!socket || !selectedCoach) return;

    // Emit typing event
    socket.emit('typing:start', {
        receiverId: selectedCoach._id,
        senderName: currentUser.name
    });

    // Clear previous timeout
    clearTimeout(typingTimeout);

    // Set new timeout
    typingTimeout = setTimeout(() => {
        socket.emit('typing:stop', {
            receiverId: selectedCoach._id
        });
    }, 2000);
}

// Send message
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput || !selectedCoach) return;

    const message = messageInput.value.trim();
    if (!message) return;

    // Clear input
    messageInput.value = '';

    // Emit message via WebSocket
    socket.emit('message:send', {
        receiverId: selectedCoach._id,
        message: message
    });

    // Add message to local state optimistically
    const newMessage = {
        _id: Date.now().toString(),
        senderId: { _id: currentUser._id, name: currentUser.name },
        receiverId: { _id: selectedCoach._id, name: selectedCoach.name },
        message: message,
        createdAt: new Date().toISOString()
    };
    messages.push(newMessage);
    displayMessages();
}

// Mark messages as read
async function markMessagesAsRead(coachId) {
    const token = localStorage.getItem('token');

    try {
        // Optimistic UI update
        if (unreadCounts[coachId] > 0) {
            totalUnreadMessages -= unreadCounts[coachId];
            if (totalUnreadMessages < 0) totalUnreadMessages = 0;
            unreadCounts[coachId] = 0;

            // Update Navbar Badge
            updateNavbarBadge();

            // Update Sidebar Item
            const coachItem = document.querySelector(`.coach-item[data-coach-id="${coachId}"]`);
            if (coachItem) {
                coachItem.classList.remove('has-unread');
                const badge = coachItem.querySelector('.unread-badge');
                if (badge) badge.remove();

                const statusText = coachItem.querySelector('.coach-status span:last-child');
                if (statusText && statusText.textContent.includes('new messages')) {
                    statusText.textContent = 'Coach';
                }
            }
        }

        // Call API
        await fetch(`${API_BASE_URL}/messages/mark-read/${coachId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// Initialize WebSocket
function initializeWebSocket() {
    const token = localStorage.getItem('token');

    socket = io('http://localhost:3000', {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
    });

    // Listen for incoming messages
    socket.on('message:received', (data) => {
        // Only show if from selected coach
        if (selectedCoach && data.senderId === selectedCoach._id) {
            const newMessage = {
                _id: data._id || Date.now().toString(),
                senderId: { _id: data.senderId, name: data.senderName },
                receiverId: { _id: currentUser._id, name: currentUser.name },
                message: data.message,
                createdAt: data.createdAt || new Date().toISOString()
            };
            messages.push(newMessage);
            displayMessages();

            // Mark as read immediately
            markMessagesAsRead(selectedCoach._id);
        } else {
            // Update coaches list for unread indicators only if we aren't viewing this chat
            loadCoaches();
        }
    });

    // Typing indicators
    socket.on('typing:started', (data) => {
        if (selectedCoach && data.senderId === selectedCoach._id) {
            showTypingIndicator();
        }
    });

    socket.on('typing:stopped', (data) => {
        if (selectedCoach && data.senderId === selectedCoach._id) {
            hideTypingIndicator();
        }
    });

    // Listen for alerts
    socket.on('alert:received', (data) => {
        // Reload alerts
        if (typeof loadAlerts === 'function') {
            loadAlerts();
        }
    });
}

// Show typing indicator
function showTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.classList.add('active');

        // Scroll to show typing
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
}

// Hide typing indicator
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.classList.remove('active');
    }
}

// Format message time
function formatMessageTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions global
window.selectCoach = selectCoach;
window.sendMessage = sendMessage;
window.handleKeyDown = handleKeyDown;
window.handleTyping = handleTyping;
