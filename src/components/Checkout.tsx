import React, { useState } from "react";
import { CreditCard, CheckCircle2, Copy, Percent, ShoppingBag, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { OrderItem, Promo } from "../types";
import { apiFetch } from "../api";
import { autoSignInAndRegisterByPhone, storeOrderInFirestore } from "../firebase";

interface CheckoutProps {
  basket: { productId: string; title: string; quantity: number; price: number; size: string; image: string }[];
  totalPrice: number;
  promos: Promo[];
  onOrderComplete: (orderData: any) => void;
  onCancel: () => void;
}

export default function Checkout({
  basket,
  totalPrice,
  promos,
  onOrderComplete,
  onCancel
}: CheckoutProps) {
  // Customer Details Form
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("Dhaka");
  const [paymentMethod, setPaymentMethod] = useState<"bKash" | "Nagad" | "Rocket" | "Card" | "COD">("COD");
  
  // Custom Validation Feedback States
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [approvedWarning, setApprovedWarning] = useState(false);

  // Promo discount states
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);
  const [promoError, setPromoError] = useState("");

  // Gateway Simulation State
  const [isSimulatingGateway, setIsSimulatingGateway] = useState(false);
  const [gatewayValue, setGatewayValue] = useState(""); // wallet number
  const [gatewayPin, setGatewayPin] = useState(""); // mockup passcode
  const [gatewayError, setGatewayError] = useState("");
  
  // Post submit loading
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Bangladesh Cities only
  const bdCities = [
    "Dhaka", "South Keraniganj", "Chittagong", "Sylhet", "Khulna", "Barisal", "Rajshahi", "Rangpur", "Mymensingh", "Comilla", "Narayanganj"
  ];

  // Coupon apply
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    const matched = promos.find(p => p.code.toLowerCase() === promoCodeInput.toLowerCase().trim() && p.active);

    if (matched) {
      setAppliedPromo(matched);
      setPromoCodeInput("");
    } else {
      setPromoError("Invalid or expired promotional code.");
    }
  };

  const discountAmount = appliedPromo
    ? appliedPromo.type === "fixed"
      ? appliedPromo.discount
      : Math.floor(totalPrice * (appliedPromo.discount / 100))
    : 0;

  const finalPrice = Math.max(0, totalPrice - discountAmount);

  // Main Submit handler (Triggers gateway simulation or direct COD lodgment)
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGatewayError("");
    setValidationError(null);
    setValidationWarning(null);

    if (!customerName || !customerPhone || !customerAddress || !customerCity) {
      setValidationError("Please fill in all the required checkout details.");
      return;
    }

    // Validation warning checks (Bangladesh specific format client warnings)
    const phoneTrimmed = customerPhone.trim().replace(/\s+/g, "");
    const isBDPhone = /^(\+?8801|01)[3-9]\d{8}$/.test(phoneTrimmed);
    
    let warning = "";
    if (!isBDPhone) {
      warning += "The phone number format does not seem to match a standard Bangladesh mobile (e.g., should start with +8801 or 01 and have 11 digits). ";
    }
    if (customerAddress.length < 15) {
      warning += "Your shipping address is quite short. Please ensure it has detailed instructions for delivery fulfillment.";
    }

    if (warning && !approvedWarning) {
      setValidationWarning(warning);
      return; // Wait for user acknowledgment via inline UI
    }

    submitCheckoutFlow();
  };

  const submitCheckoutFlow = () => {
    if (paymentMethod === "COD") {
      processFinalOrder();
    } else {
      // Launch Mobile / Card Gateway simulation flow
      setGatewayValue(customerPhone);
      setGatewayPin("");
      setIsSimulatingGateway(true);
    }
  };

  // Simulated Verification PIN confirmation
  const handleGatewayConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatewayValue || !gatewayPin) {
      setGatewayError("Both Wallet/Card number and PIN code are required.");
      return;
    }

    if (paymentMethod !== "Card" && gatewayPin.length < 4) {
      setGatewayError("Invalid transaction PIN. Standard mobile finance PIN contains 4-5 digits.");
      return;
    }

    setIsSimulatingGateway(false);
    processFinalOrder();
  };

  // Submit complete details to backend node server
  const processFinalOrder = async () => {
    setIsSubmittingOrder(true);
    setValidationError(null);
    const orderObj = {
      customerName,
      customerPhone,
      customerAddress,
      customerCity,
      items: basket,
      totalAmount: finalPrice,
      discountAmount,
      promoApplied: appliedPromo?.code,
      paymentMethod
    };

    try {
      const response = await apiFetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderObj)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Auto register / login customer with phone, and save order into Firestore database
        try {
          const fbUser = await autoSignInAndRegisterByPhone(
            customerPhone,
            customerName,
            customerAddress,
            customerCity
          );
          await storeOrderInFirestore(result.order, fbUser.uid);
        } catch (firebaseError) {
          console.error("Firebase synchronization background action failed:", firebaseError);
        }

        setIsSubmittingOrder(false);
        onOrderComplete(result.order);
      } else {
        const err = await response.json();
        setValidationError(err.error || "Order placement failed");
        setIsSubmittingOrder(false);
      }
    } catch {
      setValidationError("Could not process order placement on server.");
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" id="checkout-container-view">
      
      {/* Simulation overlay portal for bKash, Nagad, Rocket, Credit Cards */}
      {isSimulatingGateway && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl animate-scaleUp">
            
            {/* Header colors adapt based on payment chosen */}
            <div className={`p-6 text-white text-center ${
              paymentMethod === "bKash" 
                ? "bg-pink-650" 
                : paymentMethod === "Nagad" 
                  ? "bg-orange-550" 
                  : paymentMethod === "Rocket" 
                    ? "bg-violet-755" 
                    : "bg-gray-905"
            }`}>
              <span className="text-[10px] tracking-widest font-mono font-bold uppercase text-white/80 block">
                SSL COMMERZ SECURE PORTAL
              </span>
              <h4 className="text-xl font-bold flex items-center justify-center gap-2 mt-1">
                {paymentMethod} Gateway
              </h4>
              <p className="text-xs text-white/70 mt-1">
                Verify secure transaction checkout amount: <b>৳{finalPrice} BDT</b>
              </p>
            </div>

            <form onSubmit={handleGatewayConfirmSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">
                  {paymentMethod === "Card" ? "Enter 16-Digit Card Number *" : "Enter Mobile Wallet Number *"}
                </label>
                <input
                  type="text"
                  required
                  value={gatewayValue}
                  onChange={(e) => setGatewayValue(e.target.value)}
                  placeholder={paymentMethod === "Card" ? "4000 1234 5678 9010" : "0171XXXXXXX"}
                  className="w-full p-2.5 border rounded-lg text-sm font-mono text-center tracking-widest bg-gray-50 font-bold focus:ring-1 focus:ring-gray-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">
                  {paymentMethod === "Card" ? "CVV / Security PIN *" : "Secure Account PIN *"}
                </label>
                <input
                  type="password"
                  required
                  value={gatewayPin}
                  onChange={(e) => setGatewayPin(e.target.value)}
                  placeholder="••••"
                  maxLength={6}
                  className="w-full p-2.5 border rounded-lg text-sm text-center tracking-widest bg-gray-50 font-bold font-mono focus:ring-1 focus:ring-gray-700"
                />
              </div>

              {gatewayError && (
                <p className="text-[10px] text-red-650 font-bold font-mono text-center">{gatewayError}</p>
              )}

              <p className="text-[10px] text-gray-450 leading-relaxed text-center">
                🛡️ Transacting through encrypted merchant token. KHALAB does not hold or store passwords. Verified address check in Dhaka, Bangladesh.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="submit"
                  className="py-2.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-all cursor-pointer"
                >
                  Verify & Pay ৳{finalPrice}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSimulatingGateway(false)}
                  className="py-2.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-55"
                >
                  Cancel Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Form workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Billing details card */}
        <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-gray-50 pb-3">
            <h4 className="font-extrabold text-lg text-gray-950">Shipment & Delivery Details</h4>
            <p className="text-xs text-gray-550">We ship exclusively within Bangladesh. Standard delivery is 1-3 days.</p>
          </div>

          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            
            {/* Customer credentials */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">Shopper Full Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Asif Chowdhury"
                className="w-full p-2.5 border rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">Mobile Telephone Contact *</label>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 01719XXXXXX (Must be valid BD phone)"
                className="w-full p-2.5 border rounded-lg text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">Shipping City *</label>
                <select
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs"
                >
                  {bdCities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">Nation</label>
                <input
                  type="text"
                  disabled
                  value="Bangladesh"
                  className="w-full p-2.5 border rounded-lg text-xs bg-gray-50 font-bold cursor-not-allowed text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-500 font-bold mb-1">Full Delivery Address *</label>
              <textarea
                rows={3}
                required
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="House no, road, zone, keraniganj, dhaka e.t.c (Minimum 15 characters detail)"
                className="w-full p-2.5 border rounded-lg text-xs"
              ></textarea>
            </div>

            {/* Secure Payment System Choices */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <span className="block text-xs font-bold text-gray-900">Choose Secure Payment Channel</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                
                {/* Cash on delivery */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={`p-3 border rounded-xl text-left flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === "COD" 
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]" 
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs text-gray-950 block">Cash On Delivery (COD)</span>
                    <span className="text-[10px] text-gray-405 block">Pay in cash inside all 64 districts</span>
                  </div>
                  <CheckCircle2 className={`w-4 h-4 text-[var(--primary)] ${paymentMethod === "COD" ? "opacity-100" : "opacity-0"}`} />
                </button>

                {/* bKash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bKash")}
                  className={`p-3 border rounded-xl text-left flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === "bKash" 
                      ? "border-pink-500 bg-pink-50/10 ring-1 ring-pink-500" 
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs text-pink-650 block">bKash Finance</span>
                    <span className="text-[10px] text-gray-405 block">Direct mobile wallet extraction</span>
                  </div>
                  <CheckCircle2 className={`w-4 h-4 text-pink-650 ${paymentMethod === "bKash" ? "opacity-100" : "opacity-0"}`} />
                </button>

                {/* Nagad */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("Nagad")}
                  className={`p-3 border rounded-xl text-left flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === "Nagad" 
                      ? "border-orange-500 bg-orange-50/10 ring-1 ring-orange-450" 
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs text-orange-655 block">Nagad Wallet</span>
                    <span className="text-[10px] text-gray-450 block">100% instant payment verification</span>
                  </div>
                  <CheckCircle2 className={`w-4 h-4 text-orange-655 ${paymentMethod === "Nagad" ? "opacity-100" : "opacity-0"}`} />
                </button>

                {/* Cards */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("Card")}
                  className={`p-3 border rounded-xl text-left flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === "Card" 
                      ? "border-indigo-500 bg-indigo-50/10 ring-1 ring-indigo-550" 
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs text-indigo-700 block">Credit / Debit Card</span>
                    <span className="text-[10px] text-gray-450 block">VISA, MasterCard, AMEX support</span>
                  </div>
                  <CheckCircle2 className={`w-4 h-4 text-indigo-700 ${paymentMethod === "Card" ? "opacity-100" : "opacity-0"}`} />
                </button>

              </div>
            </div>

            {/* Dynamic Validation Alerts */}
            {(validationError || validationWarning) && (
              <div className="space-y-3 pt-3">
                {validationError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs space-y-1 animate-fadeIn">
                    <p className="font-extrabold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      ❌ Validation Error
                    </p>
                    <p className="leading-relaxed font-semibold">{validationError}</p>
                  </div>
                )}
                {validationWarning && (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs space-y-2.5 animate-fadeIn">
                    <p className="font-extrabold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                      ⚠️ Contact Quality Warning
                    </p>
                    <p className="leading-relaxed font-semibold">{validationWarning}</p>
                    <div className="flex gap-2">
                       <button
                         type="button"
                         onClick={() => {
                           setApprovedWarning(true);
                           setValidationWarning(null);
                           // Bypass triggering placement
                           if (paymentMethod === "COD") {
                             processFinalOrder();
                           } else {
                             setGatewayValue(customerPhone);
                             setGatewayPin("");
                             setIsSimulatingGateway(true);
                           }
                         }}
                         className="px-3 py-1.5 bg-amber-750 hover:bg-amber-800 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                       >
                         Proceed anyway
                       </button>
                       <button
                         type="button"
                         onClick={() => setValidationWarning(null)}
                         className="px-3 py-1.5 border border-amber-300 text-amber-850 hover:bg-amber-100/50 font-semibold rounded-lg text-[10px] transition-all cursor-pointer"
                       >
                         Edit details
                       </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex gap-3">
              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="flex-1 py-3 bg-[var(--primary)] text-white text-xs font-extrabold uppercase rounded-lg hover:opacity-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:bg-gray-400"
              >
                {isSubmittingOrder ? (
                  <span>Encrypting data & lodging order...</span>
                ) : (
                  <>
                    <span>Confirm Order & Proceed</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-3 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50"
              >
                Back to Cart
              </button>
            </div>
          </form>
        </div>

        {/* Order review sidebar */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
            <h5 className="font-bold text-sm text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
              <ShoppingBag className="w-4.5 h-4.5 text-[var(--primary)]" /> Packing Cart Review
            </h5>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {basket.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-gray-900 block leading-tight">{item.title}</span>
                    <span className="text-[10px] text-gray-455 font-mono">Size Selected: {item.size} x {item.quantity}</span>
                  </div>
                  <span className="font-mono text-gray-700">৳{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Coupons field */}
            <form onSubmit={handleApplyPromo} className="pt-3 border-t border-gray-200 space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-450 font-bold">Apply Coupon discount</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  placeholder="e.g. KHALAB500"
                  className="flex-1 p-2 border bg-white rounded-lg text-xs uppercase font-mono font-bold focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-905 text-white text-xs font-bold rounded-lg hover:bg-black cursor-pointer"
                >
                  Verify
                </button>
              </div>
              {appliedPromo && (
                <p className="text-[11px] text-emerald-650 font-bold flex items-center gap-1 font-sans">
                  ✓ Code applied: <b>{appliedPromo.code}</b> ({appliedPromo.type === "fixed" ? `৳${appliedPromo.discount} Off` : `${appliedPromo.discount}% Off`})
                </p>
              )}
              {promoError && (
                <p className="text-[10px] text-red-655 font-bold font-mono">{promoError}</p>
              )}
            </form>

            <div className="pt-3 border-t border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Sub-total BDT:</span>
                <span className="font-mono">৳{totalPrice.toLocaleString()}</span>
              </div>
              
              {appliedPromo && (
                <div className="flex justify-between text-emerald-650 font-bold">
                  <span>Coupon Discount:</span>
                  <span className="font-mono">-৳{discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-500">
                <span>Bangladesh Courier:</span>
                <span className="font-bold text-gray-900 font-mono">FREE SHIPPING</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-gray-200 text-sm">
                <span className="font-bold text-gray-900">Grand Total Payable BDT:</span>
                <span className="font-mono font-extrabold text-base text-[var(--primary)]">
                  ৳{finalPrice.toLocaleString()} BDT
                </span>
              </div>
            </div>

          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-150 rounded-xl text-[11px] text-emerald-700 space-y-1.5 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-650 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">100% Secure SSL Handshakes</span>
              <p className="text-emerald-600 leading-normal">
                Checkout and delivery tracking are fully monitored with integrated automated fraud risk algorithms. Protects customers from fake spam ordering duplicate tapes.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
