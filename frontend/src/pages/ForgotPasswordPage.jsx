import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      setMessage(
        "If an account exists for this email, a reset link has been sent. Check your inbox and spam folder."
      );
    } catch (error) {
      setMessage(error.message || "Unable to send the reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="forgot-page">
      <Navbar />

      <main className="forgot-main">
        <section className="forgot-card">
          <div className="forgot-icon" aria-hidden="true">
            ↻
          </div>

          <p className="forgot-eyebrow">ACCOUNT RECOVERY</p>
          <h1>Forgot your password?</h1>

          <p className="forgot-description">
            No worries. Enter the email address linked to your account
            and we'll send you a link to reset your password.
          </p>

          <form className="forgot-form" onSubmit={handleSubmit}>
            <label htmlFor="forgot-email">Email address</label>

            <input
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setMessage("");
              }}
              required
            />

            {message && (
              <p className="forgot-message" role="status">
                {message}
              </p>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Sending link..." : "Send reset link"}
              {!loading && <span aria-hidden="true"> →</span>}
            </button>
          </form>

          <Link className="forgot-back-link" to="/login">
            ← Back to sign in
          </Link>
        </section>
      </main>
    </div>
  );
}