import { useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatCard from "./components/StatCard";
import CollectionCard from "./components/CollectionCard";
import InventoryTable from "./components/InventoryTable";

import { collections } from "./data/mockData";
import { fetchProducts } from "./services/api";
import type { Product } from "./types/inventory";

import "./App.css";

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  // Product data now comes from FastAPI.
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const data = await fetchProducts();

        if (!cancelled) {
          setProducts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load inventory."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalUnits = products.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  const lowStock = products.filter(
    (product) => product.status === "Low Stock"
  ).length;

  const outOfStock = products.filter(
    (product) => product.status === "Out of Stock"
  ).length;

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <main className="main-content">
        <Header title={activePage} />

        {activePage === "Dashboard" ? (
          <>
            <section className="stats-grid" aria-label="Inventory metrics">
              <StatCard
                label="ACTIVE COLLECTIONS"
                value={collections.length}
                detail="Seasonal collections"
              />
              <StatCard
                label="PRODUCT STYLES"
                value={products.length}
                detail="API product catalog"
              />
              <StatCard
                label="INVENTORY UNITS"
                value={totalUnits}
                detail="Across API products"
              />
              <StatCard
                label="STOCK ALERTS"
                value={lowStock + outOfStock}
                detail="Require attention"
              />
            </section>

            <section className="content-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">THE EDIT</p>
                  <h2>Seasonal Collections</h2>
                </div>
                <span className="section-meta">
                  Collection overview
                </span>
              </div>

              <div className="collections-grid">
                {collections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                  />
                ))}
              </div>
            </section>

            <section className="content-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">STOCKROOM OPERATIONS</p>
                  <h2>Inventory Overview</h2>
                </div>
                <span className="section-meta">
                  Live API inventory
                </span>
              </div>

              {loading ? (
                <p role="status">Loading inventory...</p>
              ) : error ? (
                <p role="alert">
                  Unable to load inventory: {error}
                </p>
              ) : (
                <InventoryTable products={products} />
              )}
            </section>
          </>
        ) : (
          <section className="placeholder-page">
            <p className="eyebrow">COMING SOON</p>
            <h2>{activePage}</h2>
            <p>
              This module will be developed in an upcoming sprint.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}