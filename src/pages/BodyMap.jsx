import { useNavigate } from "react-router-dom";
import { CASES } from "@/data/cases";
import BodyMapExplorer from "@/components/BodyMapExplorer";

export default function BodyMap() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Body map explorer</h1>
      <p className="text-sm text-muted-foreground">Tap a region to see what's clinically relevant there.</p>
      <BodyMapExplorer cases={CASES} onOpenCase={(id) => navigate(`/case/${id}`)} />
    </div>
  );
}
