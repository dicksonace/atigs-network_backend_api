require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/homeRoutes');
const donationRoutes = require('./routes/donationRoutes');
const cors = require('cors');


const swaggerDocs = require('./swagger');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://astonishing-chimera-f20edb.netlify.app',
  'http://localhost:5173',
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

swaggerDocs(app);

// Middleware
app.use(express.json());

// Enhanced MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      socketTimeoutMS: 45000 // Close sockets after 45s inactivity
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

// Connection events 
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Initialize connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/donations', donationRoutes);

// app.use('/api/membership', membershipRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(mongoose.connection.readyState === 1 ? 200 : 503)
    .json({ 
      status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
      dbState: mongoose.connection.readyState 
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 3000;

// Vercel-compatible export
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}