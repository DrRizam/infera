import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("sign_in"); // "sign_in" | "sign_up" | "forgot_password"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useDocumentTitle(mode === "sign_in" ? "Sign in" : mode === "sign_up" ? "Sign up" : "Reset password");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    if (mode === "forgot_password") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      setSubmitting(false);
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setNotice("Check your email for a password reset link.");
      return;
    }

    const { data, error: authError } =
      mode === "sign_in" ? await signIn(email, password) : await signUp(email, password, name);

    setSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (mode === "sign_up" && !data.session) {
      setNotice("Check your email to confirm your account, then sign in.");
      setMode("sign_in");
      return;
    }

    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-base font-bold leading-none">
            {mode === "sign_in" ? "Sign in to Infera" : mode === "sign_up" ? "Create your Infera account" : "Reset your password"}
          </h1>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "sign_up" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {mode !== "forgot_password" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "sign_in" && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline"
                      onClick={() => {
                        setError("");
                        setNotice("");
                        setMode("forgot_password");
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "sign_in" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {notice && <p className="text-sm text-primary">{notice}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? "Please wait…"
                : mode === "sign_in"
                ? "Sign in"
                : mode === "sign_up"
                ? "Sign up"
                : "Send reset link"}
            </Button>
          </form>

          {mode !== "forgot_password" && (
            <Button type="button" variant="outline" className="mt-4 w-full" onClick={signInWithGoogle}>
              Continue with Google
            </Button>
          )}

          <button
            type="button"
            className="mt-4 w-full text-center text-sm text-muted-foreground underline"
            onClick={() => {
              setError("");
              setNotice("");
              setMode((m) => (m === "sign_in" ? "sign_up" : "sign_in"));
            }}
          >
            {mode === "sign_in"
              ? "New to Infera? Create an account"
              : mode === "sign_up"
              ? "Already have an account? Sign in"
              : "Back to sign in"}
          </button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/privacy" className="inline-block py-2 underline">
              Privacy
            </Link>{" "}
            ·{" "}
            <Link to="/terms" className="inline-block py-2 underline">
              Terms
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
