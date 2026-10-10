
import { useState } from "react";
import { Activity, Menu, X } from "lucide-react";
import Button from "./Button";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "About", href: "#about" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <nav className="navbar container" aria-label="Main navigation">
        <a href="/" className="brand" aria-label="EduPredict home">
          <span className="brand-icon">
            <Activity size={22} />
          </span>
          <span>
            Edu<span className="brand-accent">Predict</span>
            <small>STUDENT INTELLIGENCE</small>
          </span>
        </a>

        <div className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}

          <div className="mobile-actions">
            <a href="/login" onClick={() => setMenuOpen(false)}>
              Log in
            </a>
            <Button href="/signup" onClick={() => setMenuOpen(false)}>
              Get started
            </Button>
          </div>
        </div>

        <div className="nav-actions">
          <a href="/login" className="login-link">
            Log in
          </a>
          <Button href="/signup">Get started</Button>
        </div>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
    </header>
  );
}