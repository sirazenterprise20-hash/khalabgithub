import React, { useState } from "react";
import { ShoppingBag, Search, Phone, Send, Info, Bell, Shield, User } from "lucide-react";
import { AppConfig, PushNotification } from "../types";

interface HeaderProps {
  config: AppConfig;
  cartCount: number;
  notifications: PushNotification[];
  onNavigate: (tab: string, arg?: string) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  currentUser?: any;
  onLogOut?: () => void;
}

export default function Header({
  config,
  cartCount,
  notifications,
  onNavigate,
  onSearch,
  searchQuery,
  currentUser,
  onLogOut
}: HeaderProps) {
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearch);
    onNavigate("shop");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
      {/* Top Banner Accent - Geometric Balance theme */}
      <div className="bg-slate-900 text-white h-8 flex items-center justify-between px-4 sm:px-8 text-[10px] uppercase tracking-widest font-medium">
        <div className="flex gap-4">
          <span>Admin Mode: Active</span>
          <span className="text-emerald-400 font-semibold">• Anti-Fraud System Online</span>
        </div>
        <div className="flex gap-4 text-white/90">
          <span>{config.tagline || "Make your self premium."}</span>
          <span className="hidden sm:inline">WhatsApp: {config.mobile}</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo / Brand Name */}
        <button
          onClick={() => {
            onSearch("");
            setLocalSearch("");
            onNavigate("home");
          }}
          className="flex items-center gap-2 text-left cursor-pointer focus:outline-hidden"
          id="btn-brand-logo"
        >
          {config.logoUrl ? (
            <img
              src={config.logoUrl || "/uploads/placeholder.png"}
              alt={config.brandName}
              referrerPolicy="no-referrer"
              className="h-9 sm:h-11 object-contain"
            />
          ) : (
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tighter leading-none text-slate-800">
                {config.brandName || "KHALAB"}
              </h1>
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
                {config.tagline || "Make your self premium."}
              </p>
            </div>
          )}
        </button>

        {/* Search Bar Component */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-xs items-center relative"
          id="search-navbar-desktop"
        >
          <input
            type="text"
            placeholder="Search catalog..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="bg-slate-100 text-[11px] py-1.5 px-4 pr-10 rounded-full w-full focus:outline-hidden border border-transparent focus:border-slate-300 transition-all text-slate-800"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Navigation / Actions Toolbar */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => onNavigate("shop")}
            className="text-xs font-semibold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors py-1.5 px-2"
            id="nav-shop"
          >
            Shop All
          </button>

          <button
            onClick={() => onNavigate("tracking")}
            className="text-xs font-semibold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors py-1.5 px-2 hidden sm:inline-block"
            id="nav-track"
          >
            Track Order
          </button>

          <button
            onClick={() => onNavigate("admin")}
            className="text-xs font-bold uppercase tracking-wider text-slate-800 border border-slate-200 hover:bg-slate-50 transition-colors py-1.5 px-3 rounded flex items-center gap-1.5 cursor-pointer"
            id="nav-admin"
          >
            <Shield className="w-3.5 h-3.5" />
            Admin
          </button>

          <button
            onClick={() => onNavigate("account")}
            className={`text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded flex items-center gap-1.5 cursor-pointer border transition-all ${
              currentUser 
                ? "text-emerald-700 bg-emerald-50/50 border-emerald-150 hover:bg-emerald-50" 
                : "text-slate-805 border-slate-200 hover:bg-slate-50"
            }`}
            id="nav-account"
          >
            <User className="w-3.5 h-3.5" />
            {currentUser ? "My Profile" : "Sign In"}
          </button>

          {/* Vertical Divider */}
          <span className="h-6 w-px bg-slate-200"></span>

          {/* Real-time In-app Push Notification Bell Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationCenter(!showNotificationCenter)}
              className="p-2 text-slate-650 hover:text-slate-900 rounded-full transition-all cursor-pointer relative"
              id="btn-bell-notify"
            >
              <Bell className="w-4.5 h-4.5" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-slate-900 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotificationCenter && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-gray-150 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <h4 className="font-bold text-sm text-gray-950 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[var(--primary)]" />
                    In-Store Messages
                  </h4>
                  <span className="text-[10px] font-mono text-gray-500 uppercase bg-gray-200/70 py-0.5 px-2 rounded-full">
                    {notifications.length} Alerts
                  </span>
                </div>
                <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-450">
                      No current notifications. Checkout to see updates!
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (n.orderId) {
                            onNavigate("tracking", n.orderId);
                          }
                          setShowNotificationCenter(false);
                        }}
                        className={`p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                          n.type === "order" ? "border-l-2 border-[var(--primary)]" : "border-l-2 border-amber-400"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-bold text-xs text-gray-900 leading-tight">
                            {n.title}
                          </span>
                          <span className="text-[9px] text-gray-450 whitespace-nowrap">
                            {n.date}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1 leading-normal">
                          {n.message}
                        </p>
                        {n.orderId && (
                          <span className="mt-1.5 inline-block text-[9px] font-mono text-[var(--primary)] underline">
                            Click to track {n.orderId}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                  <button
                    onClick={() => setShowNotificationCenter(false)}
                    className="text-[10px] font-bold text-gray-600 hover:text-[var(--primary)] hover:underline block w-full uppercase"
                  >
                    Close Panel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Shopping Bag Button */}
          <button
            onClick={() => onNavigate("cart")}
            className="p-2.5 relative text-slate-700 hover:text-slate-900 transition-all rounded-full cursor-pointer hover:bg-slate-100/50 border border-slate-200"
            id="btn-nav-cart"
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="px-4 pb-3 block md:hidden">
        <form onSubmit={handleSearchSubmit} className="flex items-center relative w-full" id="search-navbar-mobile">
          <input
            type="text"
            placeholder="Search t-shirts, panjabi, design color..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] bg-gray-50"
          />
          <button
            type="submit"
            className="absolute right-3 text-gray-400 hover:text-[var(--primary)] cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </header>
  );
}
