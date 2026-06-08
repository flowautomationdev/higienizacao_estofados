import { createFileRoute, redirect, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound, Mail, User, Loader2, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const LOGO_URL = "https://upptcyqsfjlproclqemt.supabase.co/storage/v1/object/public/LOGO%20SISTEM/logo-LAVO.jpeg";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, string | undefined>) => ({
    invite: search.invite,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Lavô! Manager" },
      { name: "description", content: "Acesse o sistema de gestão Lavô!." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { invite } = useSearch({ from: Route.id });
  const { theme, toggle } = useTheme();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [inviteValido, setInviteValido] = useState<boolean | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  useEffect(() => {
    if (invite) {
      supabase
        .from("convites")
        .select("email")
        .eq("token", invite)
        .maybeSingle()
        .then(({ data, error }) => {
          if (data && !error) {
            setInviteValido(true);
            setInviteEmail(data.email);
            setEmail(data.email);
          } else {
            setInviteValido(false);
          }
        });
    }
  }, [invite]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/" });
  }

  async function handleAcceptInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!invite) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: inviteEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nome },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);

    if (data.user) {
      await supabase
        .from("convites")
        .update({ used_at: new Date().toISOString(), used_by: data.user.id })
        .eq("token", invite);
    }

    toast.success("Conta criada! Você já pode entrar.");
    navigate({ to: "/auth" });
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 overflow-hidden bg-gradient-to-br from-accent/10 via-background to-accent/5">
      {/* theme toggle */}
      <button
        onClick={toggle}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-background/60 backdrop-blur-md border border-border/40 shadow-sm text-foreground/60 hover:text-foreground hover:bg-background/90 hover:border-border transition-all duration-200"
        aria-label="Alternar tema"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      {/* decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[var(--brand)]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[var(--brand-bright)]/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 h-60 w-60 rounded-full bg-[var(--brand)]/3 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* logo + branding */}
        <div className="flex flex-col items-center mb-8 sm:mb-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-[var(--brand)]/20 blur-xl" />
            <img
              src={LOGO_URL}
              alt="Lavô!"
              className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover shadow-card ring-2 ring-[var(--brand)]/10"
            />
          </div>
          <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Lavô! Manager
          </h1>
          <p className="mt-1 text-sm text-muted-foreground italic">
            Seu estofado novo de novo.
          </p>
        </div>

        {/* card */}
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-card border p-6 sm:p-8 transition-all duration-300">
          {invite && inviteValido === false && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mb-3">
                <KeyRound className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-sm font-medium text-destructive">
                Convite inválido ou expirado.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Solicite um novo convite ao administrador.
              </p>
            </div>
          )}

          {invite && inviteValido === null && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Validando convite...</p>
            </div>
          )}

          {(!invite || inviteValido) && (
            <form onSubmit={invite ? handleAcceptInvite : handleLogin} className="space-y-4 sm:space-y-5">
              {invite && (
                <div className="bg-muted/50 rounded-xl px-4 py-3 text-xs text-center border border-border/50">
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      Convite para <span className="font-semibold text-foreground">{inviteEmail}</span>
                    </span>
                  </div>
                </div>
              )}

              {invite && (
                <div className="space-y-1.5">
                  <Label htmlFor="nome-i" className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                    Nome
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="nome-i"
                      className="h-11 pl-10 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                      placeholder="Seu nome completo"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    className="h-11 pl-10 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                    placeholder="seu@email.com"
                    required
                    value={email}
                    disabled={!!invite}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pw" className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Senha
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="pw"
                    type="password"
                    className="h-11 pl-10 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                    placeholder={invite ? "Crie uma senha (mín. 6 caracteres)" : "Sua senha"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || inviteValido === false}
                className="relative w-full h-11 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-primary-foreground font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {invite ? "Criando conta..." : "Entrando..."}
                  </span>
                ) : (
                  invite ? "Criar conta" : "Entrar"
                )}
              </Button>
            </form>
          )}
        </div>

        {/* footer */}
        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          &copy; {new Date().getFullYear()} Lavô! &mdash; Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
