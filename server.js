require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

// Initialize Express
const app = express();

// 1. Connect to DB with status logging
connectDB().then(connection => {
  // Only start server after DB connection is established
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log('\n📊 Server Status:');
    console.log(`   MongoDB: ${connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log(`   Express: Listening on port ${PORT}`);
    console.log('\n🔗 Endpoints:');
    console.log(`   http://localhost:${PORT}/`);
  });
});

// 2. Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Routes
app.get('/', (req, res) => {
  res.send('🚀 API Running');
});

// 4. Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('💥 Server Error');
});

// DB Connection Check Endpoint (optional)
app.get('/status', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  res.json({
    database: dbStatus === 1 ? 'Connected' : 'Disconnected',
    server: 'Running'
  });
});