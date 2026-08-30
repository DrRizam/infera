import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Check, Crown, Minus } from "lucide-react";
import { useProfile } from "@/lib/ProfileContext";
import { useAuth } from "@/lib/AuthContext";
import { FREE_CASES_PER_DAY, FREE_DRILLS_PER_DAY, isAdmin, isPremium } from "@/lib/subscription";
import { openBillingPortal, PLAN_PRICING, startCheckout } from "@/lib/subscriptionStore";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// [free, premium] — a string is a value, true is a plain tick, "—" a dash.
const FEATURES = [
  { label: "Practice cases (full: subjective → debrief)", free: `${FREE_CASES_PER_DAY} / day`, premium: "Unlimited" },
  { label: "Reasoning breakdown + named-error debrief", free: true, premium: true },
  { label: "Guess the Diagnosis daily game", free: true, premium: true },
  { label: "Explore reference library", free: true, premium: true },
  { label: "Drills — Recall, Speed round, Anatomy quiz", free: `${FREE_DRILLS_PER_DAY} / day (shared)`, premium: "Unlimited" },
  { label: "Spaced-repetition review scheduling", free: true, premium: true },
  { label: "OSCE checkpoints", free: true, premium: true },
  { label: "Weak-spot targeting on your reasoning profile", free: true, premium: true },
  { label: "Ads (mobile app)", free: "Occasional", premium: "None" },
];

function Cell({ value }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-emerald-600" />;
  if (value === "—") return <Minus className="mx-auto h-4 w-4 text-muted-foreground" />;
  return <span className="text-xs font-semibold">{value}</span>;
}

export default function Premium() {
  useDocumentTitle("Premium");
  const { profile } = useProfile();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const admin = isAdmin(user);
  const premium = isPremium(profile);

  const [plan, setPlan] = useState("annual");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const subscribe = async () => {
    setBusy(true);
    setError("");
    const { error: e } = await startCheckout(plan, user.email, user.id, () => {
      refreshProfile();
      setNotice("You're Premium — thanks!");
    });
    setBusy(false);
    if (e) setError(e);
  };

  const manage = async () => {
    setBusy(true);
    setError("");
    const { error: e } = await openBillingPortal();
    setBusy(false);
    if (e) setError(e);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
          <Crown className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Infera Premium</h1>
          <p className="text-sm text-muted-foreground">Unlimited practice and drills. Everything else stays free.</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          <p className="text-sm">
            The free tier is a real study tool — you get the full case, the full debrief, the daily game, and the
            reference library every day. Premium is for the days you want to keep going: <strong>unlimited cases</strong>{" "}
            and <strong>unlimited drills</strong>, with no ads.
          </p>
          <p className="text-sm text-muted-foreground">
            Nothing is taken away from free to sell it back. Practicing a case and seeing your reasoning scored is free
            forever — the cap is only on <em>how many</em> per day.
          </p>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-2xl border-2 border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted text-xs font-bold">
              <th className="p-3 text-left">What you get</th>
              <th className="w-24 p-3 text-center">Free</th>
              <th className="w-24 bg-accent p-3 text-center text-primary">Premium</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f) => (
              <tr key={f.label} className="border-t border-border">
                <td className="p-3 text-left">{f.label}</td>
                <td className="p-3 text-center text-muted-foreground">
                  <Cell value={f.free} />
                </td>
                <td className="bg-accent/40 p-3 text-center">
                  <Cell value={f.premium} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {notice && <p className="text-sm font-semibold text-primary">{notice}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {admin ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">You have full access as an admin.</CardContent>
        </Card>
      ) : premium ? (
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-5">
            <p className="text-sm font-bold text-primary">You're Premium ✓</p>
            <Button variant="outline" className="w-full" onClick={manage} disabled={busy}>
              {busy ? "Opening…" : "Manage subscription"}
            </Button>
          </CardContent>
        </Card>
      ) : Capacitor.isNativePlatform() ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Upgrades are handled on the web. Sign in at <span className="font-medium text-foreground">infera-app.com</span>{" "}
            to go Premium, then come back — your subscription carries over.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-2">
              {["annual", "monthly"].map((k) => {
                const p = PLAN_PRICING[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPlan(k)}
                    className={cn(
                      "rounded-xl border-2 p-3 text-left transition-colors",
                      plan === k ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">{p.label}</span>
                    <span className="block text-lg font-black">
                      {p.amount} <span className="text-xs font-semibold text-muted-foreground">{p.per}</span>
                    </span>
                    {p.note && <span className="block text-[11px] font-semibold text-emerald-600">{p.note}</span>}
                  </button>
                );
              })}
            </div>
            <Button className="w-full" onClick={subscribe} disabled={busy}>
              {busy ? "Redirecting…" : `Go Premium — ${PLAN_PRICING[plan].amount} ${PLAN_PRICING[plan].per}`}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Secure checkout via Paddle. Cancel anytime. Final price and tax shown at checkout.
            </p>
          </CardContent>
        </Card>
      )}

      <button
        type="button"
        onClick={() => navigate("/settings")}
        className="mx-auto block text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        Manage account in Settings
      </button>
    </div>
  );
}
