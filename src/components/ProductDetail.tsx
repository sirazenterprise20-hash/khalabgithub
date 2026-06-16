import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Video, ArrowLeft, ShoppingCart, User, PlusCircle, Check, Info } from "lucide-react";
import { Product, Review } from "../types";
import ProductCard from "./ProductCard";

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, size: string) => void;
  onViewProduct: (id: string) => void;
}

export default function ProductDetail({
  product,
  onBack,
  onAddToCart,
  onViewProduct
}: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  // Review Form States
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  
  // Custom Toast/Validation states
  const [sizeError, setSizeError] = useState("");
  const [addedNotice, setAddedNotice] = useState("");

  // Load reviews and recommended products
  useEffect(() => {
    // 1. Fetch Reviews
    fetch(`/api/reviews?productId=${product.id}`)
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => setReviews(data))
      .catch((err) => console.error("Error loading reviews:", err));

    // 2. Manage Browsing History and fetch personalized recommendations
    let history: string[] = [];
    try {
      const stored = localStorage.getItem("khalab_history");
      if (stored) {
        history = JSON.parse(stored);
      }
    } catch {
      history = [];
    }

    // Add current product to history if not exists
    if (!history.includes(product.id)) {
      history = [product.id, ...history].slice(0, 10); // Keep last 10 viewed
      localStorage.setItem("khalab_history", JSON.stringify(history));
    }

    // Fetch recommendations based on this history
    fetch(`/api/products?recommendations=true&history=${encodeURIComponent(JSON.stringify(history))}`)
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => setRecommendations(data.filter((p: Product) => p.id !== product.id)))
      .catch((err) => console.error("Error loading recommendations:", err));

    // Reset quantity and default size selection
    setQuantity(1);
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
  }, [product]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          userName: reviewName,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReviews([data.review, ...reviews]);
        setReviewSubmitted(true);
        setReviewComment("");
        setReviewName("");
        setTimeout(() => setReviewSubmitted(false), 4000);
      }
    } catch (err) {
      setSizeError("Could not submit review at this moment. Please check backend connection.");
    }
  };

  const handleCartSubmit = () => {
    setSizeError("");
    setAddedNotice("");
    if (!selectedSize) {
      setSizeError("Please select a sizing option first!");
      return;
    }
    onAddToCart(product, quantity, selectedSize);
    setAddedNotice(`✓ ${product.title} (${selectedSize}) x ${quantity} added to basket!`);
    setTimeout(() => setAddedNotice(""), 4050);
  };

  const isOutOfStock = product.inventory <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="product-detail-view">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[var(--primary)] transition-colors cursor-pointer"
        id="btn-detail-back"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Storefront
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Media Block (Images and video) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-2/3 bg-gray-50 border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image Preview</div>
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                <span className="bg-red-650 text-white font-black text-xs uppercase tracking-widest px-6 py-2.5 rounded-sm">
                  SOLD OUT
                </span>
              </div>
            )}
          </div>

          {/* Cinematic Showcase Video Player */}
          {product.videos && product.videos.length > 0 && (
            <div className="p-4 bg-gray-900 border border-gray-800 text-white rounded-xl space-y-3 shadow-md">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-indigo-405 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-400 shrink-0" />
                Catwalk Cinematic Simulation Loop
              </span>
              <p className="text-[11px] text-gray-400">
                Witness fabric drape details in mock fluid video format.
              </p>
              
              {/* Actual Video or Video Placeholder */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center relative border border-gray-800">
                {product.videos[0].endsWith(".mp4") || product.videos[0].includes("video") ? (
                  <video
                    src={product.videos[0]}
                    controls
                    loop
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <span className="text-4xl">🎬</span>
                    <p className="text-xs text-gray-500 font-mono truncate max-w-sm">{product.videos[0]}</p>
                    <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-sm">Custom catwalk linked</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Configurations Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold tracking-widest text-gray-400 bg-gray-100 p-1 rounded-sm uppercase inline-block">
              {product.catalog} — {product.category}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight leading-none">
              {product.title}
            </h3>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="ml-1 text-gray-900 font-extrabold text-sm">{product.rating}</span>
              </div>
              <span className="text-gray-200">|</span>
              <span className="text-xs text-gray-500 font-medium">({reviews.length} Verified Reviews)</span>
            </div>
          </div>

          <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl">
            <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider font-bold block">BDT MRP PRICE</span>
            <span className="text-3xl font-black text-gray-950 font-mono leading-none mt-1">
              ৳{product.price.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 block mt-1">Inclusive of all Bangladesh shopping VAT/taxes</span>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold font-mono text-gray-400 uppercase">Premium Details</h5>
            <p className="text-xs text-gray-700 leading-relaxed">
              {product.description || "The finest premium selections, dapper fabrics, and detailed fittings styled entirely in Dhaka, Bangladesh."}
            </p>
          </div>

          {/* Sizing Charts selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-900">Select Sizing Option</span>
              <span className="text-gray-400 italic">Exchanges on doorstep</span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {product.sizes.map((sz) => {
                const isSelected = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSize(sz)}
                    className={`py-2 px-4 border rounded-md text-xs font-mono font-bold transition-all uppercase cursor-pointer ${
                      isOutOfStock
                        ? "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed"
                        : isSelected
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Adding parameters */}
          {!isOutOfStock && (
            <div className="pt-4 border-t border-gray-50 flex items-center gap-4">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2.5 text-gray-600 hover:bg-gray-50 focus:outline-hidden cursor-pointer"
                >
                  -
                </button>
                <span className="px-5 text-sm font-bold font-mono text-gray-950">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))}
                  className="px-3.5 py-2.5 text-gray-600 hover:bg-gray-50 focus:outline-hidden cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleCartSubmit}
                className="flex-1 py-3 px-6 bg-[var(--primary)] text-white text-xs font-extrabold uppercase rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <ShoppingCart className="w-4 h-4" /> Add to Shopping Bag
              </button>
            </div>
          )}

          {/* Inline notification error and success alerts */}
          {sizeError && (
            <div className="p-3 bg-red-50 border border-red-150 text-red-750 text-xs font-semibold rounded-lg animate-fadeIn">
              ⚠️ {sizeError}
            </div>
          )}
          {addedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs font-bold rounded-lg animate-fadeIn">
              {addedNotice}
            </div>
          )}

          {/* Real-time Inventory counter safety */}
          <div className="text-[11px] text-gray-550 flex items-center gap-1 bg-blue-50/50 p-2.5 rounded-lg border border-blue-150/50">
            <Info className="w-3.5 h-3.5 text-blue-550" />
            {isOutOfStock ? (
              <span className="text-red-650 font-bold">This apparel structure is temporarily outstanding. Replenishing soon.</span>
            ) : (
              <span>Real-time Stock Protection: Only <span className="font-bold text-gray-950 font-mono">{product.inventory}</span> units remain allocated.</span>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Tab Layout */}
      <div className="mt-14 border-t border-gray-150 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Review list */}
        <div className="lg:col-span-7 space-y-6">
          <h4 className="font-bold text-lg text-gray-950 flex items-center gap-1.5">
            <MessageSquare className="w-5 h-5 text-[var(--primary)]" />
            Verified Customer Reviews ({reviews.length})
          </h4>

          <div className="space-y-4 divide-y divide-gray-50">
            {reviews.length === 0 ? (
              <p className="text-xs text-gray-405 italic">Be the first to submit a premium review for this outfit design...</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-900 flex items-center gap-1.5 leading-none">
                      <User className="w-3.5 h-3.5 text-gray-400 bg-gray-100 rounded-full" />
                      {r.userName}
                    </span>
                    <span className="text-[10px] text-gray-405 font-mono">{r.date}</span>
                  </div>
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < r.rating ? "fill-current" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-655 leading-relaxed italic">{r.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submit Review Form */}
        <div className="lg:col-span-5 bg-gray-50/55 p-5 rounded-xl border border-gray-150 space-y-4">
          <h5 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-[var(--primary)]" /> Share Your Styling Feeling
          </h5>
          <p className="text-[11px] text-gray-550 leading-relaxed">
            Your reviews are vital to Bangladesh community. Help others discover premium fittings!
          </p>

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div>
              <span className="block text-[11px] font-mono uppercase tracking-wider text-gray-450 font-bold mb-1">Your Full Name *</span>
              <input
                type="text"
                required
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                placeholder="e.g. Shakil Ahmed"
                className="w-full p-2.5 border bg-white rounded-lg text-xs"
              />
            </div>

            <div>
              <span className="block text-[11px] font-mono uppercase tracking-wider text-gray-450 font-bold mb-1">Rating Grade</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1 cursor-pointer focus:outline-hidden"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= reviewRating ? "text-amber-400 fill-current" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-mono uppercase tracking-wider text-gray-450 font-bold mb-1">Your Feedback Comment *</span>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Detailed fits, quality, stitching feeling..."
                className="w-full p-2.5 border bg-white rounded-lg text-xs"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-gray-950 text-white text-xs font-bold rounded-lg hover:bg-gray-850 duration-200 cursor-pointer"
            >
              Post Verification Review
            </button>

            {reviewSubmitted && (
              <p className="text-[11px] text-emerald-650 font-bold animate-pulse text-center">🏆 Your review catalog sync has been updated successfully!</p>
            )}
          </form>
        </div>
      </div>

      {/* Personalized recommendation carousel engine layout */}
      {recommendations.length > 0 && (
        <div className="mt-16 border-t border-gray-150 pt-10 space-y-6">
          <div className="text-center md:text-left">
            <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-650 uppercase bg-indigo-50 py-1 px-3 rounded-full inline-block">
              PERSONALIZED RECOMMENDATION FOR YOU
            </span>
            <h4 className="text-xl font-extrabold text-gray-950 mt-2 tracking-tight">
              Completes Your Premium Wardrobe
            </h4>
            <p className="text-xs text-gray-500">
              Smart algorithms suggested these styles based on your active clothing browsing history.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {recommendations.slice(0, 4).map((recProd) => (
              <ProductCard
                key={recProd.id}
                product={recProd}
                onViewDetails={onViewProduct}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
