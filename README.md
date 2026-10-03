# EduPulse — Intelligent Academic Monitoring & Early Intervention System

**EduPulse** is an academic management, attendance tracking, and early intervention platform designed for **KPR Institute of Engineering and Technology (Autonomous)**. It empowers administrators, faculty, and students with real-time academic analytics, 2FA OTP-secured authentication, automated deficiency alerts, section-based attendance and marks management, and personalized recovery roadmaps.

---

## 🚀 Key Features & Recent Updates

### 1. 🛡️ 2-Factor Authentication & Multi-Role Access
- **Secure 2FA Flow**: Step 1 validates credentials; Step 2 generates a time-limited 6-digit numeric OTP delivered to the user's real email inbox via SMTP.
- **Dedicated Portals**: Role-based access control for **Students**, **Faculty / Professors**, and **Academic Administrators**.
- **Official Digital Entry Passes**: Dynamic ID cards with compressed profile photos, barcodes, role badges, and institutional credentials.

### 2. 👥 Section-Based Attendance & Marks Management
- **Assigned Section Scoping**: Faculty can switch between their assigned sections (`Section A`, `Section B`, `Section C`, `Section D`, or `All Sections`).
- **Scoped Student Rosters**: Only students enrolled in the selected section appear for daily attendance and marks entry.
- **Dynamic Counters**: Live calculation of `Present`, `Absent`, and `Late` tallies per section.
- **Instant Synchronization**: Updates committed by faculty reflect immediately in student dashboards, faculty overviews, and administrator analytics.
- **Voice-Assisted Marks Entry**: Speech-to-text marks input capability for rapid assessment entry.

### 3. 🎯 60% Passing Threshold Across All Subjects
- **Academic Standard**: Minimum passing threshold is standardized to **60%** across the entire platform.
- **Clear Status Indicators**:
  - $\ge 60\%$: **Pass** (Green / Emerald)
  - $< 60\%$: **Below 60% / Fail** (Red / Rose warning)
- **Early Risk Detection**: Automatic flagging of students with marks $< 60\%$ or attendance $< 75\%$.

### 4. ✉️ Asynchronous SMTP & Official Institutional Email Templates
- **Non-Blocking Background Delivery**: High-volume notification blasts (bulk attendance shortage alerts, single student alerts, and OTP passcodes) process asynchronously via background worker threads in under 50ms HTTP response time.
- **Official KPRIET Email Layout**:
  - Header: Institutional `logo.png`
  - Body: Formatted academic alert tables, step-by-step required actions, and credentials summary
  - Visual Badging: Embedded role identification passcards (`student_card.png`, `professor_card.png`, `admin_card.png`)
  - Footer: Official Dean/Administrator signature with autonomous accreditation watermark and `instuite.png`

### 5. ⚡ Automated Student & Faculty Provisioning
- **One-Click Account Creation**: Administrator can create new student and faculty profiles with custom passwords, assigned departments, sections, and semesters.
- **Auto-Enrollment Engine**: New students are automatically enrolled in active curriculum courses corresponding to their department, semester, and section.
- **Instant Welcome Email**: As soon as a profile is created, a welcome email containing role credentials, login URL, and assigned courses is delivered to the recipient.
- **Client-Side Canvas Compression**: Profile photos uploaded from mobile devices or desktops are automatically scaled and compressed on HTML5 Canvas to 400px JPEG (`~35KB`) before upload, eliminating upload failures.

### 6. 🧮 Student Productivity Tools
- **Bunk Calculator**: Computes safe sessions a student can miss while retaining attendance $\ge 75\%$.
- **Recovery Planner**: Calculates exact consecutive classes required to recover from attendance shortage.
- **Bilingual Interface**: Language switch for English and Tamil across core dashboards.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, React Router v7 |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy ORM, Pydantic v2, Uvicorn |
| **Database** | SQLite (`backend/edupulse.db`) with Foreign Key enforcement and cascading |
| **Security** | JWT (JSON Web Tokens), Passlib (Bcrypt hashing), 2FA OTP with 10-minute expiry |
| **Email Service** | Python `smtplib` via Gmail TLS (Port 587) with RFC 2387 MIME Multipart CID embedding |

---

## 📂 Repository Structure

```
EduPulse/
├── Documentation/
│   └── Problem_Satetement2_Workflow.pdf
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── calculations.py        # Risk assessment, bunk & recovery formulas
│   │   ├── config.py              # Settings & environment variables
│   │   ├── database.py            # SQLite database engine & session factory
│   │   ├── dependencies.py        # JWT verification & RBAC role guards
│   │   ├── email_templates.py     # HTML email templates (OTP, alerts, welcome)
│   │   ├── main.py                # FastAPI app initialization, CORS, routers
│   │   ├── models.py              # SQLAlchemy database models
│   │   ├── schemas.py             # Pydantic request & response schemas
│   │   ├── security.py            # Password hashing & JWT creation
│   │   └── routers/
│   │       ├── admin.py           # Admin statistics, user CRUD, settings
│   │       ├── attendance.py      # Session marking & attendance analytics
│   │       ├── auth.py            # 2FA OTP initialization & verification
│   │       ├── courses.py         # Courses & section-scoped enrollment
│   │       ├── marks.py           # Assessment creation & marks recording
│   │       ├── notifications.py   # Async SMTP delivery & history logs
│   │       ├── professors.py      # Professor dashboard endpoints
│   │       └── students.py        # Student attendance, marks, calculations
│   ├── edupulse.db                # SQLite database file
│   ├── seed.py                    # Database seeding script
│   ├── .env                       # Environment configuration
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/            # Layouts, Navbar, Passcards, UI components
│   │   ├── contexts/              # AuthContext & LanguageContext
│   │   ├── lib/                   # Axios API instance with JWT interceptor
│   │   ├── pages/
│   │   │   ├── admin/             # AdminDashboard, Student & Faculty Management
│   │   │   ├── professor/         # Attendance, Marks, Analytics, VoiceMarksEntry
│   │   │   ├── student/           # StudentDashboard, Bunk & Recovery Calculators
│   │   │   ├── LandingPage.tsx    # Public homepage with integrated card login
│   │   │   └── Login.tsx          # 2FA OTP verification screen
│   │   ├── App.tsx                # Routes & role guard wrappers
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
└── README.md
```

---

## 🔑 Default Credentials (Test Environment)

| Role | Email | Password | OTP |
|---|---|---|---|
| **Administrator** | `karunesh128@gmail.com` | `Admin@123` | Sent to registered Gmail |
| **Faculty / Professor** | `karunesh789tiwari@gmail.com` | `Prof@123` | Sent to registered Gmail |
| **Student (CSE Sec A)** | `24cs263@kpriet.ac.in` | `Student@123` | Dispatched to email inbox |

> *Tip: In development mode, OTP codes are also printed in the backend terminal logs for instant verification if SMTP is offline.*

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** (v18.0.0 or higher) & **npm**
- **Python** (v3.10, v3.11, or v3.12)
- Modern web browser (Chrome, Edge, Firefox, Safari)

---

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv venv
   ..\venv\Scripts\Activate.ps1
   ```

3. Install required Python packages:
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic python-jose passlib bcrypt python-multipart requests
   ```

4. Configure environment variables in `backend/.env`:
   ```env
   DATABASE_URL=sqlite:///./edupulse.db
   SECRET_KEY=edupulse_super_secret_jwt_key_2026_kpriet_autonomous
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=480
   ENVIRONMENT=development
   FRONTEND_URL=http://localhost:5173
   MOCK_EMAIL=false
   GMAIL_SENDER_EMAIL=your_admin_email@gmail.com
   GMAIL_APP_PASSWORD=your_gmail_app_password
   ```

5. Seed the database with sample departments, courses, and students:
   ```bash
   python seed.py
   ```

6. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   *Backend API runs at:* `http://localhost:8000`  
   *Interactive Swagger Documentation:* `http://localhost:8000/api/docs`

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Frontend Application runs at:* `http://localhost:5173`

4. (Optional) Run production build check:
   ```bash
   npm run build
   ```

---

## 📡 Core API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/login-init`: Step 1 of 2FA — verifies email & password, dispatches 6-digit OTP.
- `POST /api/auth/verify-otp`: Step 2 of 2FA — validates OTP and returns JWT bearer token.
- `POST /api/auth/resend-otp`: Generates and re-dispatches a fresh 6-digit passcode.

### Courses & Enrolled Students (`/api/courses`)
- `GET /api/courses`: Lists courses filtered by department and professor assigned section.
- `GET /api/courses/{course_id}/students`: Lists students enrolled in the course, optionally filtered by `?section=A`.

### Attendance Operations (`/api/attendance`)
- `POST /api/attendance/sessions`: Creates an attendance session for a course and date.
- `POST /api/attendance/bulk`: Records student attendance status (`present`, `absent`, `late`, `excused`).
- `GET /api/attendance/student/me`: Retrieves complete attendance statistics for the authenticated student.

### Marks & Academic Performance (`/api/marks`)
- `POST /api/marks/assessments`: Creates assessments (Internal 1, Internal 2, Model Exam, Lab).
- `POST /api/marks/bulk`: Submits scores with validation against maximum marks.
- `GET /api/marks/student/me`: Retrieves student marks breakdown and 60% pass/fail evaluation.

### Notifications & Alerts (`/api/notifications`)
- `POST /api/notifications/send-shortage-alerts`: 1-Click bulk alert dispatch to all students below attendance threshold.
- `POST /api/notifications/send-single-student-alert`: Sends official deficit alert to a specific student.
- `GET /api/notifications/history`: Lists all sent notifications, delivery status, and timestamps.
- `DELETE /api/notifications/{id}`: Deletes a notification from history.

### Administrator Controls (`/api/admin`)
- `GET /api/admin/dashboard-stats`: Real-time analytics on attendance, risk levels, and enrolled rosters.
- `POST /api/admin/users`: Creates student or faculty, assigns department & section, and emails credentials.
- `PATCH /api/admin/users/{id}`: Updates user details, section assignment, or profile picture.
- `GET /api/admin/audit-logs`: Institutional activity and audit trail.

---

## 🔒 Security Best Practices
- **Password Protection**: Passwords are saved as bcrypt hashes; plaintext passwords are never stored.
- **Stateful OTP Validation**: Single-use 6-digit OTP records expire in 10 minutes and invalidate preceding codes upon generation.
- **Role Isolation**: FastAPI dependencies (`require_admin`, `require_professor`, `require_student`) strictly enforce role boundaries at the HTTP router level.
- **Image Sanitization**: Profile photos are constrained to standard dimensions and compressed to prevent denial-of-service via large base64 payloads.

---

## 🏛️ Institution
**KPR Institute of Engineering and Technology (Autonomous)**  
*Approved by AICTE, New Delhi | Affiliated to Anna University, Chennai*  
Coimbatore, Tamil Nadu — 641 407  
*EduPulse Academic Monitoring & Support System*
