import React, { useState, useEffect } from 'react';
import { 
  X, Heart, MessageCircle, ShoppingBag, ShieldCheck, 
  Truck, Sparkles, Check, ChevronLeft, ChevronRight, Image as ImageIcon 
} from 'lucide-react';
import { Product } from '../types';
import { BOUTIQUE_INFO } from '../data/initialProducts';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  isInCart: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  isInCart
}) => {
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Compute all available images (from 1 up to 5 images)
  const productImages = React.useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    return [product.image];
  }, [product]);

  // Reset image index when product changes
  useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
  }, [product?.id]);

  if (!product) return null;

  const currentImage = productImages[activeImageIndex] || product.image;

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
  };

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleWhatsAppOrder = () => {
    const cleanNumber = BOUTIQUE_INFO.primaryPhone.replace(/[^0-9]/g, '');
    const message = `Hello Yaarika Collections! I would like to place an order for:\n\n• Product: ${product.name}\n• Code: ${product.code}\n• Category: ${product.category}\n• Price: ₹${product.price.toLocaleString('en-IN')}\n• Quantity: ${quantity}\n\nPlease share payment details and dispatch timeframe for delivery.`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-stone-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-[#fbf5e6] rounded-2xl shadow-2xl overflow-hidden border border-[#dfc88c] my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-[#f4e8c7] hover:bg-[#ebdcae] text-stone-800 flex items-center justify-center transition-colors cursor-pointer border border-[#dfc88c]/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Left Column: Product Imagery Gallery (1 to 5 Images) */}
          <div className="bg-[#f5ebd2] relative flex flex-col items-center justify-center p-6 md:p-8 border-b md:border-b-0 md:border-r border-[#e5d39d]">
            {/* Main Image Frame */}
            <div className="relative aspect-[3/4] w-full max-w-sm rounded-xl overflow-hidden shadow-lg border-2 border-[#dfc88c] bg-[#ece0be] group">
              <img
                src={currentImage}
                alt={`${product.name} - view ${activeImageIndex + 1}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top transition-all duration-300"
              />
              
              <div className="absolute top-3 left-3 bg-[#380718] text-[#f5d78a] px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase">
                {product.category}
              </div>

              {/* Prev / Next Arrows if more than 1 image */}
              {productImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#fbf5e6] hover:bg-[#f5ebd2] text-stone-800 shadow-md border border-[#dfc88c] flex items-center justify-center transition-all opacity-90 group-hover:opacity-100 cursor-pointer"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#fbf5e6] hover:bg-[#f5ebd2] text-stone-800 shadow-md border border-[#dfc88c] flex items-center justify-center transition-all opacity-90 group-hover:opacity-100 cursor-pointer"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Photo Index Counter */}
                  <div className="absolute bottom-2.5 right-2.5 bg-stone-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {activeImageIndex + 1} / {productImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails Row (1 to 5 thumbnails) */}
            {productImages.length > 1 && (
              <div className="w-full max-w-sm mt-3 flex items-center justify-center gap-2 overflow-x-auto py-1">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-14 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-[#d4a341] ring-2 ring-amber-400/40 scale-105 shadow-sm'
                        : 'border-stone-300 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover object-top"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-stone-900/70 text-white text-[9px] text-center font-bold">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Purchasing & WhatsApp Order Desks */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Product Code & Stock status */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-[#a46d23]">
                  CODE: {product.code}
                </span>

                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  product.inStock 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {product.inStock ? '● In Stock' : '✕ Out of Stock'}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-serif-luxury text-2xl md:text-3xl font-semibold text-stone-900 leading-tight">
                {product.name}
              </h2>

              {/* Pricing */}
              <div className="flex items-baseline gap-3 mt-3">
                <span className="text-2xl md:text-3xl font-bold text-stone-900 tabular-nums">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-base text-stone-400 line-through tabular-nums">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      SAVE {discountPercent}%
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="mt-4 text-sm text-stone-600 leading-relaxed">
                {product.description}
              </p>

              {/* Specification Highlights */}
              <div className="mt-5 space-y-2 border-t border-b border-stone-100 py-3 text-xs text-stone-600">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Fabric & Weave:</span>
                  <span className="font-medium text-stone-800">{product.fabric}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Color Palette:</span>
                  <span className="font-medium text-stone-800">{product.color}</span>
                </div>
                {product.length && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Dimensions / Length:</span>
                    <span className="font-medium text-stone-800">{product.length}</span>
                  </div>
                )}
                {product.blouseIncluded !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Blouse Piece:</span>
                    <span className="font-medium text-stone-800">
                      {product.blouseIncluded ? 'Included (Matching / Contrast)' : 'Top / Tunic Included'}
                    </span>
                  </div>
                )}
              </div>

              {/* WhatsApp Desk Selection */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Direct Boutique WhatsApp Order Desk:
                </label>
                <div className="p-3 rounded-xl border border-[#dfc88c] bg-[#f5ebd2] text-xs space-y-1">
                  <div className="font-bold text-[11px] text-[#128c3e]">YAARIKA BOUTIQUE ORDER DESK</div>
                  <div className="font-mono text-sm text-stone-900 font-bold">{BOUTIQUE_INFO.primaryPhone}</div>
                  <div className="text-[10px] text-stone-600">Instant WhatsApp confirmation, live parcel dispatch & custom tailoring assistance</div>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-semibold text-stone-700">Quantity:</span>
                <div className="flex items-center border border-[#dfc88c] rounded-lg overflow-hidden bg-[#faf3df]">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1 bg-[#f0e2bd] hover:bg-[#e6d6ab] text-stone-800 font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3.5 py-1 font-bold text-xs tabular-nums text-stone-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-1 bg-[#f0e2bd] hover:bg-[#e6d6ab] text-stone-800 font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Actions: WhatsApp Order & Wishlist */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleWhatsAppOrder}
                className="w-full bg-[#128c3e] hover:bg-[#0e7433] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>ORDER ON WHATSAPP DESK</span>
              </button>

              <button
                onClick={() => onToggleWishlist(product)}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-xs border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isWishlisted
                    ? 'border-rose-400 bg-rose-50 text-rose-700'
                    : 'border-[#dfc88c] bg-[#faf3df] hover:bg-[#f3e7c8] text-stone-800 shadow-xs'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-rose-600' : 'text-stone-600'}`} />
                <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>

              {/* Kerala Trust markers */}
              <div className="flex items-center justify-around text-[11px] text-stone-600 pt-2 border-t border-[#e8d7a8]/70">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#128c3e]" />
                  <span>Free Kerala Delivery</span>
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>100% Handloom Certified</span>
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
