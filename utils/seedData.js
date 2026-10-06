const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

dotenv.config();

const seedDB = async () => {
  try {
    await connectDB();

    console.log('[Seed] Creating Admin User...');
    const adminEmail = process.env.ADMIN_EMAIL || "admin@muqaddasstudio.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      await User.create({
        name: "Muqaddas Admin",
        email: adminEmail,
        passwordHash: adminPassword,
        phone: "+92 300 1234567",
        role: "admin",
        addresses: [
          {
            label: "Studio HQ",
            street: "Main Gulberg III, MM Alam Road",
            city: "Lahore",
            postalCode: "54000",
            phone: "+92 300 1234567",
            isDefault: true
          }
        ]
      });
    }

    console.log('----------------------------------------------------');
    console.log('✅ Admin user ready!');
    console.log(`Admin: ${adminEmail} | Password: ${adminPassword}`);
    console.log('----------------------------------------------------');

    process.exit();
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
    process.exit(1);
  }
};

seedDB();
