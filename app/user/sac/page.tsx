"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera, Send, MessageCircle, AlertCircle, CheckCircle2, Loader2, ChevronRight, X, Plus, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui-button";

export default function UserSAC() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("Dúvida");
  const [evidence, setEvidence] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchTickets = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/tickets?userId=${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me").then(res => {
      if (res.ok) return res.json();
      router.push("/user/login");
    }).then(data => {
      if (data) {
        setUser(data);
        fetchTickets(data.id);
        setLoading(false);
      }
    });
  }, [router, fetchTickets]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidence(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type: "GENERAL",
          reason,
          description,
          evidence
        }),
      });
      if (res.ok) {
        setSuccess(true);
        fetchTickets(user.id);
        // Reset form
        setDescription("");
        setReason("Dúvida");
        setEvidence(null);
      } else {
        alert("Erro ao enviar ticket. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Carregando...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-100 animate-in zoom-in-95 duration-500">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">TICKET ENVIADO!</h1>
          <p className="text-slate-500 font-medium">Nossa equipe entrará em contato em breve.</p>
        </div>
        <Button onClick={() => { setSuccess(false); setIsCreating(false); }} variant="primary" className="px-8 mt-4 uppercase font-bold tracking-widest py-6">
          Voltar ao Início
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">SAC e Suporte</h1>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} size="sm" className="rounded-xl px-4 py-2 bg-blue-600 text-white font-bold h-auto shadow-md">
            <Plus size={18} className="mr-1" /> Novo
          </Button>
        )}
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-6">
        {isCreating ? (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-2">
                 <h2 className="font-black text-slate-900 uppercase text-sm">Novo Chamado</h2>
                 <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Motivo do Contato</label>
                  <select 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                  >
                    <option>Dúvida</option>
                    <option>Elogio</option>
                    <option>Reclamação</option>
                    <option>Problema Técnico</option>
                    <option>Financeiro</option>
                    <option>Outros</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Descrição do Problema</label>
                  <textarea 
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Conte-nos o que aconteceu..."
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Evidências (Fotos)</label>
                  <div className="flex flex-wrap gap-3">
                    <label className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-all">
                      <Camera size={24} />
                      <span className="text-[8px] font-bold uppercase mt-1">Anexar</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    {evidence && (
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
                        <img src={evidence} alt="Evidência" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setEvidence(null)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1 py-6" onClick={() => setIsCreating(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-[2] py-6 text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-100"
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2"><Send size={18} /> Enviar Chamado</span>}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md">
                <MessageCircle size={24} />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Histórico de Atendimento</h2>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{tickets.length} chamados registrados</p>
              </div>
            </div>

            {tickets.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <MessageCircle size={32} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Nenhum chamado ainda</p>
                  <p className="text-xs text-slate-500 px-4">Quando precisar de ajuda, clique no botão "Novo" ou use o suporte direto nos pedidos.</p>
                </div>
                <Button onClick={() => setIsCreating(true)} variant="primary" className="h-auto py-3 px-6 text-xs uppercase font-bold tracking-widest">
                  Abrir Primeiro Chamado
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${
                          ticket.status === 'OPEN' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          ticket.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {ticket.status === 'OPEN' ? 'Aberto' : ticket.status === 'IN_PROGRESS' ? 'Em Análise' : 'Resolvido'}
                        </span>
                        <h3 className="font-bold text-slate-900 uppercase tracking-tight text-sm leading-tight">{ticket.reason}</h3>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 bg-slate-50 p-3 rounded-xl">
                      {ticket.description}
                    </p>

                    {ticket.orderId && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-50 self-start">
                        <Package size={12} /> Pedido #{ticket.order.displayId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white text-center space-y-2 shadow-xl shadow-slate-200">
               <h3 className="text-sm font-black uppercase tracking-widest">Atendimento 24h</h3>
               <p className="text-[10px] text-slate-400 font-medium leading-relaxed px-4">
                 Nossa equipe analisa cada chamado individualmente para garantir a melhor experiência.
               </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
