/**
 * 25 Realistic Demo/Fake Reviews for Pakistani Women's Fashion Products
 * Used to populate every product with 20-25 authentic customer reviews
 */
const DEMO_REVIEWS = [
  {
    name: "Ayesha Khan",
    location: "Lahore",
    rating: 5,
    title: "Absolutely Stunning Fabric & Embroidery!",
    comment: "Received my package today via TCS in just 2 days! The resham embroidery on the neckline is so fine and detailed. Lawn fabric quality is pre-shrunk and ultra soft. Highly recommended Muqaddas Studio!",
    isVerifiedBuyer: true,
    date: "2 days ago"
  },
  {
    name: "Fatima Rizvi",
    location: "Karachi",
    rating: 5,
    title: "100% Authentic Quality & Perfect Fit",
    comment: "I was a bit skeptical buying clothes online but Muqaddas Studio exceeded my expectations. Colors are exact same as shown in product pictures. Will order again!",
    isVerifiedBuyer: true,
    date: "4 days ago"
  },
  {
    name: "Sana Malik",
    location: "Islamabad",
    rating: 5,
    title: "Premium Pret Kurti, Very Elegant",
    comment: "The stitching style and organza border detailing are top-notch. Fits like a glove. Got so many compliments at a family lunch today!",
    isVerifiedBuyer: true,
    date: "1 week ago"
  },
  {
    name: "Zainab Hassan",
    location: "Faisalabad",
    rating: 5,
    title: "Breathable Combed Lawn - Ideal for Summers",
    comment: "Super lightweight, breathable, and no color fading after first hand wash. Great customer care on WhatsApp as well.",
    isVerifiedBuyer: true,
    date: "1 week ago"
  },
  {
    name: "Hira Shah",
    location: "Rawalpindi",
    rating: 4,
    title: "Loved the embroidery & Dupatta tissue",
    comment: "Beautiful article! Dupatta texture is light and easy to carry. Shipping took 3 days to Rawalpindi. Worth every rupee.",
    isVerifiedBuyer: true,
    date: "2 weeks ago"
  },
  {
    name: "Mahnoor Tariq",
    location: "Multan",
    rating: 5,
    title: "Graceful & Luxurious Outfit",
    comment: "MashAllah very high quality fabric and finishing. Threadwork doesn't snag. Cash on delivery was seamless.",
    isVerifiedBuyer: true,
    date: "2 weeks ago"
  },
  {
    name: "Alishba Kazmi",
    location: "Sialkot",
    rating: 5,
    title: "Unstitched 3-Piece Quality is Amazing",
    comment: "Tailor praised the generous fabric length. Enough for heavy sleeves and long shirt style. Very satisfied customer!",
    isVerifiedBuyer: true,
    date: "3 weeks ago"
  },
  {
    name: "Nida Waseem",
    location: "Peshawar",
    rating: 5,
    title: "Value for Money Brand!",
    comment: "Designs are comparable to top designer brands but price is very reasonable. COD delivery was prompt.",
    isVerifiedBuyer: true,
    date: "3 weeks ago"
  },
  {
    name: "Sidra Butt",
    location: "Gujranwala",
    rating: 4,
    title: "Very Pretty Color Palette",
    comment: "The pastel shade looks gorgeous in daylight. Fabric requires minimal ironing. Packaging was very neat.",
    isVerifiedBuyer: true,
    date: "1 month ago"
  },
  {
    name: "Rabia Farooq",
    location: "Quetta",
    rating: 5,
    title: "Loved the Co-ord Set!",
    comment: "Minimalist design, sleek cuts, and very comfortable stitching. Perfect for daily office and outdoor wear.",
    isVerifiedBuyer: true,
    date: "1 month ago"
  },
  {
    name: "Sadia Ahmed",
    location: "Hyderabad",
    rating: 5,
    title: "Superb Stitching & Fine Finishing",
    comment: "Stitching quality is very neat with durable overlocking. Pocket detail on trousers is super convenient.",
    isVerifiedBuyer: true,
    date: "1 month ago"
  },
  {
    name: "Komal Zafar",
    location: "Lahore",
    rating: 5,
    title: "Favorite Pakistani Clothing Brand Now",
    comment: "Ordered 3 suits in Eid sale and all of them turned out flawless. 10/10 rating for fabric texture.",
    isVerifiedBuyer: true,
    date: "1 month ago"
  },
  {
    name: "Anum Jahangir",
    location: "Karachi",
    rating: 4,
    title: "Fast Delivery & Authentic Product",
    comment: "Delivered within 48 hours in Karachi. Material feels soft on skin even in humid weather.",
    isVerifiedBuyer: true,
    date: "2 months ago"
  },
  {
    name: "Maryam Imran",
    location: "Islamabad",
    rating: 5,
    title: "Exquisite Resham Needlework",
    comment: "Details on cuffs and neckline are intricate. Royal feel! Will definitely recommend to friends.",
    isVerifiedBuyer: true,
    date: "2 months ago"
  },
  {
    name: "Mariam Shah",
    location: "Sargodha",
    rating: 5,
    title: "Highly Impressed with Packaging",
    comment: "Came packed in a beautiful luxury box with ribbon and brand tag. Perfect for gifting to mom!",
    isVerifiedBuyer: true,
    date: "2 months ago"
  },
  {
    name: "Rimsha Ali",
    location: "Bahawalpur",
    rating: 5,
    title: "Lightweight & Elegant Dupatta",
    comment: "Chiffon dupatta drapes nicely without sliding. Color combination is very subtle and sophisticated.",
    isVerifiedBuyer: true,
    date: "2 months ago"
  },
  {
    name: "Iqra Parvez",
    location: "Rawalpindi",
    rating: 4,
    title: "Great Size Accuracy",
    comment: "Ordered Medium according to size chart and it fits perfectly. No alterations needed.",
    isVerifiedBuyer: true,
    date: "3 months ago"
  },
  {
    name: "Bushra Siddiqui",
    location: "Lahore",
    rating: 5,
    title: "Superior Fabric Quality",
    comment: "Fine 80s lawn yarn, doesn't shrink or bleed color after washing. Premium luxury look.",
    isVerifiedBuyer: true,
    date: "3 months ago"
  },
  {
    name: "Amna Chaudhry",
    location: "Gujrat",
    rating: 5,
    title: "Super Smooth Ordering Experience",
    comment: "Placed order via WhatsApp assistance, delivery was fast, rider was polite. Product is 10/10.",
    isVerifiedBuyer: true,
    date: "3 months ago"
  },
  {
    name: "Laiba Noor",
    location: "Mirpur",
    rating: 5,
    title: "Classy & Chic Design",
    comment: "Modern cut with traditional Pakistani embroidery touch. Received many compliments!",
    isVerifiedBuyer: true,
    date: "4 months ago"
  },
  {
    name: "Mehak Tahir",
    location: "Karachi",
    rating: 4,
    title: "Soft Linen Co-ord",
    comment: "Very comfy fabric for Karachi winter/autumn transition. Styling is minimal and classy.",
    isVerifiedBuyer: true,
    date: "4 months ago"
  },
  {
    name: "Nimra Sheikh",
    location: "Faisalabad",
    rating: 5,
    title: "Best Purchase this Season!",
    comment: "The lawn fabric feels like butter. Beautiful gold motif accent on sleeves. Super happy!",
    isVerifiedBuyer: true,
    date: "4 months ago"
  },
  {
    name: "Zoya Qureshi",
    location: "Islamabad",
    rating: 5,
    title: "Authentic Designer Touch",
    comment: "Detailing is identical to high end Pakistani boutiques at half the price.",
    isVerifiedBuyer: true,
    date: "5 months ago"
  },
  {
    name: "Subhana Gillani",
    location: "Multan",
    rating: 5,
    title: "Will shop again soon!",
    comment: "Prompt delivery and genuine lawn quality. COD service makes it so safe and easy.",
    isVerifiedBuyer: true,
    date: "5 months ago"
  },
  {
    name: "Eman Fatima",
    location: "Lahore",
    rating: 5,
    title: "Unmatched Craftsmanship",
    comment: "Every detail from neck buttons to hem scalloping is immaculate. Extremely satisfied!",
    isVerifiedBuyer: true,
    date: "5 months ago"
  }
];

module.exports = DEMO_REVIEWS;
