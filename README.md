# EduPulse — Intelligent Academic Monitoring & Early Intervention System

[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?logo=react)](https://edu-pulse-rho.vercel.app)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python%203.12-009688?logo=fastapi)](https://edupulse-ltx0.onrender.com/api/docs)
[![Database](https://img.shields.io/badge/Database-SQLite%203-003B57?logo=sqlite)](https://sqlite.org)
[![Email Engine](https://img.shields.io/badge/Email-Brevo%20API%20%2B%20Gmail%20SMTP-0B996F?logo=brevo)](https://www.brevo.com)
[![Deployment](https://img.shields.io/badge/Hosted%20On-Vercel%20%26%20Render-black?logo=vercel)](https://edu-pulse-rho.vercel.app)

**EduPulse** is an enterprise-grade academic monitoring, attendance tracking, and early intervention platform designed for **KPR Institute of Engineering and Technology (Autonomous)**. It equips administrators, faculty, and students with real-time academic analytics, 2FA OTP-secured logins, production-ready transactional emails via Brevo HTTP API & Gmail SMTP, section-scoped attendance rosters, assessment evaluation, and personalized recovery calculators.

---

## 🌐 Live Production Deployments

- **Frontend Portal**: [https://edu-pulse-rho.vercel.app](https://edu-pulse-rho.vercel.app)
- **Backend API**: [https://edupulse-ltx0.onrender.com](https://edupulse-ltx0.onrender.com)
- **Interactive Swagger Documentation**: [https://edupulse-ltx0.onrender.com/api/docs](https://edupulse-ltx0.onrender.com/api/docs)

---

## 🚀 Key Features & Recent Updates

### 1. ✉️ Dual Email Delivery Engine (Brevo HTTP API + SMTP Fallback)
- **Brevo (Sendinblue) HTTP API Primary**: Uses Brevo REST API (`POST https://api.brevo.com/v3/smtp/email`) to dispatch high-priority emails (OTP login passcodes, account provisioning credentials, and attendance deficit notices). Bypasses outbound SMTP port blocks (587/465) commonly enforced in cloud platforms such as Render.
- **Gmail SMTP / TLS Fallback**: Automatically falls back to standard Gmail SMTP (`smtp.gmail.com:587`) if Brevo is not configured or in local development mode.
- **CDN-Hosted Visual Assets**: All HTML email templates render official institutional badges, student/professor cards, and logos via HTTPS CDN URLs (`https://edu-pulse-rho.vercel.app/...`) rather than fragile `cid:` attachments, ensuring instant display across Gmail, Apple Mail, Outlook, and mobile apps.
- **Production Portal Deep-Linking**: Account welcome and notification emails provide direct links to the live production deployment.

### 2. 🛡️ 2-Factor Authentication & Multi-Role Portals
- **Two-Step Verification**: Step 1 validates password hash with support for fallback aliases; Step 2 generates a secure, time-limited 6-digit numeric OTP dispatched directly to the user's real email inbox.
- **Role Portals**: Dedicated, permission-governed interfaces for **Students**, **Faculty / Professors**, and **Academic Administrators**.
- **Dynamic Name Initials Avatar**: Top-right header displays uppercase initials of the user's first and last name (e.g. `Rahul Kumar Tiwari` $\rightarrow$ **`RT`**, `Dr. Priya Sharma` $\rightarrow$ **`PS`**) as a permanent placeholder, preventing empty or blank blue circles when an image is loading or absent.
- **Digital Student & Faculty ID Passes**: Interactive digital ID entry cards displaying barcode, registration/faculty number, department, semester, and compressed profile photo.

### 3. 👥 Section-Based Attendance & Marks Management
- **Section Scoping**: Faculty can switch between their assigned sections (`Section A`, `Section B`, `Section C`, `Section D`, or `All Sections`).
- **Scoped Student Rosters**: Only students registered in the selected section are displayed for daily roll call and assessment marking.
- **Live Attendance Tallies**: Dynamic calculation of `Present`, `Absent`, and `Late` percentages with one-click mass marking.
- **Voice-Assisted Marks Entry**: Built-in speech-to-text marks dictation for fast grade recording.

### 4. 🎯 Academic Thresholds & Automated Deficit Alerts
- **Standardized Pass/Fail Benchmark**: Standard 60% subject passing criteria and 75% minimum mandatory attendance threshold.
- **1-Click Shortage Warning Blasts**: Administrators can trigger bulk official deficit emails to all students falling below the 75% attendance threshold.
- **Streamlined Academic Settings**: Administrative controls dedicated to fine-tuning institutional attendance thresholds, warning margins, and passing criteria.

### 5. 📸 Student & Faculty Profile Photo Management
- **In-App Photo Upload**: Students can upload, preview, and reset their profile photo directly from their profile page (`/student/profile`), while faculty manage their photos in the Professor Dashboard.
- **Client-Side HTML5 Canvas Compression**: Images uploaded from mobile cameras or high-res files are automatically scaled and compressed to 400px JPEG (`~35KB`) in the browser before upload, preventing server timeouts and database bloat.

### 6. 🧮 Student Productivity Tools & Bilingual Interface
- **Bunk Calculator**: Computes exactly how many future classes a student can safely miss while remaining $\ge 75\%$.
- **Attendance Recovery Roadmap**: Calculates the exact number of consecutive classes required to climb out of attendance deficit.
- **Bilingual English / தமிழ் Mode**: Full interface localization between English and Tamil across all portal views.

---

## 🔑 Default Credentials (Test & Evaluation)

| Role | Login Identifier / Email | Password | 2FA OTP Delivery |
|---|---|---|---|
| **Administrator** | `admin@edupulse.kpriet.ac.in`<br>*(Alias: `karunesh128@gmail.com`)* | `Admin@123` | Sent to registered Gmail |
| **Faculty / Professor** | `karunesh789tiwari@gmail.com`<br>*(Aliases: `prof.sharma@kpriet.ac.in`, `priya.sharma@kpriet.ac.in`)* | `Prof@1234` | Sent to registered Gmail |
| **Student (CSE Sec A)** | `24cs263@kpriet.ac.in`<br>*(Alias: `23cs263@kpriet.ac.in`)* | `Student@123` | Sent to student email inbox |

> *Note: In development mode with `MOCK_EMAIL=true`, generated OTP codes are also returned in the API response and printed to the terminal console for rapid offline testing.*

---

## 🏗️ Technology Architecture

| Tier | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, React Router v7 |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy ORM, Pydantic v2, Uvicorn, Requests |
| **Database** | SQLite 3 (`backend/edupulse.db`) with relational integrity and cascade rules |
| **Primary Email** | **Brevo REST API v3** (`https://api.brevo.com/v3/smtp/email`) |
| **Fallback Email** | Python `smtplib` via Gmail TLS (Port 587) |
| **Authentication** | JWT Bearer Tokens (HS256), Bcrypt password hashing, 10-minute expiry OTPs |
| **Hosting** | Vercel (Frontend SPA) + Render (Backend API Web Service) |

---

## 📂 Repository Structure

```
EduPulse/
├── Documentation/
│   └── Problem_Satetement2_Workflow.pdf
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── calculations.py        # Risk analysis, bunk & recovery formulas
│   │   ├── config.py              # Environment configuration & pydantic settings
│   │   ├── database.py            # SQLite engine & session generator
│   │   ├── dependencies.py        # JWT auth guards & RBAC authorization
│   │   ├── email_templates.py     # Responsive HTML email templates (Brevo/SMTP)
│   │   ├── main.py                # FastAPI entry point, CORS middleware, routes
│   │   ├── models.py              # SQLAlchemy database tables & models
│   │   ├── schemas.py             # Pydantic request & response models
│   │   ├── security.py            # Bcrypt hashing & JWT token generators
│   │   └── routers/
│   │       ├── admin.py           # Admin analytics, user provisioning, audit
│   │       ├── attendance.py      # Session creation, bulk roll call, reports
│   │       ├── auth.py            # 2FA OTP login, password verification, tokens
│   │       ├── courses.py         # Course registry & section enrollment
│   │       ├── marks.py           # Assessments & marks recording
│   │       ├── notifications.py   # Brevo API & SMTP dispatcher, history log
│   │       ├── professors.py      # Faculty dashboard & assigned section views
│   │       └── students.py        # Student marks, attendance & profile photo
│   ├── edupulse.db                # SQLite database file
│   ├── seed.py                    # Comprehensive demo database seeder
│   ├── .env                       # Local environment variables
│   └── .env.example               # Template environment configuration
├── frontend/
│   ├── public/                    # Logos, institute badges, role cards
│   ├── src/
│   │   ├── components/            # Layouts, TopNavbar, ID passes, modals
│   │   ├── contexts/              # AuthContext & LanguageContext
│   │   ├── lib/                   # Axios API instance with JWT interceptor
│   │   ├── pages/
│   │   │   ├── admin/             # AdminDashboard, User Management, Settings
│   │   │   ├── professor/         # Attendance, Marks, Analytics, VoiceMarksEntry
│   │   │   ├── student/           # StudentDashboard, Profile, Bunk Calculator
│   │   │   ├── LandingPage.tsx    # Homepage with instant role portals
│   │   │   └── Login.tsx          # 2FA OTP verification screen
│   │   ├── App.tsx                # Client-side router & protected routes
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** (v18.0.0 or higher) & **npm**
- **Python** (v3.10, v3.11, or v3.12)
- Git

---

### 1. Backend Setup

1. Open your terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   ..\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic pydantic-settings python-jose passlib bcrypt python-multipart requests
   ```

4. Create your `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Configure your `.env` variables:
   ```env
   DATABASE_URL=sqlite:///./edupulse.db
   SECRET_KEY=your_super_secret_jwt_key_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=480
   ENVIRONMENT=development
   FRONTEND_URL=https://edu-pulse-rho.vercel.app,http://localhost:5173
   MOCK_EMAIL=false

   # Primary Email Provider: Brevo HTTP API (Recommended for production)
   BREVO_API_KEY=xkeysib-your-brevo-api-key
   BREVO_SENDER_EMAIL=your-verified-sender@gmail.com
   BREVO_SENDER_NAME=EduPulse - KPRIET

   # Fallback Email Provider: Gmail SMTP
   GMAIL_SENDER_EMAIL=your-gmail@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   ```

6. Seed the database with sample departments, professors, and student records:
   ```bash
   python seed.py
   ```

7. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   *Backend running at:* `http://localhost:8000`  
   *API Swagger Docs:* `http://localhost:8000/api/docs`

---

### 2. Frontend Setup

1. Open a separate terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Configure frontend environment variables in `frontend/.env` (optional for local dev, defaults to `http://localhost:8000`):
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *Frontend running at:* `http://localhost:5173`

5. Verify production build:
   ```bash
   npm run build
   ```

---

## 📧 Email Configuration & Brevo Setup Guide

EduPulse features automated delivery for:
1. **2FA Login OTP codes** (10-minute expiry).
2. **Account Provisioning Welcome emails** (with credentials and course assignments).
3. **Attendance Deficit Warning notices** (with required consecutive classes to reach 75%).

### How Brevo API Delivery Works:
1. When an email notification is queued, EduPulse first checks for `BREVO_API_KEY` and `BREVO_SENDER_EMAIL`.
2. If set, an HTTP POST request is dispatched to `https://api.brevo.com/v3/smtp/email`.
3. If Brevo credentials are not configured or the API request encounters an issue, EduPulse automatically falls back to standard Gmail SMTP (`smtp.gmail.com:587`).

> **Important Brevo Security Tip**: If you deploy the backend on cloud platforms (e.g. Render, AWS, Heroku) and receive a `401 unauthorized (unrecognised IP address)` error from Brevo, visit your [Brevo Authorized IPs Security Page](https://app.brevo.com/security/authorised_ips) and disable IP range restriction or authorize your server's outbound IP address.

---

## 📡 Core API Routes

### Authentication (`/api/auth`)
- `POST /api/auth/login-init`: Step 1 — verifies email/password, dispatches 6-digit OTP via Brevo/SMTP.
- `POST /api/auth/verify-otp`: Step 2 — verifies OTP and issues JWT access token.
- `POST /api/auth/resend-otp`: Dispatches a fresh 6-digit OTP code to the user's email.
- `PATCH /api/auth/profile`: Updates current user profile (language preference, phone).

### Student Portal (`/api/students`)
- `GET /api/students/profile`: Retrieves profile details, academic department, and current pass photo.
- `PATCH /api/students/profile/photo`: Updates student profile pass photo.
- `DELETE /api/students/profile/photo`: Resets profile photo to default institutional avatar.
- `GET /api/students/attendance`: Retrieves attendance records, percentage, and shortage breakdown.
- `GET /api/students/marks`: Retrieves assessment marks and 60% pass/fail evaluation.

### Faculty / Professor Portal (`/api/professors`)
- `GET /api/professors/dashboard`: Comprehensive dashboard metrics and assigned courses.
- `GET /api/professors/courses`: Scoped list of courses assigned to the logged-in professor.
- `PATCH /api/professors/profile`: Updates faculty profile details and photo.

### Attendance Operations (`/api/attendance`)
- `POST /api/attendance/sessions`: Initiates an attendance session for a subject and section.
- `POST /api/attendance/bulk`: Records student attendance statuses (`present`, `absent`, `late`, `excused`).
- `GET /api/attendance/student/me`: Authenticated student's attendance summary.

### Marks & Assessments (`/api/marks`)
- `POST /api/marks/assessments`: Creates assessments (Internal 1, Internal 2, Model Exam).
- `POST /api/marks/bulk`: Submits assessment marks with max-mark validation.
- `GET /api/marks/student/me`: Retrieves student marks breakdown.

### Notifications (`/api/notifications`)
- `POST /api/notifications/send-shortage-alerts`: 1-Click bulk alert dispatch to all students below threshold.
- `POST /api/notifications/send-single-student-alert`: Dispatches deficit alert to an individual student.
- `GET /api/notifications/history`: Fetches notification dispatch history and statuses.

### Administration (`/api/admin`)
- `GET /api/admin/dashboard-stats`: Institution-wide analytics on student enrollment, risks, and attendance.
- `POST /api/admin/users`: Provisions new student or faculty, assigns department & section, and emails credentials.
- `PATCH /api/admin/users/{id}`: Modifies user account information or assigned section.
- `GET /api/admin/audit-logs`: System audit trail of administrative actions.

---

## 🔒 Security Best Practices

- **Bcrypt Password Hashing**: Passwords stored using industry-standard bcrypt salt hashing.
- **Single-Use Expiring OTPs**: 6-digit OTP codes expire in 10 minutes and automatically invalidate older unused codes.
- **Granular RBAC**: Endpoint security enforced via FastAPI dependencies (`get_current_active_user`, `require_admin`, `require_professor`, `require_student`).
- **Canvas Payload Sanitization**: Large images compressed to 400px JPEG (`~35KB`) in the browser before upload.
- **Production CORS Protection**: Configured with strict origin whitelisting for verified production domains and local development ports.

---

## 🏛️ Institution

**KPR Institute of Engineering and Technology (Autonomous)**  
*Approved by AICTE, New Delhi | Affiliated to Anna University, Chennai*  
*Accredited by NAAC with 'A' Grade | NBA Accredited*  
Coimbatore, Tamil Nadu — 641 407, India  
*EduPulse Academic Monitoring & Support System*
