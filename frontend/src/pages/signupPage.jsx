
import { Activity, ArrowLeft, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import AuthForm from "../components/AuthForm";

export default function SignupPage() {
  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Link to="/" className="auth-brand">
          <span className="brand-icon">
            <GraduationCap size={22} />
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

      <section className="auth-main signup-main">
        <div className="auth-side-panel">
          <div className="auth-side-content">
            <span className="auth-side-label">YOUR NEXT STEP STARTS HERE</span>
            <h2>
              Turn information
              <br />
              <span>into understanding.</span>
            </h2>
            <p>
              Create your workspace to explore student predictions,
              performance patterns, and early-warning indicators.
            </p>

            <div className="auth-side-stat">
              <GraduationCap size={22} />
              <span>A clearer view of student performance.</span>
            </div>
          </div>
          <div className="auth-side-orb" />
        </div>

        <div className="auth-form-panel">
          <AuthForm mode="signup" />
        </div>
      </section>

      <footer className="auth-page-footer">
        © {new Date().getFullYear()} EduPredict. Built for better learning.
      </footer>
    </main>
  );
}