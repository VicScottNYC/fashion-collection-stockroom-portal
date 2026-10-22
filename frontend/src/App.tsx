import { useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatCard from "./components/StatCard";
import CollectionCard from "./components/CollectionCard";
import InventoryTable from "./components/InventoryTable";

import { products, collections } from "./data/mockData";

import "./App.css";

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");

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
                detail="Sample catalog"
              />
              <StatCard
                label="INVENTORY UNITS"
                value={totalUnits}
                detail="Across sample products"
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
                  Sample inventory
                </span>
              </div>

              <InventoryTable products={products} />
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