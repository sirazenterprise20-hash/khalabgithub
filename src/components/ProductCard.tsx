import { Star, Video, Eye } from "lucide-react";
import { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onViewDetails: (id: string) => void;
  key?: any;
}

export default function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const isOutOfStock = product.inventory <= 0;
  const isLimited = !isOutOfStock && product.inventory <= 5;

  return (
    <div
      onClick={() => onViewDetails(product.id)}
      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 group hover:shadow-xs transition-all duration-200 cursor-pointer"
      id={`product-card-${product.id}`}
    >
      {/* Product Image Stage with precise 4/5 aspect ratio */}
      <div className="aspect-[4/5] bg-slate-100 rounded-lg overflow-hidden relative">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-mono">
            No Image Aspect
          </div>
        )}

        {/* Video simulation badge */}
        {product.videos && product.videos.length > 0 && (
          <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1">
            <Video className="w-2.5 h-2.5" /> Cinema
          </span>
        )}

        {/* Stock Status Badge */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-slate-900 text-white text-[8px] font-bold px-2 py-1 rounded uppercase tracking-wider">
              SOLD OUT
            </span>
          </div>
        ) : isLimited ? (
          <div className="absolute top-2 right-2 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
            ONLY {product.inventory} LEFT
          </div>
        ) : (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
            In Stock
          </div>
        )}
      </div>

      {/* Description Content & Geometric layout alignment */}
      <div className="flex flex-col flex-1 justify-between gap-2">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-tight group-hover:text-slate-950 transition-colors line-clamp-1">
              {product.title}
            </h4>
            <p className="text-[10px] text-slate-500 font-medium italic mt-0.5 truncate">
              {product.category} {product.catalog ? `/ ${product.catalog}` : ''}
            </p>
          </div>
          <p className="font-bold text-slate-900 text-sm sm:text-base italic underline decoration-slate-300 font-mono shrink-0">
            ৳{product.price.toLocaleString()}
          </p>
        </div>

        {/* Meta rating block */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
          <div className="flex items-center text-amber-500">
            <Star className="w-3 h-3 fill-current" />
            <span className="ml-1 text-slate-700 font-semibold">{product.rating}</span>
            <span className="text-[9px] text-slate-400 ml-1">({product.reviewCount || 0})</span>
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </div>
  );
}
