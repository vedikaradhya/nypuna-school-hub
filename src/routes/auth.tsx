import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff Sign In — Nypuna Connect" },
      { name: "description", content: "Secure staff sign-in for the Nypuna Connect CBSE school management platform." },
      { property: "og:title", content: "Staff Sign In — Nypuna Connect" },
      { property: "og:description", content: "Secure staff sign-in for the Nypuna Connect CBSE school management platform." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      if (s && (e === "SIGNED_IN" || e === "INITIAL_SESSION")) navigate({ to: "/dashboard", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data.session) toast.success("Account created. Check your email to confirm, then sign in.");
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if ("error" in res && res.error) toast.error(res.error.message);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-md bg-sidebar-primary font-bold text-sidebar-primary-foreground">N</div>
          <span className="font-display text-lg font-semibold">Nypuna Connect</span>
        </div>
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight">One workspace for the whole campus.</h2>
          <p className="mt-3 max-w-md text-sm text-sidebar-foreground/70">
            Students, admissions, timetables, attendance, CBSE examinations, library and campus life — for administrators,
            principals, teachers, front office and librarians.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">Staff access only. Students and parents do not have logins.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="font-display">Staff sign in</CardTitle>
            <CardDescription>Use your school account to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form className="space-y-3" onSubmit={signIn}>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form className="space-y-3" onSubmit={signUp}>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email2">Email</Label>
                    <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password2">Password</Label>
                    <Input id="password2" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>Create staff account</Button>
                  <p className="text-[11px] text-muted-foreground">
                    The first account created becomes the school Administrator. Later accounts are assigned a role by an administrator.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
