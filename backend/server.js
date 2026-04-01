require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');

const app = express();

// --- Production Configuration ---
// Trust the first proxy (Railway/Render Load Balancer)
// This ensures that req.protocol and req.ip are correctly set for mobile internet users
app.set('trust proxy', 1);

// Standard security headers (helps mobile ISP proxies "trust" the response)
app.use(helmet({
  contentSecurityPolicy: false, // Set to false if you're serving standard React or have separate domains
  crossOriginEmbedderPolicy: false
}));

// Only override DNS in non-cloud environments to prevent interference with platform networking
const isCloud = process.env.RAILWAY_ENVIRONMENT || process.env.RENDER || process.env.PORT;
if (!isCloud) {
  try {
    const dns = require('dns');
    dns.setDefaultResultOrder('ipv4first');
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (e) {
    console.log('DNS override skipped');
  }
}

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // Permissive for mobile clients, but with structured options for stability
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

// Serve React frontend
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

// Database Connection & Server Start
mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err.message));

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
