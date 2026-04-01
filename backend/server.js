if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Only override DNS locally (not needed on cloud platforms like Render)
if (!process.env.RENDER) {
  try {
    const dns = require('dns');
    dns.setDefaultResultOrder('ipv4first');
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (e) {
    console.log('DNS override skipped');
  }
}

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

// PRODUCTION: Serve React frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

  app.get('*splat', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

// Database Connection & Server Start
mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err.message));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
