# Full-Stack Todo App (with JWT Authentication)

A beginner-friendly full-stack project: users sign up, log in, and manage their own
private todo list. Built with Node.js/Express/MongoDB on the backend and plain
HTML/CSS/JavaScript on the frontend (no build tools needed).

## Project Structure

```
todo-app/
├── backend/
│   ├── models/          # Mongoose schemas (User, Todo)
│   ├── controllers/     # Route logic (signup, login, CRUD)
│   ├── routes/           # Express route definitions
│   ├── middleware/        # JWT auth middleware
│   ├── server.js          # App entry point
│   ├── .env.example       # Copy to .env and fill in
│   └── package.json
└── frontend/
    ├── index.html          # Login page
    ├── signup.html         # Signup page
    ├── dashboard.html      # Protected todo dashboard
    ├── css/style.css
    └── js/
        ├── api.js          # Shared fetch wrapper + token storage
        ├── auth.js         # Login/signup form logic
        └── dashboard.js    # Todo CRUD logic
```

## How It Works

1. A user signs up. The backend hashes their password (bcrypt) and stores it in
   MongoDB, then returns a JWT token.
2. The frontend stores that token in `localStorage`.
3. Every request to a protected route (like fetching todos) includes the token
   in the `Authorization: Bearer <token>` header.
4. The backend's `authMiddleware` verifies the token and figures out *which*
   user is making the request — so each user only ever sees their own todos.

## Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed (v18+ recommended)
- A MongoDB database — easiest option is a free cluster on
  [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy the example environment file and fill in your own values:

```bash
cp .env.example .env
```

Edit `.env`:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_string
PORT=5000
```

Run the backend:

```bash
npm run dev
```

You should see:
```
Connected to MongoDB
Server running on http://localhost:5000
```

### 3. Frontend Setup

The frontend needs no installation — it's plain HTML/CSS/JS. Just open it with
a local server so `fetch` requests work properly (opening the file directly
with `file://` can cause issues).

**Easiest option — VS Code Live Server extension:**
1. Open the `frontend` folder in VS Code
2. Install the "Live Server" extension
3. Right-click `index.html` → "Open with Live Server"

**Or, using Python (already installed on most systems):**
```bash
cd frontend
python3 -m http.server 5500
```
Then open `http://localhost:5500` in your browser.

### 4. Try It Out
1. Go to the signup page, create an account
2. You'll be redirected to the dashboard
3. Add a few todos, mark them complete, delete them
4. Log out, log back in — your todos are still there
5. Try signing up as a second user — you'll see they get a completely separate todo list

## Common Issues

- **"Failed to connect to MongoDB"** — double check your `MONGO_URI` in `.env`,
  and make sure your IP address is whitelisted in MongoDB Atlas (Network Access
  settings — `0.0.0.0/0` allows access from anywhere, fine for development).
- **CORS errors in the browser console** — make sure the backend is actually
  running on port 5000, and that `API_BASE_URL` in `frontend/js/api.js` matches.
- **401 Unauthorized on every request** — your token may have expired (7 day
  expiry) or wasn't saved. Try logging out and back in.

## Next Steps to Extend This Project

- Add "edit todo" functionality (currently you can only add/toggle/delete)
- Add due dates and sort by them
- Add categories/tags for todos
- Deploy: frontend to Vercel/Netlify, backend to Render/Railway, database
  already lives on MongoDB Atlas
- Replace `localStorage` token storage with httpOnly cookies for better security
