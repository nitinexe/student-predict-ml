
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <span>404</span>
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn btn-primary">
        <ArrowLeft size={17} />
        Back to homepage
      </Link>
    </main>
  );
}