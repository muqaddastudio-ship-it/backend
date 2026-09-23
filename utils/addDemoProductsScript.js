const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const connectDB = require('../config/db');

dotenv.config();

const newDemoProducts = [
  {
    name: "Royal Oud Velvet Elixir - 100ml",
    slug: "royal-oud-velvet-elixir-100ml",
    category: "perfume",
    subCategory: "Luxury Fragrance",
    description: "An enchanting blend of rare Cambodian oud, dark rose petals, amber, and warm vanilla. Long-lasting luxury scent crafted for evening occasions.",
    price: 12500,
    discountPrice: 10900,
    images: [
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800"
    ],
    variants: [
      { size: "100ml", color: "Gold Bottle", colorHex: "#d4af37", stock: 15 }
    ],
    status: "active",
    featured: true,
    ratingAvg: 5.0,
    reviewCount: 36
  },
  {
    name: "Obsidian Embellished Velvet Tote Bag",
    slug: "obsidian-embellished-velvet-tote-bag",
    category: "bags",
    subCategory: "Tote Bag",
    description: "Handcrafted black velvet tote adorned with traditional zari embroidery and metallic magnetic clasp. Spacious interior with inner zip pocket.",
    price: 6800,
    discountPrice: 5950,
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=800"
    ],
    variants: [
      { size: "One Size", color: "Obsidian Black", colorHex: "#000000", stock: 12 }
    ],
    status: "active",
    featured: true,
    ratingAvg: 4.9,
    reviewCount: 22
  },
  {
    name: "Handcrafted Zari Embroidered Khussa Shoes",
    slug: "handcrafted-zari-embroidered-khussa-shoes",
    category: "shoes",
    subCategory: "Traditional Footwear",
    description: "Premium genuine leather khussa features intricate silver tilla embroidery and extra-cushioned sole for all-day comfort at weddings and festivities.",
    price: 4950,
    discountPrice: 4200,
    images: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1560343776-97e7d202ff0e?auto=format&fit=crop&q=80&w=800"
    ],
    variants: [
      { size: "37 (6)", color: "Silver/Black", colorHex: "#c0c0c0", stock: 8 },
      { size: "38 (7)", color: "Silver/Black", colorHex: "#c0c0c0", stock: 10 },
      { size: "39 (8)", color: "Silver/Black", colorHex: "#c0c0c0", stock: 5 }
    ],
    status: "active",
    featured: true,
    ratingAvg: 4.8,
    reviewCount: 19
  },
  {
    name: "Heritage Pearl & Emerald Statement Choker Set",
    slug: "heritage-pearl-emerald-statement-choker-set",
    category: "accessories",
    subCategory: "Jewelry",
    description: "Vintage-inspired antique gold-plated choker set studded with synthetic emeralds, polki stones, and cascading freshwater pearl drops. Comes with matching earrings.",
    price: 8400,
    discountPrice: 7200,
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800"
    ],
    variants: [
      { size: "One Size", color: "Antique Gold", colorHex: "#ffd700", stock: 7 }
    ],
    status: "active",
    featured: true,
    ratingAvg: 4.9,
    reviewCount: 14
  }
];

const addDemoProducts = async () => {
  try {
    await connectDB();
    console.log('[Demo Add] Connecting to Database...');

    for (const item of newDemoProducts) {
      const exists = await Product.findOne({ slug: item.slug });
      if (!exists) {
        await Product.create(item);
        console.log(`✅ Added Demo Product: ${item.name}`);
      } else {
        console.log(`ℹ️ Product already exists: ${item.name}`);
      }
    }

    console.log('🎉 All 4 Demo Products processed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error adding demo products:', err);
    process.exit(1);
  }
};

addDemoProducts();
