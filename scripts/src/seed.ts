import { db, productsTable, siteSettingsTable, legalPagesTable, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Default site settings
  const defaultSettings = [
    { key: "delivery_fee", value: "200" },
    { key: "cod_fee_percent", value: "10" },
    { key: "easypaisa_number", value: "0300-1234567" },
    { key: "bank_name", value: "HBL Bank" },
    { key: "bank_account", value: "1234-5678-9012" },
    { key: "bank_iban", value: "PK36HABB0000001234567890" },
    { key: "whatsapp_number", value: "923001234567" },
  ];

  for (const setting of defaultSettings) {
    await db.insert(siteSettingsTable).values(setting)
      .onConflictDoNothing();
  }
  console.log("✓ Settings seeded");

  // Default legal pages
  const legalPages = [
    {
      slug: "terms",
      title: "Terms of Service",
      content: `<h2>Terms of Service</h2><p>Welcome to Almera. By using our website, you agree to these terms.</p><h3>1. Orders</h3><p>All orders are subject to availability. We reserve the right to cancel any order.</p><h3>2. Payment</h3><p>We accept COD, Easypaisa, and Bank Transfer. Payment must be confirmed before dispatch for online payments.</p><h3>3. Delivery</h3><p>Delivery times are estimated 3–7 working days across Pakistan.</p>`,
    },
    {
      slug: "privacy",
      title: "Privacy Policy",
      content: `<h2>Privacy Policy</h2><p>Your privacy is important to us. We collect only the information needed to process your orders.</p><h3>Data We Collect</h3><p>Name, phone number, address, and email (optional) for order fulfillment.</p><h3>How We Use It</h3><p>We use your data to process and deliver orders. We do not sell your data to third parties.</p>`,
    },
    {
      slug: "refund",
      title: "Refund Policy",
      content: `<h2>Refund Policy</h2><p>We offer a 7-day return policy on all items in original condition.</p><h3>How to Return</h3><p>Contact us on WhatsApp within 7 days of delivery. Items must be unused, unwashed, and in original packaging.</p><h3>Refunds</h3><p>Refunds are processed within 5–7 business days after we receive the returned item.</p>`,
    },
  ];

  for (const page of legalPages) {
    await db.insert(legalPagesTable).values(page).onConflictDoNothing();
  }
  console.log("✓ Legal pages seeded");

  // Default admin user (change password after first login)
  const existing = await db.select().from(usersTable);
  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash("admin123", 12);
    await db.insert(usersTable).values({
      email: "admin@almera.pk",
      passwordHash,
      fullName: "Admin",
      role: "admin",
    }).onConflictDoNothing();
    console.log("✓ Admin user created: admin@almera.pk / admin123");
  }

  // Sample products (using placeholder images)
  const existing_products = await db.select().from(productsTable);
  if (existing_products.length === 0) {
    const products = [
      {
        name: "Floral Embroidered Kurta",
        slug: "floral-embroidered-kurta",
        description: "A stunning cream kurta featuring delicate floral embroidery with gold accents. Crafted from premium lawn fabric for ultimate comfort and elegance.",
        category: "women",
        originalPrice: "8500",
        discountedPrice: "5950",
        images: ["/images/product-placeholder.png"],
        variants: [
          { size: "S", color: "Cream", quality: "Premium", stock: 12 },
          { size: "M", color: "Cream", quality: "Premium", stock: 8 },
          { size: "L", color: "Cream", quality: "Premium", stock: 5 },
          { size: "XL", color: "Cream", quality: "Premium", stock: 3 },
        ],
        rating: "4.8",
        reviewCount: 124,
        isFeatured: true,
        isNew: true,
      },
      {
        name: "Classic White Shalwar Kameez",
        slug: "classic-white-shalwar-kameez",
        description: "Timeless white shalwar kameez with subtle silver embroidery on the collar and cuffs. Made from premium cotton for breathability and comfort.",
        category: "men",
        originalPrice: "6500",
        discountedPrice: "4550",
        images: ["/images/product-placeholder.png"],
        variants: [
          { size: "M", color: "White", quality: "Premium", stock: 15 },
          { size: "L", color: "White", quality: "Premium", stock: 10 },
          { size: "XL", color: "White", quality: "Premium", stock: 7 },
        ],
        rating: "4.6",
        reviewCount: 89,
        isFeatured: true,
        isNew: false,
      },
      {
        name: "Silk Embroidered Dupatta",
        slug: "silk-embroidered-dupatta",
        description: "Luxurious silk dupatta with intricate gold border embroidery and delicate tassels. A versatile accessory that adds grace to any outfit.",
        category: "accessories",
        originalPrice: "4200",
        discountedPrice: "2940",
        images: ["/images/product-placeholder.png"],
        variants: [
          { size: "One Size", color: "Coral", quality: "Premium", stock: 20 },
          { size: "One Size", color: "Gold", quality: "Premium", stock: 15 },
        ],
        rating: "4.9",
        reviewCount: 67,
        isFeatured: true,
        isNew: true,
      },
      {
        name: "Handcrafted Khussa",
        slug: "handcrafted-khussa",
        description: "Traditional handcrafted leather khussa with gold thread embroidery. Each pair is a masterpiece of Pakistani artisanship.",
        category: "footwear",
        originalPrice: "3800",
        discountedPrice: "2660",
        images: ["/images/product-placeholder.png"],
        variants: [
          { size: "7", color: "Brown", quality: "Artisan", stock: 8 },
          { size: "8", color: "Brown", quality: "Artisan", stock: 12 },
          { size: "9", color: "Brown", quality: "Artisan", stock: 10 },
          { size: "10", color: "Brown", quality: "Artisan", stock: 6 },
        ],
        rating: "4.7",
        reviewCount: 45,
        isFeatured: true,
        isNew: false,
      },
      {
        name: "Premium Cotton Lawn Suit",
        slug: "premium-cotton-lawn-suit",
        description: "3-piece lawn suit with exquisite embroidery. Breathable fabric perfect for all seasons.",
        category: "women",
        originalPrice: "7800",
        discountedPrice: "5460",
        images: ["/images/product-placeholder.png"],
        variants: [
          { size: "S", color: "Mint", quality: "Premium", stock: 10 },
          { size: "M", color: "Mint", quality: "Premium", stock: 14 },
          { size: "L", color: "Mint", quality: "Premium", stock: 8 },
        ],
        rating: "4.5",
        reviewCount: 52,
        isFeatured: false,
        isNew: true,
      },
      {
        name: "Casual Kurta",
        slug: "casual-kurta",
        description: "Comfortable everyday kurta made from pure cotton. Minimal design with a classic touch.",
        category: "men",
        originalPrice: "3500",
        discountedPrice: "2450",
        images: ["/images/product-placeholder.png"],
        variants: [
          { size: "M", color: "Navy", quality: "Standard", stock: 20 },
          { size: "L", color: "Navy", quality: "Standard", stock: 18 },
          { size: "XL", color: "Navy", quality: "Standard", stock: 12 },
          { size: "M", color: "White", quality: "Standard", stock: 15 },
        ],
        rating: "4.3",
        reviewCount: 78,
        isFeatured: false,
        isNew: false,
      },
    ];

    for (const product of products) {
      await db.insert(productsTable).values(product as any).onConflictDoNothing();
    }
    console.log("✓ Products seeded");
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
