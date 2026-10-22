import type { Collection } from "../types/inventory";

interface CollectionCardProps {
  collection: Collection;
}

export default function CollectionCard({
  collection,
}: CollectionCardProps) {
  return (
    <article className="collection-card">
      <div className="collection-visual">
        <span>{collection.season}</span>
      </div>

      <div className="collection-info">
        <div>
          <h3>{collection.name}</h3>
          <p>{collection.productCount} products</p>
        </div>
        <span className="collection-arrow" aria-hidden="true">
          ↗
        </span>
      </div>
    </article>
  );
}