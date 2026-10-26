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
import AddProductForm from "./components/AddProductForm";
import EditProductForm from "./components/EditProductForm";
import { deleteProduct } from "./services/api";

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  async function refreshProducts() {
  const latestProducts = await fetchProducts();
  setProducts(latestProducts);
}

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

              <div className="inventory-actions">
                <span className="section-meta">
                  Live API inventory
                </span>

                <button
                   type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setShowAddProduct(true);
                    }}
                  >
                    + Add Product
                </button>
              </div>
            </div>

            {showAddProduct && (
              <AddProductForm
                onCreated={async () => {
                  await refreshProducts();
                  setShowAddProduct(false);
                }}
                onCancel={() => setShowAddProduct(false)}
              />
            )}

            {editingProduct && (
              <EditProductForm
                key={editingProduct.id}
                product={editingProduct}
                onUpdated={async () => {
                  await refreshProducts();
                  setEditingProduct(null);
                }}
                onCancel={() => setEditingProduct(null)}
              />
            )}

            {loading ? (
              <p role="status">Loading inventory...</p>
            ) : error ? (
              <p role="alert">
                Unable to load inventory: {error}
              </p>
            ) : (
              <>
              <InventoryTable
                products={products}
                onEdit={(product) => {
                  setShowAddProduct(false);
                  setEditingProduct(product);
                }}
                 onDelete={(product) => {
                  setDeleteError(null);
                  setDeletingProduct(product);
                }}
              />

              {deletingProduct && (
                <div
                  className="delete-confirmation"
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="delete-confirmation-title"
                  aria-describedby="delete-confirmation-description"
                >
                  <h3 id="delete-confirmation-title">Delete Product?</h3>

                  <p id="delete-confirmation-description">
                    Are you sure you want to permanently delete{" "}
                    <strong>{deletingProduct.name}</strong> (
                    {deletingProduct.sku})?
                  </p>

                  {deleteError && <p role="alert">{deleteError}</p>}

                  <div className="product-form-actions">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => {
                        setDeletingProduct(null);
                        setDeleteError(null);
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={async () => {
                        if (!deletingProduct || isDeleting) return;

                        setIsDeleting(true);
                        setDeleteError(null);

                        try {
                          await deleteProduct(deletingProduct.id);
                          await refreshProducts();
                          setDeletingProduct(null);
                        } catch (error) {
                          setDeleteError(
                            error instanceof Error
                              ? error.message
                              : "Unable to delete product."
                          );
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                    >
                      {isDeleting ? "Deleting..." : "Confirm Delete"}
                    </button>
                  </div>
                </div>
              )}
              </>
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