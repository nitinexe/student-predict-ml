import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Navbar from "../components/Navbar";
import "./ResetPasswordPage.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkRecoverySession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        setMessage("Could not verify your reset link. Please request a new one.");
      } else if (data.session) {
        setRecoveryReady(true);
      } else {
        setMessage(
          "Your reset link is invalid or expired. Please request a new password reset link."
        );
      }

      setChecking(false);
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        setRecoveryReady(true);
        setMessage("");
      } else if (event === "SIGNED_OUT") {
        setRecoveryReady(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!recoveryReady) {
      setMessage("Please open a valid password reset link first.");
      return;
    }

    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      await supabase.auth.signOut();

      navigate("/login", {
        replace: true,
        state: {
          message: "Password updated successfully. Please sign in with your new password.",
        },
      });
    } catch (error) {
      setMessage(
        error.message || "Could not update your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reset-page">
      <Navbar />

      <main className="reset-main">
        <section className="reset-card">
          <div className="reset-icon" aria-hidden="true">
            ↻
          </div>

          <p className="reset-eyebrow">ACCOUNT RECOVERY</p>
          <h1>Set a new password</h1>

          <p className="reset-description">
            Choose a strong password for your EduPredict account.
          </p>

          {checking ? (
            <p className="reset-message" role="status">
              Verifying your reset link...
            </p>
          ) : recoveryReady ? (
            <form className="reset-form" onSubmit={handleSubmit}>
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />

              <label htmlFor="confirm-new-password">
                Confirm new password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter your password again"
                autoComplete="new-password"
                minLength={8}
                required
              />

              {message && (
                <p className="reset-message" role="status">
                  {message}
                </p>
              )}

              <button type="submit" disabled={loading}>
                {loading ? "Updating password..." : "Update password"}
                {!loading && <span aria-hidden="true"> →</span>}
              </button>
            </form>
          ) : (
            <div className="reset-message" role="status">
              {message}
              <p>
                <Link to="/forgot-password">Request a new reset link</Link>
              </p>
            </div>
          )}

          <Link className="reset-back-link" to="/login">
            ← Back to sign in
          </Link>
        </section>
      </main>
    </div>
  );
}