import React, { useState, useEffect } from "react";
import { Search, MapPin, Truck, Check, HelpCircle, Phone, ArrowLeft, PackageCheck } from "lucide-react";
import { Order, AppConfig } from "../types";
import { apiFetch } from "../api";

interface OrderTrackingProps {
  config: AppConfig;
  defaultOrderId?: string;
  onBack: () => void;
}

export default function OrderTracking({ config, defaultOrderId, onBack }: OrderTrackingProps) {
  const [trackIdInput, setTrackIdInput] = useState(defaultOrderId || "");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [searchError, setSearchError] = useState("");

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackIdInput.trim()) return;

    setLoading(true);
    setSearchError("");
    setOrder(null);

    apiFetch(`/api/orders/track/${trackIdInput.trim().toUpperCase()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Invalid tracking ID. Order not found.");
        }
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        setSearchError(err.message || "Could not resolve order tracking.");
        setLoading(false);
      });
  };

  // Auto trigger tracking if default ID shifted
  useEffect(() => {
    if (defaultOrderId) {
      setTrackIdInput(defaultOrderId);
      setLoading(true);
      apiFetch(`/api/orders/track/${defaultOrderId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Invalid tracking ID");
          }
          return res.json();
        })
        .then((data) => {
          setOrder(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [defaultOrderId]);

  // Track state markers
  const getStatusStep = (status: string) => {
    const steps = ["Pending", "Processing", "Shipped", "Delivered"];
    return steps.indexOf(status);
  };

  const currentStep = order ? getStatusStep(order.orderStatus) : -1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10" id="order-tracking-view">
      
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[var(--primary)] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Return to catalog
      </button>

      <div className="bg-white border border-gray-150 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Title details */}
        <div className="text-center space-y-2 border-b border-gray-100 pb-5">
          <span className="text-4xl">📦</span>
          <h3 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight">KHALAB Courier Tracking Station</h3>
          <p className="text-xs text-gray-550 max-w-md mx-auto">
            Input the ORD-XXXXXX sequence printed on your payment receipt to verify real-time processing and dispatch details.
          </p>
        </div>

        {/* Tracking Input field */}
        <form onSubmit={handleTrackSubmit} className="flex gap-2 max-w-lg mx-auto">
          <input
            type="text"
            required
            value={trackIdInput}
            onChange={(e) => setTrackIdInput(e.target.value)}
            placeholder="e.g. ORD-102584"
            className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-mono font-bold uppercase tracking-wider text-center focus:border-[var(--primary)] focus:outline-hidden bg-gray-50/50"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 hover:opacity-95"
          >
            <Search className="w-4 h-4" /> Track Status
          </button>
        </form>

        {loading && (
          <p className="text-center text-xs text-gray-400 font-bold animate-pulse font-mono py-4">
            Securing SSL socket and pulling tracking metrics...
          </p>
        )}

        {searchError && (
          <p className="text-center text-xs text-red-650 font-bold font-mono bg-red-50 p-2.5 rounded-lg border border-red-200">
            ⚠ {searchError}
          </p>
        )}

        {/* Tracking metrics view */}
        {order && (
          <div className="space-y-8 pt-4 animate-scaleUp">
            
            {/* Visual Tracking Progress Indicator */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-gray-400 block text-center">
                Delivery Tracker Progress Bar
              </span>

              {order.orderStatus === "Cancelled" ? (
                <div className="p-4 bg-red-50/60 border border-red-200 text-red-700 rounded-xl text-center">
                  <span className="text-sm font-bold block">🚨 Order Dispatch Cancelled / Voided</span>
                  <p className="text-xs text-red-650 leading-relaxed mt-1">
                    This order has been voided. Contact the KHALAB warehouse team on WhatsApp if you suspect this is error.
                  </p>
                </div>
              ) : (
                <div className="relative flex justify-between items-center max-w-md mx-auto py-5">
                  
                  {/* Connecting background progress line */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0">
                    <div
                      className="h-full bg-[var(--primary)] transition-all duration-500"
                      style={{ width: `${(currentStep / 3) * 100}%` }}
                    ></div>
                  </div>

                  {/* Pending Step 0 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                      currentStep >= 0 
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]" 
                        : "bg-white text-gray-400 border-gray-200"
                    }`}>
                      {currentStep > 0 ? "✓" : "1"}
                    </div>
                    <span className="text-[10px] font-bold text-gray-900 mt-1">Pending</span>
                  </div>

                  {/* Processing Step 1 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                      currentStep >= 1 
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]" 
                        : "bg-white text-gray-400 border-gray-200"
                    }`}>
                      {currentStep > 1 ? "✓" : "2"}
                    </div>
                    <span className="text-[10px] font-bold text-gray-900 mt-1">Packing</span>
                  </div>

                  {/* Shipped Step 2 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                      currentStep >= 2 
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]" 
                        : "bg-white text-gray-400 border-gray-200"
                    }`}>
                      {currentStep > 2 ? "✓" : "3"}
                    </div>
                    <span className="text-[10px] font-bold text-gray-900 mt-1">Shipped</span>
                  </div>

                  {/* Delivered Step 3 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                      currentStep >= 3 
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]" 
                        : "bg-white text-gray-400 border-gray-200"
                    }`}>
                      {currentStep === 3 ? "✓" : "4"}
                    </div>
                    <span className="text-[10px] font-bold text-gray-900 mt-1">Delivered</span>
                  </div>

                </div>
              )}
            </div>

            {/* Receipt Summary block */}
            <div className="bg-gray-50/50 p-6 rounded-xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-bold text-gray-900">Receipt Details:</span>
                <span className="text-xs font-mono font-extrabold text-white bg-[var(--primary)] px-2 py-0.5 rounded-sm animate-pulse">
                  {order.id}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
                <div className="space-y-2">
                  <p>
                    <b>Shopper Name:</b> {order.customerName}
                  </p>
                  <p>
                    <b>Shipping Destination:</b> {order.customerAddress} ({order.customerCity})
                  </p>
                  <p>
                    <b>Payment:</b> {order.paymentMethod} (Status: <b>{order.paymentStatus}</b>)
                  </p>
                </div>
                <div className="space-y-1 bg-white p-3 rounded-lg border">
                  <span className="block text-[10px] uppercase font-mono text-gray-400 font-bold mb-1">Items Dispatching:</span>
                  {order.items.map((it, index) => (
                    <div key={index} className="flex justify-between font-medium">
                      <span>• {it.title} ({it.size}) x{it.quantity}</span>
                      <span className="font-mono text-gray-900">৳{(it.price * it.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-1 border-t text-sm font-bold text-[var(--primary)]">
                    <span>Total Paid ৳:</span>
                    <span>৳{order.totalAmount.toLocaleString()} BDT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assistance Contact Block */}
            <div className="p-4 bg-blue-50 border border-blue-150 rounded-xl flex items-start gap-3">
              <HelpCircle className="text-blue-500 w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-755 leading-normal space-y-1">
                <span className="font-bold block">Need immediate shipment adjustments?</span>
                <p>
                  Contact KHALAB customer care. Direct telephone: <b>{config.mobile}</b>. Direct WhatsApp can be resolved instantly.
                </p>
                <a
                  href={`https://wa.me/${config.whatsapp?.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-1 font-bold text-[var(--primary)] underline hover:text-black"
                >
                  Message KHALAB WhatsApp Support Hub
                </a>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
