import React from 'react';
import { Heart, MessageCircle, Eye, ShoppingBag, Check } from 'lucide-react';
import { Product } from '../types';
import { BOUTIQUE_INFO } from '../data/initialProducts';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isInCart: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onQuickView,
  onAddToCart,
  isInCart
}) => {
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanNumber = BOUTIQUE_INFO.primaryPhone.replace(/[^0-9]/g, '');
    const message = `Hello Yaarika Collections! I want to order the "${product.name}" (Code: ${product.code}) priced at ₹${product.price.toLocaleString('en-IN')}. Please share availability and payment details.`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      onClick={() => onQuickView(product)}
      className="group bg-[#fbf5e6] rounded-xl overflow-hidden border border-[#e5d29d] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
    >
      
      {/* Top Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f3e9cc]">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover object-top transition-all duration-500 ease-out ${
            product.images && product.images.length > 1 
              ? 'group-hover:opacity-0 group-hover:scale-105' 
              : 'group-hover:scale-105'
          }`}
        />

        {/* Secondary image preview on hover if multiple images available */}
        {product.images && product.images.length > 1 && (
          <img
            src={product.images[1]}
            alt={`${product.name} alternate view`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out group-hover:scale-105"
          />
        )}

        {/* Multiple Photos Badge */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
            <span>{product.images.length} photos</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.isNewArrival && (
            <span className="bg-[#e8a825] text-[#2c0512] font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-sm shadow-sm tracking-wider">
              NEW
            </span>
          )}
          {product.isBestseller && (
            <span className="bg-[#380718] text-[#f5d78a] font-semibold text-[10px] uppercase px-2.5 py-0.5 rounded-sm shadow-sm tracking-wider">
              BESTSELLER
            </span>
          )}
          {!product.inStock && (
            <span className="bg-rose-700 text-white font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-sm shadow-sm tracking-wider">
              SOLD OUT
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600 shadow-md border border-rose-300'
              : 'bg-[#fbf4de] text-stone-700 hover:text-rose-600 hover:bg-[#f5edd2] border border-[#dfc88c] shadow-sm'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
        </button>

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-stone-950/80 via-stone-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="bg-[#fbf4de] hover:bg-[#f5edd2] text-stone-800 border border-[#dfc88c] text-xs font-semibold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>

      </div>

      {/* Product Information Body */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3 text-left">
        <div>
          {/* Category & Product Code */}
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="font-semibold text-[#a46d23]">{product.category}</span>
            <span className="font-mono text-[11px] bg-[#f0e3be] px-1.5 py-0.5 rounded text-stone-700 border border-[#e5d39d]/60">
              {product.code}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-serif-luxury text-lg font-semibold text-stone-900 group-hover:text-[#380718] transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Fabric Note */}
          <p className="text-xs text-stone-600 line-clamp-1 mt-0.5">
            {product.fabric}
          </p>
        </div>

        {/* Pricing & Order Section */}
        <div className="pt-2 border-t border-[#e8d7a8]/70">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-bold text-lg text-stone-900 tabular-nums">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-xs text-stone-400 line-through tabular-nums">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                  {discountPercent}% OFF
                </span>
              </>
            )}
          </div>

          {/* WhatsApp Direct Order Button */}
          <button
            onClick={handleWhatsAppOrder}
            disabled={!product.inStock}
            className={`w-full text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer ${
              product.inStock
                ? 'bg-[#128c3e] hover:bg-[#0e7433] text-white shadow-emerald-900/10'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
            title="Order directly on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>{product.inStock ? 'Order on WhatsApp' : 'Sold Out'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
