import { useState, type FormEvent } from "react";
import {
  createProduct,
  type ProductInput,
} from "../services/api";

type AddProductFormProps = {
  onCreated: () => Promise<void>;
  onCancel: () => void;
};

const initialProduct: ProductInput = {
  sku: "",
  name: "",
  category: "",
  collection: "",
  quantity: 0,
  status: "In Stock",
};

export default function AddProductForm({
  onCreated,
  onCancel,
}: AddProductFormProps) {
  const [product, setProduct] =
    useState<ProductInput>({ ...initialProduct });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof ProductInput>(
    field: K,
    value: ProductInput[K]
  ) {
    setProduct((current) => ({
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
      await createProduct({
        ...product,
        sku: product.sku.trim(),
        name: product.name.trim(),
        category: product.category.trim(),
        collection: product.collection.trim(),
      });

      await onCreated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create product."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <h2>Add Product</h2>
      <p>Create a new inventory record.</p>

      <label>
        SKU
        <input
          required
          maxLength={50}
          value={product.sku}
          onChange={(e) => updateField("sku", e.target.value)}
        />
      </label>

      <label>
        Product Name
        <input
          required
          maxLength={150}
          value={product.name}
          onChange={(e) => updateField("name", e.target.value)}
        />
      </label>

      <label>
        Category
        <input
          required
          maxLength={100}
          value={product.category}
          onChange={(e) => updateField("category", e.target.value)}
        />
      </label>

      <label>
        Collection
        <input
          required
          maxLength={50}
          value={product.collection}
          onChange={(e) => updateField("collection", e.target.value)}
        />
      </label>

      <label>
        Quantity
        <input
          type="number"
          required
          min={0}
          value={product.quantity}
          onChange={(e) =>
            updateField("quantity", Number(e.target.value))
          }
        />
      </label>

      <label>
        Stock Status
        <select
          value={product.status}
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
          {saving ? "Saving..." : "Create Product"}
        </button>
      </div>
    </form>
  );
}