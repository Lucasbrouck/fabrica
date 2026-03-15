"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui-button";
import { Lock, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao alterar senha");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/"); // Redirect to dashboard according to role handled by middleware or root
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-50">
      <div className="absolute top-[-10%] right-[-20%] w-[70%] h-[70%] bg-indigo-400/10 blur-[130px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-20%] w-[70%] h-[70%] bg-blue-400/10 blur-[130px] rounded-full" />

      <div className="w-full max-w-sm relative z-10 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Primeiro Acesso</h1>
          <p className="text-slate-500 font-semibold uppercase tracking-widest text-xs">Escolha sua nova senha de acesso</p>
        </div>

        <div className="glass-card p-6 border-white/60 shadow-xl shadow-indigo-100/50 rounded-3xl">
          {success ? (
            <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle size={32} />
              </div>
              <p className="font-bold text-slate-800">Senha Alterada!</p>
              <p className="text-sm text-slate-500">Redirecionando para o sistema...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Nova Senha</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Confirmar Senha</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold ring-1 ring-red-100">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="secondary"
                className="w-full h-12 rounded-2xl font-black bg-slate-900 text-white shadow-lg transition-all pt-1"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Salvar Senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
