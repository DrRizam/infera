import { Link } from "react-router-dom";

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-6">That page doesn't exist.</p>
        <Link to="/" className="text-primary font-semibold underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
