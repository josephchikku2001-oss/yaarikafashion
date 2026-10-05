export type ProductCategory = 
  | 'All' 
  | 'Traditional Sarees' 
  | 'Co-ord Sets' 
  | 'Churidar Sets' 
  | 'Fusion Wear' 
  | 'New Arrivals';

export interface Product {
  id: string;
  code: string;
  name: string;
  category: Exclude<ProductCategory, 'All'>;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  secondaryImage?: string;
  description: string;
  fabric: string;
  color: string;
  inStock: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  blouseIncluded?: boolean;
  featured?: boolean;
  length?: string;
  sizes?: { size: string; count: number }[];
  totalStock?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
}

export interface AdminAuthState {
  isAuthenticated: boolean;
  username: string;
  loginMethod: 'firebase' | 'master';
}
