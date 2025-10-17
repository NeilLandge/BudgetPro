# BudgetPro 💰📊

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML) [![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS) [![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/) [![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/) [![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/) [![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)

A beautiful web-based financial management app to track expenses, manage budgets, and gain insights into your spending habits.

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

- Financial summaries and expense breakdowns
- Export functionality ready (PDF/Excel in future for Pro users)

### Pro Features (Coming Soon!) ⭐

- Unlimited transactions
- Advanced analytics & AI insights (future)
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
# Clone the repository
git clone https://github.com/NeilLandge/BudgetPro.git
cd BudgetPro

# Install dependencies
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/budgetpro
JWT_SECRET=your-secret-key
```

Start MongoDB and the server:

```bash
# Start MongoDB
mongod

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

### Frontend Setup

```bash
# Using VS Code Live Server, or
python -m http.server 3000

# Or using npx
npx http-server -p 3000
```

Open `http://localhost:3000` and ensure the API URL in `js/auth.js` points to your backend.

---

## Project Structure 🗂️

```
BudgetPro/
├── frontend/
│   ├── index.html
│   ├── signup.html
│   ├── signin.html
│   ├── dashboard.html
│   ├── css/
│   └── js/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
├── screenshots/
│   ├── dashboard.png
│   ├── landing-page.png
│   └── signup-page.png
└── README.md
```

---

## Screenshots 📸

![Dashboard](https://raw.githubusercontent.com/NeilLandge/BudgetPro/main/screenshots/dashboard.png)
![Landing Page](https://raw.githubusercontent.com/NeilLandge/BudgetPro/main/screenshots/landing-page.png)
![Signup Page](https://raw.githubusercontent.com/NeilLandge/BudgetPro/main/screenshots/signup-page.png)

---

## Future Enhancements ✨

- Direct email OTP delivery
- Pro plan upgrade with Razorpay or QR UPI integration
- Advanced PDF/Excel export reports with AI insights

---

## License 📝

MIT License – free to use for personal or commercial purposes.

---

## Contributing 🤝

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/NeilLandge/BudgetPro/issues).

---

## Author 👨‍💻
GitHub: @NeilLandge
**Neil Landge**

- GitHub: [@NeilLandge](https://github.com/NeilLandge)
