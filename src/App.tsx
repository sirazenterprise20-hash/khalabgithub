import React, { useState, useEffect } from "react";
import {
  Tag,
  Star,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Trash,
  CheckCircle,
  Clock,
  ExternalLink,
  Smartphone,
  Facebook,
  Search,
  Check,
  Bell,
  Sparkles,
  Layers,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Copy
} from "lucide-react";
import { Product, Category, Catalog, Order, AppConfig, PushNotification } from "./types";
import { apiFetch, getImgUrl } from "./api";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AdminDashboard from "./components/AdminDashboard";
import ProductCard from "./components/ProductCard";
import ProductDetail from "./components/ProductDetail";
import Checkout from "./components/Checkout";
import OrderTracking from "./components/OrderTracking";
import UserProfile from "./components/UserProfile";
import { auth } from "./firebase";

export default function App() {
  // Global configuration
  const [config, setConfig] = useState<AppConfig>({
    brandName: "KHALAB",
    tagline: "Make your self premium.",
    address: "Shuvadda, South Keraniganj, Dhaka, Bangladesh.",
    mobile: "+880171941040",
    whatsapp: "+880171941040",
    instagram: "https://instagram.com/khalabfashion",
    facebook: "https://www.facebook.com/khalabfashion",
    logoUrl: "",
    banners: [],
    promos: [],
    themeMode: "slate",
    customPrimary: "#1e293b",
    customSecondary: "#475569"
  });

  // Main collections
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);

  // Navigation state routes
  const [activeTab, setActiveTab] = useState<"home" | "shop" | "product-detail" | "cart" | "checkout" | "tracking" | "admin" | "account">("home");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [selectedCatalogFilter, setSelectedCatalogFilter] = useState("All");
  const [trackingOrderIdArg, setTrackingOrderIdArg] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Cart Local Basket State
  const [basket, setBasket] = useState<{ productId: string; title: string; quantity: number; price: number; size: string; image: string }[]>([]);

  // Active Hero banner index (local state scroll)
  const [currBannerIndex, setCurrBannerIndex] = useState(0);

  // Completed successful Checkout order receipt data reference
  const [latestReceiptOrder, setLatestReceiptOrder] = useState<Order | null>(null);

  // Real-time Inventory counter flag trigger
  const [inventorySyncCounter, setInventorySyncCounter] = useState(0);

  // Subscribe to Firebase auth state globally
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch initial collections
  const loadSystemData = () => {
    // Configuration
    apiFetch("/api/config")
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.error("Config fetch detail failure:", err));

    // Products
    apiFetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Products fetch failure:", err));

    // Categories
    apiFetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Categories fetch failure:", err));

    // Catalogs
    apiFetch("/api/catalogs")
      .then((res) => res.json())
      .then((data) => setCatalogs(data))
      .catch((err) => console.error("Catalogs fetch failure:", err));

    // Orders
    apiFetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch((err) => console.error("Orders fetch failure:", err));

    // Notifications
    apiFetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch((err) => console.error("Notifications fetch detail failure:", err));
  };

  useEffect(() => {
    loadSystemData();
  }, [inventorySyncCounter]);

  // CSS custom variable Injection based on Loaded Theme Config
  useEffect(() => {
    const themeColors = {
      slate: { primary: "#1e293b", primaryHover: "#0f172a", secondary: "#475569", accent: "#cbd5e1" },
      crimson: { primary: "#881337", primaryHover: "#9f1239", secondary: "#be123c", accent: "#fecdd3" },
      emerald: { primary: "#047857", primaryHover: "#065f46", secondary: "#064e40", accent: "#d1fae5" },
      amber: { primary: "#aa5b00", primaryHover: "#92400e", secondary: "#b45309", accent: "#fef3c7" },
      violet: { primary: "#4c1d95", primaryHover: "#5b21b6", secondary: "#6d28d9", accent: "#ede9fe" },
      custom: {
        primary: config.customPrimary || "#1e293b",
        primaryHover: config.customSecondary || "#0f172a",
        secondary: config.customSecondary || "#475569",
        accent: "#f1f5f9"
      }
    };

    const activeTheme = themeColors[config.themeMode] || themeColors.slate;
    const styleTagId = "khalab-dynamic-theme";
    
    let el = document.getElementById(styleTagId);
    if (!el) {
      el = document.createElement("style");
      el.id = styleTagId;
      document.head.appendChild(el);
    }
    el.innerHTML = `
      :root {
        --primary: ${activeTheme.primary};
        --primary-hover: ${activeTheme.primaryHover};
        --secondary: ${activeTheme.secondary};
        --accent: ${activeTheme.accent};
      }
    `;
  }, [config.themeMode, config.customPrimary, config.customSecondary]);

  // Load custom header banner indexes loop
  useEffect(() => {
    if (config.banners && config.banners.length > 1) {
      const timer = setInterval(() => {
        setCurrBannerIndex((prev) => (prev + 1) % config.banners.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [config.banners]);

  // Main navigation action
  const handleNavigate = (tab: string, argument?: string) => {
    if (tab === "product-detail" && argument) {
      setSelectedProductId(argument);
      setActiveTab("product-detail");
      window.scrollTo(0, 0);
    } else if (tab === "tracking") {
      setTrackingOrderIdArg(argument || "");
      setActiveTab("tracking");
      window.scrollTo(0, 0);
    } else {
      setActiveTab(tab as any);
      window.scrollTo(0, 0);
    }
  };

  // Cart operations
  const handleAddToCart = (prod: Product, q: number, size: string) => {
    const existing = basket.find((i) => i.productId === prod.id && i.size === size);
    if (existing) {
      setBasket(
        basket.map((i) =>
          i.productId === prod.id && i.size === size
            ? { ...i, quantity: Math.min(prod.inventory, i.quantity + q) }
            : i
        )
      );
    } else {
      setBasket([
        ...basket,
        {
          productId: prod.id,
          title: prod.title,
          quantity: q,
          price: prod.price,
          size,
          image: prod.images[0] || ""
        }
      ]);
    }
  };

  const handleRemoveFromBasket = (productId: string, size: string) => {
    setBasket(basket.filter((i) => !(i.productId === productId && i.size === size)));
  };

  const handleUpdateCartQuantity = (productId: string, size: string, q: number) => {
    setBasket(
      basket.map((item) => {
        if (item.productId === productId && item.size === size) {
          const productRef = products.find((p) => p.id === productId);
          const maxLimit = productRef ? productRef.inventory : 10;
          return { ...item, quantity: Math.max(1, Math.min(maxLimit, q)) };
        }
        return item;
      })
    );
  };

  // Config modifier
  const handleConfigUpdate = async (updatedConfig: AppConfig) => {
    try {
      const res = await apiFetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig)
      });
      if (res.ok) {
        setConfig(updatedConfig);
        loadSystemData();
      }
    } catch (err) {
      alert("Failed core branding sync");
    }
  };

  // Completed order callback: resets bag, stores receipt
  const handleOrderPlacementComplete = (lodgedOrder: Order) => {
    setBasket([]);
    setLatestReceiptOrder(lodgedOrder);
    setInventorySyncCounter((prev) => prev + 1); // Trigger inventory updates
  };

  // Products filters query
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory =
      selectedCategoryFilter === "All" ||
      p.category.toLowerCase() === selectedCategoryFilter.toLowerCase();

    const matchCatalog =
      selectedCatalogFilter === "All" ||
      p.catalog.toLowerCase() === selectedCatalogFilter.toLowerCase();

    return matchSearch && matchCategory && matchCatalog;
  });

  const cartItemsCount = basket.reduce((sum, item) => sum + item.quantity, 0);
  const cartPriceTotal = basket.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between" id="khalab-applet-root">
      
      {/* Dynamic Style layout Header block */}
      <Header
        config={config}
        cartCount={cartItemsCount}
        notifications={notifications}
        onNavigate={handleNavigate}
        onSearch={(q) => {
          setSearchQuery(q);
          setSelectedCategoryFilter("All");
          setSelectedCatalogFilter("All");
        }}
        searchQuery={searchQuery}
        currentUser={currentUser}
      />

      {/* Primary Routing view switcher stage */}
      <main className="flex-1">

        {/* 1. ROUTE: Storefront HOME Landing View */}
        {activeTab === "home" && (
          <div className="space-y-12 pb-14 animate-fadeIn">
            
            {/* Sliding Hero Banner */}
            {config.banners && config.banners.length > 0 ? (
              <div className="relative w-full aspect-21/9 sm:aspect-16/6 bg-gray-900 border-b overflow-hidden shadow-xs">
                <img
                  src={getImgUrl(config.banners[currBannerIndex].imageUrl)}
                  alt={config.banners[currBannerIndex].title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-85 transition-all duration-700"
                />
                
                {/* Foreground Banner Details Card */}
                <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/40 to-transparent flex items-center">
                  <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md space-y-3 sm:space-y-4">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-[var(--primary)] uppercase bg-white/10 backdrop-blur-xs py-1 px-3.5 rounded-sm inline-block">
                        LIMITED LAUNCH CAMPAIGN
                      </span>
                      <h1 className="text-xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none dropdown-shadow">
                        {config.banners[currBannerIndex].title}
                      </h1>
                      <p className="text-xs sm:text-sm text-neutral-250 leading-relaxed font-light">
                        {config.banners[currBannerIndex].subtitle}
                      </p>
                      <button
                        onClick={() => {
                          const link = config.banners[currBannerIndex].link;
                          if (link && link.startsWith("#category/")) {
                            setSelectedCategoryFilter(link.replace("#category/", ""));
                          }
                          handleNavigate("shop");
                        }}
                        className="py-2.5 px-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        Browse Collection <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Left/Right controls indicators */}
                {config.banners.length > 1 && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    {config.banners.map((_, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={() => setCurrBannerIndex(bIdx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                          bIdx === currBannerIndex ? "bg-[var(--primary)] w-6" : "bg-white/40 hover:bg-white"
                        }`}
                      ></button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* High-end minimalist default banner if empty */
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="bg-linear-to-r from-gray-900 to-gray-850 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col justify-between relative overflow-hidden">
                  <div className="max-w-lg space-y-4 relative z-10">
                    <span className="text-[10px] font-mono tracking-widest text-[var(--primary)] uppercase font-bold">KHALAB TRADITIONS</span>
                    <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-none">PREMIUM CORD & CHINOS APPAREL</h2>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                      Custom stitched linen fabrics tailored natively in Keraniganj, Dhaka. Upgrade with premium styling now.
                    </p>
                    <button
                      onClick={() => handleNavigate("shop")}
                      className="py-2.5 px-5 bg-[var(--primary)] text-white text-xs font-bold uppercase rounded-lg hover:opacity-90"
                    >
                      Enter Shop Catalog
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Catalog Collection filters tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center md:text-left mb-6">
                <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--primary)] bg-[var(--primary)]/10 py-1 px-3 rounded-full uppercase">
                  SUMMER & FESTIVE EDITIONS
                </span>
                <h3 className="text-2xl font-black text-gray-950 mt-1.5 tracking-tight uppercase">Featured Collections</h3>
              </div>

              {/* Bento styled catalog collections list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {catalogs.slice(0, 2).map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCatalogFilter(cat.name);
                      setSelectedCategoryFilter("All");
                      handleNavigate("shop");
                    }}
                    className="group bg-white p-6 sm:p-8 border border-gray-150 rounded-2xl cursor-pointer hover:shadow-lg transition-all relative overflow-hidden flex flex-col justify-between h-44"
                  >
                    <div className="space-y-1 relative z-10">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-gray-400 uppercase">Interactive Catalog</span>
                      <h4 className="text-lg font-black text-gray-950 uppercase group-hover:text-[var(--primary)] transition-colors">
                        {cat.name}
                      </h4>
                      <p className="text-xs text-gray-450 leading-relaxed max-w-sm">
                        {cat.subtitle}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold text-[var(--primary)] group-hover:underline flex items-center gap-1">
                      Explore Series →
                    </span>
                    <div className="absolute right-4 bottom-4 text-5xl opacity-10 font-black tracking-tighter uppercase select-none font-sans">
                      KHALAB
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Featured Products Showcase */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-6 text-center md:text-left">
                <div>
                  <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--primary)] bg-[var(--primary)]/10 py-1 px-3 rounded-full uppercase">
                    SHOWCASING APPAREL
                  </span>
                  <h3 className="text-2xl font-black text-gray-950 mt-1.5 tracking-tight uppercase">Featured Arrivals</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategoryFilter("All");
                    setSelectedCatalogFilter("All");
                    handleNavigate("shop");
                  }}
                  className="text-xs font-bold text-[var(--primary)] hover:underline"
                >
                  View full catalog ({products.length} styles)
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {products.length === 0 ? (
                  <div className="col-span-full p-12 text-center text-xs text-secondary italic">
                    Loading dapper collections...
                  </div>
                ) : (
                  products.slice(0, 4).map((item) => (
                    <ProductCard
                      key={item.id}
                      product={item}
                      onViewDetails={(id) => handleNavigate("product-detail", id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Newsletter Promotional Offer Code Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="p-6 sm:p-10 bg-linear-to-br from-gray-900 via-gray-950 to-black rounded-2xl sm:rounded-3xl border border-gray-850 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl text-center md:text-left">
                <div className="space-y-2 max-w-md">
                  <span className="text-[9px] font-mono tracking-widest text-[var(--primary)] uppercase font-bold">LIMITED PROMOS</span>
                  <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">GET 20% DISCOUNT IMMEDIATELY</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-light">
                    KHALAB operates secure coupon checkouts. Use the verification voucher code printed below for 20% off BDT checkout.
                  </p>
                </div>
                
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 min-w-xs shrink-0 text-center">
                  <span className="text-[10px] text-gray-450 uppercase block font-mono font-semibold">COUPON VOUCHER CODE</span>
                  <div className="p-2 border border-dashed border-[var(--primary)]/50 bg-[var(--primary)]/10 rounded-sm">
                    <span className="font-mono font-black text-sm text-[var(--primary)] tracking-widest">PREMIUM20</span>
                  </div>
                  <span className="text-[10px] text-white/55 block">Apply on basket checkouts securely.</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 2. ROUTE: SHOP Catalog Apparel Filter List */}
        {activeTab === "shop" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn space-y-8">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
              <div>
                <h2 className="text-2xl font-black text-gray-950 tracking-tight uppercase">Apparel Style Registry</h2>
                <p className="text-xs text-gray-550">
                  Showing {filteredProducts.length} premium styled outfits in South Keraniganj, Dhaka.
                </p>
              </div>

              {/* Catalog Collection select filters options */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="self-center font-bold text-gray-500 mr-1.5 hidden md:inline">Filters:</span>
                
                <select
                  value={selectedCatalogFilter}
                  onChange={(e) => setSelectedCatalogFilter(e.target.value)}
                  className="p-2 border rounded-lg bg-white font-medium"
                >
                  <option value="All">All Catalogs</option>
                  {catalogs.map(cl => (
                    <option key={cl.id} value={cl.name}>{cl.name}</option>
                  ))}
                </select>

                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="p-2 border rounded-lg bg-white font-medium"
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                {(selectedCategoryFilter !== "All" || selectedCatalogFilter !== "All" || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategoryFilter("All");
                      setSelectedCatalogFilter("All");
                      setSearchQuery("");
                    }}
                    className="p-2 text-red-500 text-xs font-bold hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Active grid container */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full py-16 text-center text-gray-450 italic space-y-2">
                  <p className="text-sm">No dapper collection matched your active filtered parameters.</p>
                  <button
                    onClick={() => {
                      setSelectedCategoryFilter("All");
                      setSelectedCatalogFilter("All");
                      setSearchQuery("");
                    }}
                    className="text-xs text-[var(--primary)] font-bold underline"
                  >
                    Clear Filter Locks
                  </button>
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onViewDetails={(id) => handleNavigate("product-detail", id)}
                  />
                ))
              )}
            </div>

          </div>
        )}

        {/* 3. ROUTE: Detailed apparel design catalog screen */}
        {activeTab === "product-detail" && (
          <ProductDetail
            product={products.find(p => p.id === selectedProductId) || products[0]}
            onBack={() => handleNavigate("shop")}
            onAddToCart={handleAddToCart}
            onViewProduct={(id) => handleNavigate("product-detail", id)}
          />
        )}

        {/* 4. ROUTE: Cart Basket checkup bag */}
        {activeTab === "cart" && (
          <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn" id="shopping-bag-view">
            <div className="border-b pb-4 mb-6">
              <h2 className="text-2xl font-black text-gray-950 tracking-tight uppercase flex items-center gap-2">
                Shopping Bag Check
                <span className="text-xs bg-gray-150 text-gray-600 px-2.5 py-1 rounded-full font-mono">
                  {cartItemsCount} Items Allocating
                </span>
              </h2>
            </div>

            {basket.length === 0 ? (
              <div className="text-center py-16 space-y-4 bg-white border border-gray-150 rounded-2xl p-6">
                <span className="text-5xl">🛍</span>
                <h4 className="text-sm font-bold text-gray-600">Your shopping cart basket is currently clean.</h4>
                <p className="text-xs text-gray-400">Discover premium stitched fabrics across the storefront.</p>
                <button
                  onClick={() => handleNavigate("shop")}
                  className="py-2.5 px-6 bg-[var(--primary)] text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Start Premium Shopping
                </button>
              </div>
            ) : (
              /* Cart list detail */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* List items block */}
                <div className="lg:col-span-8 space-y-3">
                  {basket.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white border border-gray-150 rounded-xl flex items-center justify-between gap-4 shadow-3xs"
                    >
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-12 h-16 object-cover rounded-md bg-gray-100"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-gray-50 border rounded-md"></div>
                        )}
                        <div>
                          <span className="font-bold text-gray-950 text-xs sm:text-sm block">{item.title}</span>
                          <span className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-wider block mt-0.5">
                            Size: {item.size}
                          </span>
                          <span className="text-[11px] font-bold text-gray-905 block mt-1 font-mono">
                            ৳{item.price.toLocaleString()} BDT
                          </span>
                        </div>
                      </div>

                      {/* Controls parameters */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50">
                          <button
                            onClick={() => handleUpdateCartQuantity(item.productId, item.size, item.quantity - 1)}
                            className="py-1 px-2.5 hover:bg-gray-200 font-bold"
                          >
                            -
                          </button>
                          <span className="px-3 font-mono text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQuantity(item.productId, item.size, item.quantity + 1)}
                            className="py-1 px-2.5 hover:bg-gray-200 font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveFromBasket(item.productId, item.size)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 cursor-pointer"
                        >
                          <Trash className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Aggregate sidebar */}
                <div className="lg:col-span-4 bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4 h-fit">
                  <h5 className="font-bold text-xs uppercase font-mono tracking-wider text-gray-500 pb-2 border-b">
                    Bag Aggregate
                  </h5>

                  <div className="space-y-2 text-xs text-secondary">
                    <div className="flex justify-between">
                      <span>Total items allocation:</span>
                      <span className="font-bold font-mono text-gray-950">{cartItemsCount} Units</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery (Bangladesh):</span>
                      <span className="font-bold font-mono text-emerald-650">FREE ARRIVAL</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-bold text-gray-950">
                      <span>Bag Net Total:</span>
                      <span className="font-mono text-[var(--primary)] text-base">
                        ৳{cartPriceTotal.toLocaleString()} BDT
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleNavigate("checkout")}
                    className="w-full py-3 bg-[var(--primary)] text-white text-xs font-bold uppercase rounded-lg hover:opacity-95 transition-all text-center block cursor-pointer shadow-md"
                  >
                    Proceed To Secured Checkout
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

        {/* 5. ROUTE: CHECKOUT card billing stage */}
        {activeTab === "checkout" && (
          <Checkout
            basket={basket}
            totalPrice={cartPriceTotal}
            promos={config.promos}
            onOrderComplete={(lodgedOrder) => {
              handleOrderPlacementComplete(lodgedOrder);
              setActiveTab("tracking");
            }}
            onCancel={() => handleNavigate("cart")}
          />
        )}

        {/* 6. ROUTE: TRACKING order query screen */}
        {activeTab === "tracking" && (
          <div className="space-y-4">
            
            {/* Display physical layout receipt if order placed recently */}
            {latestReceiptOrder && (
              <div className="max-w-2xl mx-auto mt-8 bg-emerald-50/20 border-2 border-dashed border-emerald-300 p-6 sm:p-8 rounded-2xl text-center space-y-4 font-sans animate-scaleUp">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold shadow-md">
                  ✓
                </div>
                <h3 className="text-xl font-extrabold text-emerald-805 uppercase tracking-tight">
                  ORDER PLACED SUCCESSFULLY! 🎉
                </h3>
                <p className="text-xs text-gray-655 max-w-md mx-auto leading-relaxed">
                  Congratulations <b>{latestReceiptOrder.customerName}</b>, your order has been securely validated and dispatched to packing queues in Dhaka division.
                </p>

                <div className="bg-white p-4 rounded-xl border max-w-sm mx-auto text-xs text-left space-y-3 shadow-3xs">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-gray-400 font-bold block text-center">
                    OFFICIAL SECURITY RECEIPT
                  </span>
                  
                  <div className="flex justify-between font-mono">
                    <span className="text-gray-500">Tracking Code ID:</span>
                    <span className="font-extrabold text-[var(--primary)] flex items-center gap-1">
                      {latestReceiptOrder.id}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(latestReceiptOrder.id);
                          alert("Tracking Code ID copied to local system clipboard!");
                        }}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500"
                        title="Copy code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>

                  <div className="border-t border-dashed pt-2 space-y-1 text-gray-600">
                    <p><b>Pay Channel:</b> {latestReceiptOrder.paymentMethod} ({latestReceiptOrder.paymentStatus})</p>
                    <p><b>Mobile Phone Coordinate:</b> {latestReceiptOrder.customerPhone}</p>
                    <p><b>Delivery coordinate:</b> {latestReceiptOrder.customerAddress}</p>
                    <p className="pt-2 border-t font-semibold text-gray-900 flex justify-between">
                      <span>Grand Total Amount BDT:</span>
                      <span className="text-[var(--primary)] font-mono font-extrabold">৳{latestReceiptOrder.totalAmount.toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 italic">
                  Take a moment to copy yourORD-XXXXXX sequence code. Use the tracking station bellows to follow dispatch metrics.
                </p>
              </div>
            )}

            {/* Core tracking form component */}
            <OrderTracking
              config={config}
              defaultOrderId={trackingOrderIdArg || latestReceiptOrder?.id || ""}
              onBack={() => {
                setLatestReceiptOrder(null);
                handleNavigate("shop");
              }}
            />

          </div>
        )}

        {/* 7. ROUTE: ADMIN Control center */}
        {activeTab === "admin" && (
          <AdminDashboard
            config={config}
            products={products}
            categories={categories}
            catalogs={catalogs}
            orders={orders}
            onConfigChange={handleConfigUpdate}
            onRefreshData={loadSystemData}
          />
        )}

        {/* 8. ROUTE: USER PROFILE Portal */}
        {activeTab === "account" && (
          <UserProfile
            onBack={() => handleNavigate("home")}
            onNavigate={handleNavigate}
          />
        )}

      </main>

      {/* Styled Brand Footer */}
      <Footer config={config} onNavigate={handleNavigate} />

    </div>
  );
}
