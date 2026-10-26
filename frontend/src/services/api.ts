import type { Product } from "../types/inventory";
import { supabase } from "../lib/supabase";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8001";

export type ProductInput = Omit<Product, "id" | "image_path">;
export type ProductChanges = Partial<ProductInput>;

// Retrieve the current authenticated user's access token.
async function getAuthHeaders(): Promise<Headers> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${session.access_token}`);

  return headers;
}

// Add authentication to every inventory API request.
async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = await getAuthHeaders();

  new Headers(options.headers).forEach((value, key) => {
    headers.set(key, value);
  });

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

// Handle product responses and API errors.
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

// GET: All authenticated roles.
export async function fetchProducts(): Promise<Product[]> {
  const response = await authenticatedFetch("/api/products");

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      typeof errorData?.detail === "string"
        ? errorData.detail
        : `Failed to fetch products: HTTP ${response.status}`
    );
  }

  return (await response.json()) as Product[];
}

// POST: Administrator and Inventory Manager.
export async function createProduct(
  product: ProductInput
): Promise<Product> {
  const response = await authenticatedFetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  return handleResponse(response);
}

// PATCH: Administrator and Inventory Manager.
export async function updateProduct(
  productId: number,
  changes: ProductChanges
): Promise<Product> {
  const response = await authenticatedFetch(
    `/api/products/${productId}`,
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

// DELETE: Administrator only.
export async function deleteProduct(
  productId: number
): Promise<void> {
  const response = await authenticatedFetch(
    `/api/products/${productId}`,
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