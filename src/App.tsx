import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSlider } from './components/HeroSlider';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { AdminPortal } from './components/AdminPortal';
import { Product, ProductCategory, CartItem } from './types';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { HeroSlideItem, INITIAL_HERO_SLIDES } from './data/initialSlides';
import { fetchProductsFromPublicSheet, getStoredSpreadsheetId } from './utils/googleSheetsService';

const STORAGE_KEY_PRODUCTS = 'yaarika_products_v1';
const STORAGE_KEY_WISHLIST = 'yaarika_wishlist_v1';
const STORAGE_KEY_CART = 'yaarika_cart_v1';
const STORAGE_KEY_SLIDES = 'yaarika_slides_v1';

export default function App() {
  // Hero Slides
  const [heroSlides, setHeroSlides] = useState<HeroSlideItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SLIDES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_HERO_SLIDES;
  });

  // Products Catalog (with localStorage persistence & Google Sheets sync)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading stored products', e);
    }
    return INITIAL_PRODUCTS;
  });

  // On mount, if Google Spreadsheet ID is configured, fetch products from Google Sheet for remote visitors anywhere
  useEffect(() => {
    const spreadsheetId = getStoredSpreadsheetId();
    if (spreadsheetId) {
      fetchProductsFromPublicSheet(spreadsheetId)
        .then((sheetProducts) => {
          if (sheetProducts && sheetProducts.length > 0) {
            setProducts(sheetProducts);
          }
        })
        .catch((err) => {
          console.log('Using local/cached products (Google Sheet sync pending or private):', err);
        });
    }
  }, []);

  // Navigation & Filter state
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Wishlist state
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WISHLIST);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading wishlist', e);
    }
    return [];
  });

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading cart', e);
    }
    return [];
  });

  // Drawers & Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Check URL params for admin-dashboard mode
  useEffect(() => {
    if (window.location.pathname.includes('admin') || window.location.hash.includes('admin')) {
      setIsAdminView(true);
    }
  }, []);

  // Handlers
  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity
        };
        return next;
      } else {
        return [...prev, { product, quantity }];
      }
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleResetDefaults = () => {
    setProducts(INITIAL_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
  };

  const wishlistIds = new Set(wishlist.map((p) => p.id));
  const cartIds = new Set(cartItems.map((item) => item.product.id));

  // If in Admin Portal view
  if (isAdminView) {
    return (
      <AdminPortal
        products={products}
        onUpdateProducts={setProducts}
        heroSlides={heroSlides}
        onUpdateHeroSlides={(slides) => {
          setHeroSlides(slides);
          try {
            localStorage.setItem(STORAGE_KEY_SLIDES, JSON.stringify(slides));
          } catch (e) {
            console.error(e);
          }
        }}
        onBackToStore={() => {
          setIsAdminView(false);
          window.history.replaceState({}, '', '/');
        }}
        onResetDefaults={handleResetDefaults}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF9F0] text-stone-900 selection:bg-[#dfb15b]/30">
      
      <Header
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setSearchQuery('');
          window.scrollTo({ top: 380, behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        wishlistCount={wishlist.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAdmin={() => setIsAdminView(true)}
      />

      <HeroSlider
        slides={heroSlides}
        onExploreCategory={(cat) => {
          setActiveCategory(cat);
          window.scrollTo({ top: 580, behavior: 'smooth' });
        }}
      />

      <main className="flex-1">
        <ProductGrid
          products={products}
          activeCategory={activeCategory}
          searchQuery={searchQuery}
          onClearFilters={() => {
            setActiveCategory('All');
            setSearchQuery('');
          }}
          wishlistIds={wishlistIds}
          cartIds={cartIds}
          onToggleWishlist={handleToggleWishlist}
          onQuickView={(p) => setSelectedProduct(p)}
          onAddToCart={(p) => handleAddToCart(p, 1)}
        />
      </main>

      <Footer />
      <FloatingWhatsApp />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isWishlisted={selectedProduct ? wishlistIds.has(selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        isInCart={selectedProduct ? cartIds.has(selectedProduct.id) : false}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        products={wishlist}
        onRemoveWishlist={handleToggleWishlist}
        onAddToCart={(p) => handleAddToCart(p, 1)}
      />

    </div>
  );
}
