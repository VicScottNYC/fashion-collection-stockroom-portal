const navigation = [
  "Dashboard",
  "Collections",
  "Products",
  "Stockrooms",
  "Transfers",
];

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({
  activePage,
  onNavigate,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">F.</span>
        <div>
          <strong>ATELIER</strong>
          <small>COLLECTION PORTAL</small>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation.map((item) => (
          <button
            key={item}
            type="button"
            className={`nav-item ${
              activePage === item ? "active" : ""
            }`}
            onClick={() => onNavigate(item)}
            aria-current={activePage === item ? "page" : undefined}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="environment-dot" />
        Development Environment
      </div>
    </aside>
  );
}