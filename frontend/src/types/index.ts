// User types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'super_admin';
}

// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
}

export interface CategoryFormData {
  name: string;
  description?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// Product types
export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  images: string[];
  price?: number;
  priceRange?: string;
  specifications: Record<string, string>;
  technicalDetails: Record<string, string>;
  applications: string[];
  features: string[];
  model?: string;
  brand?: string;
  warranty?: string;
  brochureUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  stockStatus: 'in_stock' | 'out_of_stock' | 'on_order';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  categoryId: number;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  categoryId: number;
  description?: string;
  shortDescription?: string;
  images?: string[];
  price?: number;
  priceRange?: string;
  specifications?: Record<string, string>;
  technicalDetails?: Record<string, string>;
  applications?: string[];
  features?: string[];
  model?: string;
  brand?: string;
  warranty?: string;
  brochureUrl?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'on_order';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

// Contact types
export interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  inquiryType: 'general' | 'product' | 'support' | 'quote' | 'partnership';
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminNotes?: string;
  isRead: boolean;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  inquiryType?: 'general' | 'product' | 'support' | 'quote' | 'partnership';
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Query parameters
export interface ProductQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  featured?: boolean;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  minPrice?: number;
  maxPrice?: number;
  application?: string;
  brand?: string;
}

export interface ContactQuery {
  page?: number;
  limit?: number;
  status?: string;
  inquiryType?: string;
  priority?: string;
  isRead?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Dashboard types
export interface DashboardStats {
  overview: {
    products: {
      total: number;
      active: number;
      featured: number;
      outOfStock: number;
    };
    categories: {
      total: number;
      active: number;
    };
    contacts: {
      total: number;
      new: number;
      unread: number;
      monthly: number;
      lastMonth: number;
      growth: string;
    };
    users: {
      total: number;
      active: number;
    };
  };
  charts: {
    monthlyTrends: Array<{
      month: string;
      contacts: number;
    }>;
    inquiryStats: Array<{
      type: string;
      count: number;
    }>;
    categoryStats: Array<{
      id: number;
      name: string;
      productCount: number;
    }>;
  };
  recentActivity: {
    contacts: Contact[];
    products: Product[];
  };
}

// Form validation types
export interface FormErrors {
  [key: string]: string;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}