import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function PrivacyPolicy() {
  useDocumentTitle("Privacy Policy");
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8 text-sm">
      <Link to="/login" className="text-primary underline">
        ← Back
      </Link>
      <h1 className="text-xl font-bold">Privacy Policy</h1>
      <p className="rounded-md border border-amber-400 bg-amber-50 p-3 text-amber-800">
        This is an MVP draft for beta testing, written by the founder — it has not been reviewed by a lawyer. Don't
        treat it as binding legal terms.
      </p>

      <h2 className="font-bold">What we collect</h2>
      <p>Your email address (for sign-in), and your learning progress: quiz answers, accuracy, XP, streaks, and which cases you've completed.</p>

      <h2 className="font-bold">What we don't collect</h2>
      <p>No real patient data. Every case in Infera is a fictional, educational scenario — nothing you enter describes an actual patient.</p>

      <h2 className="font-bold">How your data is used</h2>
      <p>Solely to run the app: tracking your progress, scheduling reviews, and showing you your own stats. We don't sell or share your data with third parties.</p>

      <h2 className="font-bold">Deleting your data</h2>
      <p>You can permanently delete your account and all associated data at any time from Profile → Delete account. This is immediate and irreversible.</p>

      <h2 className="font-bold">Payments</h2>
      <p>Infera is free during the beta. No payment information is collected.</p>

      <h2 className="font-bold">Contact</h2>
      <p>
        Questions about this policy can be sent to{" "}
        <a href="mailto:rizamshaar2014@gmail.com" className="text-primary underline">
          rizamshaar2014@gmail.com
        </a>
        .
      </p>
    </div>
  );
}
