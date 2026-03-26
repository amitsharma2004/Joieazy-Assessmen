# 📚 Joineazy – Student Group & Assignment Management System

A role-based full-stack web application where students form groups and confirm assignment submissions, while professors manage assignments and track group progress.

---

## 🚀 Live Demo

- **Frontend:** https://joieazy-assessmen.vercel.app *(Vercel)*
- **Backend API:** https://joieazy-assessmen.onrender.com *(Render)*

---

## 🏗️ Architecture Overview

```
Frontend (React + Tailwind)  →  Backend (Node.js + Express)  →  Database (Supabase PostgreSQL)
        Vercel                          Render                        Supabase
```

- **Frontend** communicates with the backend via REST API using JWT tokens
- **Backend** uses Supabase JS SDK over HTTPS to query PostgreSQL
- **Auth** is custom JWT-based (bcrypt password hashing, 7-day tokens)

---

## ✨ Features

### Student Role
- Register & log in
- Create groups and invite members by email
- View all assignments with OneDrive submission links
- Confirm submission via **two-step verification**
- Track group progress with visual progress bars

### Admin (Professor) Role
- Create, edit, delete assignments (title, description, due date, OneDrive link)
- Assign to **all students** or **specific groups**
- Track group-wise & student-wise submission confirmations
- View analytics dashboard with completion charts

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, React Router v6, Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL via Supabase |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Deployment | Vercel (frontend) + Render (backend) |
| Container | Docker + Docker Compose |

---

## 📁 Project Structure

```
joineazy/
├── backend/
│   ├── src/
│   │   ├── config/         # Supabase client
│   │   ├── controllers/    # assignmentController, authController, groupController, submissionController
│   │   ├── middleware/      # JWT auth + role guards
│   │   ├── routes/         # assignments, auth, groups, submissions
│   │   └── index.js        # Express server entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, ProtectedRoute, Spinner, ConfirmModal
│   │   ├── context/        # AuthContext (JWT + user state)
│   │   ├── pages/
│   │   │   ├── admin/      # AssignmentList, AssignmentForm, AssignmentDetail, Analytics, Groups
│   │   │   └── student/    # AssignmentList, Groups
│   │   └── utils/          # axios API instance
│   ├── Dockerfile
│   └── package.json
├── database/
│   ├── full_schema.sql     # Complete DB schema (run in Supabase SQL Editor)
│   └── migration.sql       # Migration for existing DBs
├── docker-compose.yml
└── .env.example
```

---

## 🗄️ Database Schema

```
users             → id, name, email, password, role, created_at
groups            → id, name, created_by (→ users), created_at
group_members     → id, group_id (→ groups), user_id (→ users), joined_at
assignments       → id, title, description, due_date, onedrive_link, assigned_to, created_by, created_at
assignment_groups → id, assignment_id (→ assignments), group_id (→ groups)
submissions       → id, assignment_id, group_id, user_id, status, confirmed_by, confirmed_at
```

**ER Relationships:**
- A user can create many groups
- A group can have many members (students)
- An assignment can be assigned to all or specific groups
- A submission belongs to one group + one assignment (unique pair)

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (name, email, password, role) |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Get current user |

### Assignments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/assignments` | All | List (role-filtered) |
| GET | `/api/assignments/:id` | All | Single assignment |
| POST | `/api/assignments` | Admin | Create assignment |
| PUT | `/api/assignments/:id` | Admin | Edit assignment |
| DELETE | `/api/assignments/:id` | Admin | Delete assignment |

### Submissions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/submissions/confirm` | Student | Two-step confirm |
| GET | `/api/submissions` | All | List submissions |
| GET | `/api/submissions/analytics` | Admin | Completion stats |

### Groups
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/groups` | All | List groups |
| POST | `/api/groups` | Student | Create group |
| POST | `/api/groups/:id/members` | Creator | Add member by email |
| DELETE | `/api/groups/:id/members/:userId` | Creator | Remove member |

---

## ⚙️ Setup & Run Locally

### Prerequisites
- Node.js 18+
- Supabase project (free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/amitsharma2004/Joieazy-Assessmen.git
cd Joieazy-Assessmen
```

### 2. Set up the database
- Go to [supabase.com/dashboard](https://supabase.com/dashboard) → SQL Editor
- Run `database/full_schema.sql`

### 3. Configure backend
```bash
cd backend
cp .env.example .env
# Fill in your Supabase URL and service role key
npm install
npm start
```

### 4. Configure frontend
```bash
cd frontend
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
npm install
npm start
```

### 5. Using Docker
```bash
cp .env.example .env  # fill in credentials
docker-compose up --build
```

---

## 🔐 Environment Variables

### Backend (`.env`)
```env
PORT=5000
JWT_SECRET=your_secret_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLIENT_URL=http://localhost:3000
```

### Frontend (`.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🚢 Deployment

### Backend → Render
- Root: `backend/`
- Build: `npm install`
- Start: `node src/index.js`
- Add env variables in Render dashboard

### Frontend → Vercel
- Root: `frontend/`
- Framework: Create React App
- Add `REACT_APP_API_URL=https://your-render-url.onrender.com/api`

---

## 🔑 Key Design Decisions

1. **Custom JWT auth** over Supabase Auth — full control over user roles and tokens
2. **Service Role Key** on backend — bypasses RLS for reliable server-side queries
3. **Two-step submission** — prevents accidental confirmations
4. **Supabase JS SDK over HTTPS** — more portable than direct PostgreSQL TCP connection
5. **Monolith structure** with separate `frontend/` and `backend/` folders for clarity

---

*Built for Joineazy Full Stack Intern Assessment – March 2026*
