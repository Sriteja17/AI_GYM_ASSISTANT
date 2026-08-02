// ====================================
// DASHBOARD PAGE JAVASCRIPT
// ====================================

const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const profileBtn = document.getElementById('profileBtn');
const profileSidebar = document.getElementById('profileSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebar = document.getElementById('closeSidebar');
const logoutBtn = document.getElementById('logoutBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const notificationBtn = document.getElementById('notificationBtn');
const alertsPopup = document.getElementById('alertsPopup');

// User data
let currentUser = null;
let dashboardStats = null;
let alerts = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
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

    // Personal Details toggle
    const personalDetailsBtn = document.getElementById('personalDetailsBtn');
    if (personalDetailsBtn) {
        personalDetailsBtn.addEventListener('click', togglePersonalDetails);
    }

    // Notification bell setup
    if (notificationBtn) {
        notificationBtn.addEventListener('click', toggleAlertsPopup);
    }

    // Mark all read button
    const markAllRead = document.getElementById('markAllRead');
    if (markAllRead) {
        markAllRead.addEventListener('click', markAllAlertsAsRead);
    }

    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('notificationWrapper');
        if (wrapper && !wrapper.contains(e.target)) {
            alertsPopup?.classList.remove('active');
        }
    });

    // Load user data and dashboard stats
    await loadDashboardData();

    // Load alerts for members
    await loadAlerts();

    // Progress Reports button - scroll to weekly activity
    const progressReportsBtn = document.getElementById('progressReportsBtn');
    if (progressReportsBtn) {
        progressReportsBtn.addEventListener('click', scrollToWeeklyActivity);
    }

    // Settings toggle
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', toggleSettings);
    }

    // Edit details form submission
    const editDetailsForm = document.getElementById('editDetailsForm');
    if (editDetailsForm) {
        editDetailsForm.addEventListener('submit', handleSaveDetails);
    }

    // Check if URL has hash to scroll to weekly activity
    if (window.location.hash === '#weekly-activity') {
        setTimeout(() => scrollToWeeklyActivity(), 500);
    }

    // Initialize metric selector for weekly activity chart
    initMetricSelector();
});

// Toggle profile sidebar
function toggleProfileSidebar() {
    profileSidebar.classList.toggle('active');
}

// Close profile sidebar
function closeProfileSidebar() {
    profileSidebar.classList.remove('active');
}

// Toggle Personal Details Panel
function togglePersonalDetails() {
    const panel = document.getElementById('personalDetailsPanel');
    const btn = document.getElementById('personalDetailsBtn');

    panel.classList.toggle('hidden');
    btn.classList.toggle('active');
}

// Toggle Settings Panel
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    const btn = document.getElementById('settingsBtn');

    panel.classList.toggle('hidden');
    btn.classList.toggle('active');

    // If opening, populate form with current values
    if (!panel.classList.contains('hidden') && currentUser) {
        const profile = currentUser.profile || {};

        document.getElementById('editHeight').value = profile.height || '';
        document.getElementById('editWeight').value = profile.weight || '';
        document.getElementById('editAge').value = profile.age || '';
        document.getElementById('editLevel').value = profile.experienceLevel || '';
        document.getElementById('editAvailability').value = profile.availability || '';
    }
}

// Handle Save Details Form Submission
async function handleSaveDetails(e) {
    e.preventDefault();

    const height = document.getElementById('editHeight').value;
    const weight = document.getElementById('editWeight').value;
    const age = document.getElementById('editAge').value;
    const experienceLevel = document.getElementById('editLevel').value;
    const availability = document.getElementById('editAvailability').value;

    // Build profile update object (only include non-empty values)
    const profileUpdate = {};
    if (height) profileUpdate.height = parseFloat(height);
    if (weight) profileUpdate.weight = parseFloat(weight);
    if (age) profileUpdate.age = parseInt(age);
    if (experienceLevel) profileUpdate.experienceLevel = experienceLevel;
    if (availability) profileUpdate.availability = availability;

    if (Object.keys(profileUpdate).length === 0) {
        showToast('Please fill in at least one field', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileUpdate)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update profile');
        }

        const data = await response.json();

        // Update local user data
        currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));

        // Update displayed values
        updatePersonalDetails(data.user.profile || {});

        showToast('Profile updated successfully! ✅', 'success');

        // Close settings panel
        const panel = document.getElementById('settingsPanel');
        const btn = document.getElementById('settingsBtn');
        panel.classList.add('hidden');
        btn.classList.remove('active');

    } catch (error) {
        console.error('Error updating profile:', error);
        showToast(error.message || 'Failed to update profile', 'error');
    }
}

// Update Personal Details Display
function updatePersonalDetails(profile) {
    document.getElementById('detailHeight').textContent = profile.height ? `${profile.height} cm` : '--';
    document.getElementById('detailWeight').textContent = profile.weight ? `${profile.weight} kg` : '--';
    document.getElementById('detailAge').textContent = profile.age ? `${profile.age} years` : '--';
    document.getElementById('detailLevel').textContent = profile.experienceLevel || '--';
    document.getElementById('detailAvailability').textContent = profile.availability ? `${profile.availability} days/week` : '--';
}

// Scroll to Weekly Activity Section
function scrollToWeeklyActivity() {
    // Close sidebar first
    closeProfileSidebar();

    // Find the weekly activity section
    const weeklyActivitySection = document.getElementById('weeklyActivitySection');

    if (weeklyActivitySection) {
        // Smooth scroll to the section with offset for navbar
        const navbarHeight = 70;
        const elementPosition = weeklyActivitySection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navbarHeight - 20;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });

        // Add highlight animation
        weeklyActivitySection.classList.add('highlight-pulse');
        setTimeout(() => {
            weeklyActivitySection.classList.remove('highlight-pulse');
        }, 2000);
    }
}

// Load dashboard data
async function loadDashboardData() {
    const token = localStorage.getItem('token');

    try {
        // Fetch user data
        const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user data');
        }

        const userData = await userResponse.json();
        currentUser = userData.user;

        // Update UI with user data
        updateUserInfo(currentUser);
        updatePersonalDetails(currentUser);

        // Fetch dashboard stats
        const statsResponse = await fetch(`${API_BASE_URL}/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            dashboardStats = statsData;
            updateDashboardStats(statsData);
        }

        // Hide loading overlay
        loadingOverlay.classList.add('hidden');

    } catch (error) {
        console.error('Error loading dashboard:', error);

        // If unauthorized or failed to fetch user data, redirect to login
        if (error.message.includes('401') || error.message.includes('unauthorized') || error.message.includes('Failed to fetch user data')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        } else {
            showToast('Failed to load dashboard data. Please refresh the page.', 'error');
            loadingOverlay.classList.add('hidden');
        }
    }
}

// Update user info in UI
function updateUserInfo(user) {
    // Get initials for avatar
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

// Update dashboard statistics
function updateDashboardStats(stats) {
    // Set today's date label
    const todayDateLabel = document.getElementById('todayDateLabel');
    if (todayDateLabel) {
        const now = new Date();
        todayDateLabel.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    }

    // Update today's activity stats
    updateTodaysActivity(stats.recentWorkouts || []);

    // Update streak
    updateStreak(stats.recentWorkouts || []);

    // Update weekly activity chart
    updateWeeklyActivityChart(stats.recentWorkouts || []);

    // Generate AI recommendations based on user data
    generateAIRecommendations(stats);
}

// ====================================
// TODAY'S ACTIVITY
// ====================================

function updateTodaysActivity(workouts) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter workouts for today
    const todaysWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === today.getTime();
    });

    // Calculate today's totals
    const totalExercises = todaysWorkouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0);
    const totalCalories = todaysWorkouts.reduce((sum, w) => sum + (w.totalCalories || 0), 0);
    const totalDuration = todaysWorkouts.reduce((sum, w) => sum + (w.totalDuration || 0), 0);

    // Update Workouts Done card
    const todayCountEl = document.getElementById('todayWorkoutsCount');
    const todaySummaryEl = document.getElementById('todayWorkoutsSummary');

    if (todayCountEl) {
        todayCountEl.textContent = todaysWorkouts.length;
    }

    if (todaySummaryEl) {
        if (todaysWorkouts.length === 0) {
            todaySummaryEl.textContent = "No workouts yet";
            todaySummaryEl.classList.remove('positive');
        } else {
            todaySummaryEl.textContent = `${totalExercises} exercise${totalExercises !== 1 ? 's' : ''} completed`;
            todaySummaryEl.classList.add('positive');
        }
    }

    // Update Calories Burned card
    const todayCaloriesEl = document.getElementById('todayCaloriesValue');
    const todayCaloriesTrendEl = document.getElementById('todayCaloriesTrend');

    if (todayCaloriesEl) {
        todayCaloriesEl.textContent = formatNumber(totalCalories);
    }

    if (todayCaloriesTrendEl) {
        if (totalCalories === 0) {
            todayCaloriesTrendEl.textContent = "Start burning!";
            todayCaloriesTrendEl.classList.remove('positive');
        } else if (totalCalories < 100) {
            todayCaloriesTrendEl.textContent = "Good start! 💪";
            todayCaloriesTrendEl.classList.add('positive');
        } else if (totalCalories < 300) {
            todayCaloriesTrendEl.textContent = "Great effort! 🔥";
            todayCaloriesTrendEl.classList.add('positive');
        } else {
            todayCaloriesTrendEl.textContent = "On fire today! 🔥🔥";
            todayCaloriesTrendEl.classList.add('positive');
        }
    }

    // Update Time Active card
    const todayDurationEl = document.getElementById('todayDurationValue');
    const todayDurationTrendEl = document.getElementById('todayDurationTrend');

    if (todayDurationEl) {
        todayDurationEl.textContent = formatDuration(totalDuration);
    }

    if (todayDurationTrendEl) {
        if (totalDuration === 0) {
            todayDurationTrendEl.textContent = "Let's get moving!";
            todayDurationTrendEl.classList.remove('positive');
        } else if (totalDuration < 300) { // Less than 5 mins
            todayDurationTrendEl.textContent = "Warming up! 🏃";
            todayDurationTrendEl.classList.add('positive');
        } else if (totalDuration < 1800) { // Less than 30 mins
            todayDurationTrendEl.textContent = "Great session! 💪";
            todayDurationTrendEl.classList.add('positive');
        } else {
            todayDurationTrendEl.textContent = "Beast mode! 🦾";
            todayDurationTrendEl.classList.add('positive');
        }
    }
}

// ====================================
// STREAK CALCULATION
// ====================================

function updateStreak(workouts) {
    const streak = calculateStreak(workouts);

    const streakValueEl = document.getElementById('streakValue');
    const streakMessageEl = document.getElementById('streakMessage');

    if (streakValueEl) {
        streakValueEl.textContent = `${streak} day${streak !== 1 ? 's' : ''}`;
    }

    if (streakMessageEl) {
        // Remove all possible classes first
        streakMessageEl.classList.remove('positive', 'negative');

        if (streak === 0) {
            streakMessageEl.textContent = "Start your streak today!";
            streakMessageEl.classList.add('negative');
        } else if (streak === 1) {
            streakMessageEl.textContent = "Great start! Keep going!";
            streakMessageEl.classList.add('positive');
        } else if (streak < 3) {
            streakMessageEl.textContent = "Building momentum! 💪";
            streakMessageEl.classList.add('positive');
        } else if (streak < 7) {
            streakMessageEl.textContent = "You're on fire! 🔥";
            streakMessageEl.classList.add('positive');
        } else if (streak < 14) {
            streakMessageEl.textContent = "Unstoppable! Keep it up! 🚀";
            streakMessageEl.classList.add('positive');
        } else if (streak < 30) {
            streakMessageEl.textContent = "Amazing dedication! 🏆";
            streakMessageEl.classList.add('positive');
        } else {
            streakMessageEl.textContent = "Legendary streak! 👑";
            streakMessageEl.classList.add('positive');
        }
    }
}

function calculateStreak(workouts) {
    if (!workouts || workouts.length === 0) {
        return 0;
    }

    // Get unique workout dates (normalized to start of day)
    const workoutDates = new Set();
    workouts.forEach(workout => {
        const date = new Date(workout.date);
        date.setHours(0, 0, 0, 0);
        workoutDates.add(date.getTime());
    });

    // Start from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    // Check if there's a workout today
    const hasWorkoutToday = workoutDates.has(today.getTime());

    // If no workout today, start checking from yesterday
    if (!hasWorkoutToday) {
        currentDate.setDate(currentDate.getDate() - 1);
    }

    // Count consecutive days with workouts going backwards
    while (workoutDates.has(currentDate.getTime())) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);

        // Safety limit to prevent infinite loops
        if (streak > 365) break;
    }

    return streak;
}

// ====================================
// WEEKLY ACTIVITY CHART
// ====================================

// Store weekly data globally for metric switching
let weeklyChartData = [];
let currentMetric = 'workouts'; // Default to workouts (matches HTML active state)

// Initialize metric selector - now using the summary items
function initMetricSelector() {
    const summaryItems = document.querySelectorAll('.summary-item.clickable');

    summaryItems.forEach(item => {
        item.addEventListener('click', () => {
            const metric = item.dataset.metric;

            // Update active state
            summaryItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Update current metric and re-render chart
            currentMetric = metric;
            updateChartForMetric(metric);
        });
    });
}

// Update chart for selected metric
function updateChartForMetric(metric) {
    if (!weeklyChartData || weeklyChartData.length === 0) return;

    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const todayIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

    // Get all values for the selected metric
    let values = [];
    switch (metric) {
        case 'calories':
            values = weeklyChartData.map(d => d.calories);
            break;
        case 'duration':
            values = weeklyChartData.map(d => d.duration);
            break;
        case 'workouts':
            values = weeklyChartData.map(d => d.workouts);
            break;
        default:
            values = weeklyChartData.map(d => d.workouts);
    }

    // Get the maximum value (ensure at least a minimum for scaling)
    const maxValue = Math.max(...values, 1);

    // Calculate a nice scaled max for the Y-axis
    let scaledMax;
    let yMaxLabel, yMidLabel, yMinLabel;

    if (metric === 'duration') {
        // Duration in seconds - scale to nice minute values
        if (maxValue <= 30) {
            scaledMax = 60; // 1 minute max
        } else if (maxValue <= 60) {
            scaledMax = 120; // 2 minutes max
        } else if (maxValue <= 120) {
            scaledMax = 180; // 3 minutes max
        } else if (maxValue <= 300) {
            scaledMax = 300; // 5 minutes max
        } else {
            scaledMax = Math.ceil(maxValue / 60) * 60;
        }
        const maxMins = Math.floor(scaledMax / 60);
        const midMins = Math.floor(scaledMax / 120);
        yMaxLabel = maxMins >= 1 ? `${maxMins}m` : `${scaledMax}s`;
        yMidLabel = midMins >= 1 ? `${midMins}m` : `${Math.floor(scaledMax / 2)}s`;
        yMinLabel = '0s';
    } else if (metric === 'workouts') {
        // Workouts - simple integer scale
        if (maxValue <= 2) {
            scaledMax = 3;
        } else if (maxValue <= 5) {
            scaledMax = 6;
        } else if (maxValue <= 10) {
            scaledMax = 12;
        } else {
            scaledMax = Math.ceil(maxValue * 1.2);
        }
        yMaxLabel = `${scaledMax}`;
        yMidLabel = `${Math.floor(scaledMax / 2)}`;
        yMinLabel = '0';
    } else {
        // Calories - scale to nice round numbers
        if (maxValue <= 50) {
            scaledMax = 100;
        } else if (maxValue <= 100) {
            scaledMax = 150;
        } else if (maxValue <= 200) {
            scaledMax = 250;
        } else if (maxValue <= 500) {
            scaledMax = 500;
        } else {
            scaledMax = Math.ceil(maxValue / 100) * 100 + 100;
        }
        yMaxLabel = `${scaledMax} cal`;
        yMidLabel = `${Math.floor(scaledMax / 2)} cal`;
        yMinLabel = '0 cal';
    }

    // Update Y-axis labels
    const yMaxEl = document.getElementById('yMax');
    const yMidEl = document.getElementById('yMid');
    const yMinEl = document.getElementById('yMin');

    if (yMaxEl) yMaxEl.textContent = yMaxLabel;
    if (yMidEl) yMidEl.textContent = yMidLabel;
    if (yMinEl) yMinEl.textContent = yMinLabel;

    // Update each bar
    weeklyChartData.forEach((data, index) => {
        const bar = document.getElementById(`bar-${index}`);
        const tooltip = document.getElementById(`tooltip-${index}`);
        const status = document.getElementById(`status-${index}`);

        if (bar) {
            // Get the value for this day
            let value;
            switch (metric) {
                case 'calories':
                    value = data.calories;
                    break;
                case 'duration':
                    value = data.duration;
                    break;
                case 'workouts':
                    value = data.workouts;
                    break;
                default:
                    value = data.workouts;
            }

            // Calculate height in pixels (max usable height is ~180px after labels)
            const maxBarHeight = 180; // pixels
            let heightPx = scaledMax > 0 ? (value / scaledMax) * maxBarHeight : 0;

            // If there's a value but it would be too small to see, give it minimum visibility
            if (value > 0 && heightPx < 15) {
                heightPx = 15;
            }
            // Always show at least a tiny bar for visual consistency  
            if (value === 0) {
                heightPx = 4;
            }

            // Animate bar with delay - use pixels for reliable sizing
            setTimeout(() => {
                bar.style.height = `${heightPx}px`;
            }, index * 60);

            // Update bar classes
            bar.classList.remove('today', 'rest', 'active', 'metric-calories', 'metric-duration', 'metric-workouts');
            bar.classList.add(`metric-${metric}`);

            if (index === todayIndex) {
                bar.classList.add('today');
            } else if (data.workouts === 0 && index < todayIndex) {
                bar.classList.add('rest');
            } else if (data.workouts > 0) {
                bar.classList.add('active');
            }
        }

        if (tooltip) {
            if (data.workouts > 0) {
                switch (metric) {
                    case 'calories':
                        tooltip.innerHTML = `<strong>${data.calories}</strong> cal<br>${data.workouts} workout${data.workouts > 1 ? 's' : ''}`;
                        break;
                    case 'duration':
                        tooltip.innerHTML = `<strong>${formatDuration(data.duration)}</strong><br>${data.workouts} workout${data.workouts > 1 ? 's' : ''}`;
                        break;
                    case 'workouts':
                        tooltip.innerHTML = `<strong>${data.workouts}</strong> workout${data.workouts > 1 ? 's' : ''}<br>${data.calories} cal`;
                        break;
                }
            } else if (index <= todayIndex) {
                tooltip.textContent = 'Rest day';
            } else {
                tooltip.textContent = 'Upcoming';
            }
        }

        if (status) {
            if (data.workouts > 0) {
                status.textContent = `✓ ${data.workouts}`;
                status.style.color = '#10b981';
            } else if (index < todayIndex) {
                status.textContent = 'Rest';
                status.style.color = 'var(--text-muted)';
            } else if (index === todayIndex) {
                status.textContent = 'Today';
                status.style.color = '#10b981';
            } else {
                status.textContent = '-';
                status.style.color = 'var(--text-muted)';
            }
        }
    });
}

function updateWeeklyActivityChart(workouts) {
    // Get the start and end of the current week (Monday to Sunday)
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Update week period label
    const weekPeriodEl = document.getElementById('weekPeriod');
    if (weekPeriodEl) {
        const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        weekPeriodEl.textContent = `${startStr} - ${endStr}`;
    }

    // Initialize daily data array (Mon-Sun)
    const dailyData = Array(7).fill(null).map(() => ({
        calories: 0,
        duration: 0,
        workouts: 0
    }));

    // Process workouts for this week
    workouts.forEach(workout => {
        const workoutDate = new Date(workout.date);

        // Check if workout is in current week
        if (workoutDate >= weekStart && workoutDate <= weekEnd) {
            // Calculate day index (0 = Monday, 6 = Sunday)
            const dayOfWeek = workoutDate.getDay();
            const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

            dailyData[dayIndex].calories += workout.totalCalories || 0;
            dailyData[dayIndex].duration += workout.totalDuration || 0;
            dailyData[dayIndex].workouts += 1;
        }
    });

    // Store in global variable for metric switching
    weeklyChartData = dailyData;

    // Calculate totals for summary stats
    let totalWeeklyCalories = 0;
    let totalWeeklyDuration = 0;
    let totalWeeklyWorkouts = 0;

    dailyData.forEach((data) => {
        totalWeeklyCalories += data.calories;
        totalWeeklyDuration += data.duration;
        totalWeeklyWorkouts += data.workouts;
    });

    // Update summary stats
    const weeklyWorkoutsCountEl = document.getElementById('weeklyWorkoutsCount');
    const weeklyCaloriesSumEl = document.getElementById('weeklyCaloriesSum');
    const weeklyDurationEl = document.getElementById('weeklyDuration');

    if (weeklyWorkoutsCountEl) weeklyWorkoutsCountEl.textContent = totalWeeklyWorkouts;
    if (weeklyCaloriesSumEl) weeklyCaloriesSumEl.textContent = formatNumber(totalWeeklyCalories);
    if (weeklyDurationEl) weeklyDurationEl.textContent = formatDuration(totalWeeklyDuration);

    // Update chart bars based on current metric
    updateChartForMetric(currentMetric);
}

// Update recent workouts list
function updateRecentWorkouts(workouts) {
    const workoutsList = document.getElementById('recentWorkoutsList');

    // Element was removed from dashboard, so exit early if not found
    if (!workoutsList) return;

    if (!workouts || workouts.length === 0) {
        // Show empty state (already there by default)
        return;
    }

    // Clear empty state
    workoutsList.innerHTML = '';

    // Limit to 5 most recent workouts for display (backend returns all weekly workouts for chart)
    const displayWorkouts = workouts.slice(0, 5);

    // Add workout items
    displayWorkouts.forEach(workout => {
        const workoutItem = document.createElement('div');
        workoutItem.className = 'workout-item';

        const date = new Date(workout.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        workoutItem.innerHTML = `
            <div class="workout-info">
                <h5>${workout.exercises.length} exercise${workout.exercises.length > 1 ? 's' : ''}</h5>
                <p>${formattedDate}</p>
            </div>
            <div class="workout-stats">
                <span class="workout-duration">⏱️ ${formatDuration(workout.totalDuration)}</span>
                <span class="workout-calories">🔥 ${workout.totalCalories || 0} cal</span>
            </div>
        `;

        workoutsList.appendChild(workoutItem);
    });
}

// ====================================
// AI RECOMMENDATIONS
// ====================================

function generateAIRecommendations(stats) {
    const recommendationsEl = document.getElementById('aiRecommendations');
    if (!recommendationsEl) return;

    const workouts = stats.recentWorkouts || [];
    const profile = stats.profile || {};
    const recommendations = [];

    // Calculate today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysWorkouts = workouts.filter(w => {
        const d = new Date(w.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    });

    // Calculate this week's data
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyWorkouts = workouts.filter(w => new Date(w.date) >= oneWeekAgo);
    const weeklyCalories = weeklyWorkouts.reduce((sum, w) => sum + (w.totalCalories || 0), 0);

    // Calculate streak
    const streak = calculateStreak(workouts);

    // Get muscle groups worked this week
    const muscleGroups = new Set();
    weeklyWorkouts.forEach(w => {
        w.exercises?.forEach(ex => {
            if (ex.muscleGroup) muscleGroups.add(ex.muscleGroup);
        });
    });

    // ===== GENERATE RECOMMENDATIONS =====

    // 1. Today's activity recommendation
    if (todaysWorkouts.length === 0) {
        const hour = new Date().getHours();
        if (hour < 12) {
            recommendations.push({
                icon: '🌅',
                text: "Start your day with a workout! Morning exercises boost metabolism all day."
            });
        } else if (hour < 18) {
            recommendations.push({
                icon: '💪',
                text: "Haven't worked out today yet. Perfect time for an afternoon session!"
            });
        } else {
            recommendations.push({
                icon: '🌙',
                text: "There's still time for a quick evening workout before bed!"
            });
        }
    } else {
        const todayCalories = todaysWorkouts.reduce((sum, w) => sum + (w.totalCalories || 0), 0);
        recommendations.push({
            icon: '✅',
            text: `Great job today! You've burned ${todayCalories} calories across ${todaysWorkouts.length} workout${todaysWorkouts.length > 1 ? 's' : ''}.`
        });
    }

    // 2. Streak-based recommendation
    if (streak === 0) {
        recommendations.push({
            icon: '🔥',
            text: "Start your workout streak today! Consistency is key to reaching your goals."
        });
    } else if (streak >= 7) {
        recommendations.push({
            icon: '🏆',
            text: `Amazing ${streak}-day streak! You're building powerful habits. Keep it up!`
        });
    } else if (streak >= 3) {
        recommendations.push({
            icon: '⚡',
            text: `${streak}-day streak! You're on fire! Just ${7 - streak} more days to a full week.`
        });
    } else {
        recommendations.push({
            icon: '🎯',
            text: `${streak}-day streak started! Keep going to build momentum.`
        });
    }

    // 3. Weekly activity recommendation
    if (weeklyWorkouts.length < 3) {
        recommendations.push({
            icon: '📈',
            text: `Only ${weeklyWorkouts.length} workout${weeklyWorkouts.length !== 1 ? 's' : ''} this week. Aim for at least 3-4 for optimal results!`
        });
    } else if (weeklyWorkouts.length >= 5) {
        recommendations.push({
            icon: '🌟',
            text: `${weeklyWorkouts.length} workouts this week! Excellent dedication. Remember to include rest days.`
        });
    }

    // 4. Profile-based recommendation
    if (profile.experienceLevel) {
        const level = profile.experienceLevel.toLowerCase();
        if (level === 'beginner') {
            recommendations.push({
                icon: '📚',
                text: "Focus on mastering proper form before increasing weight. Quality over quantity!"
            });
        } else if (level === 'intermediate') {
            recommendations.push({
                icon: '🎯',
                text: "Try progressive overload - gradually increase weights or reps each week."
            });
        } else if (level === 'advanced') {
            recommendations.push({
                icon: '🔬',
                text: "Consider periodization to break through plateaus and maximize gains."
            });
        }
    }

    // 5. Calorie-based recommendation
    if (weeklyCalories > 0) {
        const avgDailyCalories = Math.round(weeklyCalories / 7);
        if (avgDailyCalories < 100) {
            recommendations.push({
                icon: '🔥',
                text: `Averaging ${avgDailyCalories} cal/day. Try longer or more intense sessions!`
            });
        } else if (avgDailyCalories >= 300) {
            recommendations.push({
                icon: '💥',
                text: `Burning an average of ${avgDailyCalories} cal/day. Incredible effort!`
            });
        }
    }

    // Limit to 4 recommendations max
    const finalRecommendations = recommendations.slice(0, 4);

    // Render recommendations
    if (finalRecommendations.length === 0) {
        recommendationsEl.innerHTML = `
            <div class="suggestion-item">
                <span class="suggestion-icon">💡</span>
                <p>Start working out to get personalized AI recommendations!</p>
            </div>
        `;
    } else {
        recommendationsEl.innerHTML = finalRecommendations.map(rec => `
            <div class="suggestion-item">
                <span class="suggestion-icon">${rec.icon}</span>
                <p>${rec.text}</p>
            </div>
        `).join('');
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

// Utility: Format large numbers
function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

// Utility: Format duration from seconds to readable string
function formatDuration(seconds) {
    if (!seconds || seconds === 0) {
        return '0s';
    }

    // All values are now stored in seconds
    if (seconds < 60) {
        return `${seconds}s`;
    } else if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        if (secs === 0) {
            return `${mins}m`;
        }
        return `${mins}m ${secs}s`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.round(seconds % 60);
        if (mins === 0 && secs === 0) {
            return `${hours}h`;
        } else if (secs === 0) {
            return `${hours}h ${mins}m`;
        }
        return `${hours}h ${mins}m ${secs}s`;
    }
}

// Utility: Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
    `;

    // Add styles if not already present
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast-notification {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 12px 24px;
                border-radius: 8px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 10000;
                animation: slideUp 0.3s ease;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            }
            .toast-error { border-left: 4px solid #ef4444; }
            .toast-success { border-left: 4px solid #10b981; }
            .toast-info { border-left: 4px solid #3b82f6; }
            @keyframes slideUp {
                from { transform: translateX(-50%) translateY(100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
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
                // Default to cancel if nothing focused
                cancelLogout.click();
            }
        }
    } else if (e.key === 'Escape') {
        closeProfileSidebar();
        alertsPopup?.classList.remove('active');
    }
});

// ====================================
// ALERTS FUNCTIONALITY
// ====================================

// Toggle alerts popup
function toggleAlertsPopup(e) {
    e.stopPropagation();
    alertsPopup?.classList.toggle('active');
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
        displayAlertsError();
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
                <div class="alert-message">${escapeHtml(alert.message)}</div>
                <div class="alert-time">${time}</div>
            </div>
        `;
    }).join('');
}

// Display error message
function displayAlertsError() {
    const alertsList = document.getElementById('alertsList');
    if (alertsList) {
        alertsList.innerHTML = `
            <div class="alerts-empty">
                <span style="font-size: 2rem;">⚠️</span>
                <p>Failed to load alerts</p>
            </div>
        `;
    }
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

        // Update local state
        const alert = alerts.find(a => a._id === alertId);
        if (alert) {
            alert.isRead = true;
        }

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

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions global
window.markAlertAsRead = markAlertAsRead;
