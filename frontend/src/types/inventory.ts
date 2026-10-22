export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  collection: string;
  quantity: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

export interface Collection {
  id: number;
  name: string;
  season: string;
  productCount: number;
  image: string;
}