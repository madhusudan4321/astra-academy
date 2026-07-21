import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

async function createAdmin() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not set in .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@astra.academy';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'Astra Admin';

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log(`Admin already exists: ${adminEmail}`);
      process.exit(0);
    }

    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    console.log(`✅ Admin created successfully:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ID: ${admin._id}`);
  } catch (error) {
    console.error('❌ Failed to create admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
