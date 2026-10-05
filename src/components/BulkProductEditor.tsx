import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Sparkles, AlertCircle, Save } from 'lucide-react';
import { Product, ProductCategory } from '../types';

interface BulkProductRow {
  id: string;
  code: string;
  name: string;
  category: Exclude<ProductCategory, 'All'>;
  price: number;
  originalPrice: number;
  fabric: string;
  color: string;
  inStock: boolean;
  isNewArrival: boolean;
  blouseIncluded: boolean;
  description: string;
}

interface BulkProductEditorProps {
  onSaveBulk: (newProducts: Product[]) => void;
  onCancel: () => void;
  fallbackImage: string;
}

const CATEGORIES: Exclude<ProductCategory, 'All'>[] = [
  'Traditional Sarees',
  'Co-ord Sets',
  'Churidar Sets',
  'Fusion Wear'
];

export const BulkProductEditor: React.FC<BulkProductEditorProps> = ({
  onSaveBulk,
  onCancel,
  fallbackImage
}) => {
  // Create 10 empty / templated rows
  const generateEmptyRow = (index: number): BulkProductRow => ({
    id: `bulk-row-${Date.now()}-${index}`,
    code: `YRK-${200 + index}`,
    name: '',
    category: index % 2 === 0 ? 'Traditional Sarees' : 'Co-ord Sets',
    price: 3499,
    originalPrice: 4899,
    fabric: 'Authentic Kerala Kasavu Handloom with Fine Zari',
    color: 'Ivory & Gold',
    inStock: true,
    isNewArrival: true,
    blouseIncluded: true,
    description: 'Ceremonial Kerala festive boutique piece.'
  });

  const [rows, setRows] = useState<BulkProductRow[]>(() => {
    return Array.from({ length: 10 }, (_, i) => generateEmptyRow(i + 1));
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateRow = (id: string, field: keyof BulkProductRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) {
      alert('You must have at least one product row.');
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const addRow = () => {
    setRows((prev) => [...prev, generateEmptyRow(prev.length + 1)]);
  };

  const addTenMoreRows = () => {
    setRows((prev) => [
      ...prev,
      ...Array.from({ length: 10 }, (_, i) => generateEmptyRow(prev.length + i + 1))
    ]);
  };

  // Helper: Pre-fill realistic Kerala boutique products for fast 10-item onboarding
  const handlePreFillTenSampleItems = () => {
    const sampleItems: Array<Partial<BulkProductRow>> = [
      {
        code: 'YRK-301',
        name: 'Mural Art Kasavu Tissue Saree',
        category: 'Traditional Sarees',
        price: 3899,
        originalPrice: 5200,
        fabric: 'Cotton Tissue with Handpainted Krishna Mural Pallu',
        color: 'Off-White & Antique Gold'
      },
      {
        code: 'YRK-302',
        name: 'Golden Zari Pleated Kurti Co-ord',
        category: 'Co-ord Sets',
        price: 2799,
        originalPrice: 3699,
        fabric: 'Raw Silk with Kasavu Border Hem',
        color: 'Champagne Gold'
      },
      {
        code: 'YRK-303',
        name: 'Temple Border Kasavu Bridal Saree',
        category: 'Traditional Sarees',
        price: 4599,
        originalPrice: 5999,
        fabric: 'Double Weave Fine Kasavu with Red Temple Zari',
        color: 'Ivory & Crimson Gold'
      },
      {
        code: 'YRK-304',
        name: 'Pastel Organza Kasavu Anarkali Suit',
        category: 'Churidar Sets',
        price: 3499,
        originalPrice: 4799,
        fabric: 'Sheer Organza with Kasavu Border & Chiffon Dupatta',
        color: 'Pastel Mint & Gold'
      },
      {
        code: 'YRK-305',
        name: 'Peplum & Dhoti Festive Fusion Set',
        category: 'Fusion Wear',
        price: 3299,
        originalPrice: 4299,
        fabric: 'Modal Silk Top with Kasavu Draped Dhoti',
        color: 'Royal Wine & Gold'
      },
      {
        code: 'YRK-306',
        name: 'Brocade Pallu Kanjeevaram Silk Saree',
        category: 'Traditional Sarees',
        price: 7999,
        originalPrice: 11000,
        fabric: 'Pure Mulberry Silk with Heavy Peacock Brocade',
        color: 'Deep Plum & Antique Gold'
      },
      {
        code: 'YRK-307',
        name: 'Hand-Embroidered Chanderi Straight Kurta Set',
        category: 'Churidar Sets',
        price: 2999,
        originalPrice: 3999,
        fabric: 'Chanderi Silk with Cut-Work Kasavu Trims',
        color: 'Powder Blue & Muted Zari'
      },
      {
        code: 'YRK-308',
        name: 'Pre-Pleated Tissue Saree with Belt',
        category: 'Fusion Wear',
        price: 4999,
        originalPrice: 6500,
        fabric: 'Pleated Kasavu Tissue with Embroidered Belt',
        color: 'Sunset Ochre Gold'
      },
      {
        code: 'YRK-309',
        name: 'Celebratory Kasavu Half-Saree Set (Dhavani)',
        category: 'Traditional Sarees',
        price: 5499,
        originalPrice: 6999,
        fabric: 'Pleated Kasavu Skirt with Contrast Dhavani & Blouse',
        color: 'Kerala Kasavu Gold & Rani Pink'
      },
      {
        code: 'YRK-310',
        name: 'Artisanal Kasavu Jacket & Skirt Co-ord',
        category: 'Co-ord Sets',
        price: 3699,
        originalPrice: 4899,
        fabric: 'Textured Handloom Silk with Metallic Zari Buttons',
        color: 'Emerald Green & Ivory'
      }
    ];

    setRows((prev) =>
      prev.map((r, i) => {
        if (i < sampleItems.length) {
          return {
            ...r,
            ...sampleItems[i],
            inStock: true,
            isNewArrival: true,
            blouseIncluded: true,
            description: `${sampleItems[i].name} - Authentic Kerala festive handcrafted boutique edition.`
          };
        }
        return r;
      })
    );
  };

  const handleSaveAll = () => {
    // Validate rows that have names
    const filledRows = rows.filter((r) => r.name.trim() !== '');

    if (filledRows.length === 0) {
      setErrorMessage('Please enter at least 1 product title/name before saving.');
      return;
    }

    const newProducts: Product[] = filledRows.map((r, idx) => ({
      id: `yrk-bulk-${Date.now()}-${idx}`,
      code: r.code.trim() || `YRK-${300 + idx}`,
      name: r.name.trim(),
      category: r.category,
      price: Number(r.price) || 3499,
      originalPrice: Number(r.originalPrice) || Math.round(Number(r.price) * 1.3),
      fabric: r.fabric.trim() || 'Authentic Kerala Kasavu Handloom with Fine Zari',
      color: r.color.trim() || 'Ivory & Gold',
      description: r.description.trim() || `${r.name} - Handcrafted Kerala boutique edition.`,
      inStock: r.inStock,
      isNewArrival: r.isNewArrival,
      isBestseller: false,
      blouseIncluded: r.blouseIncluded,
      image: fallbackImage,
      images: [fallbackImage]
    }));

    onSaveBulk(newProducts);
  };

  return (
    <div className="bg-[#fbf5e6] text-stone-900 rounded-xl shadow-2xl border border-[#dfc88c] overflow-hidden">
      
      {/* Top Header */}
      <div className="p-4 md:p-6 bg-[#380718] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#520d26]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif-luxury text-xl md:text-2xl font-bold text-[#f5d78a]">
              Bulk Add Products (10 Items at Once)
            </h3>
            <span className="bg-[#e8a825] text-[#2c0512] font-bold text-xs px-2.5 py-0.5 rounded-full">
              {rows.length} Rows
            </span>
          </div>
          <p className="text-xs text-amber-200/80 mt-1">
            Fill in details for up to 10 or more products simultaneously and publish them to your storefront in one click.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePreFillTenSampleItems}
            className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            title="Auto-fill 10 sample boutique sarees and co-ords"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Pre-fill 10 Boutique Samples</span>
          </button>

          <button
            type="button"
            onClick={addTenMoreRows}
            className="flex items-center gap-1 bg-[#22040c] hover:bg-[#420719] text-[#f5d78a] border border-[#d4a341]/40 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+10 More Rows</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="m-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto max-h-[580px] p-4">
        <table className="w-full text-xs text-left border border-stone-200 border-collapse">
          <thead className="bg-stone-100 text-stone-700 font-bold uppercase sticky top-0 z-10 border-b border-stone-300">
            <tr>
              <th className="p-2 border border-stone-200 w-10 text-center">#</th>
              <th className="p-2 border border-stone-200 min-w-[100px]">Item Code</th>
              <th className="p-2 border border-stone-200 min-w-[220px]">Product Title / Name *</th>
              <th className="p-2 border border-stone-200 min-w-[140px]">Category</th>
              <th className="p-2 border border-stone-200 min-w-[100px]">Price (₹)</th>
              <th className="p-2 border border-stone-200 min-w-[100px]">MRP (₹)</th>
              <th className="p-2 border border-stone-200 min-w-[200px]">Fabric &amp; Weave</th>
              <th className="p-2 border border-stone-200 min-w-[120px]">Color</th>
              <th className="p-2 border border-stone-200 w-24 text-center">In Stock?</th>
              <th className="p-2 border border-stone-200 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {rows.map((row, index) => {
              const isFilled = row.name.trim().length > 0;
              return (
                <tr 
                  key={row.id} 
                  className={`hover:bg-amber-50/40 transition-colors ${isFilled ? 'bg-emerald-50/20' : ''}`}
                >
                  {/* Row Number */}
                  <td className="p-2 border border-stone-200 text-center font-bold text-stone-500 tabular-nums">
                    {index + 1}
                  </td>

                  {/* Code */}
                  <td className="p-1 border border-stone-200">
                    <input
                      type="text"
                      value={row.code}
                      onChange={(e) => updateRow(row.id, 'code', e.target.value)}
                      placeholder="YRK-201"
                      className="w-full px-2 py-1.5 border border-stone-200 rounded font-mono font-bold text-amber-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* Name */}
                  <td className="p-1 border border-stone-200">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                      placeholder="e.g. Kasavu Golden Tissue Handloom Saree"
                      className="w-full px-2 py-1.5 border border-stone-200 rounded font-medium text-stone-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* Category */}
                  <td className="p-1 border border-stone-200">
                    <select
                      value={row.category}
                      onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                      className="w-full px-2 py-1.5 border border-stone-200 rounded bg-white font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Price */}
                  <td className="p-1 border border-stone-200">
                    <input
                      type="number"
                      value={row.price}
                      onChange={(e) => updateRow(row.id, 'price', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-stone-200 rounded font-bold text-stone-900 bg-white tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* Original Price */}
                  <td className="p-1 border border-stone-200">
                    <input
                      type="number"
                      value={row.originalPrice}
                      onChange={(e) => updateRow(row.id, 'originalPrice', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-stone-200 rounded text-stone-500 bg-white tabular-nums focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* Fabric */}
                  <td className="p-1 border border-stone-200">
                    <input
                      type="text"
                      value={row.fabric}
                      onChange={(e) => updateRow(row.id, 'fabric', e.target.value)}
                      placeholder="Pure Kerala Handloom Tissue with Fine Zari"
                      className="w-full px-2 py-1.5 border border-stone-200 rounded text-stone-700 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* Color */}
                  <td className="p-1 border border-stone-200">
                    <input
                      type="text"
                      value={row.color}
                      onChange={(e) => updateRow(row.id, 'color', e.target.value)}
                      placeholder="Off-White & Gold"
                      className="w-full px-2 py-1.5 border border-stone-200 rounded text-stone-700 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </td>

                  {/* In Stock Toggle */}
                  <td className="p-2 border border-stone-200 text-center">
                    <input
                      type="checkbox"
                      checked={row.inStock}
                      onChange={(e) => updateRow(row.id, 'inStock', e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </td>

                  {/* Remove row */}
                  <td className="p-2 border border-stone-200 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                      title="Delete this row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-4 md:p-6 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add 1 Row</span>
          </button>

          <span className="text-xs text-stone-500">
            {rows.filter((r) => r.name.trim() !== '').length} of {rows.length} products ready to publish
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg hover:bg-stone-100 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#380718] hover:bg-[#520d26] text-[#f5d78a] font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Products to Storefront</span>
          </button>
        </div>
      </div>

    </div>
  );
};
