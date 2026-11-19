import dotenv from 'dotenv';
dotenv.config();
import app from './src/app.js';
import connectDB from './src/config/db.js';

const DEFAULT_PORT = Number(process.env.PORT || 5000);

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 ||
      process.env.JWT_SECRET.toLowerCase().includes('replace_with') ||
      process.env.JWT_SECRET.toLowerCase().includes('change_this')) {
    throw new Error('JWT_SECRET must be a unique secret of at least 32 characters in production.');
  }
  if (!process.env.CLIENT_URL) {
    throw new Error('CLIENT_URL must be configured in production.');
  }
}

const listen = (port) => new Promise((resolve, reject) => {
  const server = app.listen(port, () => resolve(server));
  server.once('error', reject);
});

const startServer = async () => {
  try {
    await connectDB();
    await listen(DEFAULT_PORT);
    console.log(`Rank2Campus API running on port ${DEFAULT_PORT}`);
  } catch (error) {
    console.error(`Server startup failed on port ${DEFAULT_PORT}:`, error.message);
    process.exit(1);
  }
};

startServer();
