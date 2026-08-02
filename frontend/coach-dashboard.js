// ====================================
// COACH DASHBOARD JAVASCRIPT
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
const loadingOverlay = document.getElementById('loadingOverlay');

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
            // Redirect member to member dashboard
            window.location.href = '/dashboard';
            return;
        }

        currentUser = data.user;
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

    // Setup logout modal
    setupLogoutModal();

    // Load dashboard data
    await loadDashboardData();

    // Initialize WebSocket
    initializeWebSocket();
});

// Toggle profile sidebar
function toggleProfileSidebar() {
    profileSidebar.classList.toggle('active');
}

// Close profile sidebar
function closeProfileSidebar() {
    profileSidebar.classList.remove('active');
}

//Load dashboard data
async function loadDashboardData() {
    const token = localStorage.getItem('token');

    try {
        // Update UI with user data
        updateUserInfo(currentUser);

        // Fetch members and their stats
        const response = await fetch(`${API_BASE_URL}/coach/members/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch members');
        }

        const data = await response.json();
        displayMembers(data.members);
        updateDashboardStats(data.members);

        // Hide loading overlay
        loadingOverlay.classList.add('hidden');

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Failed to load dashboard data', 'error');
        loadingOverlay.classList.add('hidden');
    }
}

// Update user info in UI
function updateUserInfo(user) {
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    // Update navbar
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userName').textContent = user.name.split(' ')[0];

    // Update welcome message
    document.getElementById('welcomeName').textContent = user.name.split(' ')[0];

    // Update sidebar
    document.getElementById('userAvatarLarge').textContent = initials;
    document.getElementById('userNameLarge').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
}

// Update dashboard statistics
function updateDashboardStats(members) {
    const totalMembers = members.length;
    const totalWorkouts = members.reduce((sum, m) => sum + (m.stats.weeklyWorkouts || 0), 0);
    const activeToday = members.filter(m => m.stats.weeklyWorkouts > 0).length;

    document.getElementById('totalMembers').textContent = totalMembers;
    document.getElementById('totalWorkouts').textContent = totalWorkouts;
    document.getElementById('activeToday').textContent = activeToday;
}

// Display members list
function displayMembers(members) {
    const membersList = document.getElementById('membersList');

    if (!members || members.length === 0) {
        // Empty state already exists
        return;
    }

    // Clear empty state
    membersList.innerHTML = '';

    members.forEach(member => {
        const memberCard = document.createElement('div');
        memberCard.className = 'member-card';

        const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

        memberCard.innerHTML = `
            <div class="member-info">
                <div class="member-avatar">${initials}</div>
                <div class="member-details">
                    <h4>${member.name}</h4>
                    <p>${member.email}</p>
                </div>
            </div>
            <div class="member-stats">
                <div class="stat-item">
                    <span class="stat-label">Total Workouts</span>
                    <span class="stat-value">${member.stats.totalWorkouts || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Calories Burned</span>
                    <span class="stat-value">${formatNumber(member.stats.totalCalories || 0)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">This Week</span>
                    <span class="stat-value">${member.stats.weeklyWorkouts || 0} workouts</span>
                </div>
            </div>
            <div class="member-actions">
                <button class="btn btn-secondary btn-sm" onclick="viewMemberDetails('${member._id}')">
                    View Details
                </button>
                <button class="btn btn-primary btn-sm" onclick="chatWithMember('${member._id}', '${member.name}')">
                    💬 Chat
                </button>
            </div>
        `;

        membersList.appendChild(memberCard);
    });
}

// View member details - opens modal with weekly progress chart
let memberWeeklyChart = null;
let currentViewingMemberId = null;

async function viewMemberDetails(memberId) {
    const token = localStorage.getItem('token');
    currentViewingMemberId = memberId;

    try {
        // Show loading in modal
        const modal = document.getElementById('memberDetailsModal');
        modal.classList.add('active');

        // Fetch member progress data
        const response = await fetch(`${API_BASE_URL}/coach/member/${memberId}/progress`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch member details');
        }

        const data = await response.json();
        console.log('Member progress data:', data);

        // Update modal with member info
        populateMemberModal(data);

        // Draw the weekly chart
        drawWeeklyChart(data.dailyData);

    } catch (error) {
        console.error('Error fetching member details:', error);
        showToast('Failed to load member details', 'error');
        closeMemberModal();
    }
}

// Populate member details modal
function populateMemberModal(data) {
    const { member, stats, dailyData, recentWorkouts } = data;

    // Member info
    const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('modalMemberAvatar').textContent = initials;
    document.getElementById('modalMemberName').textContent = member.name;
    document.getElementById('modalMemberEmail').textContent = member.email;

    // Badges
    document.getElementById('modalMemberStreak').textContent = `🔥 ${stats.streak || 0} Day Streak`;
    document.getElementById('modalMemberLevel').textContent = member.profile?.experienceLevel || 'Member';

    // Weekly stats
    document.getElementById('modalWeeklyWorkouts').textContent = stats.weeklyWorkouts || 0;
    document.getElementById('modalWeeklyCalories').textContent = formatNumber(stats.weeklyCalories || 0);

    // Format duration with seconds
    document.getElementById('modalWeeklyDuration').textContent = formatDuration(stats.weeklyDuration || 0);

    // Set week date range
    if (dailyData && dailyData.length > 0) {
        const startDate = new Date(dailyData[0].date);
        const endDate = new Date(dailyData[dailyData.length - 1].date);

        const formatOptions = { month: 'short', day: 'numeric' };
        const startStr = startDate.toLocaleDateString('en-US', formatOptions);
        const endStr = endDate.toLocaleDateString('en-US', formatOptions);

        document.getElementById('modalWeekDateRange').textContent = `${startStr} - ${endStr}`;
    }

    // Recent workouts
    const recentWorkoutsList = document.getElementById('modalRecentWorkouts');

    if (!recentWorkouts || recentWorkouts.length === 0) {
        recentWorkoutsList.innerHTML = '<p class="text-muted">No recent workouts recorded</p>';
    } else {
        recentWorkoutsList.innerHTML = recentWorkouts.map(workout => {
            const date = new Date(workout.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Get workout name from exercises
            let workoutName = 'Workout';
            if (workout.exercises && workout.exercises.length > 0) {
                // Try to get unique body parts first
                const bodyParts = workout.exercises
                    .map(e => e.bodyPart)
                    .filter(Boolean)
                    .filter((v, i, a) => a.indexOf(v) === i);

                if (bodyParts.length > 0) {
                    // Capitalize body parts
                    workoutName = bodyParts.map(bp =>
                        bp.charAt(0).toUpperCase() + bp.slice(1)
                    ).join(', ');
                } else {
                    // Try exercise names
                    const exerciseNames = workout.exercises
                        .map(e => e.name)
                        .filter(Boolean)
                        .slice(0, 2); // Show max 2 exercise names

                    if (exerciseNames.length > 0) {
                        workoutName = exerciseNames.join(', ');
                        if (workout.exercises.length > 2) {
                            workoutName += ` +${workout.exercises.length - 2} more`;
                        }
                    } else {
                        workoutName = `${workout.exercises.length} Exercise${workout.exercises.length > 1 ? 's' : ''}`;
                    }
                }
            }

            return `
                <div class="workout-item">
                    <div class="workout-item-info">
                        <span class="workout-item-name">${workoutName}</span>
                        <span class="workout-item-date">${formattedDate}</span>
                    </div>
                    <div class="workout-item-stats">
                        <span>🔥 ${workout.totalCalories || 0} cal</span>
                        <span>⏱️ ${formatDuration(workout.totalDuration || 0)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Format duration with minutes and seconds
function formatDuration(totalSeconds) {
    if (!totalSeconds || totalSeconds === 0) return '0s';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.round(totalSeconds % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

// Draw weekly activity chart
function drawWeeklyChart(dailyData) {
    const ctx = document.getElementById('memberWeeklyChart').getContext('2d');

    // Destroy existing chart if exists
    if (memberWeeklyChart) {
        memberWeeklyChart.destroy();
    }

    const labels = dailyData.map(d => d.day);
    const workoutsData = dailyData.map(d => d.workouts);
    const caloriesData = dailyData.map(d => d.calories);

    // Colors for today and other days
    const barColors = dailyData.map(d =>
        d.isToday ? 'rgba(99, 102, 241, 0.9)' : 'rgba(99, 102, 241, 0.5)'
    );

    memberWeeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Calories Burned',
                    data: caloriesData,
                    backgroundColor: barColors,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1,
                    borderRadius: 8,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    padding: 12,
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    borderWidth: 1,
                    callbacks: {
                        afterBody: function (context) {
                            const index = context[0].dataIndex;
                            const dayData = dailyData[index];
                            return [
                                `Workouts: ${dayData.workouts}`,
                                `Duration: ${formatDuration(dayData.duration || 0)}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    },
                    title: {
                        display: true,
                        text: 'Calories',
                        color: 'rgba(148, 163, 184, 0.8)'
                    }
                }
            }
        }
    });
}

// Close member details modal
function closeMemberModal() {
    const modal = document.getElementById('memberDetailsModal');
    modal.classList.remove('active');
    currentViewingMemberId = null;
}

// Setup member modal events
document.addEventListener('DOMContentLoaded', () => {
    const closeMemberModalBtn = document.getElementById('closeMemberModal');
    const memberDetailsModal = document.getElementById('memberDetailsModal');
    const modalChatBtn = document.getElementById('modalChatBtn');
    const modalSendAlertBtn = document.getElementById('modalSendAlertBtn');

    if (closeMemberModalBtn) {
        closeMemberModalBtn.addEventListener('click', closeMemberModal);
    }

    if (memberDetailsModal) {
        memberDetailsModal.addEventListener('click', (e) => {
            if (e.target === memberDetailsModal) {
                closeMemberModal();
            }
        });
    }

    if (modalChatBtn) {
        modalChatBtn.addEventListener('click', () => {
            if (currentViewingMemberId) {
                const memberName = document.getElementById('modalMemberName').textContent;
                chatWithMember(currentViewingMemberId, memberName);
            }
        });
    }

    if (modalSendAlertBtn) {
        modalSendAlertBtn.addEventListener('click', () => {
            // Navigate to alerts page
            window.location.href = '/coach/alerts';
        });
    }
});

// Chat with member
function chatWithMember(memberId, memberName) {
    // Store selected member and redirect to chat page
    localStorage.setItem('selectedMemberId', memberId);
    localStorage.setItem('selectedMemberName', memberName);
    window.location.href = '/coach/members';
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

    // Close on overlay click
    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            logoutModal.classList.remove('active');
        }
    });
}

// Utility: Format large numbers
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
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

// Make functions global
window.viewMemberDetails = viewMemberDetails;
window.chatWithMember = chatWithMember;
