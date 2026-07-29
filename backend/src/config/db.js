const mongoose = require('mongoose');
const config = require('../../config');
const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(config.mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });
      console.log('MongoDB connected successfully');
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) {
        console.error('All retry attempts exhausted. Exiting...');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s between retries
    }
  }
};

module.exports = connectDB;

