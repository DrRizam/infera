import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { CASES } from "@/data/cases";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import BodyMapExplorer from "@/components/BodyMapExplorer";

export default function Explore() {
  useDocumentTitle("Explore");
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <Compass className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Explore</h1>
          <p className="text-sm text-muted-foreground">Tap a region to see what's clinically relevant there, or filter by specialty.</p>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-border bg-card p-5 sm:p-6">
        <BodyMapExplorer cases={CASES} onOpenCase={(id) => navigate(`/condition/${id}`)} />
      </div>
    </div>
  );
}
