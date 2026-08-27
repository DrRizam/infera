import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Settings as SettingsIcon, Sparkles } from "lucide-react";
import { useProfile } from "@/lib/ProfileContext";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { ROLE_OPTIONS } from "@/lib/profileOptions";
import { COUNTRIES } from "@/lib/countries";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sound";
import {
  debriefsRemaining,
  FREE_DEBRIEF_LIMIT,
  FREE_RECALL_SESSIONS_PER_WEEK,
  isAdmin,
  isPremium,
  recallSessionsRemaining,
} from "@/lib/subscription";
import { openBillingPortal, startCheckout } from "@/lib/subscriptionStore";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SELECT_CLASS =
  "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring";

export default function Settings() {
  useDocumentTitle("Settings");
  const { profile, setProfile, refreshProfile } = useProfile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [checkoutNotice, setCheckoutNotice] = useState("");
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [billingPlan, setBillingPlan] = useState("monthly");

  const admin = isAdmin(user);
  const premium = isPremium(profile);
  const remaining = debriefsRemaining(profile, user);
  const recallRemaining = recallSessionsRemaining(profile, user);

  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [clinicName, setClinicName] = useState(profile.clinic_name || "");
  const [country, setCountry] = useState(profile.country || "");
  const [role, setRole] = useState(profile.role || "");
  const [roleOtherLabel, setRoleOtherLabel] = useState(profile.role_other_label || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [emailOptIn, setEmailOptIn] = useState(profile.email_opt_in ?? false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailNotice, setEmailNotice] = useState("");
  const [emailError, setEmailError] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [soundEnabled, setSoundEnabledState] = useState(() => isSoundEnabled());
  const toggleSound = (enabled) => {
    setSoundEnabledState(enabled);
    setSoundEnabled(enabled);
  };

  const saveProfileFields = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileNotice("");

    const otherLabel = role === "other" ? roleOtherLabel.trim() || null : null;
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        clinic_name: clinicName,
        country,
        role: role || null,
        role_other_label: otherLabel,
        phone: phone.trim() || null,
        email_opt_in: emailOptIn,
      })
      .eq("user_id", user.id);

    if (!error) await supabase.auth.updateUser({ data: { full_name: displayName } });

    setProfileSaving(false);
    if (error) {
      console.error("Failed to save profile", error);
      setProfileNotice("Something went wrong saving your profile.");
      return;
    }
    setProfile((prev) => ({
      ...prev,
      display_name: displayName,
      clinic_name: clinicName,
      country,
      role: role || null,
      role_other_label: otherLabel,
      phone: phone.trim() || null,
      email_opt_in: emailOptIn,
    }));
    setProfileNotice("Saved.");
  };

  const changeEmail = async (e) => {
    e.preventDefault();
    setEmailError("");
    setEmailNotice("");
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) return setEmailError(error.message);
    setEmailNotice("Check your new email to confirm the change.");
    setNewEmail("");
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordNotice("");

    const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPassword });
    if (verifyError) return setPasswordError("Current password is incorrect.");

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return setPasswordError(error.message);
    setPasswordNotice("Password updated.");
    setOldPassword("");
    setNewPassword("");
  };

  const handleSubscribe = async () => {
    setBillingBusy(true);
    setBillingError("");
    const { error } = await startCheckout(billingPlan, user.email, user.id, () => {
      refreshProfile();
      setCheckoutNotice("You're subscribed — thanks!");
    });
    setBillingBusy(false);
    if (error) setBillingError(error);
  };

  const handleManage = async () => {
    setBillingBusy(true);
    setBillingError("");
    const { error } = await openBillingPortal();
    setBillingBusy(false);
    if (error) setBillingError(error);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account? This permanently erases all your progress and cannot be undone.")) return;
    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
      console.error("Failed to delete account", error);
      window.alert("Something went wrong deleting your account. Please try again.");
      return;
    }
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {checkoutNotice && <p className="text-sm text-primary">{checkoutNotice}</p>}
          {billingError && <p className="text-sm text-destructive">{billingError}</p>}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{admin ? "Admin" : premium ? "Premium" : "Free"}</span>
            {!admin && !premium && (
              <span className="text-xs text-muted-foreground">
                {remaining} of {FREE_DEBRIEF_LIMIT} debriefs left this month
              </span>
            )}
          </div>
          {!admin && !premium && (
            <p className="text-right text-xs text-muted-foreground">
              {recallRemaining} of {FREE_RECALL_SESSIONS_PER_WEEK} Recall sessions left this week
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Practicing cases and the daily game are always unlimited. Premium unlocks unlimited full case debriefs
            and Recall sessions.
          </p>
          {admin ? (
            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => navigate("/admin/feedback")}>
                View feedback
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/admin/daily-game")}>
                Review case submissions
              </Button>
            </div>
          ) : premium ? (
            <Button variant="outline" className="w-full" onClick={handleManage} disabled={billingBusy}>
              {billingBusy ? "Opening…" : "Manage subscription"}
            </Button>
          ) : Capacitor.isNativePlatform() ? (
            <p className="text-xs text-muted-foreground">
              Upgrades are handled on the web — sign in at{" "}
              <span className="font-medium text-foreground">infera-app.com</span> to go Premium, then come
              back here.
            </p>
          ) : (
            <>
              <div className="inline-flex w-full rounded-full border border-border bg-muted p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setBillingPlan("monthly")}
                  className={cn("flex-1 rounded-full px-3 py-1.5", billingPlan === "monthly" && "bg-card text-primary shadow-sm")}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPlan("annual")}
                  className={cn("flex-1 rounded-full px-3 py-1.5", billingPlan === "annual" && "bg-card text-primary shadow-sm")}
                >
                  Annual
                </button>
              </div>
              <Button className="w-full" onClick={handleSubscribe} disabled={billingBusy}>
                {billingBusy ? "Redirecting…" : "Upgrade for unlimited debriefs"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={saveProfileFields}>
            <div className="space-y-1.5">
              <Label htmlFor="display-name">Name</Label>
              <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clinic-name">Clinic / workplace</Label>
              <Input id="clinic-name" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" type="tel" placeholder="Optional" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} className={SELECT_CLASS}>
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className={SELECT_CLASS}>
                <option value="">Prefer not to say</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {role === "other" && (
              <div className="space-y-1.5">
                <Label htmlFor="role-other">Tell us more</Label>
                <Input
                  id="role-other"
                  placeholder="e.g. Athletic trainer"
                  value={roleOtherLabel}
                  onChange={(e) => setRoleOtherLabel(e.target.value)}
                />
              </div>
            )}
            <label htmlFor="email-opt-in" className="flex items-center gap-2 text-sm">
              <input
                id="email-opt-in"
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-primary"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
              />
              Add me to the email list for updates and tips
            </label>
            {profileNotice && <p className="text-sm text-primary">{profileNotice}</p>}
            <Button type="submit" className="w-full" disabled={profileSaving}>
              {profileSaving ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={changeEmail}>
            <div className="space-y-1.5">
              <Label htmlFor="new-email">Current: {user?.email}</Label>
              <Input id="new-email" type="email" placeholder="New email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            {emailNotice && <p className="text-sm text-primary">{emailNotice}</p>}
            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            <Button type="submit" variant="outline" className="w-full">
              Update email
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={changePassword}>
            <div className="space-y-1.5">
              <Label htmlFor="old-password">Current password</Label>
              <Input
                id="old-password"
                type="password"
                required
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {passwordNotice && <p className="text-sm text-primary">{passwordNotice}</p>}
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            <Button type="submit" variant="outline" className="w-full">
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sound &amp; haptics</CardTitle>
        </CardHeader>
        <CardContent>
          <label htmlFor="sound-enabled" className="flex items-center gap-2 text-sm">
            <input
              id="sound-enabled"
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-primary"
              checked={soundEnabled}
              onChange={(e) => toggleSound(e.target.checked)}
            />
            Play a sound and vibration when I answer correctly or incorrectly
          </label>
          <p className="mt-1 text-xs text-muted-foreground">Only affects this device.</p>
        </CardContent>
      </Card>

      <Button variant="ghost" className="w-full" onClick={signOut}>
        Sign out
      </Button>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Permanently deletes your account and all progress. This can't be undone.
          </p>
          <Button variant="destructive" className="w-full" onClick={handleDeleteAccount}>
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
