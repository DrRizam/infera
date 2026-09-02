import { Button } from "@/components/ui/button";

const STATUS_NOTE = {
  demonstration: "Unverified demonstration case — written to show the format, not yet source-checked.",
  "source-checked": "Teaching scenario. Claims are source-checked against references but not clinician-verified.",
  verified: "Clinician-verified teaching scenario.",
};

export default function PresentationStage({ clinicalCase, onContinue }) {
  const note = STATUS_NOTE[clinicalCase.content_status] || STATUS_NOTE.demonstration;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="italic">"{clinicalCase.chief_complaint}"</p>
        <p className="mt-3 text-sm leading-relaxed">{clinicalCase.presentation}</p>
      </div>
      <p className="text-xs text-muted-foreground">{note} Practice only — never a guide for a real patient.</p>
      <Button className="w-full" onClick={onContinue}>
        Begin history
      </Button>
    </div>
  );
}
