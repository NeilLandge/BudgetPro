# BudgetPro 💰📊 — AI-Powered Personal Finance Manager

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![Perplexity AI](https://img.shields.io/badge/Perplexity_AI-4B0082?style=for-the-badge&logo=perplexity&logoColor=white)](https://www.perplexity.ai/)

**BudgetPro** is an **AI-powered financial management platform** that helps users track expenses, manage budgets, and gain **personalized insights** into their spending habits.  
With intelligent analytics and automated reports, it transforms your financial data into actionable insights — helping you make smarter budgeting decisions effortlessly.

---

## Features 🚀

### Authentication 🔒
- Sign up / Sign in using **Email & Password**  
- **OTP Verification** during sign-up (email & phone, backend terminal for now)  
- Passwords are **hashed** and authentication uses **JWT tokens**

### Dashboard & Transactions 📈
- **Overview** of total balance, budgets, and recent transactions  
- Add, edit, and delete income/expense transactions  
- Categorize transactions and track spending trends with **interactive charts**

### Budgets & Categories 🎯
- Create **custom budgets per category**  
- Visual progress bars and alerts for overspending  
- Add custom categories with icons and colors

### Reports & Analytics 📄 
- Currently available to all users, with plans in future to make it completely Pro exclusive 
- Financial summaries and expense breakdowns with complete and detailed AI analysis according to the user's spending pattern.

  **Note: This is completely unique to each user**
- Export functionality in **.pdf** format available with proper structuring and clean look

### Pro Features(Coming Soon!) ⭐
- Unlimited transactions  
- Advanced analytics & AI insights 
- Priority support  

---

## Tech Stack 🛠️

**Frontend:** HTML5, CSS3, JavaScript (ES6+), Chart.js  
**Backend:** Node.js, Express.js, MongoDB, Mongoose  
**Security:** bcryptjs, jsonwebtoken, CORS  

---

## Installation 💻

### Prerequisites
- Node.js (v14 or higher)  
- MongoDB (local or Atlas)  
- npm or yarn  

### Backend Setup
```bash
git clone <repository-url>
cd budgetpro
npm install
Create .env file:

PORT=5000
MONGODB_URI=mongodb://localhost:27017/budgetpro
JWT_SECRET=your-secret-key

Start MongoDB and the server:

mongod
npm start

```

Or for dev with auto-reload
```bash
npm run dev
```

### Frontend Setup
Using VS Code Live Server, or
```bash
python -m http.server 3000
npx http-server -p 3000
```
Open http://localhost:3000 in your browser and ensure API URL in js/auth.js points to your backend.

## Project Structure 🗂️
```
budgetpro/
├── ai-analysis-report-pdf-copy/
├── backend/
│ ├── node_modules/
│ ├── server.js
│ ├── package.json
│ ├── package-lock.json
│ └── .env (add your JWT secret key here)
├── frontend/
│ ├── index.html
│ ├── signup.html
│ ├── signin.html
│ ├── dashboard.html
│ ├── css/
│ └── js/
├── screenshots/
├── .gitignore
├── LICENSE
└── README.md
```

## Screenshots 📸
![Dashboard](https://raw.githubusercontent.com/NeilLandge/BudgetPro/main/screenshots/dashboard.png)
![Landing Page](https://raw.githubusercontent.com/NeilLandge/BudgetPro/main/screenshots/landing-page.png)
![Signup Page](https://raw.githubusercontent.com/NeilLandge/BudgetPro/main/screenshots/signup-page.png)
![AI Analysis Part 1](https://raw.githubusercontent.com/NeilLandge/BudgetPro/main/screenshots/ai-analysis-1.png)
![AI Analysis Part 2](https://raw.githubusercontent.com/NeilLandge/BudgetPro/main/screenshots/ai-analysis-2.png)

## Future Enhancements ✨

1. Direct email OTP delivery

2. Pro plan upgrade with Razorpay or QR UPI integration

## License 📝
MIT License – free to use for personal or commercial purposes.
