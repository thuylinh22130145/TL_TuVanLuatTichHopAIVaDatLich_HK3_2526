# client-app — React + Tailwind

Frontend Vite + React 18 + React Router 6 + Tailwind CSS.

## Cấu trúc

```
client-app/
├── public/
├── src/
│   ├── assets/
│   ├── components/       # Header, Footer, Sidebar, Modal, ChatBubble, …
│   ├── context/          # AuthContext, AppDataContext
│   ├── layouts/          # PublicLayout, AdminLayout
│   ├── pages/
│   │   ├── public/       # ChatPage, LawyerInfoPage
│   │   └── admin/        # AdminLogin, AdminDashboard + tabs
│   ├── routes/
│   │   ├── routes.js     # Định nghĩa route
│   │   └── PrivateRoute.jsx
│   ├── services/         # api, auth, appointment, lawyer, chat
│   └── utils/constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

## Chạy (cần server-api + server-ai)

```bash
npm install
cp .env.example .env
npm run dev
```

Mọi request đi tới `VITE_API_BASE_URL` (mặc định `http://localhost:3000/api`).  
Xem [INTEGRATION.md](../INTEGRATION.md).
