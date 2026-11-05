export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt: string;
  position: number;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  position: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isActive?: boolean;
  images?: ProductImage[];
  imageUrl?: string | null;
  imageUrls?: string[];
  optionsJson?: string | null;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
}

export interface Shop {
  id: string;
  ownerId?: string | null;
  sellerId?: string | null;
  slug: string;
  name: string;
  headline?: string | null;
  tagline?: string | null;
  area?: string | null;
  quartier?: string | null;
  description?: string | null;
  category?: string | null;
  themeColor?: string | null;
  whatsapp?: string | null;
  waveNumber?: string | null;
  wavePaymentLink?: string | null;
  orangeMoneyNumber?: string | null;
  acceptsCash?: boolean;
  deliveryFee: number;
  deliveryNote?: string | null;
  logoUrl?: string | null;
  logoKey?: string | null;
  coverUrl?: string | null;
  coverKey?: string | null;
  facebookPixelId?: string | null;
  tiktokPixelId?: string | null;
  rating?: number;
  featured?: boolean;
  plan?: string;
  planExpiresAt?: string | number | Date | null;
  status?: "DRAFT" | "ACTIVE" | "SUSPENDED";
  isPublished?: boolean;
  isSuspended?: boolean;
  products?: Product[];
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  name?: string;
  options?: string | null;
  product?: Product;
}

export interface Order {
  id: string;
  reference: string;
  number?: string;
  publicToken?: string;
  shopId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  note?: string | null;
  paymentMethod?: string;
  paymentStatus?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: "NEW" | "CONFIRMED" | "PAID" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | string;
  items?: OrderItem[];
  shop?: Shop;
  createdAt: string | number | Date;
  updatedAt?: string | number | Date;
}

export interface User {
  id: string;
  phone: string;
  name?: string;
}

export interface Seller {
  id: string;
  phone: string;
  name?: string;
}
