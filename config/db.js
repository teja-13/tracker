const mongoose = require('mongoose');

// Cache the connection promise across invocations to reuse connections efficiently
let cachedPromise = null;

/**
 * Connect to MongoDB Atlas with optimized connection pooling settings.
 */
const connectDB = async () => {
  // If already connected (readyState 1 = connected), return connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If a connection attempt is already in progress, return the cached promise
  if (cachedPromise) {
    return cachedPromise;
  }

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI || mongoURI.includes('<username>') || mongoURI.includes('your_username')) {
    const errorMsg = 'MONGODB_URI is not properly configured in .env file.';
    console.error(`❌ DB Config Error: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Optimized Connection Options for MongoDB Atlas & Cloud Hosting Cold Starts
  const options = {
    maxPoolSize: 10,             // Maintain up to 10 socket connections in pool
    minPoolSize: 2,              // Keep at least 2 socket connections open
    serverSelectionTimeoutMS: 10000, // Wait up to 10s for Atlas server selection during cold starts
    socketTimeoutMS: 45000,      // Close sockets after 45s of inactivity
    family: 4                    // Use IPv4 first for faster DNS resolution
  };

  cachedPromise = mongoose.connect(mongoURI, options)
    .then((mongooseInstance) => {
      console.log('✅ Successfully connected to MongoDB Atlas');
      return mongooseInstance;
    })
    .catch((err) => {
      cachedPromise = null; // Clear cached promise on error so next request can retry
      console.error('❌ MongoDB Atlas Connection Error:', err.message);
      throw err;
    });

  return cachedPromise;
};

/**
 * Express Middleware: Ensures MongoDB Atlas is connected before proceeding to route handlers.
 * Prevents executing database queries when the database connection is not ready.
 */
const ensureDbConnected = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('⚠️ Express DB Middleware Error:', error.message);
    return res.status(503).json({
      error: 'Database connection initializing or unavailable. Please retry in a moment.',
      details: error.message
    });
  }
};

module.exports = {
  connectDB,
  ensureDbConnected
};
