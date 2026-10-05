import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, Sparkles, Search, X } from 'lucide-react';
import { ProductCategory } from '../types';
import { BOUTIQUE_INFO } from '../data/initialProducts';
import { YaarikaLogo } from './YaarikaLogo';

interface HeaderProps {
  activeCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  onOpenAdmin: () => void;
}

const CATEGORIES: ProductCategory[] = [
  'All',
  'Traditional Sarees',
  'Co-ord Sets',
  'Churidar Sets',
  'Fusion Wear'
];

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  wishlistCount,
  onOpenWishlist,
  onOpenAdmin
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // 5-click secret trigger for Admin login
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      window.scrollTo(0, 0);
      onOpenAdmin();
      return;
    }

    // Reset counter if user stops clicking for 3 seconds
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 3000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  const openWhatsApp = (phone: string, text: string) => {
    const cleanNumber = phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="w-full select-none">
      {/* Top Announcement Bar */}
      <div className="bg-[#24030d] text-amber-200 border-b border-amber-900/40 text-xs px-4 md:px-8 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold tracking-wider text-[11px] md:text-xs text-amber-300">
          <span className="text-amber-400 animate-pulse">🌟</span>
          <span>{BOUTIQUE_INFO.shippingPolicy}</span>
        </div>

        <button
          onClick={() => openWhatsApp(BOUTIQUE_INFO.primaryPhone, 'Hello Yaarika Collections! I would like to inquire about your handloom boutique catalog.')}
          className="flex items-center gap-1.5 bg-[#1eb853] hover:bg-[#199d46] text-white px-3 py-1 rounded-full text-[11px] md:text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
          <span>WHATSAPP: {BOUTIQUE_INFO.primaryPhone}</span>
        </button>
      </div>

      {/* Main Royal Maroon Header Bar */}
      <div className="bg-[#380718] text-white px-4 md:px-10 py-6 border-b border-[#520d26] shadow-xl relative overflow-hidden">
        {/* Subtle royal background glow pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,163,65,0.15),transparent_70%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center">
          
          {/* Top Row: Center Wordmark & Right Wishlist */}
          <div className="w-full flex items-center justify-between mb-6">
            
            {/* Left Spacer to keep logo centered */}
            <div className="w-20 hidden sm:block" />

            {/* Center: Monogram & Logo (Click 5 times for Admin Login) */}
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-3 cursor-pointer group active:scale-[0.98] transition-transform mx-auto sm:mx-0"
              title="Yaarika Collections"
            >
              {/* Circular Emblem with YA Monogram & Leaf Flourish */}
              <YaarikaLogo size="md" className="group-hover:scale-105" />

              {/* Brand Wordmark & Collections subline */}
              <div className="flex flex-col items-center md:items-start text-center">
                <span className="font-serif-luxury text-2xl md:text-3xl lg:text-4xl font-semibold tracking-wide text-[#f5d78a] drop-shadow-sm group-hover:text-amber-200 transition-colors">
                  Yaarika
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-[1px] w-6 bg-[#d4a341]/60"></div>
                  <span className="font-display text-[9px] md:text-[10px] tracking-[0.28em] text-[#e0b769] font-medium uppercase">
                    COLLECTIONS
                  </span>
                  <div className="h-[1px] w-6 bg-[#d4a341]/60"></div>
                </div>
              </div>
            </div>

            {/* Right: Wishlist button */}
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={onOpenWishlist}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full border border-[#d4a341]/50 bg-[#2d0514]/70 hover:bg-[#520d26] text-[#f5d78a] transition-all relative cursor-pointer shadow-sm"
                title="View Wishlist"
              >
                <Heart className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">WISHLIST</span>
                {wishlistCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#e5b85a] text-[#380718] font-bold text-[10px] flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>
            </div>

          </div>

          {/* Centered Search Bar in Light Gold Theme */}
          <form 
            onSubmit={handleSearchSubmit}
            className="w-full max-w-2xl relative mb-6"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  onSearchChange(e.target.value);
                }}
                placeholder="Search Sarees, Co-ords, Churidars, Kurtis, Codes..."
                className="w-full bg-[#fcf8ec] text-stone-900 placeholder:text-stone-500 pl-6 pr-28 py-3.5 rounded-full text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#d4a341] shadow-lg border border-[#e5d4a6]"
              />
              
              {localSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-28 text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Golden Yellow Pill Search Button */}
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#e8a825] hover:bg-[#d99719] text-[#2c0512] font-bold px-5 rounded-full text-sm flex items-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Category Navigation Pills */}
          <div className="w-full flex items-center justify-center flex-wrap gap-2 md:gap-3 text-xs md:text-sm font-medium pt-1 border-t border-[#520d26]/50">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`px-4 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#e8a825] text-[#2e0513] font-bold shadow-md shadow-amber-900/40 scale-105'
                      : 'text-amber-100/90 hover:text-amber-300 hover:bg-[#520d26]/60'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </header>
  );
};
