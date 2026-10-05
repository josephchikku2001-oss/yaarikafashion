import React from 'react';
import { X, Heart, ShoppingBag, Trash2, ArrowRight, MessageCircle } from 'lucide-react';
import { Product } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRemoveWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  products,
  onRemoveWishlist,
  onAddToCart
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#fbf5e6] shadow-2xl flex flex-col justify-between border-l border-[#dfc88c]">
          
          {/* Header */}
          <div className="p-4 md:p-6 bg-[#380718] text-white flex items-center justify-between border-b border-amber-900/40">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-300 fill-amber-300" />
              <h2 className="font-serif-luxury text-xl font-semibold tracking-wide text-[#f5d78a]">
                Saved Favorites ({products.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-stone-300 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {products.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
                <Heart className="w-12 h-12 text-amber-800/20 mb-3" />
                <p className="font-serif-luxury text-lg text-stone-800">Your wishlist is empty</p>
                <p className="text-xs text-stone-500 mt-1 max-w-xs">
                  Save pieces you love to track availability and place instant custom orders.
                </p>
              </div>
            ) : (
              products.map((item) => (
                <div 
                  key={item.id}
                  className="flex gap-3 p-3 bg-[#f5ebd2] rounded-xl border border-[#dfc88c] relative shadow-xs"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-20 object-cover object-top rounded-lg bg-stone-200 shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between text-left">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-[#a46d23] font-bold">
                          {item.code}
                        </span>
                        <button
                          onClick={() => onRemoveWishlist(item)}
                          className="text-stone-400 hover:text-rose-600 transition-colors"
                          title="Remove from Wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-serif-luxury font-semibold text-sm text-stone-900 line-clamp-1 mt-0.5">
                        {item.name}
                      </h4>
                      <p className="text-xs font-bold text-stone-900 mt-0.5 tabular-nums">
                        ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        onClick={() => {
                          const message = `Hello Yaarika Collections! I would like to order "${item.name}" (Code: ${item.code}) from my wishlist. Price: ₹${item.price.toLocaleString('en-IN')}.`;
                          window.open(`https://wa.me/919744415277?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-xs bg-[#128c3e] hover:bg-[#0e7433] text-white px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        <span>Order via WhatsApp</span>
                      </button>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-[#fbf5e6] border-t border-[#dfc88c] text-center">
            <button
              onClick={onClose}
              className="text-xs font-bold text-stone-700 hover:text-stone-900 cursor-pointer"
            >
              Continue Browsing
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
