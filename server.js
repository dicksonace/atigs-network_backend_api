require('dotenv').config(); // This must be at the VERY TOP of your file

const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const membershipRoutes = require('./routes/membership');

const app = express();

// Middleware
app.use(express.json());

// Database connection - add error handling
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit if DB connection fails
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/membership', membershipRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));