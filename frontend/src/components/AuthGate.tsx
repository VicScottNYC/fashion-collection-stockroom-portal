import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";
import Login from "./Login";

type AuthGateProps = {
  children: ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;

      setSession(newSession);
      setCheckingSession(false);
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;

        setSession(error ? null : data.session);
        setCheckingSession(false);
      })
      .catch(() => {
        if (active) {
          setSession(null);
          setCheckingSession(false);
        }
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return (
      <main className="atelier-login">
        <p role="status">Checking ATELIER session...</p>
      </main>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div key={session.user.id}>
      {children}
    </div>
  );
}