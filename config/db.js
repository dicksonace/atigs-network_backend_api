const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  console.log('⏳ Attempting MongoDB connection...');
  
  try {
    // Remove deprecated options for newer MongoDB drivers
    await mongoose.connect(process.env.MONGO_URI);

    // Connection events
    mongoose.connection.on('connected', () => {
      console.log('MongoDB Connected');
      console.log(`   Host: ${mongoose.connection.host}`);
      console.log(`   Port: ${mongoose.connection.port}`);
      console.log(`   Database: ${mongoose.connection.name}`);
      console.log(`   Driver: ${mongoose.version}`); // Show mongoose version
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB Error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🟡 MongoDB Disconnected');
    });

    return mongoose.connection;

  } catch (err) {
    console.error('MongoDB Connection Failed:', err.message);
    console.log('   Troubleshooting:');
    console.log('   1. Ensure MongoDB is running (try `mongosh` in terminal)');
    console.log(`   2. Check URI in .env: ${process.env.MONGO_URI}`);
    console.log('   3. Verify network/firewall settings');
    process.exit(1);
  }
};

module.exports = connectDB;