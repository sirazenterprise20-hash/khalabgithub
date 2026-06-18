import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Layers,
  ShoppingBag,
  Plus,
  Trash,
  Settings,
  Megaphone,
  CheckCircle,
  AlertTriangle,
  Upload,
  ChevronRight,
  TrendingUp,
  Tag,
  Palette,
  Eye,
  Info,
  Lock,
  Shield,
  Key,
  Globe
} from "lucide-react";
import { Product, Category, Catalog, Order, AppConfig, Promo, Banner } from "../types";
import { apiFetch } from "../api";

interface AdminDashboardProps {
  config: AppConfig;
  products: Product[];
  categories: Category[];
  catalogs: Catalog[];
  orders: Order[];
  onConfigChange: (updatedConfig: AppConfig) => void;
  onRefreshData: () => void;
}

export default function AdminDashboard({
  config,
  products,
  categories,
  catalogs,
  orders,
  onConfigChange,
  onRefreshData
}: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"products" | "categories" | "orders" | "design" | "push">("products");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Cloud Sync Server configuration state
  const [apiBaseInput, setApiBaseInput] = useState(() => {
    return localStorage.getItem("khalab_api_base") || "https://ais-pre-mlblprmea5x27qr4ihex5e-983253631521.asia-southeast1.run.app";
  });

  // Secure Admin Login State
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(() => {
    return sessionStorage.getItem("isAdminAuthorized") === "true";
  });
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError("");
    setIsVerifyingAdmin(true);

    // Dynamic validation with slight simulated ledger check delay
    setTimeout(() => {
      if (adminUsername.trim() === "khalab@123" && adminPasswordInput === "48282@Khalab") {
        setIsAdminAuthorized(true);
        sessionStorage.setItem("isAdminAuthorized", "true");
        setAdminLoginError("");
      } else {
        setAdminLoginError("Access credentials invalid. Authorization rejected.");
      }
      setIsVerifyingAdmin(false);
    }, 700);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthorized(false);
    sessionStorage.removeItem("isAdminAuthorized");
    // Clear inputs
    setAdminUsername("");
    setAdminPasswordInput("");
    setAdminLoginError("");
  };

  // Product Manager State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Product Form Attributes
  const [prodTitle, setProdTitle] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState(0);
  const [prodSizes, setProdSizes] = useState<string[]>(["M", "L", "XL"]);
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodVideos, setProdVideos] = useState<string[]>([]);
  const [prodCategory, setProdCategory] = useState("");
  const [prodCatalog, setProdCatalog] = useState("");
  const [prodInventory, setProdInventory] = useState(10);
  const [prodFeatured, setProdFeatured] = useState(false);

  // Upload/Progress State
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Categories/Catalog Custom Adds
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatalogName, setNewCatalogName] = useState("");
  const [newCatalogSubtitle, setNewCatalogSubtitle] = useState("");

  // Push Broadcast Form
  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushSuccess, setPushSuccess] = useState(false);

  // New Promo form
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoType, setPromoType] = useState<"percentage" | "fixed">("fixed");
  const [promoDesc, setPromoDesc] = useState("");

  // Brand Info Config Form States
  const [cfgBrand, setCfgBrand] = useState(config.brandName || "");
  const [cfgTagline, setCfgTagline] = useState(config.tagline || "");
  const [cfgAddress, setCfgAddress] = useState(config.address || "");
  const [cfgMobile, setCfgMobile] = useState(config.mobile || "");
  const [cfgWhatsapp, setCfgWhatsapp] = useState(config.whatsapp || "");
  const [cfgInstagram, setCfgInstagram] = useState(config.instagram || "");
  const [cfgFacebook, setCfgFacebook] = useState(config.facebook || "");
  const [cfgLogo, setCfgLogo] = useState(config.logoUrl || "");
  const [selectedTheme, setSelectedTheme] = useState<"crimson" | "emerald" | "amber" | "slate" | "violet" | "custom">(config.themeMode || "slate");
  const [customPrimary, setCustomPrimary] = useState(config.customPrimary || "");
  const [customSecondary, setCustomSecondary] = useState(config.customSecondary || "");
  const [cfgBanners, setCfgBanners] = useState<Banner[]>(config.banners || []);

  // Update Config when prop shifts
  useEffect(() => {
    setCfgBrand(config.brandName || "");
    setCfgTagline(config.tagline || "");
    setCfgAddress(config.address || "");
    setCfgMobile(config.mobile || "");
    setCfgWhatsapp(config.whatsapp || "");
    setCfgInstagram(config.instagram || "");
    setCfgFacebook(config.facebook || "");
    setCfgLogo(config.logoUrl || "");
    setSelectedTheme(config.themeMode || "slate");
    setCustomPrimary(config.customPrimary || "");
    setCustomSecondary(config.customSecondary || "");
    setCfgBanners(config.banners || []);
  }, [config]);

  // Sync Categories & Catalog selects on adding/rendering
  useEffect(() => {
    if (categories.length > 0 && !prodCategory) {
      setProdCategory(categories[0].name);
    }
    if (catalogs.length > 0 && !prodCatalog) {
      setProdCatalog(catalogs[0].name);
    }
  }, [categories, catalogs]);

  // Handle local system image/video base64 upload
  const handleLocalUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(true);
    setUploadError("");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        // Post base64 payload to local server
        const response = await apiFetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            base64Data
          })
        });

        const data = await response.json();
        if (response.ok && data.url) {
          if (fileType === "image") {
            setProdImages([data.url]); // KHALAB uses single product image main or push path
          } else {
            setProdVideos([data.url]);
          }
          setUploadProgress(false);
        } else {
          throw new Error(data.error || "Upload action failed");
        }
      };

      reader.onerror = () => {
        throw new Error("Reader read failure");
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadProgress(false);
      setUploadError(err.message || "Failed uploading system file locally");
    }
  };

  // Upload custom config Logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const response = await apiFetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            base64Data
          })
        });
        const data = await response.json();
        if (response.ok && data.url) {
          setCfgLogo(data.url);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      alert("Failed to upload brand logo.");
    }
  };

  // Upload custom photo for individual banner slide
  const handleBannerPhotoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const response = await apiFetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            base64Data
          })
        });
        const data = await response.json();
        if (response.ok && data.url) {
          const updatedBanners = [...cfgBanners];
          updatedBanners[index] = {
            ...updatedBanners[index],
            imageUrl: data.url
          };
          setCfgBanners(updatedBanners);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      alert("Failed to upload banner slide photo.");
    }
  };

  // Add new blank banner slide
  const handleAddBannerSlide = () => {
    const newSlide: Banner = {
      id: `b_${Date.now()}`,
      imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200",
      title: "NEW CAMPAIGN ARRIVAL",
      subtitle: "Discover our newly curated collection now",
      link: "#shop"
    };
    setCfgBanners([...cfgBanners, newSlide]);
  };

  // Remove individual banner slide
  const handleRemoveBannerSlide = (indexToKill: number) => {
    if (cfgBanners.length <= 1) {
      alert("At least one hero banner slide is required.");
      return;
    }
    const updated = cfgBanners.filter((_, idx) => idx !== indexToKill);
    setCfgBanners(updated);
  };

  // Update specific banner text property
  const handleUpdateBannerProperty = (index: number, key: keyof Banner, value: string) => {
    const updated = [...cfgBanners];
    updated[index] = {
      ...updated[index],
      [key]: value
    } as any;
    setCfgBanners(updated);
  };

  // Switch edited elements
  const handleEditProductClick = (item: Product) => {
    setEditingProduct(item);
    setProdTitle(item.title);
    setProdDesc(item.description);
    setProdPrice(item.price);
    setProdSizes(item.sizes);
    setProdImages(item.images);
    setProdVideos(item.videos);
    setProdCategory(item.category);
    setProdCatalog(item.catalog);
    setProdInventory(item.inventory);
    setProdFeatured(item.featured || false);
    setIsAddingProduct(true);
  };

  const handleAddNewProductClick = () => {
    setEditingProduct(null);
    setProdTitle("");
    setProdDesc("");
    setProdPrice(1500);
    setProdSizes(["M", "L", "XL"]);
    setProdImages([]);
    setProdVideos([]);
    setProdCategory(categories[0]?.name || "Traditional");
    setProdCatalog(catalogs[0]?.name || "");
    setProdInventory(10);
    setProdFeatured(false);
    setIsAddingProduct(true);
  };

  // Submit product creation/update
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle || prodPrice <= 0 || !prodCategory || !prodCatalog) {
      alert("Please provide Title, Price, Category, and Catalog Collection.");
      return;
    }

    const payload = {
      title: prodTitle,
      description: prodDesc,
      price: prodPrice,
      sizes: prodSizes,
      images: prodImages,
      videos: prodVideos,
      category: prodCategory,
      catalog: prodCatalog,
      inventory: prodInventory,
      featured: prodFeatured
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsAddingProduct(false);
        setEditingProduct(null);
        onRefreshData();
      } else {
        let errorMsg = "Save error encountered";
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          errorMsg = `Save error encountered (Status: ${res.status})`;
        }
        alert(errorMsg);
      }
    } catch (err: any) {
      alert(`Could not process product sync: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 4000); // Auto reset safety after 4s
      return;
    }

    try {
      const res = await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirmId(null);
        onRefreshData();
      }
    } catch (err: any) {
      alert(`Network deletion failure: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Add category & Catalog collections
  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const catNameStr = newCatName.trim();
    const catDescStr = newCatDesc.trim();
    if (!catNameStr) {
      alert("Category name cannot be empty.");
      return;
    }
    try {
      console.log(`[Category Create] Sending to API: Name=${catNameStr}, Description=${catDescStr}`);
      const res = await apiFetch("/api/categories", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ name: catNameStr, description: catDescStr })
      });
      if (res.ok) {
        setNewCatName("");
        setNewCatDesc("");
        onRefreshData();
      } else {
        let errorMsg = "Error adding category";
        try {
          const d = await res.json();
          errorMsg = d.error || errorMsg;
        } catch {
          errorMsg = `Error adding category (Status: ${res.status})`;
        }
        alert(errorMsg);
      }
    } catch (err: any) {
      alert(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleAddCatalogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameStr = newCatalogName.trim();
    const subtitleStr = newCatalogSubtitle.trim();
    if (!nameStr) {
      alert("Catalog title cannot be empty.");
      return;
    }
    try {
      console.log(`[Catalog Create] Sending to API: Name=${nameStr}, Subtitle=${subtitleStr}`);
      const res = await apiFetch("/api/catalogs", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ name: nameStr, subtitle: subtitleStr })
      });
      if (res.ok) {
        setNewCatalogName("");
        setNewCatalogSubtitle("");
        onRefreshData();
      } else {
        let errorMsg = "Error adding catalog Collection";
        try {
          const d = await res.json();
          errorMsg = d.error || errorMsg;
        } catch {
          errorMsg = `Error adding catalog (Status: ${res.status})`;
        }
        alert(errorMsg);
      }
    } catch (err: any) {
      alert(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Submit Brand configurations
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppConfig = {
      brandName: cfgBrand,
      tagline: cfgTagline,
      address: cfgAddress,
      mobile: cfgMobile,
      whatsapp: cfgWhatsapp,
      instagram: cfgInstagram,
      facebook: cfgFacebook,
      logoUrl: cfgLogo,
      banners: cfgBanners,
      promos: config.promos,
      themeMode: selectedTheme,
      customPrimary: selectedTheme === "custom" ? customPrimary : config.customPrimary,
      customSecondary: selectedTheme === "custom" ? customSecondary : config.customSecondary
    };

    onConfigChange(updated);
    alert("Configuration & Professional style saved successfully!");
  };

  // Handle order delivery status
  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await apiFetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: status })
      });
      if (res.ok) {
        onRefreshData();
      }
    } catch {
      alert("Status update failure");
    }
  };

  const handleToggleOrderFraud = async (id: string, currentAlert: boolean) => {
    try {
      const res = await apiFetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fraudAlert: !currentAlert })
      });
      if (res.ok) {
        onRefreshData();
      }
    } catch {
      alert("Status update failure");
    }
  };

  // Handle promo addition
  const handleAddPromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode || promoDiscount <= 0) return;

    const newPromo: Promo = {
      code: promoCode.toUpperCase().trim(),
      discount: Number(promoDiscount),
      type: promoType,
      description: promoDesc || `Save BDT ${promoDiscount}`,
      active: true
    };

    const updatedConf = {
      ...config,
      promos: [...config.promos, newPromo]
    };

    onConfigChange(updatedConf);
    setPromoCode("");
    setPromoDiscount(0);
    setPromoDesc("");
    alert("Promo Campaign saved successfully!");
  };

  const handleDeletePromo = (code: string) => {
    const updatedConf = {
      ...config,
      promos: config.promos.filter(p => p.code !== code)
    };
    onConfigChange(updatedConf);
  };

  // Push broadcast logic
  const handlePushSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle || !pushMessage) return;

    try {
      const res = await apiFetch("/api/notifications/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: pushTitle, message: pushMessage })
      });
      if (res.ok) {
        setPushTitle("");
        setPushMessage("");
        setPushSuccess(true);
        onRefreshData();
        setTimeout(() => setPushSuccess(false), 4000);
      }
    } catch {
      alert("Push campaign fail");
    }
  };

  // Toggle size ticks
  const handleToggleSize = (sz: string) => {
    if (prodSizes.includes(sz)) {
      setProdSizes(prodSizes.filter(s => s !== sz));
    } else {
      setProdSizes([...prodSizes, sz]);
    }
  };

  const totalProducts = products.length;
  const totalSalesVal = orders.reduce((acc, curr) => curr.paymentStatus === "Paid" ? acc + curr.totalAmount : acc, 0);
  const totalFraudRisks = orders.filter(o => o.fraudAlert).length;
  const pendingOrdersCount = orders.filter(o => o.orderStatus === "Pending").length;

  if (!isAdminAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12" id="admin-auth-barrier">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900"></div>
          
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-800 mx-auto mb-3">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            <h4 className="font-extrabold text-lg text-slate-900 tracking-tight uppercase">Admin Control Room</h4>
            <p className="text-xs text-slate-500 font-medium">Verify your administrative access credentials below.</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1">
                Admin Login ID *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="e.g. khalab@123"
                  className="w-full pl-3 pr-3 py-2.5 border border-gray-200 focus:ring-1 focus:ring-slate-900 rounded-lg text-xs font-mono"
                  disabled={isVerifyingAdmin}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1">
                Admin Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-3 py-2.5 border border-gray-200 focus:ring-1 focus:ring-slate-900 rounded-lg text-xs font-mono"
                  disabled={isVerifyingAdmin}
                />
              </div>
            </div>

            {adminLoginError && (
              <p className="text-[10px] text-red-650 font-bold font-mono text-center bg-red-50 p-2.5 rounded-lg border border-red-150 animate-fadeIn">
                ⚠️ {adminLoginError}
              </p>
            )}

            <button
              type="submit"
              disabled={isVerifyingAdmin}
              className="mt-2 w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-450 transition-all shadow-sm font-sans"
              id="admin-submit-btn"
            >
              {isVerifyingAdmin ? (
                <span>Confirming Key Coordinates...</span>
              ) : (
                <>
                  <span>Unlock Control Room</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin-main-section">
      
      {/* Decorative Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-950 tracking-tight flex items-center gap-2">
            KHALAB CONTROL ROOM
            <span className="text-xs bg-red-150 text-red-700 px-3 py-1 font-mono rounded-full font-bold uppercase tracking-wider animate-pulse">
              LIVE SYSTEM PORTAL
            </span>
          </h2>
          <p className="text-xs text-gray-450 mt-1">
            Secure admin operations of apparel catalogs, system configurations, anti-fraud evaluation modules, and localized deliveries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onRefreshData()}
            className="text-xs font-semibold px-4 py-2 bg-gray-50 border border-gray-200 text-gray-800 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            System Sync
          </button>
          <button
            onClick={handleAdminLogout}
            className="text-xs font-bold px-4 py-2 bg-red-50/50 border border-red-200 text-red-650 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            Lock Room
          </button>
        </div>
      </div>

      {/* Overview Stat Counters Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-white border border-gray-100 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="text-[10px] uppercase font-mono tracking-wider text-gray-500 font-bold mb-1">Catalog Apparel</div>
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 font-sans leading-none">{totalProducts}</span>
          <span className="text-[10px] text-gray-450 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[var(--primary)]" />
            Live active styles
          </span>
        </div>
        <div className="p-5 bg-white border border-gray-100 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="text-[10px] uppercase font-mono tracking-wider text-gray-500 font-bold mb-1">Verified Sales</div>
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 font-sans leading-none">৳{totalSalesVal.toLocaleString()}</span>
          <span className="text-[10px] text-[var(--primary)] mt-1 font-sans">
            Paid Bangladesh orders
          </span>
        </div>
        <div className="p-5 bg-white border border-yellow-200 bg-yellow-50/20 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="text-[10px] uppercase font-mono tracking-wider text-yellow-700 font-bold mb-1">Fraud Alerts Flagged</div>
          <span className="text-2xl sm:text-3xl font-extrabold text-yellow-800 font-sans leading-none">{totalFraudRisks}</span>
          <span className="text-[10px] text-yellow-600 mt-1 flex items-center gap-1 font-mono">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            High-Risk Bots/Spammers
          </span>
        </div>
        <div className="p-5 bg-white border border-gray-100 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="text-[10px] uppercase font-mono tracking-wider text-gray-500 font-bold mb-1">Pending Shipments</div>
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 font-sans leading-none">{pendingOrdersCount}</span>
          <span className="text-[10px] text-gray-450 mt-1">Pending delivery dispatch</span>
        </div>
      </div>

      {/* Main Panel layout with Sub Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Floating Side tab rail */}
        <div className="lg:col-span-3 space-y-1.5">
          <p className="text-[10px] font-mono tracking-widest text-gray-400 uppercase font-extrabold px-3.5 mb-2 block">
            Core Operators
          </p>
          <button
            onClick={() => setActiveSubTab("products")}
            className={`w-full py-2.5 px-3.5 text-left rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
              activeSubTab === "products"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-950"
            }`}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Manage Apparel Catalog
            </span>
            <ChevronRight className="w-3 h-3 text-white/50" />
          </button>

          <button
            onClick={() => setActiveSubTab("categories")}
            className={`w-full py-2.5 px-3.5 text-left rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
              activeSubTab === "categories"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-950"
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Categorisation & Catalogs
            </span>
            <ChevronRight className="w-3 h-3 text-white/50" />
          </button>

          <button
            onClick={() => setActiveSubTab("orders")}
            className={`w-full py-2.5 px-3.5 text-left rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
              activeSubTab === "orders"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-950"
            }`}
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Orders & Anti-Fraud Security
            </span>
            {orders.filter(o => o.fraudAlert && o.orderStatus === "Pending").length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[9px] font-mono px-1.5 py-0.5 rounded-full font-extrabold">
                {orders.filter(o => o.fraudAlert && o.orderStatus === "Pending").length} Alert
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("design")}
            className={`w-full py-2.5 px-3.5 text-left rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
              activeSubTab === "design"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-950"
            }`}
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Store Setting & Professional Colors
            </span>
            <ChevronRight className="w-3 h-3 text-white/50" />
          </button>

          <button
            onClick={() => setActiveSubTab("push")}
            className={`w-full py-2.5 px-3.5 text-left rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
              activeSubTab === "push"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-950"
            }`}
          >
            <span className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Promotional Push Broadcaster
            </span>
            <ChevronRight className="w-3 h-3 text-white/50" />
          </button>

          {/* Cloud Synchronization Manager for external hosts like Netlify */}
          <div className="pt-4 border-t border-gray-150 mt-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase font-extrabold flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-800" />
                Cloud API Sync
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Systems online"></span>
            </div>
            
            <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-2.5">
              <div className="text-[10px] text-slate-500 leading-relaxed">
                App running on: <strong className="font-mono text-slate-900">{window.location.hostname || "localhost"}</strong>.<br />
                For static hosts (like Netlify) communicating with our custom backend, sync configurations here:
              </div>
              
              <div className="space-y-1">
                <label className="block text-[8px] font-mono font-bold uppercase text-slate-500">
                  Target API Base URL
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={apiBaseInput}
                    onChange={(e) => {
                      setApiBaseInput(e.target.value);
                      localStorage.setItem("khalab_api_base", e.target.value);
                    }}
                    placeholder="https://...run.app"
                    className="w-full text-[10px] font-mono p-1.5 border border-slate-250 rounded bg-white shadow-3xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const defaultUrl = "https://ais-pre-mlblprmea5x27qr4ihex5e-983253631521.asia-southeast1.run.app";
                      setApiBaseInput(defaultUrl);
                      localStorage.setItem("khalab_api_base", defaultUrl);
                      alert("Reset target Base URL successfully! Please click Reload below.");
                    }}
                    className="text-[9px] font-bold px-1.5 py-1 bg-slate-200 text-slate-800 rounded hover:bg-slate-350 cursor-pointer"
                    title="Reset to default Cloud Run server"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
                className="w-full py-1.5 text-center bg-slate-900 hover:bg-slate-950 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all uppercase tracking-wider font-mono"
              >
                Apply & Sync
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Detail Panel Workspace */}
        <div className="lg:col-span-9 bg-white border border-gray-150 rounded-2xl p-6 sm:p-8">
          
          {/* Sub Tab: Product Apparel Catalog Add/Remove/Edit */}
          {activeSubTab === "products" && (
            <div className="space-y-6">
              {!isAddingProduct ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <div>
                      <h4 className="font-bold text-lg text-gray-950">Active Apparel Catalog List</h4>
                      <p className="text-xs text-gray-550">Double-check stock levels and size variations</p>
                    </div>
                    <button
                      onClick={handleAddNewProductClick}
                      className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" /> Add Premium Apparel
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-600 divide-y divide-gray-100">
                      <thead className="bg-gray-50 text-gray-600 font-bold">
                        <tr>
                          <th className="p-3.5">Product info</th>
                          <th className="p-3.5">Collection/Category</th>
                          <th className="p-3.5">BDT Price</th>
                          <th className="p-3.5">Stock Status</th>
                          <th className="p-3.5">Media Assets</th>
                          <th className="p-3.5 text-right">Operators</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {products.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-450 italic">
                              No products created yet. Add your first design style!
                            </td>
                          </tr>
                        ) : (
                          products.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/55 duration-100">
                              <td className="p-3.5 flex items-center gap-3">
                                {p.images[0] ? (
                                  <img
                                    src={p.images[0]}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-12 object-cover rounded-md bg-gray-100 shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-50 border flex items-center justify-center rounded-md text-[9px] shrink-0">No Img</div>
                                )}
                                <div>
                                  <span className="font-bold text-gray-900 block">{p.title}</span>
                                  <span className="text-[10px] text-gray-500 font-mono">Sizes: {p.sizes.join(", ")}</span>
                                </div>
                              </td>
                              <td className="p-3.5">
                                <span className="block font-medium text-gray-700">{p.catalog}</span>
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{p.category}</span>
                              </td>
                              <td className="p-3.5 font-bold font-mono text-gray-900">
                                ৳{p.price}
                              </td>
                              <td className="p-3.5">
                                {p.inventory <= 0 ? (
                                  <span className="text-[10px] font-bold text-red-650 bg-red-50 p-1.5 rounded-md">Sold Out</span>
                                ) : p.inventory <= 5 ? (
                                  <span className="text-[10px] font-bold text-yellow-650 bg-yellow-50 p-1.5 rounded-md">Low Inventory ({p.inventory})</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-650 bg-emerald-50 p-1.5 rounded-md">In Stock ({p.inventory})</span>
                                )}
                              </td>
                              <td className="p-3.5">
                                <span className="text-[10px] text-gray-500 block">Photos: {p.images.length}</span>
                                {p.videos && p.videos.length > 0 && (
                                  <span className="text-[9px] text-indigo-700 font-bold uppercase block tracking-wider">Has Video 📼</span>
                                )}
                              </td>
                              <td className="p-3.5 text-right space-x-1.5">
                                <button
                                  onClick={() => handleEditProductClick(p)}
                                  className="text-[11px] font-bold text-[var(--primary)] hover:underline"
                                >
                                  Edit Style
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className={`text-[11px] font-bold transition-all px-1.5 py-0.5 rounded ${deleteConfirmId === p.id ? "bg-red-650 text-white animate-pulse" : "text-red-650 hover:underline"}`}
                                >
                                  {deleteConfirmId === p.id ? "Confirm?" : "Delete"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Add / Edit Apparel form */
                <form onSubmit={handleProductSubmit} className="space-y-5">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h5 className="font-bold text-sm text-gray-900">
                      {editingProduct ? `Edit Style Design: ${editingProduct.title}` : "Launch New Design Theme"}
                    </h5>
                    <button
                      type="button"
                      onClick={() => setIsAddingProduct(false)}
                      className="text-xs font-bold text-gray-450 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">Apparel Name/Title *</label>
                      <input
                        type="text"
                        required
                        value={prodTitle}
                        onChange={(e) => setProdTitle(e.target.value)}
                        placeholder="e.g. KHALAB Crimson Silk Panjabi"
                        className="w-full p-2.5 border rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">Catalog Category *</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full p-2.5 border rounded-lg text-xs"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">Price (BDT) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={prodPrice}
                        onChange={(e) => setProdPrice(Number(e.target.value))}
                        className="w-full p-2.5 border rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">Inventory Level *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={prodInventory}
                        onChange={(e) => setProdInventory(Number(e.target.value))}
                        className="w-full p-2.5 border rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">Collection Catalog *</label>
                      <select
                        value={prodCatalog}
                        onChange={(e) => setProdCatalog(e.target.value)}
                        className="w-full p-2.5 border rounded-lg text-xs"
                      >
                        {catalogs.map((cl) => (
                          <option key={cl.id} value={cl.name}>{cl.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">Description</label>
                    <textarea
                      rows={4}
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      placeholder="Detail premium fabric details, weave structures, sleeve patterns e.t.c..."
                      className="w-full p-2.5 border rounded-lg text-xs"
                    ></textarea>
                  </div>

                  {/* Size toggles */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-2">Configure Sizing Charts</label>
                    <div className="flex flex-wrap gap-2">
                      {["S", "M", "L", "XL", "XXL", "30", "32", "34", "36"].map((size) => {
                        const active = prodSizes.includes(size);
                        return (
                          <button
                            type="button"
                            key={size}
                            onClick={() => handleToggleSize(size)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border cursor-pointer ${
                              active
                                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                                : "bg-white text-gray-700 border-gray-250 hover:bg-gray-50"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Local System Upload engine for Photo and Video */}
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-150 space-y-4">
                    <h6 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-[var(--primary)]" />
                      Local System Storage Upload Center
                    </h6>
                    <p className="text-[11px] text-gray-550">
                      Upload high-resolution fabrics showcase photo or premium catwalk cinematic loop from your local computer files. Path is resolved directly on the workspace.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Photo local block */}
                      <div className="p-4 bg-white border border-gray-200 rounded-lg">
                        <span className="block text-xs font-bold text-gray-900 mb-1">Fabric Image Showcase</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLocalUpload(e, "image")}
                          className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-[var(--primary)]/10 file:text-[var(--primary)] file:cursor-pointer hover:file:bg-[var(--primary)]/20"
                        />
                        {prodImages[0] && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-500 truncate max-w-xs">{prodImages[0]}</span>
                            <span className="text-[10px] text-emerald-650 font-bold flex items-center gap-0.5"><Eye className="w-3.5 h-3.5" /> Uploaded</span>
                          </div>
                        )}
                      </div>

                      {/* Video local block */}
                      <div className="p-4 bg-white border border-gray-200 rounded-lg">
                        <span className="block text-xs font-bold text-gray-900 mb-1">Cinematic Showcase Video</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleLocalUpload(e, "video")}
                          className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-[var(--primary)]/10 file:text-[var(--primary)] file:cursor-pointer hover:file:bg-[var(--primary)]/20"
                        />
                        {prodVideos[0] && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-500 truncate max-w-xs">{prodVideos[0]}</span>
                            <span className="text-[10px] text-indigo-650 font-bold flex items-center gap-0.5"><Eye className="w-3.5 h-3.5" /> Ready</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {uploadProgress && (
                      <p className="text-[10px] font-bold text-gray-500 animate-pulse font-mono">Writing base64 buffers to workspace uploads directory...</p>
                    )}
                    {uploadError && (
                      <p className="text-[10px] font-bold text-red-650 font-mono">{uploadError}</p>
                    )}
                  </div>

                  {/* Manual remote fallbacks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">Alternatively: Image Remote URL</span>
                      <input
                        type="text"
                        value={prodImages[0] || ""}
                        onChange={(e) => setProdImages([e.target.value])}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full p-2 border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">Alternatively: Video Remote URL</span>
                      <input
                        type="text"
                        value={prodVideos[0] || ""}
                        onChange={(e) => setProdVideos([e.target.value])}
                        placeholder="Youtube dynamic embed or direct video file URL"
                        className="w-full p-2 border rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="feat"
                      checked={prodFeatured}
                      onChange={(e) => setProdFeatured(e.target.checked)}
                      className="rounded text-[var(--primary)]"
                    />
                    <label htmlFor="feat" className="text-xs font-bold text-gray-750">Featured Style Showcase (Displays on homepage showcase layout)</label>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 duration-200 cursor-pointer shadow-xs"
                    >
                      {editingProduct ? "Save Design Updates" : "Issue Apparel Launch"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingProduct(false)}
                      className="px-4 py-2.5 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-55"
                    >
                      Discard Change
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Sub Tab: Add Categories and Catalog Collections */}
          {activeSubTab === "categories" && (
            <div className="space-y-8">
              <div className="border-b border-gray-100 pb-4">
                <h4 className="font-bold text-lg text-gray-950">Active Catalogs & Category Segments</h4>
                <p className="text-xs text-gray-550">Formulate new collections and filters for navigation</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Category forms */}
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-150 space-y-4">
                  <h5 className="font-bold text-sm text-gray-900 flex items-center gap-1.5 border-b border-gray-200/50 pb-2">
                    <Plus className="w-4.5 h-4.5 text-[var(--primary)] animate-bounce" /> Add New Category
                  </h5>
                  <form onSubmit={handleAddCategorySubmit} className="space-y-3">
                    <div>
                      <span className="block text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider mb-1">Category Label *</span>
                      <input
                        type="text"
                        required
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="e.g. Traditional Wear, Polo Shirts"
                        className="w-full p-2.5 border bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider mb-1">Short Description</span>
                      <input
                        type="text"
                        value={newCatDesc}
                        onChange={(e) => setNewCatDesc(e.target.value)}
                        placeholder="Brief segment scope"
                        className="w-full p-2.5 border bg-white rounded-lg text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-lg cursor-pointer hover:opacity-90 transition-all shadow-xs"
                    >
                      Provision Category
                    </button>
                  </form>

                  <div className="pt-2">
                    <span className="block text-[10px] uppercase font-mono font-bold text-gray-400 mb-2">Live Category Labels:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {categories.map((c) => (
                        <span key={c.id} className="text-[10px] font-bold text-gray-700 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Catalog forms */}
                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-150 space-y-4">
                  <h5 className="font-bold text-sm text-gray-900 flex items-center gap-1.5 border-b border-gray-200/50 pb-2">
                    <Sparkles className="w-4.5 h-4.5 text-[var(--primary)]" /> Add New Catalog Collection
                  </h5>
                  <form onSubmit={handleAddCatalogSubmit} className="space-y-3">
                    <div>
                      <span className="block text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider mb-1">Catalog Title *</span>
                      <input
                        type="text"
                        required
                        value={newCatalogName}
                        onChange={(e) => setNewCatalogName(e.target.value)}
                        placeholder="e.g. Eid Exclusive '26"
                        className="w-full p-2.5 border bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider mb-1">Subtitle / Campaign Tagline</span>
                      <input
                        type="text"
                        value={newCatalogSubtitle}
                        onChange={(e) => setNewCatalogSubtitle(e.target.value)}
                        placeholder="Premium linen breathable tailored blends..."
                        className="w-full p-2.5 border bg-white rounded-lg text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-lg cursor-pointer hover:opacity-90 transition-all shadow-xs"
                    >
                      Instantiate Catalog
                    </button>
                  </form>

                  <div className="pt-2">
                    <span className="block text-[10px] uppercase font-mono font-bold text-gray-400 mb-2">Live Catalogs:</span>
                    <div className="space-y-1">
                      {catalogs.map((ct) => (
                        <div key={ct.id} className="text-[10px] p-2 bg-white rounded-lg border border-gray-200">
                          <span className="font-bold text-gray-800 block text-xs">{ct.name}</span>
                          <span className="text-gray-450 text-[10px] mt-0.5 block italic">{ct.subtitle}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: Orders & Anti-Fraud Security */}
          {activeSubTab === "orders" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h4 className="font-bold text-lg text-gray-950">Customer Orders & Fraud Shield Audit</h4>
                <p className="text-xs text-gray-550">Monitor Bangladesh incoming baskets, flags and payment verifications.</p>
              </div>

              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="p-12 text-center text-xs text-gray-450 italic bg-gray-50 border border-gray-100 rounded-xl">
                    No orders have been placed on store currently. Test checkout to trigger fraud shield scanning.
                  </div>
                ) : (
                  orders.map((o) => {
                    const statusColors: Record<string, string> = {
                      Pending: "text-amber-700 bg-amber-50 border-amber-100",
                      Processing: "text-indigo-700 bg-indigo-50 border-indigo-100",
                      Shipped: "text-blue-700 bg-blue-50 border-blue-100",
                      Delivered: "text-emerald-700 bg-emerald-50 border-emerald-100",
                      Cancelled: "text-red-700 bg-red-50 border-red-100"
                    };

                    return (
                      <div
                        key={o.id}
                        className={`p-6 border rounded-xl bg-white duration-150 ${
                          o.fraudAlert ? "border-red-300 bg-red-50/5" : "border-gray-150 hover:border-gray-250 animate-fadeIn"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-gray-900 text-sm">{o.id}</span>
                              <span className="text-[10px] text-gray-450">{new Date(o.date).toLocaleDateString()}</span>
                              {o.fraudAlert && (
                                <span className="bg-red-500 text-white text-[9px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-wide font-bold animate-pulse flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3" /> Fraud Alert ({o.fraudRiskScore}%)
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-gray-700 block mt-1.5">
                              {o.customerName} | Phone: <span className="font-mono text-gray-900 tracking-wider font-semibold">{o.customerPhone}</span>
                            </span>
                            <span className="text-xs text-gray-500 block">
                              Address: {o.customerAddress} ({o.customerCity})
                            </span>
                          </div>

                          <div className="flex flex-col items-start md:items-end gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500">Delivery Status:</span>
                              <select
                                value={o.orderStatus}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                className={`text-[10px] font-bold border rounded-md py-1 px-1.5 focus:outline-hidden ${statusColors[o.orderStatus]}`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                            <div className="text-xs text-gray-550 flex items-center gap-1">
                              Payment: 
                              <span className={`font-bold ml-0.5 ${o.paymentStatus === "Paid" ? "text-emerald-600" : "text-amber-600"}`}>
                                {o.paymentMethod} ({o.paymentStatus})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Order Items detail and fraud flags descriptions */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-6">
                          <div className="md:col-span-8 space-y-2">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-450 block font-bold">Ordered Baskets ({o.items.length})</span>
                            <div className="space-y-1.5">
                              {o.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                                  <span className="text-gray-900 font-semibold">{item.title} <span className="text-[10px] text-gray-400">({item.size})</span></span>
                                  <span className="text-gray-600">৳{item.price} x {item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                              <span className="text-xs font-bold text-gray-800">Basket Net Amount BDT:</span>
                              <span className="font-mono font-extrabold text-sm text-[var(--primary)]">৳{o.totalAmount.toLocaleString()} BDT</span>
                            </div>
                          </div>

                          {/* Anti Fraud module details */}
                          <div className="md:col-span-4 bg-gray-50/70 p-4 rounded-xl border space-y-3">
                            <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold block text-gray-500">Security Guard Report</span>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 font-medium">Risk Score:</span>
                              <span className={`text-xs font-bold font-mono ${
                                o.fraudRiskScore >= 50 ? "text-red-650" : o.fraudRiskScore >= 20 ? "text-yellow-650" : "text-emerald-650"
                              }`}>{o.fraudRiskScore}% Risk</span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  o.fraudRiskScore >= 50 ? "bg-red-500" : o.fraudRiskScore >= 20 ? "bg-yellow-450" : "bg-emerald-500"
                                }`}
                                style={{ width: `${o.fraudRiskScore}%` }}
                              ></div>
                            </div>

                            {/* Risk alert list logs */}
                            {o.fraudDetails.length > 0 ? (
                              <div className="space-y-1 bg-red-50/20 p-2.5 rounded-lg border border-red-200/50">
                                <span className="text-[9px] font-bold text-red-700 block uppercase">Risks found:</span>
                                {o.fraudDetails.map((f, fIdx) => (
                                  <p key={fIdx} className="text-[10px] text-red-600 leading-normal flex items-start gap-1">
                                    <span className="text-red-500 shrink-0 font-bold">•</span>
                                    {f}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-emerald-650 flex items-center gap-1 font-medium bg-emerald-50/30 p-2 rounded-lg border border-emerald-200/30">
                                <CheckCircle className="w-3.5 h-3.5" /> No security triggers flag. Safe Bangladesh customer order transaction.
                              </p>
                            )}

                            {/* Force dismiss / flag actions */}
                            <div className="pt-2 text-right">
                              <button
                                onClick={() => handleToggleOrderFraud(o.id, o.fraudAlert)}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-md duration-200 cursor-pointer ${
                                  o.fraudAlert 
                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-250" 
                                    : "bg-red-100 text-red-700 hover:bg-red-250"
                                }`}
                              >
                                {o.fraudAlert ? "Dismiss Risk Warning" : "Flag as Fake Order"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Sub Tab: Custom Design Customization Settings (Colors, templates details) */}
          {activeSubTab === "design" && (
            <div className="space-y-8">
              <div className="border-b border-gray-100 pb-4">
                <h4 className="font-bold text-lg text-gray-950">Store Design, Brand Parameters & Aesthetics</h4>
                <p className="text-xs text-gray-550">Alter standard contacts, upload banners with promo codes, and change color scheme elements dynamically.</p>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-6">
                
                {/* 5 Professional Colors settings panel */}
                <div className="p-6 bg-gray-50/40 rounded-2xl border border-gray-150 space-y-4">
                  <h5 className="font-bold text-sm text-gray-950 flex items-center gap-1.5">
                    <Palette className="w-4.5 h-4.5 text-[var(--primary)]" />
                    Professional Style Templates
                  </h5>
                  <p className="text-xs text-gray-550 leading-relaxed">
                    Choose one of 5 pristine designer templates instantly. Selecting "Custom HEX Settings" unlocks complete color brand control inputs below.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    
                    {/* Slate */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheme("slate");
                        setCustomPrimary("#1e293b");
                        setCustomSecondary("#475569");
                      }}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all duration-200 cursor-pointer ${
                        selectedTheme === "slate" ? "border-gray-900 bg-white ring-2 ring-gray-900" : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-mono font-bold text-gray-650">Slate</span>
                      <div className="flex gap-1 mt-1">
                        <span className="w-5 h-5 rounded-full bg-slate-800 border"></span>
                        <span className="w-5 h-5 rounded-full bg-slate-600 border"></span>
                      </div>
                    </button>

                    {/* Crimson */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheme("crimson");
                        setCustomPrimary("#881337");
                        setCustomSecondary("#be123c");
                      }}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all duration-200 cursor-pointer ${
                        selectedTheme === "crimson" ? "border-rose-950 bg-white ring-2 ring-rose-900" : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-mono font-bold text-rose-800">Crimson</span>
                      <div className="flex gap-1 mt-1">
                        <span className="w-5 h-5 rounded-full bg-rose-900 border"></span>
                        <span className="w-5 h-5 rounded-full bg-rose-600 border"></span>
                      </div>
                    </button>

                    {/* Emerald */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheme("emerald");
                        setCustomPrimary("#064e3b");
                        setCustomSecondary("#047857");
                      }}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all duration-200 cursor-pointer ${
                        selectedTheme === "emerald" ? "border-emerald-950 bg-white ring-2 ring-emerald-900" : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-mono font-bold text-emerald-800">Emerald</span>
                      <div className="flex gap-1 mt-1">
                        <span className="w-5 h-5 rounded-full bg-emerald-900 border"></span>
                        <span className="w-5 h-5 rounded-full bg-emerald-600 border"></span>
                      </div>
                    </button>

                    {/* Amber */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheme("amber");
                        setCustomPrimary("#78350f");
                        setCustomSecondary("#b45309");
                      }}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all duration-200 cursor-pointer ${
                        selectedTheme === "amber" ? "border-amber-950 bg-white ring-2 ring-amber-900" : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-mono font-bold text-amber-800">Amber</span>
                      <div className="flex gap-1 mt-1">
                        <span className="w-5 h-5 rounded-full bg-amber-900 border"></span>
                        <span className="w-5 h-5 rounded-full bg-amber-500 border"></span>
                      </div>
                    </button>

                    {/* Violet */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheme("violet");
                        setCustomPrimary("#4c1d95");
                        setCustomSecondary("#6d28d9");
                      }}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all duration-200 cursor-pointer ${
                        selectedTheme === "violet" ? "border-violet-950 bg-white ring-2 ring-violet-900" : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-mono font-bold text-violet-800">Violet</span>
                      <div className="flex gap-1 mt-1">
                        <span className="w-5 h-5 rounded-full bg-violet-900 border"></span>
                        <span className="w-5 h-5 rounded-full bg-violet-600 border"></span>
                      </div>
                    </button>

                    {/* Custom settings */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheme("custom");
                      }}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all duration-200 cursor-pointer ${
                        selectedTheme === "custom" ? "border-purple-600 bg-white ring-2 ring-purple-500" : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-mono font-bold text-purple-600">Custom Hue</span>
                      <span className="text-[9px] text-gray-500 font-bold block bg-purple-50 p-1.5 rounded-md italic">Unlock manual hex</span>
                    </button>

                  </div>

                  {/* Manual Hex config inputs if custom set */}
                  {selectedTheme === "custom" && (
                    <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-4 max-w-md animate-fadeIn">
                      <span className="block text-xs font-bold text-gray-900">Custom Hex Settings</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-gray-500 font-mono font-bold uppercase mb-1">Primary Color (Hex)</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={customPrimary}
                              onChange={(e) => setCustomPrimary(e.target.value)}
                              className="w-7 h-7 bg-transparent cursor-pointer shrink-0"
                            />
                            <input
                              type="text"
                              value={customPrimary}
                              onChange={(e) => setCustomPrimary(e.target.value)}
                              placeholder="#hex"
                              className="w-full text-xs font-mono p-1 border rounded"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-500 font-mono font-bold uppercase mb-1">Secondary Color (Hex)</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={customSecondary}
                              onChange={(e) => setCustomSecondary(e.target.value)}
                              className="w-7 h-7 bg-transparent cursor-pointer shrink-0"
                            />
                            <input
                              type="text"
                              value={customSecondary}
                              onChange={(e) => setCustomSecondary(e.target.value)}
                              placeholder="#hex"
                              className="w-full text-xs font-mono p-1 border rounded"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Brand information updates */}
                <div className="p-6 bg-gray-50/40 rounded-2xl border border-gray-150 space-y-4">
                  <h5 className="font-bold text-sm text-gray-950">Brand Credentials & Touch-points</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-mono text-gray-500 font-extrabold uppercase mb-1">Brand Name</span>
                      <input
                        type="text"
                        required
                        value={cfgBrand}
                        onChange={(e) => setCfgBrand(e.target.value)}
                        className="w-full p-2.5 border bg-white rounded-lg text-xs font-bold text-gray-900"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono text-gray-500 font-extrabold uppercase mb-1">Tagline Slogan</span>
                      <input
                        type="text"
                        value={cfgTagline}
                        onChange={(e) => setCfgTagline(e.target.value)}
                        className="w-full p-2.5 border bg-white rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-mono text-gray-500 font-extrabold uppercase mb-1">Warehouse / Shop Address</span>
                      <input
                        type="text"
                        value={cfgAddress}
                        onChange={(e) => setCfgAddress(e.target.value)}
                        className="w-full p-2.5 border bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono text-gray-500 font-extrabold uppercase mb-1">Telephone Contact</span>
                      <input
                        type="text"
                        value={cfgMobile}
                        onChange={(e) => setCfgMobile(e.target.value)}
                        className="w-full p-2.5 border bg-white rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="block text-[10px] font-mono text-gray-500 font-extrabold uppercase mb-1">WhatsApp Mobile Link</span>
                      <input
                        type="text"
                        value={cfgWhatsapp}
                        onChange={(e) => setCfgWhatsapp(e.target.value)}
                        className="w-full p-2.5 border bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono text-gray-500 font-extrabold uppercase mb-1">Facebook Fan Page URL</span>
                      <input
                        type="text"
                        value={cfgFacebook}
                        onChange={(e) => setCfgFacebook(e.target.value)}
                        className="w-full p-2.5 border bg-white rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono text-gray-500 font-extrabold uppercase mb-1">Instagram Page URL</span>
                      <input
                        type="text"
                        value={cfgInstagram}
                        onChange={(e) => setCfgInstagram(e.target.value)}
                        className="w-full p-2.5 border bg-white rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-150">
                    <span className="block text-xs font-bold text-gray-950 mb-1">Website Logo</span>
                    <p className="text-[11px] text-gray-500 mb-2">Upload a vector transparent PNG or JPG for your store logo.</p>
                    <input
                      type="file"
                      onChange={handleLogoUpload}
                      className="text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded file:bg-gray-100 file:border-0 file:text-[10px] file:font-semibold"
                    />
                    {cfgLogo && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-650 font-semibold font-mono">
                        <CheckCircle className="w-3.5 h-3.5" /> Logo Path: {cfgLogo}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hero Banner Slides Customizer */}
                <div className="p-6 bg-gray-50/40 rounded-2xl border border-gray-150 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b">
                    <div>
                      <h5 className="font-bold text-sm text-gray-950 flex items-center gap-1.5">
                        <Sparkles className="w-4.5 h-4.5 text-[var(--primary)]" />
                        Hero Banner Photo & Caption Slides
                      </h5>
                      <p className="text-[11px] text-gray-550">Customize the interactive slide carousel shown on your store's front page.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddBannerSlide}
                      className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-bold hover:bg-gray-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Custom Slide
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {cfgBanners.map((banner, index) => (
                      <div key={banner.id} className="p-5 bg-white rounded-xl border border-gray-200 relative space-y-4">
                        {/* Upper Header Control Row */}
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                          <span className="text-[11px] font-bold font-mono text-gray-450 uppercase">Slide #{index + 1}</span>
                          {cfgBanners.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBannerSlide(index)}
                              className="p-1 px-2.5 bg-red-50 text-red-650 hover:bg-red-100 duration-200 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer"
                              title="Delete Slide"
                            >
                              <Trash className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          )}
                        </div>

                        {/* Slide Customizer Content: Inputs & Preview */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                          {/* Inputs Left (7 Cols) */}
                          <div className="lg:col-span-7 space-y-3">
                            <div>
                              <label className="block text-[10px] font-mono text-gray-500 font-bold uppercase mb-1">Slide Title (Primary Heading)</label>
                              <input
                                type="text"
                                required
                                value={banner.title}
                                onChange={(e) => handleUpdateBannerProperty(index, "title", e.target.value)}
                                placeholder="e.g. PREMIUM WINTER LAUNCH"
                                className="w-full p-2 border bg-gray-50/50 rounded-lg text-xs font-bold text-gray-900"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono text-gray-500 font-bold uppercase mb-1">Slide Subtitle (Description Caption)</label>
                              <textarea
                                value={banner.subtitle}
                                onChange={(e) => handleUpdateBannerProperty(index, "subtitle", e.target.value)}
                                placeholder="e.g. Elegant styles customized with love..."
                                rows={2}
                                className="w-full p-2 border bg-gray-50/50 rounded-lg text-xs text-gray-800 resize-none"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-mono text-gray-500 font-bold uppercase mb-1">Redirection Link / Hash</label>
                                <input
                                  type="text"
                                  value={banner.link}
                                  onChange={(e) => handleUpdateBannerProperty(index, "link", e.target.value)}
                                  placeholder="e.g. #shop, #category/Shirts"
                                  className="w-full p-2 border bg-gray-50/50 rounded-lg text-xs font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono text-gray-500 font-bold uppercase mb-1">Upload Photo</label>
                                <input
                                  type="file"
                                  onChange={(e) => handleBannerPhotoUpload(index, e)}
                                  className="text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:bg-gray-100 file:border-0 file:text-[9px] file:font-semibold w-full mt-1"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono text-gray-500 font-bold uppercase mb-1">Or Paste Direct Image URL</label>
                              <input
                                type="text"
                                value={banner.imageUrl}
                                onChange={(e) => handleUpdateBannerProperty(index, "imageUrl", e.target.value)}
                                placeholder="https://images.unsplash.com/photo-..."
                                className="w-full p-2 border bg-gray-50/50 rounded-lg text-[11px] font-mono"
                              />
                            </div>
                          </div>

                          {/* Mini Overlay Preview Right (5 Cols) */}
                          <div className="lg:col-span-5 flex flex-col justify-between">
                            <span className="block text-[10px] font-mono text-gray-500 font-bold uppercase mb-1.5 flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-gray-400" />
                              Live Miniature Carousel Preview
                            </span>
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-950 border group shadow-sm flex items-center justify-center">
                              {banner.imageUrl ? (
                                <img
                                  src={banner.imageUrl}
                                  alt={banner.title}
                                  referrerPolicy="no-referrer"
                                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                                />
                              ) : (
                                <span className="text-white/30 text-[10px] font-mono font-bold">No photo added yet</span>
                              )}
                              
                              {/* Dark filter overlay */}
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3.5 flex flex-col justify-end text-left min-h-[70%]">
                                <h6 className="text-[10px] font-black tracking-tight text-white uppercase truncate line-clamp-1">
                                  {banner.title || "UNTITLED LAUNCH"}
                                </h6>
                                <p className="text-[8px] text-white/80 leading-tight mt-0.5 max-w-[95%] line-clamp-2">
                                  {banner.subtitle || "Customize this slide subtitle caption..."}
                                </p>
                                {banner.link && (
                                  <span className="mt-2 text-[7px] font-extrabold uppercase tracking-wider text-pink-450 self-start border border-pink-400/50 px-1 py-0.5 rounded">
                                    Link: {banner.link}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 duration-200 cursor-pointer shadow-xs"
                  >
                    Apply Settings
                  </button>
                </div>
              </form>

              {/* Promotions and campaigns builder */}
              <div className="p-6 bg-gray-50/40 rounded-2xl border border-gray-150 space-y-6">
                <h5 className="font-bold text-sm text-gray-950 flex items-center gap-1.5 pb-2 border-b">
                  <Tag className="w-4.5 h-4.5 text-[var(--primary)]" />
                  Cashier Promotion Codes & Discounts
                </h5>

                <form onSubmit={handleAddPromoSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-white p-4 rounded-xl border">
                  <div>
                    <span className="block text-[10px] font-mono text-gray-500 font-bold uppercase mb-1">Coupon Code *</span>
                    <input
                      type="text"
                      required
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="e.g. KHALAB10"
                      className="w-full p-2 border rounded-lg text-xs uppercase font-mono font-bold"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono text-gray-500 font-bold uppercase mb-1">Promo Type</span>
                    <select
                      value={promoType}
                      onChange={(e) => setPromoType(e.target.value as any)}
                      className="w-full p-2 border rounded-lg text-xs"
                    >
                      <option value="fixed">Fixed BDT Amount</option>
                      <option value="percentage">Percentage Discount (%)</option>
                    </select>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono text-gray-500 font-bold uppercase mb-1">Discount Value</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={promoDiscount}
                      onChange={(e) => setPromoDiscount(Number(e.target.value))}
                      className="w-full p-2 border rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Save Promo Code
                  </button>
                </form>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Live Coupons:</span>
                  <div className="divide-y divide-gray-150 border rounded-xl overflow-hidden bg-white">
                    {config.promos.map((p) => (
                      <div key={p.code} className="p-3 text-xs flex justify-between items-center bg-white hover:bg-gray-50 duration-70">
                        <div>
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 py-1 px-2 rounded-sm text-xs border uppercase">{p.code}</span>
                          <span className="text-gray-500 ml-3 italic">
                            Discount: {p.type === "fixed" ? `৳${p.discount} BDT` : `${p.discount}%`}. Active status.
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeletePromo(p.code)}
                          className="text-[10px] text-red-500 font-bold hover:underline"
                        >
                          Revoke Code
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: Promotional Push Offer Broadcaster (notifications panel) */}
          {activeSubTab === "push" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h4 className="font-bold text-lg text-gray-950">In-Store Instant Push Notification Broadcaster</h4>
                <p className="text-xs text-gray-550">Draft promotional campaign offers or store notifications. Sent dynamically to user app headers instant.</p>
              </div>

              <form onSubmit={handlePushSubmit} className="space-y-4 max-w-xl">
                <div>
                  <span className="block text-xs font-bold text-gray-800 mb-1">Notification Header Title *</span>
                  <input
                    type="text"
                    required
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    placeholder="e.g. FLASH EID OFFER: BDT 500 FLAT DISCOUNTS! 🎉"
                    className="w-full p-2.5 border rounded-lg text-xs"
                  />
                </div>

                <div>
                  <span className="block text-xs font-bold text-gray-800 mb-1">Full Offer / Message Body *</span>
                  <textarea
                    rows={4}
                    required
                    value={pushMessage}
                    onChange={(e) => setPushMessage(e.target.value)}
                    placeholder="Provide full promo descriptions, coupon highlights, sizing Exchanges, and localized cash on delivery rules..."
                    className="w-full p-2.5 border rounded-lg text-xs"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:opacity-95 cursor-pointer shadow-xs"
                >
                  Broadcast Push Campaign
                </button>

                {pushSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-1.5 animate-fadeIn">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Bespoke push notification distributed successfully to all shopper clients. Checking notifications center above!
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
