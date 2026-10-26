import { useState } from "react";

type ProductImageProps = {
  imagePath: string | null;
  productName: string;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function ProductImage({
  imagePath,
  productName,
}: ProductImageProps) {
  const [failedPath, setFailedPath] = useState<string | null>(null);

  const imageUrl =
    imagePath && SUPABASE_URL
      ? `${SUPABASE_URL}/storage/v1/object/public/product-images/${imagePath
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`
      : null;

  const showPlaceholder = !imageUrl || failedPath === imagePath;

  if (showPlaceholder) {
    return (
      <div className="product-image-placeholder" aria-label={`No image available for ${productName}`}>
        <span aria-hidden="true">◇</span>
      </div>
    );
  }

  return (
    <img
      className="product-image"
      src={imageUrl}
      alt={productName}
      loading="lazy"
      onError={() => setFailedPath(imagePath)}
    />
  );
}