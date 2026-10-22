interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">COLLECTION OPERATIONS</p>
        <h1>{title}</h1>
        <p className="header-subtitle">
          Fashion Collection & Stockroom Portal
        </p>
      </div>

      <div className="header-profile">
        <div>
          <strong>Administrator</strong>
          <small>Inventory Management</small>
        </div>
        <div className="avatar" aria-hidden="true">
          AD
        </div>
      </div>
    </header>
  );
}