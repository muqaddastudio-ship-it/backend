const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/muqaddas_studio';
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    await autoSeedIfEmpty();
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to ${uri}: ${error.message}`);
    console.log(`[MongoDB] Initializing in-memory Mongo server for development...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`[MongoDB] Connected to in-memory server: ${conn.connection.host}`);
      await autoSeedIfEmpty();
    } catch (memErr) {
      console.error(`[MongoDB Fatal Error] ${memErr.message}`);
      process.exit(1);
    }
  }
};

const autoSeedIfEmpty = async () => {
  try {
    const Product = require('../models/Product');
    const User = require('../models/User');
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('[MongoDB Auto-Seed] Seeding default products and admin user...');
      const seedFunc = require('./seedHelper');
      await seedFunc();
    }
  } catch (err) {
    console.error('[MongoDB Auto-Seed Error]', err.message);
  }
};

module.exports = connectDB;
