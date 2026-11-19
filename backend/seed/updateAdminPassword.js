import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';

await connectDB();

try {
    const email = process.env.SEED_ADMIN_EMAIL.toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;

    const admin = await User.findOne({ email });

    if (!admin) {
        throw new Error('Admin account not found. Run npm run seed first.');
    }

    admin.password = password;
    await admin.save();

    console.log('Admin password updated successfully.');
} catch (error) {
    console.error('Password update failed:', error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}