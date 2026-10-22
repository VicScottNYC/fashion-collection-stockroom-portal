import type { Product } from "../types/inventory";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/products`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch products: HTTP ${response.status}`
    );
  }

  const products: Product[] = await response.json();

  return products;
}