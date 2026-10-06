const User = require('../models/User');

const seedHelper = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@muqaddasstudio.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
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
    console.log('[Seed Helper] Admin user created.');
  }
};

module.exports = seedHelper;
