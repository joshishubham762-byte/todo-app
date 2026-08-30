require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const todoRoutes = require('./routes/todoRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || true,
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

app.get('/', (req, res) => {
  res.send('Todo App API is running');
});

module.exports = app;
