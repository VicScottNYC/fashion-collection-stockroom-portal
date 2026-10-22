import type { Product } from "../types/inventory";

interface InventoryTableProps {
  products: Product[];
}

export default function InventoryTable({
  products,
}: InventoryTableProps) {
  return (
    <div className="table-scroll">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td className="sku">{product.sku}</td>
              <td className="product-name">{product.name}</td>
              <td>{product.category}</td>
              <td>{product.quantity}</td>
              <td>
                <span
                  className={`status-badge ${
                    product.status.toLowerCase().replaceAll(" ", "-")
                  }`}
                >
                  {product.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}