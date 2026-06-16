/**
 * Shared Type Definitions for KHALAB Fashion Store
 */

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  sizes: string[];
  images: string[];
  videos: string[];
  category: string;
  catalog: string;
  inventory: number;
  rating: number;
  reviewCount: number;
  featured?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Catalog {
  id: string;
  name: string;
  subtitle: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  link: string;
}

export interface Promo {
  code: string;
  discount: number; // Percentage or absolute (e.g. 10% or 200 BDT)
  type: 'percentage' | 'fixed';
  description: string;
  active: boolean;
}

export interface AppConfig {
  brandName: string;
  tagline: string;
  address: string;
  mobile: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  logoUrl: string;
  banners: Banner[];
  promos: Promo[];
  themeMode: 'crimson' | 'emerald' | 'amber' | 'slate' | 'violet' | 'custom';
  customPrimary: string; // custom hex color
  customSecondary: string; // custom hex color
}

export interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  price: number;
  size: string;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  promoApplied?: string;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Card' | 'COD';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  orderStatus: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  fraudAlert: boolean;
  fraudDetails: string[];
  fraudRiskScore: number;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'promo' | 'order';
  orderId?: string;
}
