import mongoose from 'mongoose';

const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017/rank2campus';

export default async function connectDB() {
  const candidates = [
    process.env.MONGODB_URI,
    DEFAULT_LOCAL_URI,
  ].filter(Boolean);

  let lastError;

  for (const uri of [...new Set(candidates)]) {
    try {
      await mongoose.connect(uri);
      console.log(`MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (error) {
      lastError = error;
      console.warn(`MongoDB connection failed for ${uri}: ${error.message}`);
    }
  }

  throw lastError || new Error('MONGODB_URI is missing in backend/.env');
}
