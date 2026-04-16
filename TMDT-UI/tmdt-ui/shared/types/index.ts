// Các Interface cốt lõi dùng trên toàn bộ ứng dụng

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  images: string[];
  aiMaskUrl?: string; // Dùng cho tính năng thử đồ
  categoryId: string;
  rating?: number;
  soldCount?: number;
}

export interface CartItemType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant: string;
  imageUrl?: string;
}

export type PaymentMethod = 'VNPAY' | 'MOMO' | 'COD';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';