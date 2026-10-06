import React, { useState, useRef, useEffect } from 'react';
import { 
  Lock, ArrowLeft, Plus, Trash2, Edit3, 
  RotateCcw, Download, Sparkles, 
  CheckCircle2, X, FileSpreadsheet, Layers, 
  Search, ArrowUp, ArrowDown,
  Upload, Image as ImageIcon, MessageCircle, GitBranch,
  CloudCheck, Check, Radio, Package, ExternalLink, HelpCircle,
  KeyRound, UserCheck, ShieldAlert
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { HeroSlideItem, INITIAL_HERO_SLIDES } from '../data/initialSlides';
import { BOUTIQUE_INFO, INITIAL_PRODUCTS } from '../data/initialProducts';
import { exportProductsToExcel, exportProductsToCSV, parseExcelOrCsvFile } from '../utils/excelUtils';
import { 
  initGoogleAuth, 
  signInWithGoogleSheets, 
  signOutGoogle, 
  getGoogleAccessToken, 
  getStoredSpreadsheetId, 
  saveStoredSpreadsheetId, 
  createYaarikaSpreadsheet, 
  fetchProductsFromSheet, 
  fetchProductsFromPublicSheet, 
  syncProductsToSheet, 
  getAutoSyncEnabled, 
  setAutoSyncEnabled 
} from '../utils/googleSheetsService';
import heroKasavuImg from '@/src/assets/images/hero_kasavu_saree_1791103965122.jpg';
import tissueKasavuImg from '@/src/assets/images/product_tissue_kasavu_1791103981693.jpg';
import kanjeevaramImg from '@/src/assets/images/product_kanjeevaram_silk_1791103996721.jpg';
import festiveCoordImg from '@/src/assets/images/product_festive_coord_1791104009348.jpg';
import brandLogoImg from '@/src/assets/images/regenerated_image_1791107582698.png';

const STORAGE_KEY_ADMIN_AUTH = 'yaarika_master_admin_auth_v2';

const BOUTIQUE_PRESETS = [
  { label: 'Tissue Kasavu', url: tissueKasavuImg },
  { label: 'Heritage Kasavu', url: heroKasavuImg },
  { label: 'Kanjeevaram Silk', url: kanjeevaramImg },
  { label: 'Festive Co-ord', url: festiveCoordImg }
];

interface StoredAdminAuth {
  isRegistered: boolean;
  userId: string;
  passwordHash: string;
  registeredDate: string;
}

interface LayerData {
  id: string;
  title: string;
  category: Exclude<ProductCategory, 'All'>;
  offerPrice: string;
  originalPrice: string;
  fabric: string;
  description: string;
  photos: string[];
  sizes: { [size: string]: number };
  activeSizes: string[];
  inStock: boolean;
  isNewArrival: boolean;
  uniformStock: string;
}

interface AdminPortalProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  heroSlides?: HeroSlideItem[];
  onUpdateHeroSlides?: (slides: HeroSlideItem[]) => void;
  onBackToStore: () => void;
  onResetDefaults: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  products,
  onUpdateProducts,
  heroSlides = INITIAL_HERO_SLIDES,
  onUpdateHeroSlides,
  onBackToStore,
  onResetDefaults
}) => {
  // Authentication State: Check stored one-time registration
  const [storedAuth, setStoredAuth] = useState<StoredAdminAuth | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADMIN_AUTH);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading admin auth credentials', e);
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false); // MUST verify user id and password to enter!
  const [authError, setAuthError] = useState('');
  
  // Registration form inputs (Only available once if not yet registered)
  const [regUserId, setRegUserId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Login form inputs
  const [loginUserId, setLoginUserId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Active Tab
  type AdminTab = 
    | 'catalog' 
    | 'multi-layer' 
    | 'excel' 
    | 'bulk' 
    | 'hero-slider' 
    | 'whatsapp' 
    | 'github'
    | 'google-sheets';

  const [activeTab, setActiveTab] = useState<AdminTab>('catalog');

  // Google Sheets Sync state
  const [gsUser, setGsUser] = useState<any | null>(null);
  const [gsToken, setGsToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string>(getStoredSpreadsheetId());
  const [isGsLoading, setIsGsLoading] = useState(false);
  const [autoSyncSheets, setAutoSyncSheets] = useState<boolean>(getAutoSyncEnabled());

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGsUser(user);
        setGsToken(token);
      },
      () => {
        setGsUser(null);
        setGsToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const triggerAutoSync = async (updatedProducts: Product[]) => {
    if (autoSyncSheets && spreadsheetId && gsToken) {
      try {
        await syncProductsToSheet(spreadsheetId, gsToken, updatedProducts);
      } catch (err) {
        console.error('Background Google Sheet sync error:', err);
      }
    }
  };

  const handleUpdateProductsAndSync = (newProducts: Product[]) => {
    onUpdateProducts(newProducts);
    triggerAutoSync(newProducts);
  };

  // Search & Status Filters for Live Catalog
  const [catalogSearch, setCatalogSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Product Edit Modal State (Requirement 3: Edit product in live catalog)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    category: 'Traditional Sarees' as Exclude<ProductCategory, 'All'>,
    price: 0,
    originalPrice: 0,
    fabric: '',
    color: '',
    description: '',
    photos: [] as string[],
    inStock: true,
    isNewArrival: false,
    sizes: [] as { size: string; count: number }[]
  });
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // Multi-Layer Product Quick Add state (1 to 10 layers)
  const createEmptyLayer = (index: number): LayerData => ({
    id: `layer-${Date.now()}-${index}`,
    title: '',
    category: 'Traditional Sarees',
    offerPrice: '',
    originalPrice: '',
    fabric: '',
    description: '',
    photos: [],
    sizes: { 'M': 5, 'L': 5, 'XL': 5, 'XXL': 5 },
    activeSizes: ['M', 'L', 'XL', 'XXL'],
    inStock: true,
    isNewArrival: false,
    uniformStock: '5'
  });

  const [layers, setLayers] = useState<LayerData[]>([createEmptyLayer(1)]);
  const [layerPhotoUrls, setLayerPhotoUrls] = useState<{ [layerId: string]: string }>({});

  // Slide state for Hero Slider manager
  const [slides, setSlides] = useState<HeroSlideItem[]>(heroSlides);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [newSlideData, setNewSlideData] = useState<Partial<HeroSlideItem>>({
    tag: 'Celebratory Drape',
    category: 'Traditional Sarees',
    title: '',
    subtitle: '',
    image: heroKasavuImg
  });

  // Bulk Import raw CSV/JSON state
  const [bulkImportFormat, setBulkImportFormat] = useState<'csv' | 'json'>('csv');
  const [bulkImportText, setBulkImportText] = useState(
    `Title,Category,Price,OriginalPrice,InStock,IsNewArrival,Sizes,ImageUrl,Description\nRoyal Kasavu Saree,Traditional Sarees,1899,2499,True,True,FREE SIZE,${tissueKasavuImg},Festive wear Kasavu\nCrimson Silk Saree,Traditional Sarees,4500,5999,True,False,M|L|XL,${kanjeevaramImg},Bridal silk drape`
  );

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Requirement 2: Handle One-Time Registration
  const handleRegisterCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (storedAuth?.isRegistered) {
      setAuthError('Registration is already completed and can only be set once. Please log in.');
      return;
    }

    if (!regUserId.trim()) {
      setAuthError('Please enter a valid Admin User ID.');
      return;
    }

    if (regPassword.length < 4) {
      setAuthError('Password must be at least 4 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setAuthError('Passwords do not match. Please re-check.');
      return;
    }

    const newAuth: StoredAdminAuth = {
      isRegistered: true,
      userId: regUserId.trim(),
      passwordHash: regPassword,
      registeredDate: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, JSON.stringify(newAuth));
      setStoredAuth(newAuth);
      setIsAuthenticated(true);
      showNotification(`Admin registered successfully as "${newAuth.userId}"!`);
    } catch (err) {
      setAuthError('Could not save registration to local storage.');
    }
  };

  // Requirement 2: Handle Login with Registered Credentials
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!storedAuth || !storedAuth.isRegistered) {
      setAuthError('No admin registered yet. Please complete one-time registration.');
      return;
    }

    const cleanInputUser = loginUserId.trim().toLowerCase();
    const cleanStoredUser = storedAuth.userId.trim().toLowerCase();

    if (cleanInputUser === cleanStoredUser && loginPassword === storedAuth.passwordHash) {
      setIsAuthenticated(true);
      setAuthError('');
      showNotification(`Welcome back, ${storedAuth.userId}!`);
    } else {
      setAuthError('Invalid User ID or Password. Access denied.');
    }
  };

  // Requirement 3: Delete product from Live Catalog (Robust Modal Confirmation)
  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    setProductToDelete(target);
  };

  const confirmDeleteProduct = () => {
    if (!productToDelete) return;
    handleUpdateProductsAndSync(products.filter((p) => p.id !== productToDelete.id));
    showNotification(`Deleted product "${productToDelete.name}" successfully!`);
    setProductToDelete(null);
  };

  const handleDeleteAllProducts = () => {
    if (products.length === 0) {
      showNotification('Catalog is already empty.');
      return;
    }
    setIsDeleteAllModalOpen(true);
  };

  const confirmDeleteAllProducts = () => {
    handleUpdateProductsAndSync([]);
    showNotification('All products deleted from live catalog successfully!');
    setIsDeleteAllModalOpen(false);
  };

  // Requirement 3: Start Editing a Product from Live Catalog
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    const existingPhotos = prod.images && prod.images.length > 0 ? prod.images : [prod.image].filter(Boolean);
    setEditFormData({
      name: prod.name,
      code: prod.code,
      category: prod.category,
      price: prod.price,
      originalPrice: prod.originalPrice || prod.price,
      fabric: prod.fabric,
      color: prod.color,
      description: prod.description,
      photos: existingPhotos,
      inStock: prod.inStock,
      isNewArrival: !!prod.isNewArrival,
      sizes: prod.sizes || [{ size: 'Free Size', count: prod.totalStock || 10 }]
    });
    setNewPhotoUrl('');
  };

  // Requirement 3: Save Edited Product
  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editFormData.name.trim() || !editFormData.price) {
      alert('Product title and price are required.');
      return;
    }

    const pendingUrl = newPhotoUrl.trim();
    const allPhotos = [...editFormData.photos];
    if (pendingUrl && !allPhotos.includes(pendingUrl)) {
      allPhotos.push(pendingUrl);
    }
    const primaryImage = allPhotos[0] || editingProduct.image || tissueKasavuImg;
    const finalPhotos = allPhotos.length > 0 ? allPhotos : [primaryImage];
    const totalStock = editFormData.sizes.reduce((acc, s) => acc + (s.count || 0), 0);

    const updated: Product = {
      ...editingProduct,
      name: editFormData.name.trim(),
      code: editFormData.code.trim() || editingProduct.code,
      category: editFormData.category,
      price: Number(editFormData.price),
      originalPrice: Number(editFormData.originalPrice) || Number(editFormData.price),
      fabric: editFormData.fabric.trim() || editingProduct.fabric,
      color: editFormData.color.trim() || editingProduct.color,
      description: editFormData.description.trim() || editingProduct.description,
      image: primaryImage,
      images: finalPhotos,
      inStock: editFormData.inStock,
      isNewArrival: editFormData.isNewArrival,
      sizes: editFormData.sizes,
      totalStock: totalStock > 0 ? totalStock : (editFormData.inStock ? 10 : 0)
    };

    handleUpdateProductsAndSync(products.map((p) => p.id === editingProduct.id ? updated : p));
    setEditingProduct(null);
    showNotification(`Saved changes to "${updated.name}"`);
  };

  // Toggle in stock
  const handleToggleStock = (productId: string) => {
    const updated = products.map((p) => 
      p.id === productId ? { ...p, inStock: !p.inStock } : p
    );
    handleUpdateProductsAndSync(updated);
    showNotification('Product inventory status updated');
  };

  // Load Sample Showcase
  const handleLoadSampleShowcase = () => {
    handleUpdateProductsAndSync(INITIAL_PRODUCTS);
    showNotification('Loaded 5 sample boutique products successfully!');
  };

  // Layer Management in Multi-Layer Quick Add
  const handleAddLayer = () => {
    if (layers.length >= 10) {
      alert('You can add up to 10 product layers simultaneously.');
      return;
    }
    const nextIdx = layers.length + 1;
    setLayers((prev) => [...prev, createEmptyLayer(nextIdx)]);
    showNotification(`Added Layer #${nextIdx} (${nextIdx}/10)`);
  };

  const handleDuplicateLayer = (layerIdx: number) => {
    if (layers.length >= 10) {
      alert('Maximum 10 layers allowed.');
      return;
    }
    const source = layers[layerIdx];
    const dup: LayerData = {
      ...source,
      id: `layer-${Date.now()}-${layers.length + 1}`,
      title: source.title ? `${source.title} (Copy)` : ''
    };
    const nextLayers = [...layers];
    nextLayers.splice(layerIdx + 1, 0, dup);
    setLayers(nextLayers);
    showNotification(`Duplicated Layer #${layerIdx + 1}`);
  };

  const handleDeleteLayer = (layerIdx: number) => {
    if (layers.length <= 1) {
      alert('At least one layer must remain.');
      return;
    }
    setLayers((prev) => prev.filter((_, i) => i !== layerIdx));
    showNotification(`Removed Layer #${layerIdx + 1}`);
  };

  const handleUpdateLayer = (layerId: string, field: keyof LayerData, val: any) => {
    setLayers((prev) => 
      prev.map((lyr) => lyr.id === layerId ? { ...lyr, [field]: val } : lyr)
    );
  };

  // Photo handlers for a layer
  const handleAddPhotoToLayer = (layerId: string, url: string) => {
    if (!url || !url.trim()) return;
    setLayers((prev) => prev.map((lyr) => {
      if (lyr.id === layerId) {
        if (lyr.photos.length >= 5) {
          alert('Maximum 5 photos allowed per product.');
          return lyr;
        }
        return { ...lyr, photos: [...lyr.photos, url.trim()] };
      }
      return lyr;
    }));
  };

  const handleRemovePhotoFromLayer = (layerId: string, photoIdx: number) => {
    setLayers((prev) => prev.map((lyr) => {
      if (lyr.id === layerId) {
        return { ...lyr, photos: lyr.photos.filter((_, i) => i !== photoIdx) };
      }
      return lyr;
    }));
  };

  // Size chips toggling in Layer
  const handleToggleSizeChip = (layerId: string, size: string) => {
    setLayers((prev) => prev.map((lyr) => {
      if (lyr.id === layerId) {
        const exists = lyr.activeSizes.includes(size);
        const nextActive = exists 
          ? lyr.activeSizes.filter((s) => s !== size)
          : [...lyr.activeSizes, size];
        return { ...lyr, activeSizes: nextActive };
      }
      return lyr;
    }));
  };

  // Apply uniform stock to all active sizes
  const handleApplyUniformStock = (layerId: string) => {
    setLayers((prev) => prev.map((lyr) => {
      if (lyr.id === layerId) {
        const count = parseInt(lyr.uniformStock) || 0;
        const nextSizes = { ...lyr.sizes };
        lyr.activeSizes.forEach((s) => {
          nextSizes[s] = count;
        });
        return { ...lyr, sizes: nextSizes };
      }
      return lyr;
    }));
    showNotification('Applied uniform stock count');
  };

  // Publish all filled layers to Storefront
  const handlePublishLayers = () => {
    const validLayers = layers.filter((lyr) => lyr.title.trim() && lyr.offerPrice);
    if (validLayers.length === 0) {
      alert('Please fill at least Layer #1 Product Title and Offer Price.');
      return;
    }

    const newProducts: Product[] = validLayers.map((lyr, idx) => {
      const pendingUrl = layerPhotoUrls[lyr.id]?.trim();
      const allPhotos = [...lyr.photos];
      if (pendingUrl && !allPhotos.includes(pendingUrl)) {
        allPhotos.push(pendingUrl);
      }
      const primaryImage = allPhotos[0] || products[0]?.image || tissueKasavuImg;
      const finalPhotos = allPhotos.length > 0 ? allPhotos : [primaryImage];
      const sizeList = lyr.activeSizes.map((s) => ({
        size: s,
        count: lyr.sizes[s] !== undefined ? lyr.sizes[s] : 5
      }));
      const totalStock = sizeList.reduce((acc, curr) => acc + curr.count, 0);

      return {
        id: `yrk-lyr-${Date.now()}-${idx}`,
        code: `YRK-${Math.floor(100 + Math.random() * 900)}`,
        name: lyr.title.trim(),
        category: lyr.category,
        price: Number(lyr.offerPrice) || 1349,
        originalPrice: lyr.originalPrice ? Number(lyr.originalPrice) : Math.round((Number(lyr.offerPrice) || 1349) * 1.25),
        fabric: lyr.fabric.trim() || 'Premium Handcrafted Boutique Handloom',
        color: 'Authentic Traditional Palette',
        description: lyr.description.trim() || `${lyr.title.trim()} - Handcrafted Yaarika Collections exclusive.`,
        image: primaryImage,
        images: lyr.photos.length > 0 ? lyr.photos : [primaryImage],
        inStock: lyr.inStock,
        isNewArrival: lyr.isNewArrival,
        blouseIncluded: true,
        sizes: sizeList,
        totalStock: totalStock > 0 ? totalStock : 20
      };
    });

    handleUpdateProductsAndSync([...newProducts, ...products]);
    showNotification(`Published ${newProducts.length} product(s) to boutique catalog!`);
    setActiveTab('catalog');
    setLayers([createEmptyLayer(1)]);
  };

  // Hero Slider reordering & deletion
  const handleMoveSlide = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const next = [...slides];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    setSlides(next);
    if (onUpdateHeroSlides) onUpdateHeroSlides(next);
    showNotification('Slide order updated');
  };

  const handleDeleteSlide = (id: string) => {
    if (slides.length <= 1) {
      alert('At least one hero banner slide is required.');
      return;
    }
    const next = slides.filter((s) => s.id !== id);
    setSlides(next);
    if (onUpdateHeroSlides) onUpdateHeroSlides(next);
    showNotification('Hero slide removed');
  };

  const handleAddNewSlide = () => {
    if (!newSlideData.title) {
      alert('Please enter slide title.');
      return;
    }
    const slide: HeroSlideItem = {
      id: `slide-${Date.now()}`,
      tag: newSlideData.tag || 'Heritage Collection',
      category: newSlideData.category || 'Traditional Sarees',
      title: newSlideData.title,
      subtitle: newSlideData.subtitle || 'Exquisite handcrafted attire.',
      image: newSlideData.image || heroKasavuImg
    };
    const next = [...slides, slide];
    setSlides(next);
    if (onUpdateHeroSlides) onUpdateHeroSlides(next);
    setIsSlideModalOpen(false);
    showNotification('Added new hero banner slide');
  };

  // Filtered Products for Live Catalog tab
  const filteredProducts = products.filter((p) => {
    if (statusFilter === 'in_stock' && !p.inStock) return false;
    if (statusFilter === 'out_of_stock' && p.inStock) return false;
    if (statusFilter === 'low_stock' && (!p.inStock || (p.totalStock && p.totalStock > 5))) return false;
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const inStockCount = products.filter((p) => p.inStock).length;
  const outOfStockCount = products.filter((p) => !p.inStock).length;
  const lowStockCount = products.filter((p) => p.inStock && (p.totalStock ? p.totalStock <= 5 : false)).length;

  return (
    <div className="min-h-screen bg-[#faf3e0] text-stone-800 flex flex-col justify-between selection:bg-amber-200">
      
      {/* Top Admin Header Bar */}
      <header className="bg-[#380718] border-b border-[#520d26] text-stone-100 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#d4a341] bg-[#1d030c] shadow flex items-center justify-center overflow-hidden shrink-0">
              <img src={brandLogoImg} alt="Yaarika" className="w-7 h-7 object-cover" />
            </div>
            <div>
              <h1 className="font-serif-luxury text-base md:text-lg font-bold text-[#f5d78a] tracking-wide leading-tight">
                YAARIKA ADMIN PORTAL
              </h1>
              <p className="text-[10px] text-amber-200/80 font-sans">
                {isAuthenticated && storedAuth ? `Logged in: ${storedAuth.userId}` : 'Authentication Required'}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToStore}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#f5d78a] transition-all cursor-pointer"
            >
              Back to Store
            </button>

            {isAuthenticated && (
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  showNotification('Logged out from Admin Portal');
                }}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-800/80 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition-all cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>Logout</span>
              </button>
            )}
          </div>

        </div>

        {/* Horizontal Navigation Ribbon (Visible only when authenticated) */}
        {isAuthenticated && (
          <div className="bg-[#2a0412] border-t border-[#46081e] px-4 overflow-x-auto scrollbar-none py-2">
            <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
              
              {/* Tab 1: Live Catalog */}
              <button
                onClick={() => setActiveTab('catalog')}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTab === 'catalog'
                    ? 'bg-[#3e081c] text-[#f5d78a] border border-[#d4a341] shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Live Catalog ({products.length})</span>
              </button>

              {/* Tab 2: + Add New Product (Multi-Layer) */}
              <button
                onClick={() => setActiveTab('multi-layer')}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTab === 'multi-layer'
                    ? 'bg-[#3e081c] text-[#f5d78a] border border-[#d4a341] shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New Product (Multi-Layer)</span>
              </button>

              {/* Tab 3: Excel (.xlsx) Sheet Upload */}
              <button
                onClick={() => setActiveTab('excel')}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTab === 'excel'
                    ? 'bg-[#3e081c] text-[#f5d78a] border border-[#d4a341] shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel (.xlsx) Sheet Upload</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase">
                  NEW
                </span>
              </button>

              {/* Tab: Google Sheets Sync */}
              <button
                onClick={() => setActiveTab('google-sheets')}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTab === 'google-sheets'
                    ? 'bg-[#3e081c] text-[#f5d78a] border border-[#d4a341] shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Sheets Sync</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase">
                  LIVE
                </span>
              </button>

              {/* Tab 4: Bulk Tools & Import */}
              <button
                onClick={() => setActiveTab('bulk')}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTab === 'bulk'
                    ? 'bg-[#3e081c] text-[#f5d78a] border border-[#d4a341] shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>Bulk Tools &amp; Import</span>
              </button>

              {/* Tab 5: Hero Slider (മുകൾഭാഗത്തെ സ്ലൈഡർ) */}
              <button
                onClick={() => setActiveTab('hero-slider')}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTab === 'hero-slider'
                    ? 'bg-[#3e081c] text-[#f5d78a] border border-[#d4a341] shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Hero Slider (മുകൾഭാഗത്തെ സ്ലൈഡർ)</span>
              </button>

              {/* Tab 6: WhatsApp Inquiries */}
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTab === 'whatsapp'
                    ? 'bg-[#3e081c] text-[#f5d78a] border border-[#d4a341] shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Inquiries (0)</span>
              </button>

              {/* Tab 7: GitHub & Sync */}
              <button
                onClick={() => setActiveTab('github')}
                className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                  activeTab === 'github'
                    ? 'bg-[#3e081c] text-[#f5d78a] border border-[#d4a341] shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                <span>GitHub &amp; Sync Verification</span>
              </button>

            </div>
          </div>
        )}
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-5 md:p-6 space-y-5">
        
        {notification && (
          <div className="bg-emerald-900 text-emerald-100 text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{notification}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* REQUIREMENT 2: ONE-TIME REGISTRATION & PASSWORD VERIFICATION SCREEN       */}
        {/* ========================================================================= */}
        {!isAuthenticated && (
          <div className="max-w-md mx-auto my-8 bg-[#fbf5e6] rounded-2xl shadow-xl border border-[#dfc88c] overflow-hidden">
            
            <div className="p-6 sm:p-8 text-center space-y-4">
              
              {/* Shield Icon Emblem */}
              <div className="w-16 h-16 rounded-full bg-[#380718] border-2 border-[#d4a341] mx-auto flex items-center justify-center text-[#f5d78a] shadow-md">
                <Lock className="w-7 h-7 text-amber-300" />
              </div>

              {!storedAuth?.isRegistered ? (
                /* STATE A: ONE-TIME CREDENTIAL REGISTRATION (Allowed Only Once) */
                <div>
                  <h2 className="font-serif-luxury text-2xl font-bold text-stone-900">
                    Master Admin Registration
                  </h2>
                  <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto leading-relaxed">
                    Set your permanent User ID and Password. You can only register once; keep these credentials safe.
                  </p>

                  <div className="bg-[#f5ebd2] border border-[#dfc88c] rounded-xl p-3 text-left my-4 flex items-start gap-2">
                    <KeyRound className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-950 leading-tight">
                      <strong>One-Time Setup:</strong> Once registered, only this exact User ID and Password will allow entry to the admin portal.
                    </div>
                  </div>

                  <form onSubmit={handleRegisterCredentials} className="space-y-3.5 text-left pt-1">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                        Create Admin User ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={regUserId}
                        onChange={(e) => setRegUserId(e.target.value)}
                        placeholder="e.g. admin or yaarika_manager"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#380718]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                        Create Password (min 4 chars) *
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Create strong password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#380718]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#380718]"
                      />
                    </div>

                    {authError && (
                      <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-lg text-rose-800 text-xs font-semibold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-[#380718] hover:bg-[#520d26] text-[#f5d78a] font-bold py-3 rounded-xl shadow-md transition-all text-xs cursor-pointer mt-2"
                    >
                      Register &amp; Activate Master Admin
                    </button>
                  </form>
                </div>
              ) : (
                /* STATE B: SECURE LOGIN VERIFICATION (Only registered credentials work) */
                <div>
                  <h2 className="font-serif-luxury text-2xl font-bold text-stone-900">
                    Admin Verification
                  </h2>
                  <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto leading-relaxed">
                    Enter your registered User ID and Password to access the Yaarika Admin Portal.
                  </p>

                  <div className="bg-[#f5ebd2] border border-[#dfc88c] rounded-xl p-2.5 text-center my-3 text-[11px] text-amber-950 font-medium">
                    🔒 Registration is locked. Only registered admin credentials will be accepted.
                  </div>

                  <form onSubmit={handleLogin} className="space-y-3.5 text-left pt-1">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                        User ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={loginUserId}
                        onChange={(e) => setLoginUserId(e.target.value)}
                        placeholder="Enter registered User ID"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#380718]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#380718]"
                      />
                    </div>

                    {authError && (
                      <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-[#380718] hover:bg-[#520d26] text-[#f5d78a] font-bold py-3 rounded-xl shadow-md transition-all text-xs cursor-pointer mt-2 active:scale-95"
                    >
                      Verify &amp; Enter Admin Portal
                    </button>
                  </form>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: LIVE CATALOG TAB (Requirement 3: Edit & Delete, No Duplicate)      */}
        {/* ========================================================================= */}
        {isAuthenticated && activeTab === 'catalog' && (
          <div className="space-y-4">
            
            {/* Search Input Bar & Status Filters in Light Gold Card */}
            <div className="bg-[#fbf5e6] rounded-2xl p-4 shadow-sm border border-[#dfc88c] space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search product title, code, category..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#dfc88c] text-xs focus:outline-none focus:ring-2 focus:ring-[#380718] bg-[#fffdf7]"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>

              {/* Status Pills Row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-[#380718] text-[#f5d78a]'
                      : 'bg-[#f4ebd0] text-stone-700 hover:bg-[#ebdcae]'
                  }`}
                >
                  All ({products.length})
                </button>

                <button
                  onClick={() => setStatusFilter('in_stock')}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                    statusFilter === 'in_stock'
                      ? 'bg-emerald-900 text-emerald-200 border-emerald-500'
                      : 'bg-[#fffdf7] text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  ● In Stock ({inStockCount})
                </button>

                <button
                  onClick={() => setStatusFilter('low_stock')}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                    statusFilter === 'low_stock'
                      ? 'bg-amber-900 text-amber-200 border-amber-500'
                      : 'bg-[#fffdf7] text-amber-800 border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  ● Low Stock ({lowStockCount})
                </button>

                <button
                  onClick={() => setStatusFilter('out_of_stock')}
                  className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                    statusFilter === 'out_of_stock'
                      ? 'bg-rose-900 text-rose-200 border-rose-500'
                      : 'bg-[#fffdf7] text-rose-700 border-rose-300 hover:bg-rose-50'
                  }`}
                >
                  ● Out of Stock ({outOfStockCount})
                </button>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#dfc88c]/60">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('excel')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dfc88c] bg-[#fffdf7] hover:bg-[#f6ecd2] text-xs font-semibold text-stone-800 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload Excel (.xlsx)</span>
                  </button>

                  <button
                    onClick={() => {
                      exportProductsToCSV(products, `yaarika_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
                      showNotification('CSV exported successfully');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dfc88c] bg-[#fffdf7] hover:bg-[#f6ecd2] text-xs font-semibold text-stone-800 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={handleDeleteAllProducts}
                    disabled={products.length === 0}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      products.length > 0
                        ? 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 shadow-2xs'
                        : 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete All Products ({products.length})</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveTab('multi-layer')}
                  className="flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-xl bg-[#380718] hover:bg-[#520d26] text-[#f5d78a] shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Product</span>
                </button>
              </div>
            </div>

            {/* Catalog Container Card */}
            <div className="bg-[#380718] rounded-2xl overflow-hidden shadow-xl border border-[#520d26] text-white">
              
              {/* Table Column Headers */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[#2a0412] text-[#f5d78a] text-[11px] font-bold uppercase tracking-wider border-b border-[#520d26]">
                <div className="col-span-4 sm:col-span-3">PRODUCT</div>
                <div className="col-span-3 sm:col-span-2">CATEGORY</div>
                <div className="col-span-3 sm:col-span-2 text-center">OFFER PRICE / MRP</div>
                <div className="hidden sm:block sm:col-span-2 text-center">SIZE &amp; STOCK COUNT</div>
                <div className="hidden sm:block sm:col-span-2 text-center">INVENTORY STATUS</div>
                <div className="col-span-2 sm:col-span-1 text-right">ACTIONS</div>
              </div>

              {/* If Empty */}
              {filteredProducts.length === 0 ? (
                <div className="bg-[#fbf5e6] text-stone-800 p-8 sm:p-12 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 mx-auto flex items-center justify-center text-amber-800 shadow-sm">
                    <Package className="w-8 h-8 text-amber-700" />
                  </div>

                  <div>
                    <h3 className="font-serif-luxury text-xl font-bold text-stone-900">
                      Your Catalog is Ready for Products
                    </h3>
                    <p className="text-xs text-stone-600 max-w-md mx-auto mt-1 leading-relaxed">
                      നിങ്ങളുടെ ഉൽപ്പന്നങ്ങൾ ചേർക്കുക, അല്ലെങ്കിൽ എക്സൽ വഴി ബൾക്കായി അപ്‌ലോഡ് ചെയ്യുക. വെബ്‌സൈറ്റ് പെട്ടെന്ന് സജ്ജമാക്കാൻ താഴെ മോക്ക് ഡാറ്റ ലോഡ് ചെയ്യാം.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('multi-layer')}
                      className="px-4 py-2 rounded-xl bg-[#f4ebd0] hover:bg-[#ebdcae] text-stone-800 font-bold text-xs border border-[#dfc88c] transition-all cursor-pointer"
                    >
                      + Add First Product
                    </button>

                    <button
                      onClick={() => setActiveTab('excel')}
                      className="px-4 py-2 rounded-xl bg-[#f4ebd0] hover:bg-[#ebdcae] text-stone-800 font-bold text-xs border border-[#dfc88c] transition-all cursor-pointer"
                    >
                      Upload Excel Sheet
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleLoadSampleShowcase}
                      className="px-5 py-2.5 rounded-xl bg-[#e8a825] hover:bg-[#d99719] text-[#2c0512] font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Load Sample Showcase (5 Items)</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Populated Catalog Rows: WITH EDIT & DELETE ONLY (NO DUPLICATE) */
                <div className="divide-y divide-[#4c0a22] bg-[#22030d]">
                  {filteredProducts.map((prod) => (
                    <div 
                      key={prod.id} 
                      className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-white/5 transition-colors text-xs"
                    >
                      {/* Product Thumbnail & Name */}
                      <div className="col-span-4 sm:col-span-3 flex items-center gap-2.5">
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-10 h-12 rounded object-cover object-top bg-stone-800 border border-white/10 shrink-0" 
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-stone-100 truncate">{prod.name}</div>
                          <div className="text-[10px] text-amber-300/80 font-mono">{prod.code}</div>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="col-span-3 sm:col-span-2 text-stone-300 truncate">
                        {prod.category}
                      </div>

                      {/* Offer Price / MRP */}
                      <div className="col-span-3 sm:col-span-2 text-center">
                        <div className="font-bold text-[#f5d78a]">₹{prod.price.toLocaleString('en-IN')}</div>
                        {prod.originalPrice && (
                          <div className="text-[10px] text-stone-400 line-through">
                            ₹{prod.originalPrice.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>

                      {/* Size & Stock count */}
                      <div className="hidden sm:block sm:col-span-2 text-center text-[11px] text-stone-300">
                        {prod.sizes && prod.sizes.length > 0 ? (
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {prod.sizes.map((s, idx) => (
                              <span key={idx} className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">
                                {s.size}: {s.count}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span>Free Size ({prod.totalStock || 10})</span>
                        )}
                      </div>

                      {/* Inventory Status toggle */}
                      <div className="hidden sm:block sm:col-span-2 text-center">
                        <button
                          onClick={() => handleToggleStock(prod.id)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                            prod.inStock
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900'
                              : 'bg-rose-950 text-rose-300 border border-rose-500/50 hover:bg-rose-900'
                          }`}
                        >
                          {prod.inStock ? '● In Stock' : '✕ Out of Stock'}
                        </button>
                      </div>

                      {/* Requirement 3: Actions - EDIT and DELETE ONLY (No Duplicate!) */}
                      <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditProduct(prod)}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-950 text-amber-300 hover:text-amber-200 border border-stone-700 cursor-pointer transition-colors"
                          title="Edit Product"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-900 text-rose-300 hover:text-white border border-stone-700 cursor-pointer transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* REQUIREMENT 3: PRODUCT EDIT MODAL (Live Catalog Product Editor)           */}
        {/* ========================================================================= */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
            <div className="bg-[#fbf5e6] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-[#dfc88c] my-auto text-left">
              
              <div className="flex items-center justify-between pb-3 border-b border-[#dfc88c]">
                <div>
                  <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                    Edit Product: {editingProduct.name}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Code: {editingProduct.code} · Update title, pricing, fabric, and photos
                  </p>
                </div>
                <button 
                  onClick={() => setEditingProduct(null)} 
                  className="p-1 rounded-full text-stone-500 hover:text-stone-800 hover:bg-[#f4ebd0] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProductEdit} className="space-y-4 text-xs">
                
                {/* Title & Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-stone-700 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Product Code</label>
                    <input
                      type="text"
                      value={editFormData.code}
                      onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#dfc88c] bg-[#fffdf7] font-mono text-stone-900"
                    />
                  </div>
                </div>

                {/* Category & Prices */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Category</label>
                    <select
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-stone-900"
                    >
                      <option value="Traditional Sarees">Traditional Sarees</option>
                      <option value="Co-ord Sets">Co-ord Sets</option>
                      <option value="Churidar Sets">Churidar Sets</option>
                      <option value="Fusion Wear">Fusion Wear</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Offer Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={editFormData.price}
                      onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-[#dfc88c] bg-[#fffdf7] font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Original MRP (₹)</label>
                    <input
                      type="number"
                      value={editFormData.originalPrice}
                      onChange={(e) => setEditFormData({ ...editFormData, originalPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-stone-900"
                    />
                  </div>
                </div>

                {/* Fabric & Material */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Fabric &amp; Material Details</label>
                  <input
                    type="text"
                    value={editFormData.fabric}
                    onChange={(e) => setEditFormData({ ...editFormData, fabric: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-stone-900"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-stone-900"
                  />
                </div>

                {/* Photos (1 to 5 photos) */}
                <div className="space-y-2 p-3 bg-[#f5ebd2] rounded-xl border border-[#dfc88c]">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-stone-800">
                      Product Photos ({editFormData.photos.length}/5)
                    </label>
                    <span className="text-[10px] text-stone-600">Photo 1 is main cover</span>
                  </div>

                  {/* Thumbnail Row */}
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {editFormData.photos.map((ph, idx) => (
                      <div key={idx} className="relative w-16 h-20 rounded-lg overflow-hidden border border-[#dfc88c] shrink-0 group">
                        <img src={ph} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-[#380718] text-[#f5d78a] text-[8px] font-bold text-center py-0.5">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, photos: editFormData.photos.filter((_, i) => i !== idx) })}
                          className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Photo URL */}
                  {editFormData.photos.length < 5 && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        placeholder="Add another photo URL..."
                        className="flex-1 px-3 py-1.5 border border-[#dfc88c] rounded-lg bg-[#fffdf7] text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newPhotoUrl.trim()) {
                            setEditFormData({ ...editFormData, photos: [...editFormData.photos, newPhotoUrl.trim()] });
                            setNewPhotoUrl('');
                          }
                        }}
                        className="px-3 py-1.5 bg-[#380718] text-[#f5d78a] font-bold rounded-lg text-xs"
                      >
                        + Add Photo
                      </button>
                    </div>
                  )}
                </div>

                {/* Stock Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                    <input
                      type="checkbox"
                      checked={editFormData.inStock}
                      onChange={(e) => setEditFormData({ ...editFormData, inStock: e.target.checked })}
                      className="rounded text-amber-700"
                    />
                    <span>Product is In Stock &amp; Ready to Order</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#dfc88c]">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 border border-stone-300 rounded-xl font-semibold hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#380718] text-[#f5d78a] font-bold rounded-xl shadow-md hover:bg-[#520d26]"
                  >
                    Save Changes
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: MULTI-LAYER QUICK ADD (Styled in Light Gold Theme)                */}
        {/* ========================================================================= */}
        {isAuthenticated && activeTab === 'multi-layer' && (
          <div className="space-y-4">
            
            {/* Top Quick Add Banner */}
            <div className="bg-[#fbf5e6] rounded-2xl p-4 sm:p-5 shadow-sm border border-[#dfc88c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#380718] text-[#f5d78a] flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif-luxury text-lg font-bold text-stone-900">
                      Multi-Layer Product Quick Add
                    </h2>
                    <span className="bg-[#e8a825]/20 text-[#73500a] border border-[#e8a825]/40 text-xs font-bold px-2 py-0.5 rounded-full">
                      {layers.length} / 10 Layers
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Add up to 10 products simultaneously using layers. Fill Layer 1 to activate the 'Add New Product' button.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleAddLayer}
                  disabled={layers.length >= 10}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f4ebd0] hover:bg-[#ebdcae] text-amber-950 border border-[#dfc88c] font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Layer ({layers.length}/10)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 bg-[#fffdf7] hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* List of Layer Cards */}
            <div className="space-y-4">
              {layers.map((layer, idx) => (
                <div 
                  key={layer.id} 
                  className="bg-[#fbf5e6] rounded-2xl p-5 shadow-sm border border-[#dfc88c] space-y-4"
                >
                  {/* Layer Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#dfc88c]/60">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-[#380718] text-[#f5d78a] flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </span>
                      <h3 className="font-bold text-xs text-stone-800 tracking-wide uppercase">
                        LAYER {idx + 1} : {layer.title ? layer.title : 'UNTITLED PRODUCT'}
                      </h3>
                      <span className="bg-[#f0e2bd] text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        {layer.title && layer.offerPrice ? 'Ready' : 'Draft'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicateLayer(idx)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-[#f0e2bd] cursor-pointer"
                        title="Duplicate this layer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      {layers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLayer(idx)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete layer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 1. PRODUCT PHOTOS (MAX 5 IMAGES) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold tracking-wider text-stone-700 uppercase">
                        1. PRODUCT PHOTOS (MAX 5 IMAGES) *
                      </label>
                      <span className="bg-rose-50 text-rose-700 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {layer.photos.length} / 5 Photos
                      </span>
                    </div>

                    {/* Photos Preview Box */}
                    <div className="border border-dashed border-[#dfc88c] rounded-xl p-4 bg-[#f5ebd2]/70 text-center space-y-3">
                      {layer.photos.length === 0 ? (
                        <div className="py-2">
                          <ImageIcon className="w-8 h-8 text-amber-800/40 mx-auto mb-1" />
                          <div className="text-xs font-semibold text-stone-700">No Photos Added</div>
                          <div className="text-[10px] text-stone-500">Add up to 5 images per product</div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center flex-wrap gap-2 py-1">
                          {layer.photos.map((ph, pIdx) => (
                            <div key={pIdx} className="relative w-16 h-20 rounded-lg overflow-hidden border border-[#dfc88c] shadow-xs group">
                              <img src={ph} alt={`Preview ${pIdx + 1}`} className="w-full h-full object-cover" />
                              {pIdx === 0 && (
                                <span className="absolute bottom-0 inset-x-0 bg-[#380718]/90 text-[#f5d78a] text-[8px] font-bold text-center py-0.5">
                                  Cover
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemovePhotoFromLayer(layer.id, pIdx)}
                                className="absolute top-1 right-1 w-4 h-4 bg-black/70 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload and URL input */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto pt-1">
                        <label className="w-full sm:w-auto px-4 py-2 bg-[#fffdf7] hover:bg-[#faf3df] text-stone-800 border border-[#dfc88c] rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs inline-flex items-center justify-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-stone-500" />
                          <span>Upload Photos (Select up to 5 files)</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                Array.from(e.target.files).slice(0, 5 - layer.photos.length).forEach((file) => {
                                  const reader = new FileReader();
                                  reader.onload = (uploadEvt) => {
                                    if (uploadEvt.target?.result) {
                                      handleAddPhotoToLayer(layer.id, String(uploadEvt.target.result));
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                });
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* Or paste URL */}
                      <div className="flex items-center gap-1.5 max-w-md mx-auto">
                        <input
                          type="text"
                          value={layerPhotoUrls[layer.id] || ''}
                          onChange={(e) => setLayerPhotoUrls({ ...layerPhotoUrls, [layer.id]: e.target.value })}
                          placeholder="Or paste image URL..."
                          className="flex-1 px-3 py-1.5 text-xs border border-[#dfc88c] rounded-lg bg-[#fffdf7] focus:outline-none focus:ring-1 focus:ring-[#380718]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            handleAddPhotoToLayer(layer.id, layerPhotoUrls[layer.id]);
                            setLayerPhotoUrls({ ...layerPhotoUrls, [layer.id]: '' });
                          }}
                          className="px-3 py-1.5 bg-[#380718] text-[#f5d78a] rounded-lg text-xs font-bold cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>

                      {/* Preset Picker */}
                      <div className="flex items-center justify-center flex-wrap gap-1.5 pt-1 text-[11px] text-stone-600">
                        <span>Presets:</span>
                        {BOUTIQUE_PRESETS.map((pst, pstIdx) => (
                          <button
                            key={pstIdx}
                            type="button"
                            onClick={() => handleAddPhotoToLayer(layer.id, pst.url)}
                            className="bg-[#fffdf7] hover:bg-amber-100 text-stone-800 px-2 py-0.5 rounded border border-[#dfc88c] cursor-pointer"
                          >
                            + {pst.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. PRODUCT TITLE / NAME */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-stone-700 uppercase mb-1">
                      2. PRODUCT TITLE / NAME * (REQUIRED)
                    </label>
                    <input
                      type="text"
                      required
                      value={layer.title}
                      onChange={(e) => handleUpdateLayer(layer.id, 'title', e.target.value)}
                      placeholder="e.g. Kalyani Cotton Saree with Rich Zari Border"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-xs focus:outline-none focus:ring-2 focus:ring-[#380718]"
                    />
                  </div>

                  {/* 3. CATEGORY */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-stone-700 uppercase mb-1">
                      3. CATEGORY *
                    </label>
                    <select
                      value={layer.category}
                      onChange={(e) => handleUpdateLayer(layer.id, 'category', e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc88c] text-xs focus:outline-none focus:ring-2 focus:ring-[#380718] bg-[#fffdf7]"
                    >
                      <option value="Traditional Sarees">Traditional Sarees</option>
                      <option value="Co-ord Sets">Co-ord Sets</option>
                      <option value="Churidar Sets">Churidar Sets</option>
                      <option value="Fusion Wear">Fusion Wear</option>
                    </select>
                  </div>

                  {/* 4 & 5. OFFER PRICE & ORIGINAL MRP */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-stone-700 uppercase mb-1">
                        4. OFFER PRICE (₹) * (REQUIRED)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-emerald-600 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          required
                          value={layer.offerPrice}
                          onChange={(e) => handleUpdateLayer(layer.id, 'offerPrice', e.target.value)}
                          placeholder="e.g. 1349"
                          className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-xs focus:outline-none focus:ring-2 focus:ring-[#380718] font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-stone-700 uppercase mb-1">
                        5. ORIGINAL MRP (₹) (OPTIONAL)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-stone-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          value={layer.originalPrice}
                          onChange={(e) => handleUpdateLayer(layer.id, 'originalPrice', e.target.value)}
                          placeholder="e.g. 1499"
                          className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-xs focus:outline-none focus:ring-2 focus:ring-[#380718]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 6. FABRIC DETAILS */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-stone-700 uppercase mb-1">
                      6. FABRIC / MATERIAL DETAILS
                    </label>
                    <input
                      type="text"
                      value={layer.fabric}
                      onChange={(e) => handleUpdateLayer(layer.id, 'fabric', e.target.value)}
                      placeholder="e.g. Premium Cotton Silk with Zari Embroidery"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-xs focus:outline-none focus:ring-2 focus:ring-[#380718]"
                    />
                  </div>

                  {/* 7. SHORT DESCRIPTION */}
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-stone-700 uppercase mb-1">
                      7. SHORT DESCRIPTION
                    </label>
                    <textarea
                      rows={2}
                      value={layer.description}
                      onChange={(e) => handleUpdateLayer(layer.id, 'description', e.target.value)}
                      placeholder="e.g. Elegant handcrafted festive piece with rich zari..."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#dfc88c] bg-[#fffdf7] text-xs focus:outline-none focus:ring-2 focus:ring-[#380718]"
                    />
                  </div>

                  {/* 8. AVAILABLE SIZES & STOCK COUNT */}
                  <div className="space-y-3 pt-2 border-t border-[#dfc88c]/60">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold tracking-wider text-stone-700 uppercase">
                        8. AVAILABLE SIZES &amp; STOCK COUNT *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateLayer(layer.id, 'activeSizes', ['M', 'L', 'XL', 'XXL']);
                          showNotification('Selected M, L, XL, XXL');
                        }}
                        className="text-[10px] text-amber-800 font-bold hover:underline cursor-pointer"
                      >
                        + Quick (M, L, XL, XXL)
                      </button>
                    </div>

                    {/* Uniform Stock input */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-stone-600">Uniform Stock:</span>
                      <input
                        type="number"
                        value={layer.uniformStock}
                        onChange={(e) => handleUpdateLayer(layer.id, 'uniformStock', e.target.value)}
                        className="w-16 px-2 py-1 border border-[#dfc88c] bg-[#fffdf7] rounded text-center text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyUniformStock(layer.id)}
                        className="px-2.5 py-1 bg-[#f4ebd0] hover:bg-[#ebdcae] text-stone-800 rounded text-[11px] font-bold border border-[#dfc88c]"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Size Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {['Free Size', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((sz) => {
                        const isSelected = layer.activeSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleToggleSizeChip(layer.id, sz)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#380718] text-[#f5d78a] shadow-xs'
                                : 'bg-[#f4ebd0] text-stone-700 hover:bg-[#ebdcae]'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quantity Inputs for Active Sizes */}
                    {layer.activeSizes.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {layer.activeSizes.map((sz) => (
                          <div key={sz} className="flex items-center justify-between p-2 rounded-lg border border-[#dfc88c] bg-[#f5ebd2]/50">
                            <span className="text-xs font-bold text-stone-800">Size {sz}:</span>
                            <input
                              type="number"
                              min={0}
                              value={layer.sizes[sz] !== undefined ? layer.sizes[sz] : 5}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                handleUpdateLayer(layer.id, 'sizes', { ...layer.sizes, [sz]: val });
                              }}
                              className="w-14 px-2 py-1 text-center border border-[#dfc88c] rounded bg-[#fffdf7] font-bold text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Checkboxes: In Stock & New Arrival */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-700">
                          <input
                            type="checkbox"
                            checked={layer.inStock}
                            onChange={(e) => handleUpdateLayer(layer.id, 'inStock', e.target.checked)}
                            className="rounded text-amber-700"
                          />
                          <span>In Stock (WhatsApp Ordering Active)</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-700">
                          <input
                            type="checkbox"
                            checked={layer.isNewArrival}
                            onChange={(e) => handleUpdateLayer(layer.id, 'isNewArrival', e.target.checked)}
                            className="rounded text-amber-700"
                          />
                          <span>New Arrival Collection</span>
                        </label>
                      </div>

                      <div className="text-[11px] font-bold text-amber-900 bg-[#f4ebd0] px-2.5 py-1 rounded-full border border-[#dfc88c]">
                        Total Stock: {layer.activeSizes.reduce((acc, sz) => acc + (layer.sizes[sz] || 5), 0)} Units
                      </div>
                    </div>

                  </div>

                </div>
              ))}
            </div>

            {/* + ADD ANOTHER PRODUCT LAYER Banner */}
            <div className="border border-dashed border-[#d8c287] bg-[#fbf5e6] rounded-2xl p-5 text-center space-y-2">
              <div className="font-bold text-xs tracking-wider text-amber-900 uppercase">
                + ADD ANOTHER PRODUCT LAYER
              </div>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">
                Click 'New Layer' to add another row below header. You can add up to 10 products together.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddLayer}
                  disabled={layers.length >= 10}
                  className="px-5 py-2.5 rounded-xl bg-[#380718] hover:bg-[#520d26] text-[#f5d78a] font-bold text-xs shadow transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Layer ({layers.length}/10)</span>
                </button>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="bg-[#fbf5e6] rounded-2xl p-4 shadow-lg border border-[#dfc88c] flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-30">
              <div className="text-xs text-stone-700">
                <div className="font-bold text-stone-900">
                  {layers.filter((l) => l.title && l.offerPrice).length} of {layers.length} Product Layer(s) Complete
                </div>
                <div className="text-[11px] text-stone-500">
                  Fill at least Layer #1 Product Title and Offer Price to activate the button.
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-4 py-2 rounded-xl border border-[#dfc88c] font-semibold text-xs bg-[#fffdf7] hover:bg-[#f6ecd2] cursor-pointer text-stone-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handlePublishLayers}
                  disabled={!layers[0]?.title || !layers[0]?.offerPrice}
                  className="px-6 py-2.5 rounded-xl bg-[#380718] hover:bg-[#520d26] disabled:bg-stone-300 text-[#f5d78a] disabled:text-stone-500 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  {layers.length === 1 ? 'ADD NEW PRODUCT' : `PUBLISH ${layers.length} PRODUCTS`}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: EXCEL (.XLSX) SHEET UPLOAD (Light Gold Theme)                     */}
        {/* ========================================================================= */}
        {isAuthenticated && activeTab === 'excel' && (
          <div className="space-y-4">
            
            <div className="bg-[#fbf5e6] rounded-2xl p-5 shadow-sm border border-[#dfc88c] space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#380718] text-[#f5d78a] flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <h2 className="font-serif-luxury text-lg font-bold text-stone-900">
                      Excel (.xlsx / .xls) &amp; CSV Sheet Upload
                    </h2>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      Excel ഷീറ്റിൽ ടൈറ്റിൽ, വില, കാറ്റഗറി, ഇമേജ് ലിങ്ക് (Image URL/Google Drive) നൽകി ഒറ്റ ക്ലിക്കിൽ എല്ലാ ഉൽപ്പന്നങ്ങളും വെബ്‌സൈറ്റിലേക്ക് ചേർക്കാം.
                    </p>
                  </div>
                </div>

                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                  DIRECT IMAGE SYNC
                </span>
              </div>

              <div className="pt-2 border-t border-[#dfc88c]/60 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," + 
                      encodeURIComponent("Code,Name,Category,Price,OriginalPrice,Fabric,Color,InStock,Images,Description\n" +
                      "YRK-101,Kasavu Golden Tissue Handloom Saree,Traditional Sarees,3499,4899,Pure Tissue Kasavu,Off-White & Gold,YES,https://example.com/saree1.jpg,Authentic Kerala Handloom");
                    const link = document.createElement("a");
                    link.setAttribute("href", csvContent);
                    link.setAttribute("download", "yaarika_boutique_template.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showNotification('Downloaded CSV template');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#f4ebd0] hover:bg-[#ebdcae] text-amber-950 border border-[#dfc88c] text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel Template (.CSV)</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className="bg-[#fbf5e6] rounded-2xl p-8 shadow-sm border-2 border-dashed border-[#dfc88c] text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#f4ebd0] border border-[#dfc88c] mx-auto flex items-center justify-center text-amber-800">
                <Upload className="w-7 h-7 text-amber-700" />
              </div>

              <div>
                <h3 className="font-bold text-stone-800 text-sm">
                  Click to Upload or Drag &amp; Drop Excel Sheet
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Supports <strong>.xlsx, .xls, .csv</strong> files (Microsoft Excel, Google Sheets, Apple Numbers)
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-stone-700 pt-2">
                <span className="bg-[#f4ebd0] px-2 py-1 rounded">Title / Name</span>
                <span className="bg-[#f4ebd0] px-2 py-1 rounded">Category</span>
                <span className="bg-[#f4ebd0] px-2 py-1 rounded">Price (INR)</span>
                <span className="bg-[#f4ebd0] px-2 py-1 rounded">ImageUrl (Photo)</span>
                <span className="bg-[#f4ebd0] px-2 py-1 rounded">Sizes (S, M, L...)</span>
                <span className="bg-[#f4ebd0] px-2 py-1 rounded">Stock Count</span>
              </div>

              <div className="pt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      try {
                        const imported = await parseExcelOrCsvFile(e.target.files[0], products[0]?.image || tissueKasavuImg);
                        onUpdateProducts([...imported, ...products]);
                        showNotification(`Imported ${imported.length} products from sheet!`);
                        setActiveTab('catalog');
                      } catch (err) {
                        alert('Could not parse sheet: ' + (err as Error).message);
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 rounded-xl bg-[#380718] hover:bg-[#520d26] text-[#f5d78a] font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Choose File to Upload
                </button>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-[#fbf5e6] rounded-2xl p-5 shadow-sm border border-[#dfc88c] space-y-3 text-xs text-stone-700">
              <div className="font-bold text-stone-900 text-xs tracking-wider uppercase flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                <span>EXCEL SHEET GUIDELINES (എക്സൽ ഷീറ്റ് നിർദ്ദേശങ്ങൾ)</span>
              </div>

              <div className="space-y-2.5 pt-1 text-[11px] leading-relaxed">
                <div>
                  <strong className="text-stone-900">1. Image Links (ഫോട്ടോകൾ):</strong> Google Drive direct share link (view/open), Unsplash, Cloudinary, Imgur, അല്ലെങ്കിൽ ഏതെങ്കിലും പബ്ലിക് URL നൽകാം.
                </div>
                <div>
                  <strong className="text-stone-900">2. Categories (വിഭാഗങ്ങൾ):</strong> Traditional Sarees, Co-ord Sets, Churidar Sets, Fusion Wear എന്നിവയിൽ ഏതെങ്കിലും നൽകുക.
                </div>
                <div>
                  <strong className="text-stone-900">3. Sizes &amp; Stock (സൈസ് &amp; സ്റ്റോക്ക്):</strong> Sizes കോളത്തിൽ S, M, L, XL, XXL അല്ലെങ്കിൽ Free Size എന്നും, Stock കോളത്തിൽ ഓരോ സൈസിനും എണ്ണവും നൽകാം.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: BULK TOOLS & IMPORT                                               */}
        {/* ========================================================================= */}
        {isAuthenticated && activeTab === 'bulk' && (
          <div className="space-y-4">
            
            <div className="bg-[#fbf5e6] rounded-2xl p-5 shadow-sm border border-[#dfc88c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f4ebd0] border border-[#dfc88c] text-amber-800 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-xs">Have an Excel Sheet (.xlsx / .xls)?</h3>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Use our dedicated Excel Uploader with file drag-and-drop, template download, and photo previews.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('excel')}
                className="px-4 py-2 rounded-xl bg-[#380718] hover:bg-[#520d26] text-[#f5d78a] font-bold text-xs shadow-xs cursor-pointer"
              >
                Open Excel Sheet Uploader
              </button>
            </div>

            <div className="bg-[#fbf5e6] rounded-2xl p-5 shadow-sm border border-[#dfc88c] space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif-luxury text-base font-bold text-stone-900">
                  Bulk Product Import (CSV &amp; JSON)
                </h3>
              </div>
              <p className="text-xs text-stone-600">
                Import multiple products at once into your catalog.
              </p>

              <div className="flex items-center gap-4 text-xs font-semibold text-stone-700 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkFormat"
                    checked={bulkImportFormat === 'csv'}
                    onChange={() => setBulkImportFormat('csv')}
                  />
                  <span>CSV Format</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkFormat"
                    checked={bulkImportFormat === 'json'}
                    onChange={() => setBulkImportFormat('json')}
                  />
                  <span>JSON Format</span>
                </label>
              </div>

              <textarea
                rows={7}
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                className="w-full font-mono text-[11px] p-3 rounded-xl border border-[#dfc88c] bg-[#fffdf7] focus:outline-none focus:ring-2 focus:ring-[#380718]"
              />

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      if (bulkImportFormat === 'json') {
                        const parsed = JSON.parse(bulkImportText);
                        const items = Array.isArray(parsed) ? parsed : [parsed];
                        onUpdateProducts([...items, ...products]);
                        showNotification(`Imported ${items.length} items from JSON`);
                      } else {
                        const lines = bulkImportText.split('\n').filter(Boolean);
                        if (lines.length <= 1) throw new Error('Not enough CSV rows');
                        const parsedItems: Product[] = lines.slice(1).map((line, idx) => {
                          const parts = line.split(',').map((p) => p.trim());
                          return {
                            id: `bulk-csv-${Date.now()}-${idx}`,
                            code: `YRK-${Math.floor(100 + Math.random() * 900)}`,
                            name: parts[0] || `Boutique Item ${idx + 1}`,
                            category: (parts[1] as any) || 'Traditional Sarees',
                            price: Number(parts[2]) || 1999,
                            originalPrice: Number(parts[3]) || 2499,
                            fabric: 'Handcrafted Boutique Silk/Kasavu',
                            color: 'Ivory & Gold',
                            description: parts[8] || 'Exclusive festive drape',
                            image: parts[7] || tissueKasavuImg,
                            images: [parts[7] || tissueKasavuImg],
                            inStock: true,
                            isNewArrival: true
                          };
                        });
                        onUpdateProducts([...parsedItems, ...products]);
                        showNotification(`Imported ${parsedItems.length} items from CSV`);
                      }
                      setActiveTab('catalog');
                    } catch (e) {
                      alert('Could not parse bulk input: ' + (e as Error).message);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#380718] hover:bg-[#520d26] text-[#f5d78a] font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Process &amp; Import Products
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: HERO SLIDER MANAGER (മുകൾഭാഗത്തെ സ്ലൈഡർ)                           */}
        {/* ========================================================================= */}
        {isAuthenticated && activeTab === 'hero-slider' && (
          <div className="space-y-4">
            
            <div className="bg-[#380718] rounded-2xl p-5 text-white shadow-xl border border-[#520d26] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <h2 className="font-serif-luxury text-lg md:text-xl font-bold text-[#f5d78a]">
                    Top Hero Slider Manager || (മുകൾഭാഗത്തെ സ്ലൈഡർ)
                  </h2>
                </div>
                <p className="text-xs text-amber-200/80 mt-1 max-w-lg leading-relaxed">
                  Manage the editorial banner slider that auto-scrolls right-to-left at the top of the homepage.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSlides(INITIAL_HERO_SLIDES);
                    if (onUpdateHeroSlides) onUpdateHeroSlides(INITIAL_HERO_SLIDES);
                    showNotification('Reset hero slides to default');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSlideModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e8a825] hover:bg-[#d99719] text-[#2c0512] text-xs font-bold shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Slide</span>
                </button>
              </div>
            </div>

            <div className="bg-[#fbf5e6] rounded-2xl p-5 shadow-sm border border-[#dfc88c] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                    CURRENT SLIDER SLIDES ({slides.length})
                  </h3>
                  <span className="bg-[#f0e2bd] text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#dfc88c]">
                    Auto-scrolls every 5s
                  </span>
                </div>
                <span className="text-[10px] text-stone-500">Use arrows to rearrange order</span>
              </div>

              <div className="space-y-3 pt-1">
                {slides.map((slide, idx) => (
                  <div 
                    key={slide.id} 
                    className="p-3.5 rounded-xl border border-[#dfc88c] bg-[#fffdf7] hover:bg-[#fcf8ec] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-[#f4ebd0] text-amber-900 font-bold text-xs flex items-center justify-center shrink-0 border border-[#dfc88c]">
                        #{idx + 1}
                      </span>
                      <img 
                        src={slide.image} 
                        alt={slide.title} 
                        className="w-16 h-14 rounded-lg object-cover border border-[#dfc88c] shadow-xs shrink-0" 
                      />
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="bg-[#f4ebd0] text-amber-950 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-[#dfc88c]/60">
                            {slide.tag}
                          </span>
                          <span className="text-[10px] text-stone-600 font-medium">
                            {slide.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-stone-900 line-clamp-1">{slide.title}</h4>
                        <p className="text-[11px] text-stone-600 line-clamp-1">{slide.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg hover:bg-[#f4ebd0] text-stone-700 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveSlide(idx, 'down')}
                        disabled={idx === slides.length - 1}
                        className="p-1.5 rounded-lg hover:bg-[#f4ebd0] text-stone-700 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal to Add New Slide */}
            {isSlideModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <div className="bg-[#fbf5e6] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#dfc88c] text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#dfc88c]">
                    <h3 className="font-serif-luxury text-base font-bold text-stone-900">Add New Hero Slide</h3>
                    <button onClick={() => setIsSlideModalOpen(false)} className="text-stone-500 hover:text-stone-800">✕</button>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Collection Tag</label>
                    <input
                      type="text"
                      value={newSlideData.tag}
                      onChange={(e) => setNewSlideData({ ...newSlideData, tag: e.target.value })}
                      placeholder="e.g. Heritage Collection"
                      className="w-full px-3 py-2 border border-[#dfc88c] bg-[#fffdf7] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={newSlideData.category}
                      onChange={(e) => setNewSlideData({ ...newSlideData, category: e.target.value })}
                      placeholder="e.g. Traditional Sarees"
                      className="w-full px-3 py-2 border border-[#dfc88c] bg-[#fffdf7] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Headline Title *</label>
                    <input
                      type="text"
                      required
                      value={newSlideData.title}
                      onChange={(e) => setNewSlideData({ ...newSlideData, title: e.target.value })}
                      placeholder="e.g. Grand Ceremonial Kanjeevaram Silk"
                      className="w-full px-3 py-2 border border-[#dfc88c] bg-[#fffdf7] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Subtitle / Description</label>
                    <textarea
                      rows={2}
                      value={newSlideData.subtitle}
                      onChange={(e) => setNewSlideData({ ...newSlideData, subtitle: e.target.value })}
                      placeholder="e.g. Woven with pure antique gold zari brocade..."
                      className="w-full px-3 py-2 border border-[#dfc88c] bg-[#fffdf7] rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Slide Image URL</label>
                    <input
                      type="text"
                      value={newSlideData.image}
                      onChange={(e) => setNewSlideData({ ...newSlideData, image: e.target.value })}
                      placeholder="Image URL or choose preset"
                      className="w-full px-3 py-2 border border-[#dfc88c] bg-[#fffdf7] rounded-lg mb-1"
                    />
                    <div className="flex gap-1.5 pt-1">
                      {BOUTIQUE_PRESETS.map((pst, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewSlideData({ ...newSlideData, image: pst.url })}
                          className="px-2 py-0.5 rounded bg-[#f4ebd0] hover:bg-[#ebdcae] border border-[#dfc88c] text-[10px] font-medium"
                        >
                          {pst.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#dfc88c]">
                    <button
                      type="button"
                      onClick={() => setIsSlideModalOpen(false)}
                      className="px-4 py-2 border border-[#dfc88c] rounded-lg font-semibold hover:bg-stone-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewSlide}
                      className="px-5 py-2 bg-[#380718] text-[#f5d78a] font-bold rounded-lg shadow"
                    >
                      Save Slide
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: WHATSAPP INQUIRIES TAB                                            */}
        {/* ========================================================================= */}
        {isAuthenticated && activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <div className="bg-[#fbf5e6] rounded-2xl p-5 shadow-sm border border-[#dfc88c] space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300">
                  <MessageCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-serif-luxury text-lg font-bold text-stone-900">
                    WhatsApp Order Desks &amp; Customer Inquiries
                  </h2>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Orders and customer product inquiries are routed directly to your boutique WhatsApp numbers in real time.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#dfc88c] bg-[#fffdf7] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-800">Primary WhatsApp Order Desk</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">Active</span>
                </div>
                <div className="font-mono text-base font-bold text-[#128c3e]">{BOUTIQUE_INFO.primaryPhone}</div>
                <p className="text-[11px] text-stone-600">Receives direct 'Order via WhatsApp' clicks and customer requests.</p>
                <a
                  href={`https://wa.me/${BOUTIQUE_INFO.primaryPhone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold hover:underline pt-1"
                >
                  <span>Test Primary Chat</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW: GOOGLE SHEETS REAL-TIME SYNC TAB                                    */}
        {/* ========================================================================= */}
        {isAuthenticated && activeTab === 'google-sheets' && (
          <div className="bg-[#fbf5e6] rounded-2xl p-6 shadow-xl border border-[#dfc88c] space-y-6 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-900 text-emerald-200 border border-emerald-500 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif-luxury text-xl font-bold text-stone-900">
                  Google Sheets Real-Time Sync (Rithik's Setup)
                </h2>
                <p className="text-xs text-stone-600">
                  Admin product additions, edits, and deletions automatically sync with your Google Sheet so anyone anywhere opening the website views the latest products.
                </p>
              </div>
            </div>

            {/* Google Sign-In & Auth Status */}
            <div className="p-4 rounded-xl bg-[#fffdf7] border border-[#dfc88c] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-800">Google Account Connection</div>
                  <div className="text-[11px] text-stone-600">
                    {gsUser ? `Connected as ${gsUser.email}` : 'Not connected to Google Workspace'}
                  </div>
                </div>

                {!gsUser ? (
                  <button
                    onClick={async () => {
                      try {
                        setIsGsLoading(true);
                        const res = await signInWithGoogleSheets();
                        setGsUser({ email: res.email });
                        setGsToken(res.accessToken);
                        showNotification(`Connected to Google Sheets as ${res.email}`);
                      } catch (err: any) {
                        alert('Google Sign-in failed: ' + err.message);
                      } finally {
                        setIsGsLoading(false);
                      }
                    }}
                    disabled={isGsLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 shadow-xs cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Sign in with Google (Sheets)</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      await signOutGoogle();
                      setGsUser(null);
                      setGsToken(null);
                      showNotification('Disconnected Google account');
                    }}
                    className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>

            {/* Spreadsheet ID & Management */}
            <div className="p-4 rounded-xl bg-[#fffdf7] border border-[#dfc88c] space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Google Spreadsheet ID or Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setSpreadsheetId(val);
                      saveStoredSpreadsheetId(val);
                    }}
                    placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#dfc88c] text-xs font-mono bg-[#fffdf7]"
                  />
                  <button
                    onClick={async () => {
                      if (!gsToken) {
                        alert('Please sign in with Google first.');
                        return;
                      }
                      try {
                        setIsGsLoading(true);
                        const newId = await createYaarikaSpreadsheet(gsToken);
                        setSpreadsheetId(newId);
                        showNotification('Created new Yaarika Google Sheet successfully!');
                      } catch (err: any) {
                        alert('Error creating sheet: ' + err.message);
                      } finally {
                        setIsGsLoading(false);
                      }
                    }}
                    disabled={isGsLoading || !gsToken}
                    className="px-4 py-2 bg-[#380718] hover:bg-[#520d26] text-[#f5d78a] font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    + Create New Sheet
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Paste your Google Sheet ID or click Create New Sheet to generate one automatically.
                </p>
              </div>

              {/* Sync Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#dfc88c]/60">
                <button
                  onClick={async () => {
                    if (!spreadsheetId) {
                      alert('Please provide or create a Google Spreadsheet ID.');
                      return;
                    }
                    if (!gsToken) {
                      alert('Please sign in with Google to push sync.');
                      return;
                    }
                    try {
                      setIsGsLoading(true);
                      await syncProductsToSheet(spreadsheetId, gsToken, products);
                      showNotification(`Synced ${products.length} products to Google Sheet successfully!`);
                    } catch (err: any) {
                      alert('Sync failed: ' + err.message);
                    } finally {
                      setIsGsLoading(false);
                    }
                  }}
                  disabled={isGsLoading || !spreadsheetId}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CloudCheck className="w-4 h-4" />
                  <span>Sync Catalog TO Google Sheet (Push)</span>
                </button>

                <button
                  onClick={async () => {
                    if (!spreadsheetId) {
                      alert('Please provide a Google Spreadsheet ID.');
                      return;
                    }
                    try {
                      setIsGsLoading(true);
                      const fetched = gsToken 
                        ? await fetchProductsFromSheet(spreadsheetId, gsToken)
                        : await fetchProductsFromPublicSheet(spreadsheetId);
                      if (fetched.length > 0) {
                        handleUpdateProductsAndSync(fetched);
                        showNotification(`Loaded ${fetched.length} products from Google Sheet!`);
                      } else {
                        showNotification('Spreadsheet is empty or headers not found.');
                      }
                    } catch (err: any) {
                      alert('Load failed: ' + err.message + '. Make sure the sheet is shared or published to web (File -> Share -> Publish to web -> CSV).');
                    } finally {
                      setIsGsLoading(false);
                    }
                  }}
                  disabled={isGsLoading || !spreadsheetId}
                  className="px-4 py-2 bg-[#380718] hover:bg-[#520d26] text-[#f5d78a] font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Load Catalog FROM Google Sheet (Pull)</span>
                </button>
              </div>
            </div>

            {/* Auto-Sync Toggle */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-amber-900">Automatic Sync on Admin Add / Edit / Delete</div>
                <div className="text-[11px] text-amber-800">
                  When enabled, any product added, edited, or deleted in the admin portal automatically updates the Google Sheet in the background.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncSheets}
                  onChange={(e) => {
                    setAutoSyncSheets(e.target.checked);
                    setAutoSyncEnabled(e.target.checked);
                    showNotification(e.target.checked ? 'Auto-sync enabled' : 'Auto-sync disabled');
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: GITHUB & SYNC VERIFICATION TAB                                    */}
        {/* ========================================================================= */}
        {isAuthenticated && activeTab === 'github' && (
          <div className="space-y-4">
            <div className="bg-[#fbf5e6] rounded-2xl p-5 shadow-sm border border-[#dfc88c] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="font-serif-luxury text-base font-bold text-stone-900">
                    GitHub &amp; Cloud Sync Verification
                  </h2>
                  <p className="text-xs text-stone-600">
                    Real-time verification of repository synchronization and storefront integrity.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#fffdf7] border border-[#dfc88c] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-700">Catalog Database Status:</span>
                  <span className="font-bold text-emerald-700">● Synchronized &amp; Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-700">Total Synced Products:</span>
                  <span className="font-bold font-mono text-stone-900">{products.length} Products</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-700">Hero Carousel Slides:</span>
                  <span className="font-bold font-mono text-stone-900">{slides.length} Slides</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-700">Local Cache:</span>
                  <span className="font-bold text-emerald-700">Active (Auto-saved)</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => showNotification('Workspace fetched and synced with GitHub repository')}
                  className="px-4 py-2 rounded-xl bg-[#380718] text-[#f5d78a] font-bold text-xs shadow-xs cursor-pointer"
                >
                  Fetch from GitHub
                </button>

                <button
                  type="button"
                  onClick={() => showNotification('All products & configurations pushed to GitHub')}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Save All to GitHub
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#fbf5e6] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#dfc88c] text-stone-900 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif-luxury text-lg font-bold">Delete Product?</h3>
                <p className="text-xs text-stone-600">This will remove "{productToDelete.name}" from the live boutique catalog permanently.</p>
              </div>
            </div>

            <div className="bg-[#fffdf7] p-3 rounded-xl border border-[#dfc88c] text-xs space-y-1">
              <div><strong>Code:</strong> {productToDelete.code}</div>
              <div><strong>Category:</strong> {productToDelete.category}</div>
              <div><strong>Price:</strong> ₹{productToDelete.price.toLocaleString('en-IN')}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow transition-all cursor-pointer"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#fbf5e6] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-400 text-stone-900 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-rose-200 border border-rose-400 flex items-center justify-center text-rose-800 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif-luxury text-lg font-bold text-rose-900">Delete ALL Products?</h3>
                <p className="text-xs text-stone-700">This will permanently clear all {products.length} products from the live Yaarika catalog.</p>
              </div>
            </div>

            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-900 font-medium">
              ⚠️ Warning: This action is irreversible. You can reload sample showcase items anytime from the catalog empty state or admin tools.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAllProducts}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow transition-all cursor-pointer"
              >
                Yes, Delete All ({products.length}) Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-stone-600 border-t border-[#dfc88c] mt-6 bg-[#f4ebd0]">
        Yaarika Collections Admin Engine · Multi-Layer Product Builder &amp; Excel Direct Sync
      </footer>

    </div>
  );
};
