import { useNavigate } from "react-router-dom";
import { MODULES } from "@/lib/modules";

export default function Modules() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Specialty modules</h1>
      <div className="grid grid-cols-2 gap-3">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => navigate(`/module/${m.id}`)}
              className={`flex flex-col items-start gap-2 rounded-lg bg-gradient-to-br ${m.color} p-4 text-left text-white`}
            >
              <Icon className="h-7 w-7" />
              <span className="text-sm font-bold leading-tight">{m.name}</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={() => navigate("/body-map")}
        className="block w-full rounded-lg border border-border p-4 text-center font-semibold hover:border-primary"
      >
        🫀 Body map explorer →
      </button>
    </div>
  );
}
