import React, { useState, useMemo } from 'react';
import { ProductCard } from './ProductCard';
import { Product, ProductCategory } from '../types';
import { SlidersHorizontal, Sparkles } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  activeCategory: ProductCategory;
  searchQuery: string;
  onClearFilters: () => void;
  wishlistIds: Set<string>;
  cartIds: Set<string>;
  onToggleWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  activeCategory,
  searchQuery,
  onClearFilters,
  wishlistIds,
  cartIds,
  onToggleWishlist,
  onQuickView,
  onAddToCart
}) => {
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category match
      if (activeCategory === 'New Arrivals') {
        if (!p.isNewArrival) return false;
      } else if (activeCategory !== 'All' && p.category !== activeCategory) {
        return false;
      }

      // Stock filter
      if (onlyInStock && !p.inStock) {
        return false;
      }

      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCode = p.code.toLowerCase().includes(q);
        const matchesFabric = p.fabric.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesFabric && !matchesCategory && !matchesDesc) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [products, activeCategory, searchQuery, onlyInStock, sortBy]);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-10 py-10">
      
      {/* Grid Controls Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#dfc88c]/70">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif-luxury text-2xl md:text-3xl font-semibold text-stone-900">
              {activeCategory === 'All' ? 'Boutique Catalog' : activeCategory}
            </h2>
            <span className="text-xs bg-[#f4e6c0] text-[#5e410b] font-bold px-2 py-0.5 rounded-full border border-[#dfc88c] tabular-nums">
              {filteredProducts.length} items
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-0.5">
            {searchQuery ? `Showing search results for "${searchQuery}"` : 'Handpicked celebratory handlooms and contemporary sets'}
          </p>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center flex-wrap gap-3 text-xs">
          
          {/* In Stock Only Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-[#fbf5e6] border border-[#dfc88c] px-3.5 py-1.5 rounded-xl select-none hover:bg-[#f6ebd0] shadow-2xs">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="rounded text-amber-700 focus:ring-amber-500 h-3.5 w-3.5"
            />
            <span className="font-semibold text-stone-800">In Stock Only</span>
          </label>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#fbf5e6] border border-[#dfc88c] px-3.5 py-1.5 rounded-xl shadow-2xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
            <span className="text-stone-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-stone-900 focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

        </div>
      </div>

      {/* Product Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8 pt-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistIds.has(product.id)}
              onToggleWishlist={onToggleWishlist}
              onQuickView={onQuickView}
              onAddToCart={onAddToCart}
              isInCart={cartIds.has(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#d4a341]">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="font-serif-luxury text-xl font-semibold text-stone-800">
            No matching items found
          </h3>
          <p className="text-sm text-stone-500 max-w-md">
            We couldn't find any products matching your current category, search query, or stock filter.
          </p>
          <button
            onClick={onClearFilters}
            className="bg-[#380718] text-[#f5d78a] px-5 py-2 rounded-full text-xs font-semibold shadow hover:bg-[#520d26] transition-colors"
          >
            Clear All Filters & Reset
          </button>
        </div>
      )}

    </section>
  );
};
