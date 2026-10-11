import { useState } from "react";
import { GraduationCap, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "./Button";

const links = [
{ label: "Features", href: "#features" },
{ label: "How it works", href: "#how-it-works" },
{ label: "About", href: "#about" },
];

export default function Navbar() {
const [menuOpen, setMenuOpen] = useState(false);

return ( <header className="site-header"> <nav className="navbar container" aria-label="Main navigation">
<Link
to="/"
className="brand"
aria-label="EduPredict home"
onClick={() => setMenuOpen(false)}
> <span className="brand-icon"> <GraduationCap size={22} /> </span>

      <span>
        Edu<span className="brand-accent">Predict</span>
        <small>STUDENT INTELLIGENCE</small>
      </span>
    </Link>

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
        <Link to="/login" onClick={() => setMenuOpen(false)}>
          Log in
        </Link>
        <Button href="/signup" onClick={() => setMenuOpen(false)}>
          Get started
        </Button>
      </div>
    </div>

    <div className="nav-actions">
      <Link to="/login" className="login-link">
        Log in
      </Link>
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
