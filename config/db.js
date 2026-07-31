const mongoose = require('mongoose');

let retryCount = 0;
const MAX_RETRIES = 5;

const connectDB = async () => {
  const uri = process.env.MONGO_URL || process.env.MONGO_URI;

  if (!uri) {
    console.error('✗ MONGO_URL environment variable is not set. Exiting.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS:          45000,
      maxPoolSize:              10,
    });

    retryCount = 0;
    console.log(`✓ MongoDB connected: ${conn.connection.host}`);

    // Handle connection events after initial connect
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠ MongoDB disconnected.');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('✓ MongoDB reconnected.');
    });
    mongoose.connection.on('error', (err) => {
      console.error('✗ MongoDB error:', err.message);
    });
  } catch (err) {
    retryCount += 1;
    console.error(`✗ MongoDB connection failed (attempt ${retryCount}): ${err.message}`);

    if (retryCount < MAX_RETRIES) {
      const delay = Math.min(retryCount * 3000, 15000); // backoff up to 15s
      console.log(`  Retrying in ${delay / 1000}s...`);
      setTimeout(connectDB, delay);
    } else {
      console.error('✗ Max MongoDB retries reached. Exiting.');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
