import mongoose from 'mongoose';

const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017/rank2campus';

export default async function connectDB() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be configured in production.');
  }

  const candidates = [
    process.env.MONGODB_URI,
    ...(isProduction ? [] : [DEFAULT_LOCAL_URI])
  ].filter(Boolean);

  let lastError;

  for (const uri of [...new Set(candidates)]) {
    try {
      await mongoose.connect(uri);
      console.log(`MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (error) {
      lastError = error;
      console.warn(`MongoDB connection attempt ${candidates.indexOf(uri) + 1} failed: ${error.message}`);
    }
  }

  throw lastError || new Error('MONGODB_URI is missing in backend/.env');
}
