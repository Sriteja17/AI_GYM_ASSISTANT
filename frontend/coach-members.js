// ====================================
// COACH MEMBERS CHAT JAVASCRIPT  
// ====================================

const API_BASE_URL = 'http://localhost:3000/api';

// WebSocket
let socket;

// State
let currentUser = null;
let selectedMember = null;
let members = [];
let messages = [];
let isTyping = false;
let typingTimeout;

// DOM Elements
const profileBtn = document.getElementById('profileBtn');
const profileSidebar = document.getElementById('profileSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebar = document.getElementById('closeSidebar');
const logoutBtn = document.getElementById('logoutBtn');
const membersList = document.getElementById('membersList');
const chatWindow = document.getElementById('chatWindow');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

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

    // Event listeners
    profileBtn.addEventListener('click', () => profileSidebar.classList.toggle('active'));
    sidebarOverlay.addEventListener('click', () => profileSidebar.classList.remove('active'));
    closeSidebar.addEventListener('click', () => profileSidebar.classList.remove('active'));
    logoutBtn.addEventListener('click', handleLogout);

    // Setup logout modal
    setupLogoutModal();

    // Load members
    await loadMembers();

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

// Load members
async function loadMembers() {
    const token = localStorage.getItem('token');
    console.log('Loading members...');

    try {
        const response = await fetch(`${API_BASE_URL}/coach/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        console.log('Members loaded:', data);
        members = data.members;

        // Fetch unread message counts
        await loadUnreadCounts();

        displayMembers(members);

        // Update navbar badge
        updateNavbarBadge();

        // Check if there's a pre-selected member
        const selectedMemberId = localStorage.getItem('selectedMemberId');
        if (selectedMemberId) {
            const member = members.find(m => m._id === selectedMemberId);
            if (member) {
                selectMember(member);
                localStorage.removeItem('selectedMemberId');
                localStorage.removeItem('selectedMemberName');
            }
        }
    } catch (error) {
        console.error('Error loading members:', error);
        membersList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⚠️</span>
                <p>Failed to load members</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Store for unread counts per member
let unreadCounts = {};
let totalUnreadMessages = 0;

// Load unread message counts
async function loadUnreadCounts() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
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
    // Look for the Messages nav link and add/update badge
    const messagesNavLink = document.querySelector('a.nav-link[href="/coach/members"]');
    if (messagesNavLink) {
        // Remove existing badge
        const existingBadge = messagesNavLink.querySelector('.nav-badge');
        if (existingBadge) existingBadge.remove();

        // Add new badge if there are unread messages
        if (totalUnreadMessages > 0) {
            const badge = document.createElement('span');
            badge.className = 'nav-badge';
            badge.textContent = totalUnreadMessages > 9 ? '9+' : totalUnreadMessages;
            messagesNavLink.appendChild(badge);
        }
    }

    // Sync with global common.js state
    if (window.updateUnreadCount) {
        window.updateUnreadCount(totalUnreadMessages);
    }
}

// Display members list
function displayMembers(membersArray) {
    console.log('Displaying members:', membersArray);

    if (!membersArray || membersArray.length === 0) {
        console.log('No members to display');
        return;
    }

    membersList.innerHTML = '';

    membersArray.forEach(member => {
        const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const unreadCount = unreadCounts[member._id] || 0;

        const isSelected = selectedMember && selectedMember._id === member._id;
        const memberItem = document.createElement('div');
        memberItem.className = `member-item ${unreadCount > 0 ? 'has-unread' : ''} ${isSelected ? 'active' : ''}`;
        memberItem.dataset.memberId = member._id;
        memberItem.style.cursor = 'pointer'; // Make sure it's clickable

        const unreadBadge = unreadCount > 0
            ? `<span class="unread-badge">${unreadCount > 9 ? '9+' : unreadCount}</span>`
            : '';

        memberItem.innerHTML = `
            <div class="member-item-avatar">${initials}</div>
            <div class="member-item-info">
                <div class="member-item-name">${member.name}</div>
                <div class="member-item-last-message">${unreadCount > 0 ? unreadCount + ' new messages' : 'Click to chat'}</div>
            </div>
            ${unreadBadge}
        `;

        memberItem.addEventListener('click', () => {
            console.log('Member clicked:', member.name);
            selectMember(member);
        });
        membersList.appendChild(memberItem);
    });

    console.log('Members displayed successfully');
}

// Select member to chat with
async function selectMember(member) {
    console.log('Selected member:', member.name);
    selectedMember = member;

    // Update UI
    document.querySelectorAll('.member-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.memberId === member._id) {
            item.classList.add('active');
        }
    });

    // Load conversation
    await loadConversation(member._id);

    // Build chat window
    buildChatWindow(member);
    console.log('Chat window built for:', member.name);
}

// Load conversation
async function loadConversation(memberId) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/messages/conversation/${memberId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        messages = data.messages || [];

        // Mark messages as read
        await markMessagesAsRead(memberId);
    } catch (error) {
        console.error('Error loading conversation:', error);
        messages = [];
    }
}

// Mark messages as read
async function markMessagesAsRead(memberId) {
    const token = localStorage.getItem('token');

    try {
        // Optimistic UI update
        if (unreadCounts[memberId] > 0) {
            totalUnreadMessages -= unreadCounts[memberId];
            if (totalUnreadMessages < 0) totalUnreadMessages = 0;
            unreadCounts[memberId] = 0;

            // Update UI
            updateNavbarBadge();

            // Update member list item
            const memberItem = document.querySelector(`.member-item[data-member-id="${memberId}"]`);
            if (memberItem) {
                memberItem.classList.remove('has-unread');
                const badge = memberItem.querySelector('.unread-badge');
                if (badge) badge.remove();

                const lastMsg = memberItem.querySelector('.member-item-last-message');
                if (lastMsg && lastMsg.textContent.includes('new messages')) {
                    lastMsg.textContent = 'Click to chat';
                }
            }
        }

        // API Call
        await fetch(`${API_BASE_URL}/messages/mark-read/${memberId}`, {
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

    // Listen for confirmation of sent messages
    socket.on('message:sent', (data) => {
        // Replace temp message with real one
        const index = messages.findIndex(m => m.tempId === data.tempId);
        if (index !== -1) {
            messages[index] = { ...messages[index], ...data }; // Merge to keep tempId if needed, or just replace
            // displayMessages(); // Optional: if we need to update ID in DOM
        }
    });

    // Listen for incoming messages
    socket.on('message:received', (data) => {
        // Only show if from selected member
        if (selectedMember && data.senderId === selectedMember._id) {
            messages.push({
                _id: data._id,
                senderId: data.senderId,
                receiverId: currentUser._id,
                message: data.message,
                createdAt: data.createdAt,
                isRead: false
            });
            displayMessages();

            // Mark as read immediately via API and update UI
            markMessagesAsRead(selectedMember._id);
        } else {
            // Update members list for unread indicators only if we aren't viewing this chat
            loadMembers();
        }
    });

    // Listen for typing indicators
    socket.on('typing:started', (data) => {
        if (selectedMember && data.senderId === selectedMember._id) {
            document.getElementById('memberStatus').textContent = 'typing...';
            showTypingIndicator(); // Also show the bubble visual
        }
    });

    socket.on('typing:stopped', (data) => {
        if (selectedMember && data.senderId === selectedMember._id) {
            // Revert to online/offline status
            // We might need to track actual online status separately if we want to revert correctly
            // For now, let's assume online if they were typing
            // Or better, just remove the 'typing...' text
            const statusDot = document.querySelector('.chat-header .status-dot');
            const isOnline = statusDot ? statusDot.classList.contains('online') : false;
            document.getElementById('memberStatus').innerHTML = `
                <span class="status-dot ${isOnline ? 'online' : ''}"></span>
                ${isOnline ? 'Online' : 'Offline'}
             `;
            hideTypingIndicator();
        }
    });

    // Listen for user status updates
    socket.on('user:status', (data) => {
        // Update sidebar
        const memberItem = document.querySelector(`[data-member-id="${data.userId}"]`);
        if (memberItem) {
            const statusDot = memberItem.querySelector('.member-item-avatar'); // We don't have a dot in sidebar avatar currently, maybe add one?
            // The sidebar HTML structure uses .status-dot inside .member-item-info? No, let's check displayMembers
            // displayMembers doesn't seem to have a status dot. 
            // It has .member-item-last-message.
            // Let's just update the specific chat header if selected.
        }

        // Update selected member chat header
        if (selectedMember && selectedMember._id === data.userId) {
            const statusContainer = document.getElementById('memberStatus');
            if (statusContainer) {
                statusContainer.innerHTML = `
                    <span class="status-dot ${data.status === 'online' ? 'online' : ''}"></span>
                    ${data.status === 'online' ? 'Online' : 'Offline'}
                `;
            }
        }
    });
}

// Build chat window
function buildChatWindow(member) {
    const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    chatWindow.innerHTML = `
        <div class="chat-header">
            <div class="chat-user-avatar">${initials}</div>
            <div class="chat-user-info">
                <div class="chat-user-name">${member.name}</div>
                <div class="chat-user-status" id="memberStatus">
                    <span class="status-dot offline"></span>
                    Offline
                </div>
            </div>
        </div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input-container">
            <!-- File Preview -->
            <div class="file-preview-container" id="filePreviewContainer"></div>
            
            <!-- Emoji Picker -->
            <div class="emoji-picker-popup" id="emojiPicker">
                <div class="emoji-picker-header">😊 Emojis</div>
                <div class="emoji-grid" id="emojiGrid"></div>
            </div>
            
            <div class="chat-input-wrapper">
                <div class="chat-input-field-container">
                    <button class="input-action-btn" id="emojiBtn" title="Add emoji">😊</button>
                    <input type="text" class="chat-input" id="chatInput" placeholder="Type your message..." />
                    <button class="input-action-btn" id="attachBtn" title="Attach file">📎</button>
                    <input type="file" id="fileInput" accept="image/*,video/*,.pdf,.doc,.docx" multiple style="display: none;" />
                </div>
                <button class="send-btn" id="sendBtn">
                    <span>➤</span>
                </button>
            </div>
        </div>
    `;

    // Populate emoji grid
    populateEmojiGrid();

    // Display messages
    displayMessages();

    // Event listeners
    document.getElementById('chatInput').addEventListener('input', handleTyping);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    document.getElementById('sendBtn').addEventListener('click', sendMessage);

    // Emoji picker events
    document.getElementById('emojiBtn').addEventListener('click', toggleEmojiPicker);

    // Attachment events
    document.getElementById('attachBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);

    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
        const emojiPicker = document.getElementById('emojiPicker');
        const emojiBtn = document.getElementById('emojiBtn');
        if (emojiPicker && !emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
            emojiPicker.classList.remove('active');
            emojiBtn.classList.remove('active');
        }
    });
}

// Emoji list
const EMOJIS = [
    '😊', '😂', '🤣', '❤️', '😍', '🔥', '👍', '👏',
    '💪', '🏋️', '🏃', '💯', '⭐', '🎯', '🚀', '💥',
    '😎', '🤔', '😅', '🙌', '✨', '🎉', '👋', '🙏',
    '💬', '📊', '📈', '🏆', '🥇', '💪🏼', '🤝', '👊',
    '😤', '💢', '😈', '🙃', '🤗', '😶', '🤐', '😴',
    '🏋️‍♂️', '🏋️‍♀️', '🧘', '🧘‍♀️', '🤸', '🏊', '🚴', '⚡'
];

// Populate emoji grid
function populateEmojiGrid() {
    const emojiGrid = document.getElementById('emojiGrid');
    if (!emojiGrid) return;

    emojiGrid.innerHTML = EMOJIS.map(emoji =>
        `<button class="emoji-item" data-emoji="${emoji}">${emoji}</button>`
    ).join('');

    // Add click handlers
    emojiGrid.querySelectorAll('.emoji-item').forEach(btn => {
        btn.addEventListener('click', () => {
            insertEmoji(btn.dataset.emoji);
        });
    });
}

// Toggle emoji picker
function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    const emojiBtn = document.getElementById('emojiBtn');

    emojiPicker.classList.toggle('active');
    emojiBtn.classList.toggle('active');
}

// Insert emoji into input
function insertEmoji(emoji) {
    const chatInput = document.getElementById('chatInput');
    const cursorPos = chatInput.selectionStart;
    const textBefore = chatInput.value.substring(0, cursorPos);
    const textAfter = chatInput.value.substring(cursorPos);

    chatInput.value = textBefore + emoji + textAfter;
    chatInput.focus();
    chatInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);

    // Close emoji picker
    document.getElementById('emojiPicker').classList.remove('active');
    document.getElementById('emojiBtn').classList.remove('active');
}

// Selected files for attachment
let selectedFiles = [];

// Handle file selection
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    selectedFiles = [...selectedFiles, ...files].slice(0, 3); // Max 3 files

    updateFilePreview();
}

// Update file preview
function updateFilePreview() {
    const container = document.getElementById('filePreviewContainer');

    if (selectedFiles.length === 0) {
        container.classList.remove('active');
        container.innerHTML = '';
        return;
    }

    container.classList.add('active');
    container.innerHTML = selectedFiles.map((file, index) => {
        const isImage = file.type.startsWith('image/');
        const size = formatFileSize(file.size);

        if (isImage) {
            const url = URL.createObjectURL(file);
            return `
                <div class="file-preview-item">
                    <img src="${url}" alt="${file.name}">
                    <div class="file-preview-info">
                        <span class="file-preview-name">${file.name}</span>
                        <span class="file-preview-size">${size}</span>
                    </div>
                    <button class="file-preview-remove" onclick="removeFile(${index})">✕</button>
                </div>
            `;
        } else {
            return `
                <div class="file-preview-item">
                    <span style="font-size: 1.5rem;">📄</span>
                    <div class="file-preview-info">
                        <span class="file-preview-name">${file.name}</span>
                        <span class="file-preview-size">${size}</span>
                    </div>
                    <button class="file-preview-remove" onclick="removeFile(${index})">✕</button>
                </div>
            `;
        }
    }).join('');
}

// Remove file from selection
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFilePreview();
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Make remove file globally accessible
window.removeFile = removeFile;

// Display messages
function displayMessages() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';

    if (messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="chat-empty-messages">
                <span>💬</span>
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }

    messages.forEach(msg => {
        const isSent = (msg.senderId._id || msg.senderId) === currentUser._id;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;

        const time = new Date(msg.createdAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Get initials for avatar
        const senderName = isSent ? currentUser.name : selectedMember?.name || 'User';
        const initials = senderName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

        messageDiv.innerHTML = `
            <div class="message-avatar">${initials}</div>
            <div class="message-content">
                <div class="message-bubble">${escapeHtml(msg.message)}</div>
                <span class="message-time">${time}</span>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
    });

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle typing
function handleTyping() {
    if (!selectedMember) return;

    if (!isTyping) {
        isTyping = true;
        socket.emit('typing:start', { receiverId: selectedMember._id });
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        isTyping = false;
        socket.emit('typing:stop', { receiverId: selectedMember._id });
    }, 1000);
}

// Send message
function sendMessage() {
    if (!selectedMember) return;

    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (!message) return;

    const tempId = Date.now().toString();

    // Add to UI optimistically
    messages.push({
        _id: tempId,
        senderId: currentUser,
        receiverId: selectedMember,
        message,
        createdAt: new Date(),
        tempId
    });

    displayMessages();
    chatInput.value = '';

    // Send via Socket.IO
    socket.emit('message:send', {
        receiverId: selectedMember._id,
        message,
        tempId
    });
}



// Typing indicator
function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    if (!document.getElementById('typingIndicator')) {
        const indicator = document.createElement('div');
        indicator.id = 'typingIndicator';
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
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

// Close modal when pressing Escape, handle arrow keys for modal
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
    }
});
