import { Button } from "@/components/ui/button";

export default function PresentationStage({ clinicalCase, onContinue }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="italic">"{clinicalCase.chief_complaint}"</p>
        <p className="mt-3 text-sm leading-relaxed">{clinicalCase.presentation}</p>
      </div>
      <Button className="w-full" onClick={onContinue}>
        Begin history
      </Button>
    </div>
  );
}
