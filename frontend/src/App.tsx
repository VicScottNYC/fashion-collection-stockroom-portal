import { useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatCard from "./components/StatCard";
import CollectionCard from "./components/CollectionCard";
import InventoryTable from "./components/InventoryTable";

import { collections } from "./data/mockData";
import { fetchProducts } from "./services/api";
import {
  getCurrentUserRole,
  type AppRole,
} from "./services/roles";
import type { Product } from "./types/inventory";

import "./App.css";
import AddProductForm from "./components/AddProductForm";
import EditProductForm from "./components/EditProductForm";
import { deleteProduct } from "./services/api";

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRole() {
      try {
        const currentRole = await getCurrentUserRole();

        if (active) {
          setRole(currentRole);
          setRoleError(null);
        }
      } catch {
        if (active) {
          setRole(null);
          setRoleError("Unable to verify your permissions.");
        }
      }
    }

    void loadRole();

    return () => {
      active = false;
    };
  }, []);

  const canManageProducts =
    role === "administrator" ||
    role === "inventory_manager";

  const canDeleteProducts = role === "administrator";
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
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

  const collectionOptions = [...new Set(products.map((product) => product.collection))].sort();
    const categoryOptions = [...new Set(products.map((product) => product.category))].sort();

    const filteredProducts = products.filter((product) => {
      const query = searchQuery.trim().toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);

      const matchesCollection =
        collectionFilter === "All" || product.collection === collectionFilter;

      const matchesCategory =
        categoryFilter === "All" || product.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" || product.status === statusFilter;

      return (
        matchesSearch &&
        matchesCollection &&
        matchesCategory &&
        matchesStatus
      );
    });

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <main className="main-content">
        <Header title={activePage} role={role} />

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

              <div className="inventory-search">
                <input
                  type="search"
                  placeholder="Search products or SKU..."
                  aria-label="Search inventory by product name or SKU"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>

              <div className="inventory-filters">
                <select
                  aria-label="Filter by collection"
                  value={collectionFilter}
                  onChange={(event) => setCollectionFilter(event.target.value)}
                >
                  <option value="All">All Collections</option>
                  {collectionOptions.map((collection) => (
                    <option key={collection} value={collection}>
                      {collection}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by category"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by stock status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="All">All Stock Statuses</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>

              <div className="inventory-actions">
                <span className="section-meta">
                  Live API inventory
                </span>

                {canManageProducts && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setShowAddProduct(true);
                    }}
                  >
                    + Add Product
                  </button>
                )}
              </div>
            </div>

            {canManageProducts && showAddProduct && (
              <AddProductForm
                onCreated={async () => {
                  await refreshProducts();
                  setShowAddProduct(false);
                }}
                onCancel={() => setShowAddProduct(false)}
              />
            )}

            {canManageProducts && editingProduct && (
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
            {roleError && (
              <p role="alert">{roleError}</p>
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
                products={filteredProducts}
                role={role}
                onEdit={(product) => {
                  setShowAddProduct(false);
                  setEditingProduct(product);
                }}
                 onDelete={(product) => {
                  setDeleteError(null);
                  setDeletingProduct(product);
                }}
              />

              {canDeleteProducts && deletingProduct && (
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