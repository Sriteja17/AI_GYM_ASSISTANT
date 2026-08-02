# 🏋️ AI-Based Personal Trainer Assistant

A comprehensive full-stack gym workout tracking and coaching platform with AI-powered recommendations, real-time metrics, live workout logging, diet management, and instant coach-member communication.

---

## 🚀 Features

- 👤 **Dual User Roles**: Tailored interfaces & permission levels for **Gym Members** and **Coaches**.
- 🔒 **JWT-Secured Authentication**: Stateless token authorization with persistent sessions.
- ⚙️ **Interactive Profile Setup**: Custom goal-oriented setup (height, weight, age, availability, experience level).
- 📊 **Real-time Member Dashboard**: Active tracking of workouts done, calories burned, weekly progress charts, and unified active time metrics.
- 🏋️ **Live Workout Tracker**: Guided exercise routines categorized by muscle group with interactive exercise demos, set counters, rest timers, and real-time calorie tracking.
- 🥗 **Diet & Meal Management**: Daily macro tracking (protein, carbs, fats, calories) with meal log histories.
- 🤖 **AI Assistant Integrations**: AI-driven workout recommendations and diet macro suggestions powered by Google Gemini AI & Groq SDK.
- 💬 **Real-time Coach Chat & Alerts**: Socket.IO powered messaging between members and coaches with instant broadcast announcements.
- ⚡ **Redis High-Performance Caching**: Fast key-value storage for active session stats and user profiles.
- 🐇 **RabbitMQ Asynchronous Processing**: Background message queuing for intensive workout calculations.
- 📈 **Prometheus & Grafana Observability**: Pre-configured dashboards for API request duration, throughput, and system health metrics.
- 📝 **ELK Stack Logging**: Logstash pipeline integration for log aggregation and audit trails.

---

## 🛠️ Tech Stack & Requirements

### Backend Architecture
- **Node.js** (v16+) & **Express.js** (REST API)
- **MongoDB & Mongoose**: Primary database
- **Redis**: High-speed caching & stats engine
- **RabbitMQ**: AMQP message queuing
- **Socket.IO**: Real-time WebSocket communications
- **Google Generative AI & Groq SDK**: LLM integrations
- **Prometheus & Grafana**: Telemetry, metrics & visual dashboards

### Frontend Architecture
- **HTML5 & Vanilla JavaScript**: Clean, framework-free architecture
- **CSS3 (Vanilla)**: Modern UI design system featuring Glassmorphism effects, dynamic dark mode, and responsive layouts

---

## 📋 Prerequisites & Requirements Specification

- **Node.js**: `v16.0.0` or higher
- **npm**: `v7.0.0` or higher
- **Docker Desktop**: For running containerized services (MongoDB, Redis, RabbitMQ, Prometheus, Grafana, Logstash)

### 📦 Package & Environment Requirements (`requirements.txt`)

The project includes a [`requirements.txt`](file:///c:/Users/thodu/OneDrive/Desktop/BOKKA/2-1/project/gym-workout-tracker/gym-workout-tracker/requirements.txt) file that serves as a complete version-locked requirements manifest for the application stack:

- **System & Engine Specifications**: Node.js engine and npm version requirements.
- **Node Package Dependencies**: Express, Mongoose, JWT, Redis, Socket.IO, RabbitMQ (`amqplib`), Google Generative AI SDK, Groq SDK, Prometheus Client, Winston Logger.
- **Infrastructure Services**: MongoDB, Redis, RabbitMQ, Prometheus, Grafana, ELK ports and container configuration.

> **Note on Package Management**:
> - **[`requirements.txt`](file:///c:/Users/thodu/OneDrive/Desktop/BOKKA/2-1/project/gym-workout-tracker/gym-workout-tracker/requirements.txt)** provides a universal, human-readable specification of system and library requirements across environments.
> - **[`package.json`](file:///c:/Users/thodu/OneDrive/Desktop/BOKKA/2-1/project/gym-workout-tracker/gym-workout-tracker/package.json)** is the native Node.js package manager file executed by `npm install`.

---

## 🏁 Quick Start Guide

### 1. Install Node Dependencies

```bash
npm install
```

### 2. Launch Docker Services

Make sure Docker Desktop is running, then launch all infrastructure services:

```bash
docker-compose up -d
```

*This provisions:*
- **MongoDB** (`localhost:27017`)
- **Redis** (`localhost:6379`)
- **RabbitMQ** (`localhost:5672`, Management UI at `localhost:15672`)
- **Prometheus** (`localhost:9090`)
- **Grafana** (`localhost:3001`)
- **Logstash & Elasticsearch** (`localhost:5000`, `localhost:9200`)

### 3. Configure Environment Variables

The default `.env` configuration file is ready out of the box:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/gym-tracker
JWT_SECRET=gym-tracker-secret-key-2024
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
NODE_ENV=development
GROQ_API_KEY=your-api-key
```

### 4. Start the Application

To run in development mode with automatic reload:

```bash
npm run dev
```

Or start the production server:

```bash
npm start
```

---

## 🌐 Application Services & Dashboards

| Service / Component | URL / Endpoint | Credentials / Details |
| --- | --- | --- |
| **Web Application** | `http://localhost:3000` | Full App (Landing, Dashboard, Workouts, Diet, Coach) |
| **Prometheus Telemetry** | `http://localhost:3000/metrics` | Prometheus Scraping Endpoint |
| **Health Status** | `http://localhost:3000/health` | Service Uptime & Component Health |
| **Grafana Dashboards** | `http://localhost:3001` | User: `admin` \| Pass: `admin123` |
| **Prometheus Dashboard** | `http://localhost:9090` | System metrics & queries |
| **RabbitMQ Console** | `http://localhost:15672` | User: `admin` \| Pass: `admin123` |
| **Elasticsearch** | `http://localhost:9200` | Log indexer |

---

## 📂 Project Structure

```
gym-workout-tracker/
├── backend/
│   └── src/
│       ├── config/          # MongoDB, Redis, RabbitMQ, Prometheus configurations
│       ├── middleware/      # Auth & JWT verification middleware
│       ├── models/          # Mongoose Schemas (User, Workout, Message, Alert, Diet)
│       ├── routes/          # REST Routes (auth, dashboard, workouts, diet, coach, messages, alerts)
│       └── server.js        # Express application entrypoint
│   └── scripts/
│       ├── clear-database.js# Database reset script
│       └── clearMessages.js # Chat history cleaner
├── frontend/
│   ├── index.html           # Landing page & feature showcase
│   ├── auth.html            # Sign In / Sign Up portal
│   ├── profile-setup.html   # Onboarding profile setup
│   ├── dashboard.html       # Member dashboard & analytics
│   ├── workouts.html        # Interactive workout tracking page
│   ├── diet.html            # Nutrition & meal tracking page
│   ├── coach-dashboard.html # Coach dashboard & member manager
│   ├── coach-alerts.html    # Coach broadcast alert center
│   ├── chat.css / styles.css# Design system & modular CSS
│   └── *.js                 # Frontend module controllers
├── docker-compose.yml       # Docker multi-container service orchestrator
├── prometheus.yml           # Prometheus scraping configuration
├── logstash.conf            # Logstash log ingestion pipeline
├── package.json             # Node dependencies & npm scripts
├── requirements.txt         # Package & runtime specification
└── .env                     # Environment settings
```

---

## 🔑 API Endpoint Reference

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/signup` — Create a new member or coach account
- `POST /api/auth/signin` — Authenticate user & return JWT token
- `GET /api/auth/me` — Retrieve logged-in user profile details
- `POST /api/auth/complete-profile` — Complete initial setup
- `PUT /api/auth/update-profile` — Update member preferences & biometrics

### 📊 Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` — Retrieve aggregated activity, streak, and recent workouts
- `POST /api/dashboard/workout` — Quick-log a workout entry

### 🏋️ Workouts (`/api/workouts`)
- `GET /api/workouts` — Fetch user workout history
- `GET /api/workouts/stats` — Get current day & weekly duration/calorie stats
- `POST /api/workouts` — Save a detailed workout session

### 🥗 Diet (`/api/diet`)
- `GET /api/diet` — Fetch logged meals & daily macro breakdown
- `POST /api/diet` — Log a meal item (calories, protein, carbs, fats)

### 💬 Messaging & Broadcasts (`/api/messages`, `/api/alerts`)
- `GET /api/messages/:userId` — Load chat history between user & coach
- `POST /api/messages` — Send a direct message
- `GET /api/alerts` — Fetch system & coach broadcast alerts
- `POST /api/alerts` — Broadcast a coach alert

---

## 🧹 Database Maintenance Commands

To clear database collections (users, workouts, messages, alerts) and flush the Redis cache:

```bash
npm run clear-db
```

Alternatively:

```bash
node backend/scripts/clear-database.js
```

---

## 📝 License

Distributed under the **ISC License**.
