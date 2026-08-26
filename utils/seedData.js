const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Product = require('../models/Product');
const connectDB = require('../config/db');

dotenv.config();

const sampleProducts = [
  {
    name: "Noir Midnight Embroidered Lawn Suit - 3 Piece",
    slug: "noir-midnight-embroidered-lawn-suit-3-piece",
    category: "clothes",
    subCategory: "Lawn Suit",
    description: "An exquisite 3-piece embroidered lawn suit featuring intricate black silk threadwork on breathable premium lawn fabric. Includes printed silk dupatta and dyed cotton trousers.",
    price: 8950,
    discountPrice: 7450,
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800"
    ],
    variants: [
      { size: "XS", color: "Noir Black", colorHex: "#000000", stock: 8 },
      { size: "S", color: "Noir Black", colorHex: "#000000", stock: 12 },
      { size: "M", color: "Noir Black", colorHex: "#000000", stock: 4 }, // low stock <5
      { size: "L", color: "Noir Black", colorHex: "#000000", stock: 10 },
      { size: "XL", color: "Noir Black", colorHex: "#000000", stock: 2 }  // low stock <5
    ],
    status: "active",
    featured: true,
    ratingAvg: 4.9,
    reviewCount: 28
  },
  {
    name: "Opal Minimalist Monochromatic Stitched Kurti",
    slug: "opal-minimalist-monochromatic-stitched-kurti",
    category: "clothes",
    subCategory: "Kurti",
    description: "Tailored to perfection, this crisp white and charcoal grey printed kurti features clean line geometry and side slit accents. Ideal for everyday elegance.",
    price: 4250,
    discountPrice: null,
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=800"
    ],
    variants: [
      { size: "XS", color: "Ivory White", colorHex: "#ffffff", stock: 15 },
      { size: "S", color: "Ivory White", colorHex: "#ffffff", stock: 20 },
      { size: "M", color: "Ivory White", colorHex: "#ffffff", stock: 14 },
      { size: "L", color: "Ivory White", colorHex: "#ffffff", stock: 6 },
      { size: "XL", color: "Ivory White", colorHex: "#ffffff", stock: 0 }  // out of stock
    ],
    status: "active",
    featured: true,
    ratingAvg: 4.8,
    reviewCount: 15
  },
  {
    name: "Velvet Obsidian Festive Stitched Shirt",
    slug: "velvet-obsidian-festive-stitched-shirt",
    category: "clothes",
    subCategory: "Stitched",
    description: "Luxury velvet shirt crafted with gold-tinted silver zardozi detailing along the collar and cuffs. High-end formal wear for evening celebrations.",
    price: 14500,
    discountPrice: 12900,
    images: [
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&q=80&w=800"
    ],
    variants: [
      { size: "S", color: "Obsidian", colorHex: "#111111", stock: 3 },
      { size: "M", color: "Obsidian", colorHex: "#111111", stock: 5 },
      { size: "L", color: "Obsidian", colorHex: "#111111", stock: 2 }
    ],
    status: "active",
    featured: true,
    ratingAvg: 5.0,
    reviewCount: 42
  },
  {
    name: "Chiffon Monochromatic Unstitched 3-Piece",
    slug: "chiffon-monochromatic-unstitched-3-piece",
    category: "clothes",
    subCategory: "Unstitched",
    description: "Premium unstitched crinkle chiffon shirt with schiffli laser-cut embroidered border, paired with embroidered chiffon dupatta and raw silk trousers.",
    price: 9800,
    discountPrice: 8500,
    images: [
      "https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800"
    ],
    variants: [
      { size: "Unstitched", color: "Mono Pattern", colorHex: "#222222", stock: 25 }
    ],
    status: "active",
    featured: false,
    ratingAvg: 4.7,
    reviewCount: 9
  },
  {
    name: "Shadow Line Printed Cotton Tunic",
    slug: "shadow-line-printed-cotton-tunic",
    category: "clothes",
    subCategory: "Kurti",
    description: "Lightweight 100% combed cotton tunic with subtle stripe motifs and keyhole neck detail. Perfectly breathable for warm Pakistani summers.",
    price: 3650,
    discountPrice: null,
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=800"
    ],
    variants: [
      { size: "S", color: "Charcoal", colorHex: "#333333", stock: 10 },
      { size: "M", color: "Charcoal", colorHex: "#333333", stock: 12 },
      { size: "L", color: "Charcoal", colorHex: "#333333", stock: 8 }
    ],
    status: "active",
    featured: true,
    ratingAvg: 4.6,
    reviewCount: 19
  },
  {
    name: "Classic Silk Monochrome Co-Ord Set",
    slug: "classic-silk-monochrome-co-ord-set",
    category: "clothes",
    subCategory: "Stitched",
    description: "Contemporary 2-piece co-ord set in Korean raw silk. Oversized button-down shirt paired with straight wide-leg trousers for an effortless look.",
    price: 11200,
    discountPrice: 9990,
    images: [
      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800"
    ],
    variants: [
      { size: "S", color: "Pure Black", colorHex: "#000000", stock: 7 },
      { size: "M", color: "Pure Black", colorHex: "#000000", stock: 9 },
      { size: "L", color: "Pure Black", colorHex: "#000000", stock: 4 }
    ],
    status: "active",
    featured: true,
    ratingAvg: 4.9,
    reviewCount: 31
  }
];

const seedDB = async () => {
  try {
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany();
    await Product.deleteMany();

    console.log('[Seed] Creating Admin & Customer Users...');
    const adminEmail = process.env.ADMIN_EMAIL || "admin@muqaddasstudio.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

    const admin = await User.create({
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

    const user = await User.create({
      name: "Ayesha Khan",
      email: "user@muqaddasstudio.com",
      passwordHash: "User@123",
      phone: "+92 321 9876543",
      role: "customer",
      addresses: [
        {
          label: "Home",
          street: "House 45, Street 12, F-8/3",
          city: "Islamabad",
          postalCode: "44000",
          phone: "+92 321 9876543",
          isDefault: true
        }
      ]
    });

    console.log('[Seed] Seeding sample products...');
    await Product.insertMany(sampleProducts);

    console.log('----------------------------------------------------');
    console.log('✅ Database Seeded Successfully!');
    console.log(`Admin Account: ${adminEmail} | Password: ${adminPassword}`);
    console.log('User Account:  user@muqaddasstudio.com  | Password: User@123');
    console.log('----------------------------------------------------');

    process.exit();
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
    process.exit(1);
  }
};

seedDB();
