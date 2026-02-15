import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-6">
        <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          About Us
        </Link>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} TrustKey. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
