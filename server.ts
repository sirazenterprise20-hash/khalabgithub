import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { Product, Category, Catalog, Review, Order, AppConfig, PushNotification } from "./src/types.js";

const app = express();
const PORT = 3000;

// Enable robust CORS support for all endpoints and preflight requests
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  optionsSuccessStatus: 200
}));

// Manual OPTIONS preflight handler fallback for absolute reliability
app.options("*", (req, res) => {
  const origin = req.headers.origin || "*";
  if (origin !== "*") {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.setHeader("Access-Control-Max-Age", "86400"); // cache preflight for 24 hours
  res.sendStatus(200);
});

// High payload size for base64 photo/video uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// DB File path
const DB_PATH = path.join(process.cwd(), "db.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Default/Initial Configuration
const defaultConfig: AppConfig = {
  brandName: "KHALAB",
  tagline: "Make your self premium.",
  address: "Shuvadda, South Keraniganj, Dhaka, Bangladesh.",
  mobile: "+880171941040",
  whatsapp: "+880171941040",
  instagram: "https://instagram.com/khalabfashion",
  facebook: "https://www.facebook.com/khalabfashion",
  logoUrl: "", // blank uses beautiful default text logo
  banners: [
    {
      id: "b1",
      imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200",
      title: "PREMIUM FESTIVE LAUNCH",
      subtitle: "Elevate your wardrobe with KHALAB premium collections",
      link: "#shop"
    },
    {
      id: "b2",
      imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200",
      title: "SUMMER BREATHABLES '26",
      subtitle: "Pure cotton Oxford shirts & comfortable linen apparel",
      link: "#category/Shirts"
    }
  ],
  promos: [
    {
      code: "KHALAB500",
      discount: 500,
      type: "fixed",
      description: "Flat 500 BDT off on orders above 3000 BDT",
      active: true
    },
    {
      code: "PREMIUM20",
      discount: 20,
      type: "percentage",
      description: "Get 20% discount on entire cart!",
      active: true
    }
  ],
  themeMode: "slate",
  customPrimary: "#047857", // default emerald hex
  customSecondary: "#065f46"
};

// Default Products Seed Data
const defaultProducts: Product[] = [
  {
    id: "p1",
    title: "KHALAB Royal Festive Panjabi",
    description: "Handcrafted Premium semi-wool blended Panjabi featuring detailed classic embroidery on collar and placket. Intended for religious festivities and premium casual styling.",
    price: 3200,
    sizes: ["M", "L", "XL", "XXL"],
    images: ["https://images.unsplash.com/photo-1608748010899-18f300247112?auto=format&fit=crop&q=80&w=600"],
    videos: [],
    category: "Panjabi",
    catalog: "Festive Collection",
    inventory: 15,
    rating: 4.8,
    reviewCount: 14,
    featured: true
  },
  {
    id: "p2",
    title: "Minimalist Soft Linen Panjabi",
    description: "100% pure linen breathability in soft paste green. Clean silhouette with subtle pearl buttons. Elegant, comfortable and absolutely premium.",
    price: 2400,
    sizes: ["S", "M", "L", "XL"],
    images: ["https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&q=80&w=600"],
    videos: [],
    category: "Panjabi",
    catalog: "Summer Style '26",
    inventory: 8,
    rating: 4.6,
    reviewCount: 9,
    featured: true
  },
  {
    id: "p3",
    title: "Italian-cut Cotton Oxford Shirt",
    description: "Premium double-ply long-staple cotton tailoring with modern cutaway collar. Double buttons cuff and smooth clean finish.",
    price: 1850,
    sizes: ["M", "L", "XL"],
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600"],
    videos: [],
    category: "Shirts",
    catalog: "Summer Style '26",
    inventory: 12,
    rating: 4.5,
    reviewCount: 18,
    featured: true
  },
  {
    id: "p4",
    title: "Japanese Vintage Selvedge Jeans",
    description: "Deep indigo raw Japanese denim with selvedge trim details. Tailored mid-rise slim straight fit that develops custom whiskers with wear.",
    price: 2950,
    sizes: ["30", "32", "34", "36"],
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600"],
    videos: [],
    category: "Pants",
    catalog: "Summer Style '26",
    inventory: 10,
    rating: 4.7,
    reviewCount: 7
  },
  {
    id: "p5",
    title: "KHALAB Signature Heavyweight Hoodie",
    description: "420 GSM ultra-dense loopback French Terry fabric cotton. Dropped shoulders, seamless kangaroo pocket, and elegant embossed KHALAB insignia.",
    price: 3600,
    sizes: ["M", "L", "XL"],
    images: ["https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600"],
    videos: [],
    category: "Hoodies",
    catalog: "Festive Collection",
    inventory: 5,
    rating: 4.9,
    reviewCount: 16,
    featured: true
  }
];

const defaultCategories: Category[] = [
  { id: "c1", name: "Panjabi", description: "Traditional luxury festive apparel" },
  { id: "c2", name: "Shirts", description: "Premium formal and semi-formal wear" },
  { id: "c3", name: "Pants", description: "Superb chinos, denim, and trousers" },
  { id: "c4", name: "Hoodies", description: "Luxury street wear and outerwear" }
];

const defaultCatalogs: Catalog[] = [
  { id: "cat1", name: "Summer Style '26", subtitle: "Stay breezy and dapper in premium linen and cotton blends" },
  { id: "cat2", name: "Festive Collection", subtitle: "Pristine embroidered Panjabis and luxury outfits for celebrations" }
];

const defaultReviews: Review[] = [
  {
    id: "r1",
    productId: "p1",
    userName: "Arman Khan",
    rating: 5,
    comment: "The embroidery is top notch, fabric feels extremely premium. Perfect fit for Eid!",
    date: "2026-06-10"
  },
  {
    id: "r2",
    productId: "p1",
    userName: "Zahid Hasan",
    rating: 4,
    comment: "Very elegant, though I suggest ordering a size up if you like loose fit. Overall 10/10.",
    date: "2026-06-12"
  },
  {
    id: "r3",
    productId: "p3",
    userName: "Maherab Hossain",
    rating: 5,
    comment: "Excellent shirt structure! The double cuffs feel solid structure. Highly recommended.",
    date: "2026-06-14"
  }
];

// In-Memory Database State
let state = {
  config: defaultConfig,
  products: defaultProducts,
  categories: defaultCategories,
  catalogs: defaultCatalogs,
  reviews: defaultReviews,
  orders: [] as Order[],
  notifications: [
    {
      id: "n-welcome",
      title: "Welcome to KHALAB Store!",
      message: "Discover modern, premium clothing tailored with love. Enjoy free shipping on your first purchase!",
      date: new Date().toISOString().split('T')[0],
      type: "promo"
    }
  ] as PushNotification[]
};

// Sync state load/save
function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      state = { ...state, ...parsed };
      console.log("Database loaded successfully from file client.");
    } else {
      saveDB();
    }
  } catch (err) {
    console.error("Failed to load db.json, using memory:", err);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save db.json to disk:", err);
  }
}

// Initial DB Load
loadDB();

// Serves Static Uploads
app.use("/uploads", express.static(UPLOADS_DIR));

// --- API ROUTES ---

// 1. App configuration endpoints
app.get("/api/config", (req, res) => {
  res.json(state.config);
});

app.post("/api/config", (req, res) => {
  try {
    state.config = { ...state.config, ...req.body };
    saveDB();
    res.json({ success: true, config: state.config });
  } catch (err) {
    res.status(500).json({ error: "Failed to save configuration" });
  }
});

// 2. Catalogs & Categories
app.get(["/api/categories", "/api/category"], (req, res) => {
  res.json(state.categories);
});

app.post(["/api/categories", "/api/category"], (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Category name is required" });
    
    // Check duplication
    const exists = state.categories.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) return res.status(400).json({ error: "Category already exists" });

    const newCat: Category = {
      id: "c_" + Date.now(),
      name,
      description: description || ""
    };
    state.categories.push(newCat);
    saveDB();
    res.json({ success: true, category: newCat });
  } catch (err) {
    res.status(500).json({ error: "Failed to add category" });
  }
});

app.get(["/api/catalogs", "/api/catalog"], (req, res) => {
  res.json(state.catalogs);
});

app.post(["/api/catalogs", "/api/catalog"], (req, res) => {
  try {
    const { name, subtitle } = req.body;
    if (!name) return res.status(400).json({ error: "Catalog name is required" });

    const newCatalog: Catalog = {
      id: "cat_" + Date.now(),
      name,
      subtitle: subtitle || ""
    };
    state.catalogs.push(newCatalog);
    saveDB();
    res.json({ success: true, catalog: newCatalog });
  } catch (err) {
    res.status(500).json({ error: "Failed to add catalog" });
  }
});

// 3. Products Endpoints
app.get("/api/products", (req, res) => {
  const { category, catalog, search, recommendations, history } = req.query;
  let list = [...state.products];

  // Recommendations Logic
  if (recommendations && history) {
    try {
      const viewHistory = JSON.parse(history as string) as string[]; // product IDs viewed
      if (viewHistory && viewHistory.length > 0) {
        // Find categories of recently viewed products
        const viewedProducts = state.products.filter(p => viewHistory.includes(p.id));
        const categories = viewedProducts.map(p => p.category);
        
        // Return products in same categories, excluding already viewed items, or rank them
        let recommended = state.products.filter(p => categories.includes(p.category) && !viewHistory.includes(p.id));
        if (recommended.length === 0) {
          // Fallback to featured products or top rated products
          recommended = state.products.filter(p => p.featured || p.rating >= 4.7).slice(0, 4);
        }
        return res.json(recommended.slice(0, 4));
      } else {
        // No history, return featured products
        return res.json(state.products.filter(p => p.featured).slice(0, 4));
      }
    } catch {
      return res.json(state.products.slice(0, 4));
    }
  }

  if (category) {
    list = list.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (catalog) {
    list = list.filter(p => p.catalog.toLowerCase() === (catalog as string).toLowerCase());
  }

  if (search) {
    const term = (search as string).toLowerCase();
    list = list.filter(p => 
      p.title.toLowerCase().includes(term) || 
      p.description.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  }

  res.json(list);
});

// Create Product
app.post("/api/products", (req, res) => {
  try {
    const { title, description, price, sizes, images, videos, category, catalog, inventory } = req.body;
    if (!title || !price || !category || !catalog) {
      return res.status(400).json({ error: "Missing required fields (Title, Price, Category, Catalog required)" });
    }

    const newProd: Product = {
      id: "p_" + Date.now(),
      title,
      description: description || "",
      price: Number(price),
      sizes: Array.isArray(sizes) ? sizes : ["M", "L", "XL"],
      images: Array.isArray(images) ? images : [],
      videos: Array.isArray(videos) ? videos : [],
      category,
      catalog,
      inventory: Number(inventory) !== undefined ? Number(inventory) : 10,
      rating: 5.0,
      reviewCount: 0,
      featured: req.body.featured || false
    };

    state.products.push(newProd);
    saveDB();
    res.json({ success: true, product: newProd });
  } catch (err) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update Product
app.put("/api/products/:id", (req, res) => {
  try {
    const { id } = req.params;
    const index = state.products.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Product not found" });
    }

    const updated = {
      ...state.products[index],
      ...req.body,
      price: req.body.price !== undefined ? Number(req.body.price) : state.products[index].price,
      inventory: req.body.inventory !== undefined ? Number(req.body.inventory) : state.products[index].inventory,
    };

    state.products[index] = updated;
    saveDB();
    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete Product
app.delete("/api/products/:id", (req, res) => {
  try {
    const { id } = req.params;
    const initialLen = state.products.length;
    state.products = state.products.filter(p => p.id !== id);
    
    if (state.products.length === initialLen) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    saveDB();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// 4. File uploads from local base64
app.post("/api/upload", (req, res) => {
  try {
    const { filename, base64Data } = req.body;
    if (!filename || !base64Data) {
      return res.status(400).json({ error: "Filename and base64Data are required" });
    }

    // Strip header details (e.g. "data:image/png;base64,")
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid base64 data format" });
    }

    const fileBuffer = Buffer.from(matches[2], "base64");
    const safeFilename = Date.now() + "_" + filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filepath = path.join(UPLOADS_DIR, safeFilename);

    fs.writeFileSync(filepath, fileBuffer);
    
    // Return relative url path
    res.json({ url: `/uploads/${safeFilename}` });
  } catch (err) {
    console.error("Local upload error info:", err);
    res.status(500).json({ error: "Failed to upload file to local server storage." });
  }
});

// 5. Orders & Anti-Fraud Customers System
app.get("/api/orders", (req, res) => {
  res.json(state.orders);
});

// Order tracking
app.get("/api/orders/track/:id", (req, res) => {
  const order = state.orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});

// Create Order with detailed Anti-Fraud System
app.post("/api/orders", (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress, customerCity, items, totalAmount, discountAmount, promoApplied, paymentMethod } = req.body;

    if (!customerName || !customerPhone || !customerAddress || !customerCity || !items || !items.length) {
      return res.status(400).json({ error: "Missing checkout parameters" });
    }

    // Anti-Fraud Evaluation System
    let fraudRiskScore = 0;
    const fraudDetails: string[] = [];

    // Rule 1: Bangladesh phone number match
    const cleanPhone = customerPhone.trim().replace(/\s+/g, "");
    const isBDPhone = /^(\+?8801|01)[3-9]\d{8}$/.test(cleanPhone);
    if (!isBDPhone) {
      fraudRiskScore += 35;
      fraudDetails.push("Invalid Bangladesh Mobile number format. Must start with +8801 or 01 and contain 11 core digits.");
    }

    // Rule 2: Minimum address check (checks address length and Bangladesh location specificity details)
    if (customerAddress.length < 15) {
      fraudRiskScore += 25;
      fraudDetails.push("Extremely short shipping address provided. Higher possibility of inaccurate delivery.");
    }
    const keywordMatch = /dhaka|keraniganj|shuvadda|bangladesh|chittagong|sylhet|khulna|barisal|rajshahi|rangpur|mymensingh/i.test(customerAddress);
    if (!keywordMatch) {
      fraudRiskScore += 15;
      fraudDetails.push("Shipping address does not mention standard Bangladesh zones or city details.");
    }

    // Rule 3: Anti-bot / Spam detection (repeated consonant letters or rapid duplicates)
    const consecutiveConsonants = /[^aeiou\s\d\W]{6}/i.test(customerName + " " + customerAddress);
    if (consecutiveConsonants) {
      fraudRiskScore += 40;
      fraudDetails.push("Spam bot signature: Consecutive high density consonants in customer credentials.");
    }

    // Rule 4: Super-high amount warning
    if (Number(totalAmount) > 15000) {
      fraudRiskScore += 20;
      fraudDetails.push("Extremely high cart basket amount for a first-time order (> 15,000 BDT).");
    }

    // Rule 5: Rapid double-tap order detection within 2 mins from same phone
    const recentDuplicate = state.orders.find(o => o.customerPhone === customerPhone && (Date.now() - new Date(o.date).getTime() < 120000));
    if (recentDuplicate) {
      fraudRiskScore += 50;
      fraudDetails.push("Rapid consecutive orders from the same user phone pattern (Bot duplicate safeguard).");
    }

    const fraudAlert = fraudRiskScore >= 50;

    // Build the order list
    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    const newOrder: Order = {
      id: orderId,
      customerName,
      customerPhone,
      customerAddress,
      customerCity,
      items,
      totalAmount: Number(totalAmount),
      discountAmount: Number(discountAmount) || 0,
      promoApplied,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
      orderStatus: "Pending",
      date: new Date().toISOString(),
      fraudAlert,
      fraudDetails,
      fraudRiskScore
    };

    // Real-time Inventory Update
    items.forEach((item: any) => {
      const idx = state.products.findIndex(p => p.id === item.productId);
      if (idx !== -1) {
        state.products[idx].inventory = Math.max(0, state.products[idx].inventory - item.quantity);
      }
    });

    state.orders.push(newOrder);

    // Auto trigger Order placement Push Notification
    const nameTruncated = customerName.length > 15 ? customerName.substring(0, 15) + "..." : customerName;
    const newNotify: PushNotification = {
      id: "notify_" + Date.now(),
      title: "New Order Placed! 🎉",
      message: `Order ${orderId} received from ${nameTruncated}. Amount BDT ${totalAmount.toLocaleString()}.`,
      date: new Date().toISOString().split('T')[0],
      type: "order",
      orderId: orderId
    };

    state.notifications.unshift(newNotify);

    saveDB();
    res.json({ success: true, order: newOrder });
  } catch (err) {
    console.error("Order creation server side error:", err);
    res.status(500).json({ error: "Failed to place order." });
  }
});

// Update order status or fraud state
app.put("/api/orders/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, fraudAlert } = req.body;
    const index = state.orders.findIndex(o => o.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updated = {
      ...state.orders[index],
      orderStatus: orderStatus || state.orders[index].orderStatus,
      paymentStatus: paymentStatus || state.orders[index].paymentStatus,
      fraudAlert: fraudAlert !== undefined ? fraudAlert : state.orders[index].fraudAlert
    };

    state.orders[index] = updated;

    // Notification broadcast for shipping status update
    if (orderStatus) {
      const statusNotify: PushNotification = {
        id: "notify_status_" + Date.now(),
        title: `Order Status Check: ${orderStatus}`,
        message: `Your order ${id} has been marked as ${orderStatus}. Details tracked on dashboard.`,
        date: new Date().toISOString().split('T')[0],
        type: "order",
        orderId: id
      };
      state.notifications.unshift(statusNotify);
    }

    saveDB();
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

// Delete Order (Cancelled / Void)
app.delete("/api/orders/:id", (req, res) => {
  try {
    const { id } = req.params;
    state.orders = state.orders.filter(o => o.id !== id);
    saveDB();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete order" });
  }
});

// 6. Reviews Endpoints
app.get("/api/reviews", (req, res) => {
  const { productId } = req.query;
  if (productId) {
    return res.json(state.reviews.filter(r => r.productId === productId));
  }
  res.json(state.reviews);
});

app.post("/api/reviews", (req, res) => {
  try {
    const { productId, userName, rating, comment } = req.body;
    if (!productId || !userName || !rating || !comment) {
      return res.status(400).json({ error: "Missing rating attributes" });
    }

    const newReview: Review = {
      id: "r_" + Date.now(),
      productId,
      userName,
      rating: Number(rating),
      comment,
      date: new Date().toISOString().split('T')[0]
    };

    state.reviews.push(newReview);

    // Recalculate Product Score details
    const productIndex = state.products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      const prodReviews = state.reviews.filter(r => r.productId === productId);
      const totalRating = prodReviews.reduce((sum, r) => sum + r.rating, 0);
      state.products[productIndex].rating = Number((totalRating / prodReviews.length).toFixed(1));
      state.products[productIndex].reviewCount = prodReviews.length;
    }

    saveDB();
    res.json({ success: true, review: newReview });
  } catch (err) {
    res.status(500).json({ error: "Failed to post review" });
  }
});

// 7. Notifications Endpoints
app.get("/api/notifications", (req, res) => {
  res.json(state.notifications);
});

// Create alert notification (push center)
app.post("/api/notifications/push", (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: "Notification fields missing" });
    }

    const manualPush: PushNotification = {
      id: "notify_push_" + Date.now(),
      title,
      message,
      date: new Date().toISOString().split('T')[0],
      type: "promo"
    };

    state.notifications.unshift(manualPush);
    saveDB();
    res.json({ success: true, notification: manualPush });
  } catch (err) {
    res.status(500).json({ error: "Failed to broadcast notification" });
  }
});


// --- VITE & PRODUCTION MIDDLEWARES ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched successfully on http://localhost:${PORT}`);
  });
}

startServer();
