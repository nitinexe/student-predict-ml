
import { Activity, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <a href="/" className="brand footer-brand">
          <span className="brand-icon">
            <Activity size={20} />
          </span>
          <span>
            Edu<span className="brand-accent">Predict</span>
            <small>STUDENT INTELLIGENCE</small>
          </span>
        </a>

        <p>
          Built for better learning, with <Heart size={14} /> and AI.
        </p>

        <span className="footer-copy">© {new Date().getFullYear()} EduPredict</span>
      </div>
    </footer>
  );
}