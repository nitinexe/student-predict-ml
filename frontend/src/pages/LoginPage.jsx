
import { Activity, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import AuthForm from "../components/AuthForm";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Link to="/" className="auth-brand">
          <span className="brand-icon">
            <Activity size={21} />
          </span>
          <span>
            Edu<span className="brand-accent">Predict</span>
            <small>STUDENT INTELLIGENCE</small>
          </span>
        </Link>

        <Link to="/" className="back-home">
          <ArrowLeft size={16} />
          Back to home
        </Link>
      </header>

      <section className="auth-main">
        <div className="auth-side-panel">
          <div className="auth-side-content">
            <span className="auth-side-label">STUDENT INTELLIGENCE PLATFORM</span>
            <h2>
              Every student has potential.
              <br />
              <span>Make it easier to see.</span>
            </h2>
            <p>
              Explore machine-learning predictions and performance
              insights in one simple workspace.
            </p>

            <div className="auth-side-stat">
              <Activity size={19} />
              <span>Understand patterns. Support progress.</span>
            </div>
          </div>
          <div className="auth-side-orb" />
        </div>

        <div className="auth-form-panel">
          <AuthForm mode="login" />
        </div>
      </section>

      <footer className="auth-page-footer">
        © {new Date().getFullYear()} EduPredict. Built for better learning.
      </footer>
    </main>
  );
}