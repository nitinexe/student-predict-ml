
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import GoogleButton from "./GoogleButton";
import { supabase } from "../lib/supabaseClient";

export default function AuthForm({ mode }) {
    const navigate = useNavigate();
  const isSignup = mode === "signup";

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
    setMessage("");
  }

  
async function handleSubmit(event) {
  event.preventDefault();
  setMessage("");

  const email = form.email.trim();

  // Check email format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    setMessage("Please enter a valid email address.");
    return;
  }

  if (isSignup) {
    if (form.password !== form.confirmPassword) {
      setMessage("Your passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    if (!/[A-Z]/.test(form.password)) {
      setMessage("Include at least one uppercase letter (A–Z).");
      return;
    }

    if (!/[a-z]/.test(form.password)) {
      setMessage("Include at least one lowercase letter (a–z).");
      return;
    }

    if (!/[0-9]/.test(form.password)) {
      setMessage("Include at least one number (0–9).");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(form.password)) {
      setMessage("Include at least one special character, such as ! or @.");
      return;
    }
  }

  try {
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: form.name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) throw error;

      if (data.session) {
        navigate("/dashboard");
      } else {
        setMessage(
          "Account created! Check your email for a confirmation link before signing in."
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      });

      if (error) throw error;

      navigate("/dashboard");
    }
  } catch (error) {
    setMessage(error.message || "Authentication failed. Please try again.");
  }
}

  return (
    <div className="auth-card">
      <div className="auth-heading">
        <span className="auth-kicker">
          {isSignup ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}
        </span>

        <h1>{isSignup ? "Start learning smarter." : "Welcome back."}</h1>

        <p>
          {isSignup
            ? "Create your account to explore student performance insights."
            : "Sign in to continue to your student insights workspace."}
        </p>
      </div>

      <GoogleButton />

      <div className="auth-divider">
        <span />
        <p>or continue with email</p>
        <span />
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {isSignup && (
          <label className="auth-field">
            <span>Full name</span>
            <div className="auth-input-wrap">
              <UserRound size={18} />
              <input
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={form.name}
                onChange={updateField}
                required
              />
            </div>
          </label>
        )}

        <label className="auth-field">
          <span>Email address</span>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={updateField}
              required
            />
          </div>
        </label>

        <label className="auth-field">
          <span>Password</span>
          <div className="auth-input-wrap">
            <LockKeyhole size={18} />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder="At least 8 characters"
              minLength={8}
              value={form.password}
              onChange={updateField}
              required
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        {isSignup && (
          <label className="auth-field">
            <span>Confirm password</span>
            <div className="auth-input-wrap">
              <LockKeyhole size={18} />
              <input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter your password again"
                value={form.confirmPassword}
                onChange={updateField}
                required
              />
            </div>
          </label>
        )}

        {!isSignup && (
          <div className="auth-options">
            <label className="remember-option">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setMessage("Password recovery will be enabled with Supabase Auth.")
              }
            >
              Forgot password?
            </button>
          </div>
        )}

        {message && (
          <div className="auth-message" role="status">
            {message}
          </div>
        )}

        <button type="submit" className="auth-submit">
          {isSignup ? "Create account" : "Sign in"}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="auth-switch">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </>
        ) : (
          <>
            Don't have an account?{" "}
            <Link to="/signup">Create an account</Link>
          </>
        )}
      </div>

      <p className="auth-legal">
        By continuing, you agree to use student data responsibly and
        protect personal information.
      </p>
    </div>
  );
}