import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon } from "lucide-react";
import { useProfile } from "@/lib/ProfileContext";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { resetProfile } from "@/lib/store";
import { ROLE_OPTIONS } from "@/lib/profileOptions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const { profile, setProfile } = useProfile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [clinicName, setClinicName] = useState(profile.clinic_name || "");
  const [country, setCountry] = useState(profile.country || "");
  const [role, setRole] = useState(profile.role || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailNotice, setEmailNotice] = useState("");
  const [emailError, setEmailError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const saveProfileFields = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileNotice("");

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, clinic_name: clinicName, country, role: role || null })
      .eq("user_id", user.id);

    if (!error) await supabase.auth.updateUser({ data: { full_name: displayName } });

    setProfileSaving(false);
    if (error) {
      console.error("Failed to save profile", error);
      setProfileNotice("Something went wrong saving your profile.");
      return;
    }
    setProfile((prev) => ({ ...prev, display_name: displayName, clinic_name: clinicName, country, role: role || null }));
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
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return setPasswordError(error.message);
    setPasswordNotice("Password updated.");
    setNewPassword("");
  };

  const handleReset = async () => {
    if (!window.confirm("Reset all progress? This can't be undone.")) return;
    await resetProfile(user.id);
    window.location.reload();
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
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Prefer not to say</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
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

      <Button variant="outline" className="w-full" onClick={handleReset}>
        Reset all progress
      </Button>

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
