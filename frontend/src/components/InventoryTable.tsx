import type { Product } from "../types/inventory";
import type { AppRole } from "../services/roles";
import ProductImage from "./ProductImage";

type InventoryTableProps = {
  products: Product[];
  role: AppRole | null;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export default function InventoryTable({
  products,
  role,
  onEdit,
  onDelete,
}: InventoryTableProps) {
  const canEdit =
    role === "administrator" ||
    role === "inventory_manager";

  const canDelete = role === "administrator";

  const canManage = canEdit || canDelete;

  return (
    <div className="table-scroll">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th scope="col">Image</th>
            <th>Product</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Status</th>

            {canManage && (
              <th scope="col">Actions</th>
            )}
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td className="sku">{product.sku}</td>

              <td>
                <ProductImage
                  key={product.image_path ?? "no-image"}
                  imagePath={product.image_path}
                  productName={product.name}
                />
              </td>

              <td className="product-name">
                {product.name}
              </td>

              <td>{product.category}</td>
              <td>{product.quantity}</td>

              <td>
                <span
                  className={`status-badge ${
                    product.status
                      .toLowerCase()
                      .replaceAll(" ", "-")
                  }`}
                >
                  {product.status}
                </span>
              </td>

              {canManage && (
                <td>
                  {canEdit && (
                    <button
                      type="button"
                      className="inventory-edit-button"
                      onClick={() => onEdit(product)}
                      aria-label={`Edit ${product.name}`}
                    >
                      Edit
                    </button>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      className="inventory-delete-button"
                      onClick={() => onDelete(product)}
                      aria-label={`Delete ${product.name}`}
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}