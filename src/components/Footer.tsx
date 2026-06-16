import { Phone, MapPin, Facebook, Instagram, ShieldCheck, Truck, RefreshCw, Send } from "lucide-react";
import { AppConfig } from "../types";

interface FooterProps {
  config: AppConfig;
  onNavigate: (tab: string) => void;
}

export default function Footer({ config, onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 font-sans" id="footer-section">
      {/* Advantages Banner Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-gray-800 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-white text-sm font-bold tracking-wide">EXPRESS BD DELIVERY</h5>
            <p className="text-xs text-gray-405 mt-1">Cash on Delivery across all 64 districts in Bangladesh</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-white text-sm font-bold tracking-wide">3-DAY SECURE RETURNS</h5>
            <p className="text-xs text-gray-405 mt-1">Hassle-free size exchanges at your doorstep</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-white text-sm font-bold tracking-wide">100% PREMIUM GUARANTEE</h5>
            <p className="text-xs text-gray-405 mt-1">Finest fabric sourcing with accurate premium stitching</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand Column */}
        <div className="space-y-4">
          <span className="text-2xl font-black text-white tracking-tight flex items-center gap-1.5 justify-start">
            {config.brandName || "KHALAB"}
            <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
          </span>
          <p className="text-xs text-gray-450 leading-relaxed max-w-xs">
            {config.tagline || "Make your self premium."} Traditional ethnic aesthetics crafted meticulously for the premium class.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a
              href={config.facebook || "https://www.facebook.com/khalabfashion"}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-gray-800 text-gray-300 hover:bg-[var(--primary)] hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href={config.instagram || "https://instagram.com/khalabfashion"}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-gray-800 text-gray-300 hover:bg-[var(--primary)] hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Categories / Quick shop */}
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Shop Categories</h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <button onClick={() => onNavigate("shop")} className="hover:text-[var(--primary)] transition-colors cursor-pointer text-left">
                Panjabi Collection
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("shop")} className="hover:text-[var(--primary)] transition-colors cursor-pointer text-left">
                Cotton Shirts
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("shop")} className="hover:text-[var(--primary)] transition-colors cursor-pointer text-left">
                Pants & Denim
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("shop")} className="hover:text-[var(--primary)] transition-colors cursor-pointer text-left">
                Jackets & Hoodies
              </button>
            </li>
          </ul>
        </div>

        {/* Useful links */}
        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Customer Care</h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <button onClick={() => onNavigate("tracking")} className="hover:text-[var(--primary)] transition-colors cursor-pointer text-left">
                Order Tracking
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("shop")} className="hover:text-[var(--primary)] transition-colors cursor-pointer text-left">
                Fresh Inventory
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate("admin")} className="hover:text-[var(--primary)] transition-colors cursor-pointer text-left">
                Admin Control Room
              </button>
            </li>
          </ul>
        </div>

        {/* Brand Contact Details */}
        <div className="space-y-4">
          <h4 className="text-white text-xs font-bold uppercase tracking-widest">Connect With Us</h4>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
              <span className="leading-relaxed">{config.address || "Shuvadda, South Keraniganj, Dhaka, Bangladesh."}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span>WhatsApp: {config.mobile || "+880171941040"}</span>
            </div>
          </div>
          <div className="pt-2">
            <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-semibold font-mono">Verified Location</span>
            <span className="text-xs text-white/80 font-medium block mt-0.5">Dhaka Division, Bangladesh</span>
          </div>
        </div>
      </div>

      {/* Corporate bottom credit bar */}
      <div className="bg-gray-950 py-6 border-t border-gray-800/60 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-gray-500">
            &copy; {currentYear} <span className="text-gray-300 font-bold">{config.brandName || "KHALAB"}</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-gray-500">
            <span>Secured Payment Gateways</span>
            <span className="text-gray-400 font-mono text-[9px] border border-gray-800 py-0.5 px-1.5 rounded-sm">bKash</span>
            <span className="text-gray-400 font-mono text-[9px] border border-gray-800 py-0.5 px-1.5 rounded-sm">Nagad</span>
            <span className="text-gray-400 font-mono text-[9px] border border-gray-800 py-0.5 px-1.5 rounded-sm">Rocket</span>
            <span className="text-gray-400 font-mono text-[9px] border border-gray-800 py-0.5 px-1.5 rounded-sm">VISA/MasterCard</span>
            <span className="text-gray-400 font-mono text-[9px] border border-gray-800 py-0.5 px-1.5 rounded-sm">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
