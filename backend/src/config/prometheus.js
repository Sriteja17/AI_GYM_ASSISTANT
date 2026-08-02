const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

const httpRequestTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

const activeUsers = new promClient.Gauge({
    name: 'active_users_total',
    help: 'Total number of active users',
    registers: [register]
});

const workoutsLogged = new promClient.Counter({
    name: 'workouts_logged_total',
    help: 'Total number of workouts logged',
    registers: [register]
});

// Additional workout metrics for Grafana dashboard
const workoutCaloriesBurned = new promClient.Gauge({
    name: 'workout_calories_burned',
    help: 'Daily calories burned from workouts',
    labelNames: ['user_id', 'day'],
    registers: [register]
});

const workoutDurationSeconds = new promClient.Gauge({
    name: 'workout_duration_seconds',
    help: 'Daily workout duration in seconds',
    labelNames: ['user_id', 'day'],
    registers: [register]
});

const workoutCount = new promClient.Gauge({
    name: 'workout_count',
    help: 'Daily workout count',
    labelNames: ['user_id', 'day'],
    registers: [register]
});

const weeklyWorkoutStats = new promClient.Gauge({
    name: 'weekly_workout_stats',
    help: 'Weekly workout statistics',
    labelNames: ['user_id', 'metric_type', 'day_of_week'],
    registers: [register]
});

module.exports = {
    register,
    httpRequestDuration,
    httpRequestTotal,
    activeUsers,
    workoutsLogged,
    workoutCaloriesBurned,
    workoutDurationSeconds,
    workoutCount,
    weeklyWorkoutStats
};

