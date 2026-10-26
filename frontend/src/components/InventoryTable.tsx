import type { Product } from "../types/inventory";

type InventoryTableProps = {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export default function InventoryTable({
  products,
  onEdit,
  onDelete,
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
            <th scope="col">Actions</th>
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
              <td>
                <button
                  type="button"
                  className="inventory-edit-button"
                  onClick={() => onEdit(product)}
                  aria-label={`Edit ${product.name}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="inventory-delete-button"
                  onClick={() => onDelete(product)}
                  aria-label={`Delete ${product.name}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}