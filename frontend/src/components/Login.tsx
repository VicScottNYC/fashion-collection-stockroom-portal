import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {
        setError("Unable to sign in. Check your email and password.");
      }
    } catch {
      setError("Authentication is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="atelier-login">
      <section className="atelier-login-card">
        <div className="atelier-login-brand">
          <span className="atelier-login-mark">◆</span>
          <h1>ATELIER</h1>
          <p>FASHION COLLECTION & STOCKROOM PORTAL</p>
        </div>

        <div className="atelier-login-heading">
          <h2>Welcome Back</h2>
          <p>Sign in to access your collection workspace.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="atelier-login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <div className="atelier-login-footer">
          AUTHORIZED PERSONNEL ONLY
        </div>
      </section>
    </main>
  );
}