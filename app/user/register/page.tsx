"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui-button";
import { User, Mail, Lock, Loader2, AlertCircle, Building2, Phone } from "lucide-react";
import Link from "next/link";

export default function UserRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cnpj: "",
    phone: "",
    postalCode: "",
    address: "",
    addressNumber: "",
    complement: "",
    province: "",
    city: "",
    state: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    setFormData(prev => ({ ...prev, postalCode: cleanCep }));

    if (cleanCep.length === 8) {
      setIsCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro,
            province: data.bairro,
            city: data.localidade,
            state: data.uf,
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      } finally {
        setIsCepLoading(false);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta");
      }

      alert("Conta criada com sucesso! Faça login para continuar.");
      router.push("/user/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-50">
      <div className="absolute top-[-10%] right-[-20%] w-[70%] h-[70%] bg-indigo-400/10 blur-[130px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-20%] w-[70%] h-[70%] bg-blue-400/10 blur-[130px] rounded-full" />

      <div className="w-full max-w-sm relative z-10 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Criar Conta</h1>
          <p className="text-slate-500 font-semibold uppercase tracking-widest text-xs">Acesso ao Cliente</p>
        </div>

        <div className="glass-card p-6 border-white/60 shadow-xl shadow-indigo-100/50 rounded-3xl">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Nome Completo / Razão Social</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><User size={18} /></div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  placeholder="Nome do cliente"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">E-mail</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={18} /></div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">CNPJ</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Building2 size={18} /></div>
                <input
                  type="text"
                  required
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Telefone / WhatsApp</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Phone size={18} /></div>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Endereço de Cobrança</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">CEP</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.postalCode}
                      onChange={(e) => handleCepLookup(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                      placeholder="00000-000"
                    />
                    {isCepLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 size={16} className="animate-spin text-indigo-500" /></div>}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Número</label>
                  <input
                    type="text"
                    required
                    value={formData.addressNumber}
                    onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-sm font-bold text-slate-700 ml-1">Endereço</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  placeholder="Rua, Avenida..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Bairro</label>
                  <input
                    type="text"
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    placeholder="Bairro"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Cidade</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    className="w-full bg-slate-100 border border-slate-100 rounded-2xl py-3 px-4 focus:outline-none font-medium cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100 mt-4">
              <label className="text-sm font-bold text-slate-700 ml-1">Senha de Acesso</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={18} /></div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Cadastrar Agora"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm font-semibold">
              Já tem conta? <Link href="/user/login" className="text-indigo-600">Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
