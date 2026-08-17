import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8 text-sm">
      <Link to="/login" className="text-primary underline">
        ← Back
      </Link>
      <h1 className="text-xl font-bold">Terms of Service</h1>
      <p className="rounded-md border border-amber-400 bg-amber-50 p-3 text-amber-800">
        This is an MVP draft for beta testing, written by the founder — it has not been reviewed by a lawyer. Don't
        treat it as binding legal terms.
      </p>

      <h2 className="font-bold">Educational use only</h2>
      <p>Infera is a study tool for physical therapy students and clinicians. It is not a diagnostic tool and must never be used to make real clinical decisions about an actual patient.</p>

      <h2 className="font-bold">Beta status</h2>
      <p>The app is in active beta. Features, content, and availability may change or break without notice. Content is source-checked against clinical references but has not yet been reviewed by a licensed clinician for this app specifically.</p>

      <h2 className="font-bold">Your account</h2>
      <p>You're responsible for keeping your login credentials secure. You can delete your account at any time from Profile → Delete account.</p>

      <h2 className="font-bold">Content ownership</h2>
      <p>All case content and app code are owned by the founder, except for open-source libraries used to build it.</p>

      <h2 className="font-bold">No warranty</h2>
      <p>The app is provided as-is during beta, with no guarantee of accuracy, availability, or fitness for any particular purpose.</p>
    </div>
  );
}
