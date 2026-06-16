import React, { useState, useEffect } from "react";
import { User, LogOut, Package, MapPin, Phone, Calendar, ShoppingBag, ArrowRight, ShieldCheck, Mail } from "lucide-react";
import { autoSignInAndRegisterByPhone, getUserOrdersFromFirestore, auth } from "../firebase";
import { signOut } from "firebase/auth";

interface UserProfileProps {
  onBack: () => void;
  onNavigate: (tab: string, arg?: string) => void;
}

export default function UserProfile({ onBack, onNavigate }: UserProfileProps) {
  // Current user tracking
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for login/register
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bdCities = [
    "Dhaka", "South Keraniganj", "Chittagong", "Sylhet", "Khulna", "Barisal", "Rajshahi", "Rangpur", "Mymensingh", "Comilla", "Narayanganj"
  ];

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsLoading(true);
        try {
          // Fetch previous orders from Firestore
          const list = await getUserOrdersFromFirestore(user.uid);
          setUserOrders(list);

          // Extract mock user info from email or custom profile
          const cleanPhone = user.email ? user.email.replace("phone_", "").replace("@khalab.com", "") : user.uid;
          
          // Re-inflate user details if they placed an order or from latest order
          if (list.length > 0) {
            const lastOrder = list[0];
            setUserProfile({
              fullName: lastOrder.customerName || "Premium Member",
              phoneNumber: lastOrder.customerPhone || cleanPhone,
              address: lastOrder.customerAddress || "Address on record",
              city: lastOrder.customerCity || "Dhaka"
            });
          } else {
            setUserProfile({
              fullName: "Premium Member",
              phoneNumber: cleanPhone,
              address: "Dhaka Division, Bangladesh",
              city: "Dhaka"
            });
          }
        } catch (err) {
          console.error("Failed to load user session data", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setUserProfile(null);
        setUserOrders([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!phoneNumber || !fullName || !address) {
      setFormError("All fields are required to secure your customer portal.");
      return;
    }

    // Validate phone formatting
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, "");
    const isBDPhone = /^(\+?8801|01)[3-9]\d{8}$/.test(cleanPhone);
    if (!isBDPhone) {
      setFormError("Must be a valid Bangladesh phone number starting with +8801 or 01.");
      return;
    }

    if (address.length < 10) {
      setFormError("Detailed address should have at least 10 characters for shipment accuracy.");
      return;
    }

    setIsSubmitting(true);
    try {
      await autoSignInAndRegisterByPhone(phoneNumber, fullName, address, city);
    } catch (err: any) {
      setFormError(err.message || "Failed to establish secure phone session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out fail:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn" id="user-profile-dashboard">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
            {currentUser ? "Customer Profile Portal" : "Secure Shop Registry"}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {currentUser ? "Access your real-time Firestore database order transcripts" : "Log in securely using your mobile number"}
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 hover:bg-slate-50 py-1.5 px-3 rounded"
        >
          Back to Store
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-mono font-medium text-slate-500 uppercase tracking-widest">Synchronizing Session with Firestore...</p>
        </div>
      ) : currentUser && userProfile ? (
        /* LOGGED IN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* USER INFO PANEL */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900"></div>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border border-slate-200">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 leading-tight uppercase font-sans">
                    {userProfile.fullName}
                  </h3>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 mt-1 block">
                    KHALAB Premium Member
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 space-y-4 text-xs">
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="block font-mono font-semibold text-slate-800">{userProfile.phoneNumber}</span>
                    <span className="text-[9px] text-slate-400 font-mono uppercase">Primary Coordinate</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="block text-slate-800 font-medium">{userProfile.address}, {userProfile.city}</span>
                    <span className="text-[9px] text-slate-400 font-mono uppercase">Shipping Coordinate</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="block font-mono text-slate-800 break-all">{currentUser.email || "No Email"}</span>
                    <span className="text-[9px] text-slate-400 font-mono uppercase">Durable Auth Email</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogOut}
                className="mt-6 w-full py-2.5 border border-red-200 text-red-650 rounded-xl hover:bg-red-50 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect Account
              </button>
            </div>

            <div className="p-4 bg-emerald-50/40 border border-emerald-150 rounded-xl text-[11px] text-emerald-800 space-y-1.5 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-650 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold block">Frictionless Phone login</span>
                <p className="text-emerald-650 leading-relaxed">
                  Your billing session connects securely via your mobile number on order checkpoints. No manual password management required!
                </p>
              </div>
            </div>
          </div>

          {/* FIRESTORE ORDERS LIST */}
          <div className="md:col-span-8 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <Package className="w-4.5 h-4.5 text-slate-600" /> Firestore Order Registries ({userOrders.length})
            </h3>

            {userOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mx-auto">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-sans uppercase">No Direct Orders Found Yet</h4>
                  <p className="text-xs text-slate-400 mt-1">Place an order directly from checkout to establish your Firestore tracking record.</p>
                </div>
                <button
                  onClick={() => onNavigate("shop")}
                  className="py-2 px-4 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-black inline-block cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userOrders.map((order: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs" id={`order-card-${order.id}`}>
                    <div className="bg-slate-50 px-4 py-3 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 block">ORDER ID</span>
                        <span className="font-mono font-black text-slate-850 text-xs sm:text-sm">{order.id}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                          order.orderStatus === "Delivered" 
                            ? "bg-emerald-100 text-emerald-800" 
                            : order.orderStatus === "Cancelled"
                              ? "bg-red-100 text-red-800" 
                              : "bg-blue-100 text-blue-800"
                        }`}>
                          Disp: {order.orderStatus}
                        </span>
                        <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
                          order.paymentStatus === "Paid" 
                            ? "bg-emerald-100 text-emerald-800" 
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          Pay: {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Products detail in order */}
                      <div className="space-y-2">
                        {order.items?.map((item: any, itemIdx: number) => (
                          <div key={itemIdx} className="flex justify-between text-xs text-slate-600">
                            <span>{item.title} (Size: {item.size}) <span className="font-mono text-slate-400">x{item.quantity}</span></span>
                            <span className="font-mono font-medium">৳{(item.price * item.quantity).toLocaleString()} BDT</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-450 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{order.date ? new Date(order.date).toLocaleDateString() : ""}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800">
                          Total Amount Paid: <span className="text-slate-900 font-mono text-sm">৳{order.totalAmount?.toLocaleString()}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => onNavigate("tracking", order.id)}
                        className="w-full mt-2 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded text-[10px] uppercase tracking-wider font-bold text-slate-600 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Track Shipment Logistics <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* LOGOUT VIEW - LOGIN FORM */
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900"></div>
          
          <div className="text-center space-y-2 mb-6">
            <h4 className="font-black text-lg text-slate-805 uppercase">Buyer Session Portal</h4>
            <p className="text-xs text-slate-500">Sign in using your mobile coordinates to pull your past orders live from Firestore.</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Asif Chowdhury"
                className="w-full p-2.5 border rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1">Mobile number *</label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 01719XXXXXX"
                className="w-full p-2.5 border rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1">Delivery Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Zone, Road No, Area Description"
                className="w-full p-2.5 border rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1">City *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-xs"
              >
                {bdCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {formError && (
              <p className="text-[10px] text-red-650 font-bold font-mono text-center">{formError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full py-3 bg-slate-900 text-white rounded-xl hover:bg-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-450 transition-all shadow-md"
            >
              {isSubmitting ? (
                <span>Establishing Firestore handshake...</span>
              ) : (
                <>
                  <span>Initialize Account Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
