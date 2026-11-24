export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
  image_url?: string | null;
}

export interface OrderItem {
  id?: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price?: number | string;
  price?: number | string;
}

export interface Order {
  id: number;
  status: "pending" | "paid" | "cancelled" | string;
  total_price?: number | string;
  total?: number | string;
  items?: OrderItem[];
  created_at?: string;
}
