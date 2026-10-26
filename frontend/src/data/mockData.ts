import type { Product, Collection } from "../types/inventory";

export const products: Product[] = [
  {
    id: 1,
    sku: "FW26-JKT-001",
    name: "Wool Tailored Jacket",
    category: "Outerwear",
    collection: "Fall / Winter 2026",
    quantity: 48,
    status: "In Stock",
    image_path: null,
  },
  {
    id: 2,
    sku: "FW26-KNT-002",
    name: "Cashmere Knit Sweater",
    category: "Knitwear",
    collection: "Fall / Winter 2026",
    quantity: 8,
    status: "Low Stock",
    image_path: null,
  },
  {
    id: 3,
    sku: "SS27-DRS-003",
    name: "Silk Midi Dress",
    category: "Dresses",
    collection: "Spring / Summer 2027",
    quantity: 0,
    status: "Out of Stock",
    image_path: null,
  },
  {
    id: 4,
    sku: "FW26-TRS-004",
    name: "Wide-Leg Trousers",
    category: "Bottoms",
    collection: "Fall / Winter 2026",
    quantity: 120,
    status: "In Stock",
    image_path: null,
  },
];

export const collections: Collection[] = [
  {
    id: 1,
    name: "Fall / Winter 2026",
    season: "FW26",
    productCount: 42,
    image: "/collections/fall-winter.jpg",
  },
  {
    id: 2,
    name: "Spring / Summer 2027",
    season: "SS27",
    productCount: 36,
    image: "/collections/spring-summer.jpg",
  },
];