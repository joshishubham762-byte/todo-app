require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const todoRoutes = require('./routes/todoRoutes');

const app = express();

// Middleware
app.use(cors()); // allows the frontend (different origin) to talk to this API
app.use(express.json()); // parses incoming JSON request bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

// Simple health check route
app.get('/', (req, res) => {
  res.send('Todo App API is running');
});

// Connect to MongoDB, then start the server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  });
