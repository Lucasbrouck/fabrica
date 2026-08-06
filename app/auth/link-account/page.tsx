"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui-button";
import { Mail, Lock, Loader2, AlertCircle, Sparkles, UserPlus, Link2, ArrowLeft } from "lucide-react";

export default function LinkAccountPage() {
  const [mode, setMode] = useState<"choose" | "link">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateNew = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/caja-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-new" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar conta");
      }

      // Redirect based on role
      redirectToDashboard(data.role);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLinkExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/caja-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link-existing", email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Credenciais inválidas");
      }

      // Redirect based on role
      redirectToDashboard(data.role);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const redirectToDashboard = (role: string) => {
    const uppercaseRole = (role || "CUSTOMER").toUpperCase();
    if (uppercaseRole === "ADMIN") {
      router.push("/admin/orders");
    } else if (uppercaseRole === "GESTOR") {
      router.push("/gestor");
    } else if (uppercaseRole === "SEPARADOR") {
      router.push("/separador");
    } else {
      router.push("/user");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 blur-[120px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-200 mb-6">
            <Sparkles size={32} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            PDV <span className="text-blue-600">Fábrica</span>
          </h1>
          <p className="text-slate-500 font-medium">Vinculação de conta CaJa</p>
        </div>

        <div className="glass-card p-8 border-white/50 shadow-2xl shadow-slate-200/50">
          {error && (
            <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-red-50 text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {mode === "choose" ? (
            <div className="space-y-6">
              <div className="text-slate-600 text-center mb-4 space-y-2">
                <p className="font-semibold text-slate-800 text-lg">Parece que você é novo por aqui!</p>
                <p className="text-sm">Não encontramos nenhuma conta com o e-mail cadastrado no CaJa. Como deseja prosseguir?</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleCreateNew}
                  disabled={loading}
                  className="w-full h-14 text-base font-bold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <UserPlus size={20} />
                      Criar uma conta nova
                    </>
                  )}
                </Button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase">ou</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <Button
                  onClick={() => setMode("link")}
                  disabled={loading}
                  variant="secondary"
                  className="w-full h-14 text-base font-bold flex items-center justify-center gap-2"
                >
                  <Link2 size={20} />
                  Vincular a uma conta existente
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLinkExisting} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-slate-600 text-center mb-4">
                <p className="font-semibold text-slate-800 text-lg">Vincular Conta Existente</p>
                <p className="text-sm">Insira o e-mail e a senha do PDV Fábrica para conectar com seu login CaJa.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">E-mail local</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    placeholder="E-mail cadastrado..."
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Senha local</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setMode("choose")}
                  disabled={loading}
                  variant="ghost"
                  className="px-4 h-14 rounded-2xl flex items-center justify-center"
                >
                  <ArrowLeft size={20} />
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-grow h-14 text-base font-bold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    "Vincular Contas"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <footer className="absolute bottom-8 text-slate-400 text-sm font-medium">
        © 2026 PDV Fábrica • Padrão Open Delivery v1.7.0
      </footer>
    </main>
  );
}
