import { Link } from "react-router-dom";
import Mascot from "@/components/Mascot";

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <Mascot mood="curious" className="mx-auto mb-3 h-24 w-24" />
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-6">That page doesn't exist.</p>
        <Link to="/" className="text-primary font-semibold underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
