<div align="center">
  <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop" alt="Gym Workout Tracker Banner" width="100%" style="border-radius: 10px;"/>

  <br />
  <br />

  # 🏋️ AI-Based Personal Trainer Assistant

  *A comprehensive full-stack gym workout tracking and coaching platform with AI-powered recommendations, real-time metrics, live workout logging, diet management, and instant coach-member communication.*

  <br />

  ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
  ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
  ![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
  ![RabbitMQ](https://img.shields.io/badge/Rabbitmq-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
  ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
  ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

</div>

---

## 📑 Table of Contents
- [About the Project](#-about-the-project)
- [Use Cases](#-use-cases)
- [Key Features](#-key-features)
- [How it Works (Architecture)](#-how-it-works-architecture)
- [File Structure](#-file-structure)
- [Getting Started](#-getting-started)
- [API Endpoints](#-api-endpoints)
- [Tech Stack & Requirements](#-tech-stack--requirements)

---

## 🎯 About the Project

The **AI-Based Personal Trainer Assistant** (Gym Workout Tracker) is designed to bridge the gap between fitness enthusiasts and professional coaching by leveraging modern web technologies and Artificial Intelligence. It provides a unified ecosystem where members can log workouts, track diets, and receive AI-curated fitness plans, while coaches can monitor progress, broadcast announcements, and chat with members in real-time.

Say goodbye to fragmented fitness apps and hello to an all-in-one platform built for performance, scalability, and an intuitive user experience.

---

## 💡 Use Cases

1. **Individual Fitness Enthusiasts**: Track your daily macros, log your gym sessions with live timers, and visualize your progress over time. Unsure what to do next? Request an AI-generated workout plan tailored to your goals.
2. **Professional Personal Trainers / Coaches**: Manage multiple clients from a single dashboard. Send real-time alerts, monitor their diet adherence, and provide immediate feedback via live chat.
3. **Gym Facilities**: Deploy this application as a centralized hub for your gym members to foster community, enhance engagement, and provide value-added digital services.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| 👤 **Dual User Roles** | Tailored interfaces & permission levels for **Gym Members** and **Coaches**. |
| 🔒 **JWT-Secured Auth** | Stateless token authorization with persistent sessions. |
| ⚙️ **Interactive Setup** | Custom goal-oriented setup (height, weight, age, availability, experience level). |
| 📊 **Real-time Dashboard** | Active tracking of workouts done, calories burned, weekly progress charts, and unified active time metrics. |
| 🏋️ **Live Workout Tracker** | Guided exercise routines categorized by muscle group with interactive exercise demos, set counters, rest timers, and real-time calorie tracking. |
| 🥗 **Diet Management** | Daily macro tracking (protein, carbs, fats, calories) with meal log histories. |
| 🤖 **AI Integrations** | AI-driven workout recommendations and diet macro suggestions powered by **Google Gemini AI & Groq SDK**. |
| 💬 **Real-time Chat** | **Socket.IO** powered messaging between members and coaches with instant broadcast announcements. |
| ⚡ **Redis Caching** | Fast key-value storage for active session stats and user profiles. |
| 🐇 **RabbitMQ Queues** | Background message queuing for intensive workout calculations. |
| 📈 **Observability** | Pre-configured **Prometheus & Grafana** dashboards for API request duration, throughput, and system health metrics. |
| 📝 **ELK Stack Logging** | Logstash pipeline integration for log aggregation and audit trails. |

---

## 🏗️ How it Works (Architecture)

The system utilizes a robust microservices-inspired architecture to ensure real-time responsiveness and high availability.

```mermaid
graph TD
    subgraph Frontend
        UI[Web UI - HTML/CSS/JS]
    end

    subgraph Backend Core
        API[Express.js REST API]
        RealTime[Socket.IO Server]
    end

    subgraph Data & Caching
        DB[(MongoDB)]
        Cache[(Redis)]
    end

    subgraph Async Processing
        Queue>RabbitMQ]
        Worker[Background Workers]
    end

    subgraph External Services
        AI[Google Gemini / Groq]
    end

    UI <-->|HTTP/REST| API
    UI <-->|WebSockets| RealTime
    API <--> DB
    API <--> Cache
    API --> Queue
    Queue --> Worker
    Worker <--> AI
    RealTime --> API
```

---

## 📂 File Structure

```text
gym-workout-tracker/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Cache, Queue, and Metrics configuration
│   │   ├── middleware/      # Auth & JWT verification
│   │   ├── models/          # Mongoose Schemas (User, Workout, Message, Alert, Diet)
│   │   ├── routes/          # REST API Routes
│   │   └── server.js        # Entry point for the backend application
│   └── scripts/             # Database maintenance scripts
├── frontend/
│   ├── assets/              # Images, exercise demos, and thumbnails
│   ├── *.html               # View files (Dashboard, Workouts, Diet, Coach UI)
│   ├── *.css                # Modular styling & design system
│   └── *.js                 # Frontend controllers and logic
├── docker-compose.yml       # Infrastructure orchestration
├── prometheus.yml           # Prometheus scraping configuration
├── logstash.conf            # ELK Stack configuration
├── package.json             # Node dependencies and scripts
└── requirements.txt         # Environment requirements specification
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js**: `v16.0.0` or higher
- **npm**: `v7.0.0` or higher
- **Docker Desktop**: Essential for running containerized infrastructure (MongoDB, Redis, RabbitMQ, Prometheus, Grafana, Logstash)

### Installation & Setup

**1. Install Node Dependencies**
```bash
npm install
```

**2. Launch Docker Services**
Ensure Docker Desktop is running, then spin up the required infrastructure:
```bash
docker-compose up -d
```
*(Provisions: MongoDB, Redis, RabbitMQ, Prometheus, Grafana, Logstash & Elasticsearch)*

**3. Configure Environment Variables**
Create or verify your `.env` file based on `.env.example`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/gym-tracker
JWT_SECRET=your_super_secret_jwt_key
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key
```

**4. Start the Application**
```bash
# Development mode with hot-reload
npm run dev

# Production mode
npm start
```

Your app will be accessible at: `http://localhost:3000`

---

## 🔑 API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/signup` — Register a new account
- `POST /api/auth/signin` — Authenticate & receive JWT
- `GET /api/auth/me` — Retrieve profile data
- `POST /api/auth/complete-profile` — Finish onboarding
- `PUT /api/auth/update-profile` — Update user preferences

### 📊 Dashboard & Workouts (`/api/dashboard`, `/api/workouts`)
- `GET /api/dashboard/stats` — Fetch activity streaks and insights
- `GET /api/workouts` — Retrieve workout history
- `POST /api/workouts` — Log a comprehensive workout session

### 🥗 Diet (`/api/diet`)
- `GET /api/diet` — Get today's meals & macro breakdown
- `POST /api/diet` — Log a meal (calories, protein, carbs, fats)

### 💬 Messaging (`/api/messages`, `/api/alerts`)
- `GET /api/messages/:userId` — Retrieve chat history
- `POST /api/messages` — Send a direct message
- `GET /api/alerts` — Fetch system & broadcast alerts
- `POST /api/alerts` — Broadcast an alert (Coach only)

---

## 🛠️ Tech Stack & Requirements

### Backend
- **Node.js** & **Express.js**
- **MongoDB & Mongoose**
- **Redis**
- **RabbitMQ**
- **Socket.IO**
- **Google Generative AI & Groq SDK**
- **Prometheus & Grafana**

### Frontend
- **HTML5 & Vanilla JavaScript**
- **CSS3 (Vanilla)**

---

## 🧹 Database Maintenance

To clear database collections (users, workouts, messages, alerts) and flush the Redis cache:
```bash
npm run clear-db
```

---

<div align="center">
  <p>Distributed under the <strong>ISC License</strong>.</p>
  <p>Made with ❤️ for Fitness</p>
</div>