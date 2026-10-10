import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

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
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!data.session) {
        setMessage(
          "Your reset session is missing or expired. Please request a new reset link."
        );
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      await supabase.auth.signOut();

      navigate("/login", {
        replace: true,
        state: { message: "Password updated successfully. Please sign in." },
      });
    } catch (error) {
      setMessage(error.message || "Could not update your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset your password</h1>
        <p>Choose a new password for your EduPredict account.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />

          {message && (
            <div className="auth-message" role="status">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

        <p>
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}