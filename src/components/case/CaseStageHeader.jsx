export default function CaseStageHeader({ clinicalCase, stageIndex, stageCount }) {
  return (
    <div className="mb-4">
      <div className="mb-3 flex gap-1">
        {Array.from({ length: stageCount }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= stageIndex ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      <h1 className="text-lg font-bold">{clinicalCase.presenting_complaint}</h1>
      <p className="text-sm text-muted-foreground">
        {clinicalCase.patient_age}
        {clinicalCase.patient_sex?.[0]?.toUpperCase()} · {clinicalCase.occupation}
      </p>
    </div>
  );
}
