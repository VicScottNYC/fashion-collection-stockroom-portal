import type { Product } from "../types/inventory";

const API_BASE_URL = "http://127.0.0.1:8000";

export type ProductInput = Omit<Product, "id">;
export type ProductChanges = Partial<ProductInput>;

async function handleResponse(response: Response): Promise<Product> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    const message =
      typeof errorData?.detail === "string"
        ? errorData.detail
        : `Request failed: HTTP ${response.status}`;

    throw new Error(message);
  }

  return (await response.json()) as Product;
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/api/products`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch products: HTTP ${response.status}`
    );
  }

  return (await response.json()) as Product[];
}

export async function createProduct(
  product: ProductInput
): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  return handleResponse(response);
}

export async function updateProduct(
  productId: number,
  changes: ProductChanges
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${productId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(changes),
    }
  );

  return handleResponse(response);
}

export async function deleteProduct(productId: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${productId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    const message =
      typeof errorData?.detail === "string"
        ? errorData.detail
        : `Failed to delete product: HTTP ${response.status}`;

    throw new Error(message);
  }
}