import { useState } from "react";
import type { AppRole } from "../services/roles";
import { supabase } from "../lib/supabase";

interface HeaderProps {
  title: string;
  role: AppRole | null;
}

const ROLE_LABELS: Record<AppRole, string> = {
  administrator: "Administrator",
  inventory_manager: "Inventory Manager",
  viewer: "Viewer",
};

export default function Header({ title, role }: HeaderProps) {
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleSignOut() {
    setSigningOut(true);
    setLogoutError(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    } catch {
      setLogoutError("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  const roleLabel = role
    ? ROLE_LABELS[role]
    : "Role Unavailable";

  const avatarInitials =
    role === "administrator"
      ? "AD"
      : role === "inventory_manager"
        ? "IM"
        : role === "viewer"
          ? "VW"
          : "--";

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
          <strong>{roleLabel}</strong>
          <small>Inventory Management</small>
        </div>

        <div className="avatar" aria-hidden="true">
          {avatarInitials}
        </div>

        <button
          type="button"
          className="header-signout"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? "Signing Out..." : "Sign Out"}
        </button>

        {logoutError && (
          <p role="alert">{logoutError}</p>
        )}
      </div>
    </header>
  );
}