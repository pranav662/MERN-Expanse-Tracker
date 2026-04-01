<p align="center">
  <img src="https://img.shields.io/badge/MERN-Full_Stack-blue?style=for-the-badge&logo=mongodb&logoColor=green" />
  <img src="https://img.shields.io/badge/Currency-₹_INR-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Railway-⚡_Live-0B0D11?style=for-the-badge&logo=railway&logoColor=white" />
</p>

<h1 align="center">💰 SpendSmart — Expense Tracker</h1>
<p align="center">
  <strong>A premium, full-stack financial dashboard designed for deep spending insights.</strong>
</p>
## ⚡ Live Demo
**[Click here to Launch SpendSmart Application](https://mern-expanse-tracker-production.up.railway.app/login)**

---

## 📸 Project Showcase

### 📊 Dashboard — All-in-One Financial View
![Dashboard](screenshots/dashboard.png)

### 📈 Analytics — Data-Driven Insights
| Analytics View | Comparison & Detail |
|:---:|:---:|
| ![Analytics](screenshots/analytics.png) | ![Filters](screenshots/filters.png) |

### 🔐 Authentication Flow
| Login | Sign Up |
|:---:|:---:|
| ![Login](screenshots/login.png) | ![Sign Up](screenshots/signup.png) |

---

## ✨ Why SpendSmart?

SpendSmart isn't just another CRUD app. It combines **highly specific financial tools** (like Indian Rupee ₹ support and daily/weekly/monthly/yearly period switching) with a **premium design system** (glassmorphism) to create an experience that feels alive and interactive.

### 🎯 Key Highlights
- **Real-time Data Visualization** — Beautiful Recharts integration for spending patterns.
- **Advanced Filtering** — Narrow down expenses by date, category, amount, or keyword.
- **Enterprise-grade Auth** — JWT, BCrypt, OTP verification, and Password Recovery.
- **Performance Optimized** — Built on Vite for lightning-fast loads and smooth 60fps animations.

---

## 🛠️ Features Deep-Dive

### 📊 Financial Intelligence (Recharts)
- 📈 **5 Interactive Chart Types** — Area, Bar, Line, Donut, and Progress bars.
- ⏱️ **Multi-Period Analytics** — One-click switching between **Daily**, **Weekly**, **Monthly**, and **Yearly** views.
- 📅 **Advanced Date Filters** — Custom range picker + 10 presets (Today, Last 7 Days, This Month, etc.).
- 📉 **Comparison Logic** — Automatic calculation of growth/decrease vs previous periods.

### 🔐 Security & Account Management
- ✅ **OTP Verification** — 6-digit email OTP for secure user registration.
- ✅ **Password Recovery** — Secure reset links sent via NodeMailer.
- ✅ **Profile Management** — Update security credentials or permanently delete account data.
- ✅ **Secure Backend** — JWT middleware with 10-round BCrypt password hashing.

### 🌑 Visual Aesthetics (Glassmorphism)
- ✨ **Particle Background** — Interactive Canvas particle network that responds to mouse hover.
- 🌈 **Mesh Gradients** — Animated shifting radiant backgrounds.
- 🔮 **Parallax Orbs** — Floating glass orbs with independent float animations.
- 🇮🇳 **INR Localization** — Native currency formatting (`en-IN`) for all amounts.

---

## 📁 Project Structure

```bash
MERN FULL STACK PROJECT/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # JWT security & protected routes
│   ├── models/
│   │   ├── User.js              # User schema (v2: added OTP, verification state)
│   │   └── Expense.js           # Expense schema (mapped to categories)
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints (v2: added Google, Reset flows)
│   │   └── expenses.js          # Expense CRUD & advanced retrieval
│   ├── utils/
│   │   └── emailConfig.js       # NodeMailer configuration (OTP/Reset)
│   ├── .env                     # Secrets (Auth, DB, Email)
│   └── server.js                # Express logic & Database entry
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable Glass UI components
│   │   ├── context/             # Global State (AuthContext, JWT sync)
│   │   ├── pages/
│   │   │   ├── Login.jsx        # Glassmorphism Login
│   │   │   ├── Signup.jsx       # Progressive onboarding
│   │   │   ├── Dashboard.jsx    # Analytics + CRUD controller
│   │   │   ├── Profile.jsx      # Security settings & deletion
│   │   │   └── ForgotPassword.jsx # Recovery request controller
│   │   ├── api.js               # Axios instance (JWT Interceptor)
│   │   └── App.jsx              # Main Layering (Particles + Mesh + Router)
│   ├── tailwind.config.js       # Custom animations & blur extensions
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
```
Create `backend/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Railway Deployment
The project is optimized for Railway. Connect your repo and ensure the environment variables are mirrored in the Railway dashboard.

---

## 👨‍💻 Tech Stack

| Component | Technology |
|---|---|
| **Frontend** | React 18, Vite, TailwindCSS, Recharts, Lucide |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Cloud) |
| **Email** | NodeMailer (Gmail Transporter) |
| **Auth** | JWT, BCrypt, Crypto |

---

## 📝 License
Licensed under the [MIT License](LICENSE).
