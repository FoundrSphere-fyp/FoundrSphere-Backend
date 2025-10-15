# FoundrSphere - Backend

<div align="center">
  
**AI-Powered Entrepreneurial Hub Backend**

*Scalable REST API and AI microservices built for founder success*

[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4.x-black?style=flat&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=flat&logo=mongodb)](https://mongodb.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10-3776AB?style=flat&logo=python)](https://python.org/)
[![Docker](https://img.shields.io/badge/Docker-24.0.7-2496ED?style=flat&logo=docker)](https://docker.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Backend](#running-the-backend)
- [API Reference](#api-reference)
- [AI Microservices](#ai-microservices)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Team](#team)
- [License](#license)

---

## Overview

The backend for FoundrSphere empowers the platform’s core logic, data management, authentication, matchmaking, and AI-powered evaluations. It is organized into RESTful services, integrates Python-based AI microservices, and manages scalable data storage through MongoDB.

Key responsibilities:
- Authenticate users and manage sessions
- Handle all CRUD operations for users, startups, and community resources
- Interface with AI layer for recommendations and evaluations
- Real-time features (chat, notifications) via Socket.io
- Modular separation for core platform and ML/AI components

---

## 🏗️ Architecture

The backend is structured as a modular system:

- **API Server (Node.js + Express):**
    - RESTful endpoints for user management, startups, ideas, community tools, and event access
    - JWT-based authentication & role-based authorization
    - Socket.io integration for real-time chat and event notifications
    - Handles communication with AI microservices

- **Database (MongoDB):**
    - Stores user profiles, startup information, idea submissions, evaluation results, matches, forum posts, and events
    - Indexing and schema validation for performance

- **AI/ML Microservice (Python + FastAPI):**
    - Exposed via REST endpoints for matchmaking and idea evaluation
    - Runs NLP models (BERT/Gemma, Sentence-BERT) for recommendations
    - Handles requests from the Node.js backend for inference

- **Deployment:**
    - Containerized with Docker (backend + AI services)
    - Production deployments on AWS EC2, Vercel, or similar

---

## 🧰 Tech Stack

| Category    | Technology       | Purpose |
|-------------|-----------------|---------|
| **Runtime** | Node.js    | Server-side JavaScript |
| **Framework** | Express  | Fast, minimalist RESTful API development |
| **Database** | MongoDB   | Scalable NoSQL document storage |
| **AI Layer** | Python + FastAPI | Serve language model inference and recommendations |
| **Realtime** | Socket.io      | WebSockets for live chat/updates |
| **ORM**    | Mongoose        | MongoDB schema management |
| **Deployment** | Docker, AWS EC2/Vercel | Production infrastructure |


---

## 📦 Prerequisites

- **Node.js** v18.x+
- **npm** v9+ or **yarn**
- **Python** 3.10+
- **MongoDB**
- **Docker** (for containerized deployment)

---

## 🚀 Getting Started

1. Clone the repository

   ```sh
   git clone https://github.com/your-org/foundrsphere.git
   cd backend
   ```

2. Install Node.js dependencies
   ```sh
   npm install
   # or
   yarn install
   ```

3. Set up MongoDB and update your `.env` file
4. (Optional) Set up Python virtual environment for AI microservice

---

## 🔐 Environment Variables

Create a `.env` file in `backend/`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/foundrsphere
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
```

---

## 🏃 Running the Backend

### Start REST API Server
```sh
npm run dev
# or
yarn dev
```
The Express server will run at `http://localhost:5000`

### Start AI Microservice
```sh
# (in ai/microservice dir)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Start all services with Docker
```sh
docker-compose up --build
```

---

## 📡 API Reference (Selected)

| Endpoint                  | Method | Description                      |
|--------------------------|--------|----------------------------------|
| /api/auth/register       | POST   | Register a new user              |
| /api/auth/login          | POST   | Login and receive JWT            |
| /api/users/profile       | GET/PUT| Get/update user profile          |
| /api/matchmaking/cofounders | POST| Get co-founder recommendations   |
| /api/matchmaking/investors  | POST| Get investor matches             |
| /api/evaluation/submit   | POST   | Submit startup idea for analysis |
| /api/evaluation/results  | GET    | Retrieve evaluation outcomes     |
| /api/community/forums    | GET    | Forum and group management       |
| /api/events/list         | GET    | List available events/workshops  |

---

## 🧠 AI Microservices

- **Location**: `/ai/microservice/`
- **Models**: BERT/Gemma/Sentence-BERT transformer models
- **Tasks**: Evaluate ideas, recommend co-founders/investors
- **Endpoints**: REST API (e.g. `/api/evaluate`, `/api/recommend`)
- **Integration**: Node.js backend calls AI endpoints for analysis on behalf of web/mobile clients

---

## ☁️ Deployment

- Use Docker Compose for local multi-service setup
- Deploy to AWS EC2 or Vercel for production
- Apply secure environment variables for production
- Separate monitoring/logging for API and AI services

---



