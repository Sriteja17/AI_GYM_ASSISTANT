// ====================================
// WORKOUTS PAGE JAVASCRIPT - Full Implementation
// ====================================

// Exercise database (expandable)
const EXERCISE_DATABASE = {
    chest: [
        { name: 'Bench Press', difficulty: 'intermediate', duration: 30, calories: 150, thumbnail: '/assets/exercise-thumbnails/bench_press.png', videoId: 'rT7DgCr-3pg' },
        { name: 'Push-ups', difficulty: 'beginner', duration: 15, calories: 80, thumbnail: '/assets/exercise-thumbnails/push_ups.png', videoId: 'IODxDxX7oi4' },
        { name: 'Dumbbell Flyes', difficulty: 'advanced', duration: 20, calories: 120, thumbnail: '/assets/exercise-thumbnails/dumbbell_flyes.jpg', videoId: 'eozdVDA78K0' },
        { name: 'Incline Press', difficulty: 'intermediate', duration: 25, calories: 140, thumbnail: '/assets/exercise-thumbnails/incline_press.png', videoId: 'SrqOu55lrYU' }
    ],
    back: [
        { name: 'Pull-ups', difficulty: 'advanced', duration: 20, calories: 130, thumbnail: '/assets/exercise-thumbnails/pull_ups.jpg', videoId: 'eGo4IYlbE5g' },
        { name: 'Bent Over Rows', difficulty: 'intermediate', duration: 25, calories: 140, thumbnail: '/assets/exercise-thumbnails/bent_over_rows.jpg', videoId: 'FWJR5Ve8bnQ' },
        { name: 'Lat Pulldowns', difficulty: 'beginner', duration: 20, calories: 100, thumbnail: '/assets/exercise-thumbnails/lat_pulldowns.jpg', videoId: '1Sb4H5ZbvLc' },
        { name: 'Deadlifts', difficulty: 'advanced', duration: 30, calories: 180, thumbnail: '/assets/exercise-thumbnails/deadlifts.png', videoId: 'op9kVnSso6Q' }
    ],
    arms: [
        { name: 'Bicep Curls', difficulty: 'beginner', duration: 15, calories: 80, thumbnail: '/assets/exercise-thumbnails/bicep_curls.png', videoId: 'ykJmrZ5v0Oo' },
        { name: 'Tricep Dips', difficulty: 'intermediate', duration: 20, calories: 110, thumbnail: '/assets/exercise-thumbnails/tricep_dips.png', videoId: '0326dy_-CzM' },
        { name: 'Hammer Curls', difficulty: 'beginner', duration: 15, calories: 85, thumbnail: '/assets/exercise-thumbnails/hammer_curls.png', videoId: 'TwD-YGVP4Bk' },
        { name: 'Skull Crushers', difficulty: 'advanced', duration: 20, calories: 120, thumbnail: '/assets/exercise-thumbnails/skull_crushers.png', videoId: 'd_KZxkY_0cM' }
    ],
    shoulders: [
        { name: 'Shoulder Press', difficulty: 'intermediate', duration: 25, calories: 130, thumbnail: '/assets/exercise-thumbnails/shoulder_press.png', videoId: 'qEwKCR5JCog' },
        { name: 'Lateral Raises', difficulty: 'beginner', duration: 15, calories: 90, thumbnail: '/assets/exercise-thumbnails/lateral_raises.png', videoId: '3VcKaXpzqRo' },
        { name: 'Front Raises', difficulty: 'beginner', duration: 15, calories: 85, thumbnail: '/assets/exercise-thumbnails/front_raises.jpg', videoId: '_QnwAoesJvQ' },
        { name: 'Shrugs', difficulty: 'beginner', duration: 10, calories: 70, thumbnail: '/assets/exercise-thumbnails/shrugs.png', videoId: 'cJRVVxmytaM' }
    ],
    legs: [
        { name: 'Squats', difficulty: 'intermediate', duration: 30, calories: 160, thumbnail: '/assets/exercise-thumbnails/squats.png', videoId: 'ultWZbUMPL8' },
        { name: 'Lunges', difficulty: 'beginner', duration: 20, calories: 110, thumbnail: '/assets/exercise-thumbnails/lunges.png', videoId: 'QOVaHwm-Q6U' },
        { name: 'Leg Press', difficulty: 'intermediate', duration: 25, calories: 150, thumbnail: '/assets/exercise-thumbnails/leg_press.jpg', videoId: 'IZxyjW7MPJQ' },
        { name: 'Leg Curls', difficulty: 'beginner', duration: 15, calories: 95, thumbnail: '/assets/exercise-thumbnails/leg_curls.jpg', videoId: '1Tq3QdYUuHs' }
    ],
    core: [
        { name: 'Crunches', difficulty: 'beginner', duration: 15, calories: 70, thumbnail: '/assets/exercise-thumbnails/crunches.png', videoId: 'Xyd_fa5zoEU' },
        { name: 'Plank', difficulty: 'intermediate', duration: 10, calories: 60, thumbnail: '/assets/exercise-thumbnails/plank.png', videoId: 'pSHjTRCQxIw' },
        { name: 'Russian Twists', difficulty: 'intermediate', duration: 15, calories: 85, thumbnail: '/assets/exercise-thumbnails/russian_twists.png', videoId: 'wkD8rjkodUI' },
        { name: 'Leg Raises', difficulty: 'advanced', duration: 15, calories: 90, thumbnail: '/assets/exercise-thumbnails/leg_raises.png', videoId: 'JB2oyawG9KI' }
    ],
    cardio: [
        { name: 'Running', difficulty: 'beginner', duration: 30, calories: 250, thumbnail: '/assets/exercise-thumbnails/running.png', videoId: '0fIV2N9LPKU' },
        { name: 'Cycling', difficulty: 'beginner', duration: 30, calories: 220, thumbnail: '/assets/exercise-thumbnails/cycling.jpg', videoId: 'qFYPMPiGNHY' },
        { name: 'Jump Rope', difficulty: 'intermediate', duration: 15, calories: 180, thumbnail: '/assets/exercise-thumbnails/jump_rope.png', videoId: 'FJmRQ5iTXKE' },
        { name: 'Burpees', difficulty: 'advanced', duration: 10, calories: 150, thumbnail: '/assets/exercise-thumbnails/burpees.png', videoId: 'TU8QYVW0gDU' }
    ],
    fullbody: [
        { name: 'Burpees', difficulty: 'advanced', duration: 15, calories: 200, thumbnail: '/assets/exercise-thumbnails/burpees.png', videoId: 'TU8QYVW0gDU' },
        { name: 'Mountain Climbers', difficulty: 'intermediate', duration: 10, calories: 120, thumbnail: '/assets/exercise-thumbnails/mountain_climbers.png', videoId: 'nmwgirgXLYM' },
        { name: 'Jumping Jacks', difficulty: 'beginner', duration: 10, calories: 80, thumbnail: '/assets/exercise-thumbnails/jumping_jacks.png', videoId: 'iSSAk4XCsRA' },
        { name: 'Box Jumps', difficulty: 'advanced', duration: 15, calories: 150, thumbnail: '/assets/exercise-thumbnails/box_jumps.png', videoId: 'NBY9-kTuHEk' }
    ]
};

// State management
let currentMuscleGroup = null;
let selectedExercises = [];
let currentExerciseIndex = 0;
let currentWorkout = {
    exercises: [],
    startTime: null,
    totalCalories: 0,
    totalDuration: 0
};
let workoutTimer = null;
let restTimer = null;
let setCounter = 0;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadWorkoutStats();
    await loadWorkoutHistory();
    setupEventListeners();
    hideLoading();
});

// Setup event listeners
function setupEventListeners() {
    // Muscle group selection
    document.querySelectorAll('.muscle-card').forEach(card => {
        card.addEventListener('click', () => selectMuscleGroup(card.dataset.muscle));
    });

    // Back buttons
    document.getElementById('backToMuscles')?.addEventListener('click', showMuscleGroups);
    document.getElementById('backToExercises')?.addEventListener('click', showExercises);

    // Workout control buttons
    document.getElementById('startWorkoutBtn')?.addEventListener('click', showMuscleGroups);
    document.getElementById('finishWorkout')?.addEventListener('click', finishWorkout);
    document.getElementById('addSetBtn')?.addEventListener('click', addSet);
    document.getElementById('nextExerciseBtn')?.addEventListener('click', nextExercise);
    document.getElementById('skipRest')?.addEventListener('click', skipRest);

    // Summary modal
    document.getElementById('closeSummary')?.addEventListener('click', closeSummary);
    document.getElementById('doneSummary')?.addEventListener('click', closeSummary);
}

// Load workout stats from API (today's stats + streak)
async function loadWorkoutStats() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${window.API_BASE_URL}/workouts/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const stats = await response.json();

            // Update today's stats from API
            if (stats.today) {
                document.getElementById('todayCalories').textContent = stats.today.calories || 0;
                document.getElementById('todayDuration').textContent = formatDurationDisplay(stats.today.duration || 0);
                document.getElementById('todayExercises').textContent = stats.today.exercises || 0;
            }

            // Update streak
            document.getElementById('weekStreak').textContent = stats.streak || 0;
        } else {
            // API failed, set defaults
            resetStatsDisplay();
        }
    } catch (error) {
        console.error('Error loading workout stats:', error);
        resetStatsDisplay();
    }
}

// Reset stats display to zero
function resetStatsDisplay() {
    document.getElementById('todayCalories').textContent = '0';
    document.getElementById('todayDuration').textContent = '0s';
    document.getElementById('todayExercises').textContent = '0';
    document.getElementById('weekStreak').textContent = '0';
}

// Format duration from seconds to readable string
function formatDurationDisplay(seconds) {
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


// Update stats display (from API - aggregated totals)
function updateStatsDisplay(stats) {
    document.getElementById('todayCalories').textContent = stats.today.calories;
    document.getElementById('todayDuration').textContent = formatDurationDisplay(stats.today.duration);
    document.getElementById('todayExercises').textContent = stats.today.exercises;
    document.getElementById('weekStreak').textContent = stats.streak;
}

// Update stats display with ONLY current workout's data (not aggregated totals)
function updateCurrentWorkoutStats() {
    // Show only the current workout's stats, not the aggregated total
    document.getElementById('todayCalories').textContent = currentWorkout.totalCalories;
    document.getElementById('todayDuration').textContent = formatDurationDisplay(currentWorkout.totalDuration);
    document.getElementById('todayExercises').textContent = currentWorkout.exercises.length;
    // Streak stays the same or increments by 1 if this is first workout today
}

// Load workout history
async function loadWorkoutHistory() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${window.API_BASE_URL}/workouts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            displayWorkoutHistory(data.workouts);
        }
    } catch (error) {
        console.error('Error loading workout history:', error);
    }
}

// Display workout history grouped by date (last 3 days only)
function displayWorkoutHistory(workouts) {
    const historyList = document.getElementById('historyList');

    if (!workouts || workouts.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📋</span>
                <p>No workout history yet</p>
                <small>Start your first workout to see it here!</small>
            </div>
        `;
        return;
    }

    // Filter to only show workouts from the past 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    const recentWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= threeDaysAgo;
    });

    if (recentWorkouts.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📋</span>
                <p>No recent workouts</p>
                <small>Workouts from the past 3 days will appear here</small>
            </div>
        `;
        return;
    }

    // Group workouts by date
    const groupedWorkouts = {};
    recentWorkouts.forEach(workout => {
        const date = new Date(workout.date);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format

        if (!groupedWorkouts[dateKey]) {
            groupedWorkouts[dateKey] = {
                date: date,
                workouts: [],
                totalCalories: 0,
                totalDuration: 0,
                totalExercises: 0
            };
        }

        groupedWorkouts[dateKey].workouts.push(workout);
        groupedWorkouts[dateKey].totalCalories += workout.totalCalories || 0;
        groupedWorkouts[dateKey].totalDuration += workout.totalDuration || 0;
        groupedWorkouts[dateKey].totalExercises += workout.exercises?.length || 0;
    });

    // Sort dates in descending order (most recent first)
    const sortedDates = Object.keys(groupedWorkouts).sort((a, b) => new Date(b) - new Date(a));

    // Generate HTML for grouped workouts
    historyList.innerHTML = sortedDates.map(dateKey => {
        const group = groupedWorkouts[dateKey];
        const date = group.date;
        const day = date.getDate();
        const month = date.toLocaleString('en', { month: 'short' }).toUpperCase();
        const weekday = date.toLocaleString('en', { weekday: 'long' });

        // Check if this is today
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        let dateLabel = weekday;
        if (isToday) dateLabel = 'Today';
        else if (isYesterday) dateLabel = 'Yesterday';

        // Generate exercises list for this date
        const exercisesList = group.workouts.map(workout => {
            const exerciseNames = workout.exercises?.map(ex => ex.name).join(', ') || 'Workout';
            return `
                <div class="history-exercise-item">
                    <div class="exercise-name">${exerciseNames}</div>
                    <div class="exercise-stats">
                        <span>⏱️ ${formatDurationDisplay(workout.totalDuration)}</span>
                        <span>🔥 ${workout.totalCalories} cal</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="history-date-group ${isToday ? 'today' : ''}">
                <div class="history-date-header">
                    <div class="history-date">
                        <div class="history-day">${day}</div>
                        <div class="history-month">${month}</div>
                    </div>
                    <div class="history-date-info">
                        <h4 class="history-date-label">${dateLabel}</h4>
                        <div class="history-date-summary">
                            <span>${group.totalExercises} exercise${group.totalExercises !== 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>${group.totalCalories} cal</span>
                            <span>•</span>
                            <span>${formatDurationDisplay(group.totalDuration)}</span>
                        </div>
                    </div>
                </div>
                <div class="history-exercises-list">
                    ${exercisesList}
                </div>
            </div>
        `;
    }).join('');
}


// Select muscle group
function selectMuscleGroup(muscle) {
    currentMuscleGroup = muscle;
    const exercises = EXERCISE_DATABASE[muscle] || [];

    document.getElementById('muscleGroupsSection').classList.add('hidden');
    document.getElementById('exercisesSection').classList.remove('hidden');
    document.getElementById('exerciseSectionTitle').textContent = `${capitalize(muscle)} Exercises`;

    displayExercises(exercises);
}

// Display exercises
function displayExercises(exercises) {
    const grid = document.getElementById('exercisesGrid');

    grid.innerHTML = exercises.map((exercise, index) => `
        <div class="exercise-card" data-exercise-index="${index}">
            <div class="exercise-thumbnail">
                <img src="${exercise.thumbnail}" alt="${exercise.name}" style="width: 120px; height: 120px; object-fit: contain;">
                <span class="difficulty-badge ${exercise.difficulty}">${capitalize(exercise.difficulty)}</span>
            </div>
            <div class="exercise-info">
                <h3 class="exercise-name">${exercise.name}</h3>
                <div class="exercise-meta">
                    <span>⏱️ ${exercise.duration} min</span>
                    <span>🔥 ${exercise.calories} cal</span>
                </div>
            </div>
        </div>
    `).join('');

    // Add click listeners
    grid.querySelectorAll('.exercise-card').forEach(card => {
        card.addEventListener('click', () => {
            const index = parseInt(card.dataset.exerciseIndex);
            startExercise(exercises[index]);
        });
    });
}

// Start exercise
function startExercise(exercise) {
    selectedExercises = [exercise];
    currentExerciseIndex = 0;
    currentWorkout = {
        exercises: [],
        startTime: Date.now(),
        totalCalories: 0,
        totalDuration: 0
    };
    setCounter = 0;

    showWorkoutTracker(exercise);
}

// Show workout tracker
function showWorkoutTracker(exercise) {
    document.getElementById('exercisesSection').classList.add('hidden');
    document.getElementById('workoutTracker').classList.remove('hidden');
    document.getElementById('currentExerciseName').textContent = exercise.name;

    // Display exercise demonstration as auto-cycling carousel
    const demoEl = document.getElementById('exerciseDemo');

    // Exercise demo images mapping (number of steps per exercise)
    const exerciseDemos = {
        // Chest
        'Bench Press': 4,
        'Push-ups': 3,
        'Dumbbell Flyes': 3,
        'Incline Press': 3,
        // Back
        'Pull-ups': 3,
        'Bent Over Rows': 3,
        'Lat Pulldowns': 3,
        'Deadlifts': 4,
        // Arms
        'Bicep Curls': 3,
        'Tricep Dips': 3,
        'Hammer Curls': 2,
        'Skull Crushers': 3,
        // Shoulders
        'Shoulder Press': 2,
        'Lateral Raises': 3,
        'Front Raises': 2,
        'Shrugs': 2,
        // Legs
        'Squats': 3,
        'Lunges': 2,
        'Leg Press': 2,
        'Leg Curls': 2,
        // Core
        'Crunches': 2,
        'Plank': 1,
        'Russian Twists': 2,
        'Leg Raises': 2,
        // Cardio
        'Running': 2,
        'Cycling': 2,
        'Jump Rope': 3,
        'Burpees': 4,
        // Full Body
        'Mountain Climbers': 2,
        'Jumping Jacks': 2,
        'Box Jumps': 3
    };

    const stepCount = exerciseDemos[exercise.name] || 0;

    if (stepCount > 0) {
        // Create carousel HTML
        const exerciseKey = exercise.name.toLowerCase().replace(/[\s-]/g, '_');
        demoEl.innerHTML = `
            <div class="demo-carousel">
                <div class="demo-carousel-inner" id="demoCarouselInner">
                    ${Array.from({ length: stepCount }, (_, i) => `
                        <img 
                            src="/assets/exercise-demos/${exerciseKey}_step${i + 1}.png" 
                            alt="${exercise.name} Step ${i + 1}"
                            class="demo-step${i === 0 ? ' active' : ''}"
                            onerror="this.style.display='none'"
                        />
                    `).join('')}
                </div>
                <div class="demo-indicators">
                    ${Array.from({ length: stepCount }, (_, i) => `
                        <span class="demo-indicator${i === 0 ? ' active' : ''}" data-step="${i}"></span>
                    `).join('')}
                </div>
                <div class="demo-controls">
                    <button class="demo-control-btn" onclick="previousDemoStep()">‹</button>
                    <div class="demo-step-label">Step <span id="currentDemoStep">1</span> of ${stepCount}</div>
                    <button class="demo-control-btn" onclick="nextDemoStep()">›</button>
                </div>
            </div>
        `;

        // Start auto-cycling (every 2 seconds)
        startDemoCarousel(stepCount);
    } else {
        // Fallback to placeholder
        demoEl.innerHTML = `
            <div class="demo-placeholder">
                <span style="font-size: 4rem;">${exercise.icon}</span>
                <p>Exercise Demonstration</p>
                <small style="opacity: 0.7;">Step-by-step images coming soon</small>
            </div>
        `;
    }

    // Start timer
    startWorkoutTimer();

    // Initialize sets
    document.getElementById('setsList').innerHTML = '';
    addSet();
}

// Start workout timer
function startWorkoutTimer() {
    const timerEl = document.getElementById('workoutTimer');
    const caloriesEl = document.getElementById('workoutCalories');

    workoutTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - currentWorkout.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timerEl.textContent = `${pad(minutes)}:${pad(seconds)}`;

        // Estimate calories (rough calculation)
        const caloriesPerMin = 5; // Base rate
        const totalCalories = Math.floor(elapsed / 60 * caloriesPerMin);
        caloriesEl.textContent = `${totalCalories} cal`;
        currentWorkout.totalCalories = totalCalories;
    }, 1000);
}

// Add set
function addSet() {
    setCounter++;
    const setsList = document.getElementById('setsList');

    const setItem = document.createElement('div');
    setItem.className = 'set-item';
    setItem.dataset.setNumber = setCounter;
    setItem.innerHTML = `
        <div class="set-number">Set ${setCounter}</div>
        <div class="set-input-group">
            <label>Reps</label>
            <input type="number" class="set-reps" placeholder="12" min="1" value="12">
        </div>
        <div class="set-input-group">
            <label>Weight (kg)</label>
            <input type="number" class="set-weight" placeholder="0" min="0" value="0" step="0.5">
        </div>
        <div class="set-input-group">
            <label>Rest (sec)</label>
            <input type="number" class="set-rest" placeholder="60" min="0" value="60">
        </div>
        <button class="btn-complete-set" onclick="completeSet(${setCounter})">
            Complete
        </button>
    `;

    setsList.appendChild(setItem);
}

// Complete set (global function)
window.completeSet = function (setNumber) {
    const setItem = document.querySelector(`[data-set-number="${setNumber}"]`);
    const btn = setItem.querySelector('.btn-complete-set');
    const reps = parseInt(setItem.querySelector('.set-reps').value);
    const weight = parseFloat(setItem.querySelector('.set-weight').value);
    const restTime = parseInt(setItem.querySelector('.set-rest').value);

    // Mark as completed
    btn.classList.add('completed');
    btn.textContent = '✓ Done';
    btn.disabled = true;

    // Disable inputs
    setItem.querySelectorAll('input').forEach(input => input.disabled = true);

    // Start rest timer if rest time > 0
    if (restTime > 0) {
        startRestTimer(restTime);
    }
};

// Start rest timer
function startRestTimer(seconds) {
    const restTimerEl = document.getElementById('restTimer');
    const countdownEl = document.getElementById('restCountdown');
    restTimerEl.classList.remove('hidden');

    let remaining = seconds;
    countdownEl.textContent = `00:${pad(remaining)}`;

    restTimer = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            clearInterval(restTimer);
            restTimerEl.classList.add('hidden');
        } else {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            countdownEl.textContent = `${pad(mins)}:${pad(secs)}`;
        }
    }, 1000);
}

// Skip rest
function skipRest() {
    clearInterval(restTimer);
    document.getElementById('restTimer').classList.add('hidden');
}

// Next exercise
function nextExercise() {
    // For now, finish workout
    finishWorkout();
}

// Finish workout
async function finishWorkout() {
    clearInterval(workoutTimer);
    clearInterval(restTimer);
    stopDemoCarousel();

    // Calculate total duration in SECONDS (no minimum, track actual time)
    const durationMs = Date.now() - currentWorkout.startTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    currentWorkout.totalDuration = durationSeconds; // Store in seconds

    // Collect exercise data from completed sets
    const completedSets = Array.from(document.querySelectorAll('.set-item'));
    const totalReps = completedSets.reduce((sum, setItem) => {
        return sum + parseInt(setItem.querySelector('.set-reps').value) || 0;
    }, 0);
    const maxWeight = Math.max(...completedSets.map(setItem =>
        parseFloat(setItem.querySelector('.set-weight').value) || 0
    ));

    // Calculate calories using a more realistic formula
    // Base calories per set from exercise database (divide by expected sets of 3)
    const exerciseCaloriesPerSet = Math.ceil((selectedExercises[0]?.calories || 100) / 3);

    // Calculate intensity multiplier based on reps and weight
    const avgRepsPerSet = totalReps / completedSets.length || 12;
    const weightMultiplier = maxWeight > 0 ? 1 + (maxWeight / 100) : 1; // +1% per kg
    const repsMultiplier = avgRepsPerSet / 12; // 12 reps = baseline
    const intensityMultiplier = Math.max(0.5, Math.min(2, repsMultiplier * weightMultiplier));

    // Final calculation: calories per set × number of sets × intensity
    const calculatedCalories = Math.round(exerciseCaloriesPerSet * completedSets.length * intensityMultiplier);

    // Minimum 5 calories per workout, maximum based on exercise type
    const maxCalories = selectedExercises[0]?.calories || 150;
    currentWorkout.totalCalories = Math.max(5, Math.min(calculatedCalories, maxCalories));

    const exerciseData = {
        name: selectedExercises[0].name,
        sets: completedSets.length,
        reps: Math.round(totalReps / completedSets.length) || 12, // Average reps
        weight: maxWeight,
        duration: currentWorkout.totalDuration,
        caloriesBurned: currentWorkout.totalCalories
    };

    currentWorkout.exercises = [exerciseData];

    // Save to database
    const saved = await saveWorkout();

    if (saved) {
        // Show success toast
        if (typeof showToast === 'function') {
            showToast('Workout saved successfully! 💪', 'success');
        }
    }

    // Show summary
    showSummaryModal();
}

// Save workout to database
async function saveWorkout() {
    const token = localStorage.getItem('token');

    console.log('Saving workout:', currentWorkout);

    try {
        const response = await fetch(`${window.API_BASE_URL}/workouts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                exercises: currentWorkout.exercises,
                totalCalories: currentWorkout.totalCalories,
                totalDuration: currentWorkout.totalDuration
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Workout saved successfully:', data);

            // Update stats display with ONLY current workout's data (not aggregated totals)
            updateCurrentWorkoutStats();

            // Reload workout history to show the new entry
            await loadWorkoutHistory();

            return true;
        } else {
            const error = await response.json();
            console.error('Failed to save workout:', error);
            if (typeof showToast === 'function') {
                showToast('Failed to save workout', 'error');
            }
            return false;
        }
    } catch (error) {
        console.error('Error saving workout:', error);
        if (typeof showToast === 'function') {
            showToast('Error saving workout', 'error');
        }
        return false;
    }
}


// Show summary modal
function showSummaryModal() {
    document.getElementById('summaryDuration').textContent = formatDurationDisplay(currentWorkout.totalDuration);
    document.getElementById('summaryCalories').textContent = currentWorkout.totalCalories;
    document.getElementById('summaryExercises').textContent = currentWorkout.exercises.length;

    const exercisesList = document.getElementById('summaryExercisesList');
    exercisesList.innerHTML = currentWorkout.exercises.map(ex => `
        <div class="summary-exercise-item">
            <div class="summary-exercise-name">${ex.name}</div>
            <div class="summary-exercise-sets">${ex.sets} sets completed</div>
        </div>
    `).join('');

    document.getElementById('summaryModal').classList.add('active');
}

// Close summary
function closeSummary() {
    document.getElementById('summaryModal').classList.remove('active');
    showMuscleGroups();
}

// Navigation helpers
function showMuscleGroups() {
    document.getElementById('muscleGroupsSection').classList.remove('hidden');
    document.getElementById('exercisesSection').classList.add('hidden');
    document.getElementById('workoutTracker').classList.add('hidden');
}

function showExercises() {
    document.getElementById('exercisesSection').classList.remove('hidden');
    document.getElementById('workoutTracker').classList.add('hidden');
}

// Utility functions
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

function hideLoading() {
    setTimeout(() => {
        document.getElementById('loadingOverlay')?.classList.add('hidden');
    }, 500);
}

// Demo carousel functionality
let demoCarouselInterval = null;
let currentDemoStepIndex = 0;
let totalDemoSteps = 0;

function startDemoCarousel(stepCount) {
    totalDemoSteps = stepCount;
    currentDemoStepIndex = 0;

    // Clear any existing interval
    if (demoCarouselInterval) {
        clearInterval(demoCarouselInterval);
    }

    // Auto-cycle every 2 seconds
    demoCarouselInterval = setInterval(() => {
        currentDemoStepIndex = (currentDemoStepIndex + 1) % totalDemoSteps;
        updateDemoDisplay();
    }, 2000);
}

function stopDemoCarousel() {
    if (demoCarouselInterval) {
        clearInterval(demoCarouselInterval);
        demoCarouselInterval = null;
    }
}

function updateDemoDisplay() {
    const images = document.querySelectorAll('.demo-step');
    const indicators = document.querySelectorAll('.demo-indicator');
    const stepLabel = document.getElementById('currentDemoStep');

    // Update active states
    images.forEach((img, i) => {
        img.classList.toggle('active', i === currentDemoStepIndex);
    });

    indicators.forEach((ind, i) => {
        ind.classList.toggle('active', i === currentDemoStepIndex);
    });

    if (stepLabel) {
        stepLabel.textContent = currentDemoStepIndex + 1;
    }
}

// Global functions for onclick handlers
window.nextDemoStep = function () {
    stopDemoCarousel(); // Stop auto-cycling when user manually controls
    currentDemoStepIndex = (currentDemoStepIndex + 1) % totalDemoSteps;
    updateDemoDisplay();
};

window.previousDemoStep = function () {
    stopDemoCarousel(); // Stop auto-cycling when user manually controls
    currentDemoStepIndex = (currentDemoStepIndex - 1 + totalDemoSteps) % totalDemoSteps;
    updateDemoDisplay();
};
