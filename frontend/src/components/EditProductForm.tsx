import { useState, type FormEvent } from "react";
import type { Product } from "../types/inventory";
import { updateProduct, type ProductInput } from "../services/api";

type EditProductFormProps = {
  product: Product;
  onUpdated: () => Promise<void>;
  onCancel: () => void;
};

export default function EditProductForm({
  product,
  onUpdated,
  onCancel,
}: EditProductFormProps) {
  const [values, setValues] = useState<ProductInput>({
    sku: product.sku,
    name: product.name,
    category: product.category,
    collection: product.collection,
    quantity: product.quantity,
    status: product.status,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof ProductInput>(
    field: K,
    value: ProductInput[K]
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      await updateProduct(product.id, {
        sku: values.sku.trim(),
        name: values.name.trim(),
        category: values.category.trim(),
        collection: values.collection.trim(),
        quantity: values.quantity,
        status: values.status,
      });

      await onUpdated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update product."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <h2>Edit Product</h2>
      <p>Update an existing inventory record.</p>

      <label>
        SKU
        <input
          required
          maxLength={50}
          value={values.sku}
          onChange={(e) => updateField("sku", e.target.value)}
        />
      </label>

      <label>
        Product Name
        <input
          required
          maxLength={150}
          value={values.name}
          onChange={(e) => updateField("name", e.target.value)}
        />
      </label>

      <label>
        Category
        <input
          required
          maxLength={100}
          value={values.category}
          onChange={(e) => updateField("category", e.target.value)}
        />
      </label>

      <label>
        Collection
        <input
          required
          maxLength={50}
          value={values.collection}
          onChange={(e) => updateField("collection", e.target.value)}
        />
      </label>

      <label>
        Quantity
        <input
          type="number"
          min={0}
          required
          value={values.quantity}
          onChange={(e) =>
            updateField("quantity", Number(e.target.value))
          }
        />
      </label>

      <label>
        Stock Status
        <select
          value={values.status}
          onChange={(e) =>
            updateField(
              "status",
              e.target.value as ProductInput["status"]
            )
          }
        >
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </label>

      {error && <p role="alert">{error}</p>}

      <div className="product-form-actions">
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}