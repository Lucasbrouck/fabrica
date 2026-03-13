"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Clock, AlertCircle, CheckCircle2, ChevronRight, User, Package, ImageIcon, Loader2, X, Search, MoreVertical, CheckCircle } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui-button";

export default function AdminSAC() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [ticketSearch, setTicketSearch] = useState("");

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickets(data);
      } else {
        console.error("API returned non-array data:", data);
        setTickets([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 15000);
    return () => clearInterval(interval);
  }, []);

  const updateTicketStatus = async (ticketId: string, status: string) => {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchTickets();
    setSelectedTicket(null);
  };

  const statusMap: any = {
    OPEN: { label: "Aberto", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
    IN_PROGRESS: { label: "Em Atendimento", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Loader2 },
    RESOLVED: { label: "Resolvido", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  };

  const filters = [
    { label: "Todos", value: "ALL" },
    { label: "Abertos", value: "OPEN" },
    { label: "Em Atendimento", value: "IN_PROGRESS" },
    { label: "Resolvidos", value: "RESOLVED" },
  ];

  const filteredTickets = tickets.filter(t => {
    const matchesFilter = activeFilter === "ALL" || t.status === activeFilter;
    const matchesSearch = t.reason.toLowerCase().includes(ticketSearch.toLowerCase()) || 
                         t.user.name.toLowerCase().includes(ticketSearch.toLowerCase()) ||
                         t.description.toLowerCase().includes(ticketSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando Chamados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             SAC & Atendimento
          </h1>
          <p className="text-slate-500 font-medium">Gerencie tickets e problemas relatados por clientes.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                activeFilter === f.value 
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100" 
                  : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Pesquisar tickets..." 
            value={ticketSearch}
            onChange={(e) => setTicketSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTickets.length > 0 ? filteredTickets.map((ticket) => {
                const status = statusMap[ticket.status] || statusMap.OPEN;
                const StatusIcon = status.icon;

                return (
                  <tr 
                    key={ticket.id} 
                    onClick={() => setSelectedTicket(ticket)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-5">
                      <span className="font-mono font-bold text-slate-400 text-[10px] uppercase">#{ticket.id.slice(-6)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase text-sm tracking-tight truncate max-w-[200px]">
                          {ticket.reason}
                        </span>
                        {ticket.orderId && (
                           <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                             <Package size={10} /> Pedido #{ticket.order.displayId}
                           </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-xs">{ticket.user.name}</span>
                        <span className="text-[10px] text-slate-400">{ticket.user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="flex justify-center">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          status.color
                        )}>
                          {ticket.status === 'IN_PROGRESS' ? <Loader2 size={10} className="animate-spin" /> : <StatusIcon size={10} />}
                          {status.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col">
                         <span className="text-xs font-bold text-slate-600">{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                         <span className="text-[10px] text-slate-400 font-medium">{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                          <ChevronRight size={18} />
                       </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                   <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-20">
                         <MessageCircle size={48} />
                         <p className="font-black uppercase tracking-widest text-sm">Nenhum chamado encontrado</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 shrink-0 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                  {selectedTicket.orderId ? <Package size={28} /> : <MessageCircle size={28} />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chamado #{selectedTicket.id.slice(-6).toUpperCase()}</p>
                  <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight leading-tight">{selectedTicket.reason}</h2>
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl transition-colors"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                  <p className="font-bold text-slate-900 text-sm">{selectedTicket.user.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{selectedTicket.user.email}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contexto</p>
                  <p className="font-bold text-slate-900 text-sm uppercase">{selectedTicket.type}</p>
                  {selectedTicket.orderId && <p className="text-[10px] text-blue-600 font-black uppercase">Pedido #{selectedTicket.order.displayId}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Relato do Cliente</p>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-slate-800 text-sm font-medium leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>

              {selectedTicket.evidences && selectedTicket.evidences.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Evidências Fotograficas</p>
                  <div className="flex flex-wrap gap-4">
                    {selectedTicket.evidences.map((ev: any) => (
                      <div key={ev.id} className="w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 cursor-zoom-in hover:scale-105 transition-all shadow-sm">
                        <img src={ev.url} alt="Evidência" className="w-full h-full object-cover" onClick={() => window.open(ev.url, '_blank')} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 pt-4 flex gap-4 bg-slate-50/50">
               <Button 
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100"
                onClick={() => updateTicketStatus(selectedTicket.id, "RESOLVED")}
              >
                Resolver Chamado
              </Button>
              <Button 
                variant="secondary"
                className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest bg-white border-slate-200"
                onClick={() => updateTicketStatus(selectedTicket.id, "IN_PROGRESS")}
              >
                Em Atendimento
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
