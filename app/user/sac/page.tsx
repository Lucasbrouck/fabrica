"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Send, MessageCircle, AlertCircle, CheckCircle2, Loader2, ChevronRight, X, Plus, Minus, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui-button";

function UserSAC() {
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

  // Novos Estados para o Fluxo em Etapas
  const [step, setStep] = useState(0); 
  const [supportType, setSupportType] = useState<"GENERAL" | "ORDER">("GENERAL");
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);
  const [category, setCategory] = useState<"DELIVERY" | "ITEM" | "OTHER">("OTHER");
  const [subCategory, setSubCategory] = useState<"MORE" | "LESS" | "DAMAGED">("LESS");
  const [divergedItems, setDivergedItems] = useState<{ productId: string; name: string; quantity: number }[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [searchProduct, setSearchProduct] = useState("");

  const [lote, setLote] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId");

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

        // Buscar Pedidos do Usuário para o Seletor
        fetch(`/api/orders`).then(res => res.json()).then(orders => {
          if (Array.isArray(orders)) {
             // Filtrar apenas os do usuário
             const userOrders = orders.filter((o: any) => o.userId === data.id);
             setMyOrders(userOrders);
          }
        });

        // Buscar Catálogo de Produtos para "Itens a Mais"
        fetch(`/api/products`).then(res => res.json()).then(prods => {
          if (Array.isArray(prods)) setCatalog(prods);
        });

        // Auto-carregar se houver orderId na URL
        if (orderIdParam) {
           setSupportType("ORDER");
           setSelectedOrderId(orderIdParam);
           setIsCreating(true);
           setStep(2); // Pula direto pra categoria

           // Buscar itens daquele pedido especifico para travar nos states locais
           fetch(`/api/orders`).then(res => res.json()).then(orders => {
              const o = orders.find((ord: any) => ord.id === orderIdParam);
              if (o) setSelectedOrderItems(o.items || []);
           });
        }
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

  // Efeito para o Scanner de Código de Barras
  useEffect(() => {
    let html5QrCode: any;
    if (isScanning) {
      // Import dinâmico para evitar quebra no SSR do Next.js
      import("html5-qrcode").then((Html5QrcodeModule) => {
         html5QrCode = new Html5QrcodeModule.Html5Qrcode("qr-reader");
         html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText: string) => {
               setLote(decodedText);
               setIsScanning(false);
            },
            () => {} // Ignorar erros de frames falhos
         ).catch(console.error);
      });
    }
    return () => {
      if (html5QrCode) {
         html5QrCode.stop().catch(() => {}); // Ignora erro se já parado
      }
    };
  }, [isScanning]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalDescription = description;
      
      if (supportType === "ORDER") {
         const catText = category === "DELIVERY" ? "PROBLEMA COM A ENTREGA" : category === "ITEM" ? "PROBLEMA COM ITENS" : "OUTRO PROBLEMA";
         const subText = category === "ITEM" ? (subCategory === "MORE" ? "ITENS A MAIS" : subCategory === "LESS" ? "ITENS A MENOS" : "AVARIA DE ITENS") : "";

         let itemsText = "";
         if (divergedItems.length > 0) {
            itemsText = "\n\nItens Reportados:\n" + divergedItems.map(d => ` - ${d.quantity}x ${d.name}`).join("\n");
         }

         finalDescription = `Categoria: ${catText}${subText ? `\nTipo: ${subText}` : ""}\n\nDescrição do Cliente: ${description || "N/A"}${itemsText}`;
      } else if (lote) {
         finalDescription = `LOTE REPORTADO: ${lote}\n\nDescrição do Cliente: ${description || "N/A"}`;
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type: supportType === "ORDER" ? "ORDER_ISSUE" : "GENERAL",
          reason,
          description: finalDescription,
          evidence,
          orderId: selectedOrderId || null
        }),
      });

      if (res.ok) {
        setSuccess(true);
        fetchTickets(user.id);
        // Reset form
        setDescription("");
        setReason("Dúvida");
        setEvidence(null);
        setStep(0);
        setDivergedItems([]);
        setSelectedOrderId("");
        setLote("");
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
          <Button onClick={() => { setIsCreating(true); setSupportType("GENERAL"); setStep(10); setReason("Problema com Item (Lote)"); }} size="sm" className="rounded-xl px-4 py-2 bg-blue-600 text-white font-bold h-auto shadow-md">
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
                {step === 0 && (
                   <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Qual o tipo de atendimento?</p>
                      <button 
                         type="button"
                         onClick={() => { setSupportType("GENERAL"); setStep(10); setReason("Problema com Item (Lote)"); }}
                         className="w-full p-6 bg-slate-50 hover:bg-slate-100 rounded-3xl border border-slate-100 flex items-center justify-between group transition-all"
                      >
                         <div className="text-left">
                            <p className="font-black text-slate-900 uppercase text-sm">Problema com Item / Lote</p>
                            <p className="text-xs text-slate-500 font-medium">Se você comprou um item com problema de fabricação</p>
                         </div>
                         <ChevronRight size={20} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button 
                         type="button"
                         onClick={() => { setSupportType("ORDER"); setStep(1); setReason("Problema com Pedido"); }}
                         className="w-full p-6 bg-slate-50 hover:bg-slate-100 rounded-3xl border border-slate-100 flex items-center justify-between group transition-all"
                      >
                         <div className="text-left">
                            <p className="font-black text-slate-900 uppercase text-sm">Problema com Pedido</p>
                            <p className="text-xs text-slate-500 font-medium">Faltou item, danificado ou entrega</p>
                         </div>
                         <ChevronRight size={20} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </button>
                   </div>
                )}

                {step === 10 && (
                   <div className="space-y-5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Informar Lote do item</p>
                      <div className="space-y-2">
                         <div className="relative">
                            <input 
                               type="text" 
                               placeholder="Número do Lote..." 
                               value={lote}
                               onChange={(e) => setLote(e.target.value)}
                               className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 pr-14 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-300"
                            />
                            <button
                               type="button"
                               onClick={() => setIsScanning(true)}
                               className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-100 hover:scale-105 active:scale-95 transition-all shadow-sm"
                            >
                               <Camera size={18} />
                            </button>
                         </div>
                         <p className="text-[9px] text-slate-400 px-2">Código impresso na embalagem do item.</p>
                      </div>

                      {isScanning && (
                         <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-6 space-y-4">
                            <div className="w-full max-w-sm aspect-square bg-slate-800 rounded-3xl overflow-hidden border-2 border-white/20 relative shadow-2xl">
                               <div id="qr-reader" className="w-full h-full" />
                               <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                            </div>
                            <p className="text-white text-xs font-bold text-center px-4">Aponte para o código de barras ou QR Code do Lote</p>
                            <Button onClick={() => setIsScanning(false)} variant="secondary" className="px-6 py-4 bg-white text-slate-900 hover:bg-slate-100 font-bold">
                               Fechar Câmera
                            </Button>
                         </div>
                      )}

                      <div className="flex gap-3 pt-2">
                         <Button type="button" variant="secondary" className="flex-1 py-6" onClick={() => setIsCreating(false)}>Voltar</Button>
                         <Button type="button" className="flex-[2] py-6 bg-blue-600 text-white font-bold" disabled={!lote} onClick={() => setStep(5)}>Próximo</Button>
                      </div>
                   </div>
                )}

                {step === 1 && (
                   <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Selecione o pedido</p>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                         {myOrders.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">Nenhum pedido recente encontrado.</p>
                         ) : (
                            myOrders.slice(0, 5).map((order: any) => (
                               <button 
                                  key={order.id}
                                  type="button"
                                  onClick={() => {
                                     setSelectedOrderId(order.id);
                                     // Buscar itens do pedido selecionado
                                     const items = order.items || [];
                                     setSelectedOrderItems(items);
                                     setStep(2);
                                  }}
                                  className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 flex justify-between items-center transition-all"
                               >
                                  <div className="text-left">
                                     <p className="font-bold text-slate-900 text-sm">Pedido #{order.displayId || order.id.slice(0,6)}</p>
                                     <p className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                  </div>
                                  <ChevronRight size={16} className="text-slate-400" />
                               </button>
                            ))
                         )}
                      </div>
                      <Button type="button" variant="secondary" className="w-full" onClick={() => setStep(0)}>Voltar</Button>
                   </div>
                )}

                {step === 2 && (
                   <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Qual o problema do pedido?</p>
                      <div className="grid grid-cols-1 gap-2">
                         {[
                            { label: "Problema com a Entrega", val: "DELIVERY", next: 4 },
                            { label: "Problema com Itens", val: "ITEM", next: 3 },
                            { label: "Outro Problema", val: "OTHER", next: 4 }
                         ].map((item) => (
                            <button 
                                key={item.val}
                                type="button"
                                onClick={() => {
                                   setCategory(item.val as any);
                                   setReason(item.label);
                                   setStep(item.next);
                                }}
                                className="w-full p-5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 flex justify-between items-center transition-all"
                            >
                               <span className="font-bold text-slate-900 text-sm uppercase">{item.label}</span>
                               <ChevronRight size={18} className="text-slate-400" />
                            </button>
                         ))}
                      </div>
                      <Button type="button" variant="secondary" className="w-full" onClick={() => setStep(1)}>Voltar</Button>
                   </div>
                )}

                {step === 3 && (
                   <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">O que houve com os itens?</p>
                      <div className="grid grid-cols-1 gap-2">
                         {[
                            { label: "Itens a Mais", val: "MORE" },
                            { label: "Itens a Menos", val: "LESS" },
                            { label: "Avaria de Itens", val: "DAMAGED" }
                         ].map((item) => (
                            <button 
                                key={item.val}
                                type="button"
                                onClick={() => {
                                   setSubCategory(item.val as any);
                                   setStep(4);
                                   setDivergedItems([]); // Limpar seleções anteriores
                                }}
                                className="w-full p-5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 flex justify-between items-center transition-all"
                            >
                               <span className="font-bold text-slate-900 text-sm uppercase">{item.label}</span>
                               <ChevronRight size={18} className="text-slate-400" />
                            </button>
                         ))}
                      </div>
                      <Button type="button" variant="secondary" className="w-full" onClick={() => setStep(2)}>Voltar</Button>
                   </div>
                )}

                {step === 4 && category === "ITEM" && (
                   <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Selecione os itens e quantidades</p>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                         {selectedOrderItems.map((item: any) => {
                            const current = divergedItems.find(d => d.productId === item.productId);
                            const qty = current ? current.quantity : 0;

                            const handleQty = (diff: number) => {
                               setDivergedItems(prev => {
                                  const existing = prev.find(d => d.productId === item.productId);
                                  if (existing) {
                                     const newQty = existing.quantity + diff;
                                     if (newQty <= 0) return prev.filter(d => d.productId !== item.productId);
                                     return prev.map(d => d.productId === item.productId ? { ...d, quantity: newQty } : d);
                                  }
                                  if (diff > 0) {
                                     return [...prev, { productId: item.productId, name: item.product.name, quantity: diff }];
                                  }
                                  return prev;
                               });
                            };

                            return (
                               <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                  <div>
                                     <p className="font-bold text-slate-900 text-sm">{item.product.name}</p>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase">No pedido: {item.quantity}</p>
                                  </div>
                                  <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 p-1">
                                     <button type="button" onClick={() => handleQty(-1)} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600"><Minus size={14} /></button>
                                     <span className="w-6 text-center font-black text-sm text-slate-900">{qty}</span>
                                     <button type="button" onClick={() => handleQty(1)} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600"><Plus size={14} /></button>
                                  </div>
                               </div>
                            );
                         })}

                         {subCategory === "MORE" && (
                            <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
                               <p className="text-[10px] font-bold text-slate-400 uppercase px-1">Adicionar Item do Catálogo</p>
                               <input 
                                  type="text"
                                  placeholder="Buscar no catálogo..."
                                  value={searchProduct}
                                  onChange={(e) => setSearchProduct(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs"
                               />
                               {searchProduct && (
                                  <div className="max-h-[150px] overflow-y-auto border border-slate-100 rounded-xl bg-white divide-y divide-slate-50">
                                     {catalog.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase())).slice(0,3).map(p => (
                                        <button 
                                           key={p.id}
                                           type="button"
                                           onClick={() => {
                                              setDivergedItems(prev => {
                                                 const existing = prev.find(d => d.productId === p.id);
                                                 if (existing) return prev;
                                                 return [...prev, { productId: p.id, name: p.name, quantity: 1 }];
                                              });
                                              setSearchProduct("");
                                           }}
                                           className="w-full p-3 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex justify-between"
                                        >
                                           <span>{p.name}</span>
                                           <Plus size={14} className="text-blue-600" />
                                        </button>
                                     ))}
                                  </div>
                               )}
                            </div>
                         )}
                      </div>
                      <div className="flex gap-2">
                         <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(3)}>Voltar</Button>
                         <Button type="button" className="flex-2 bg-blue-600 text-white" onClick={() => setStep(5)}>Próximo</Button>
                      </div>
                   </div>
                )}

                {(step === 5 || (step === 4 && category !== "ITEM")) && (
                   <div className="space-y-6">
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
                        <Button type="button" variant="secondary" className="flex-1 py-6" onClick={() => setStep( category === "ITEM" ? 4 : 2 )}>
                          Voltar
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-[2] py-6 text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-100 bg-blue-600 text-white"
                          disabled={submitting}
                        >
                          {submitting ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2"><Send size={18} /> Enviar Chamado</span>}
                        </Button>
                      </div>
                   </div>
                )}
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
                <Button onClick={() => { setIsCreating(true); setSupportType("GENERAL"); setStep(10); setReason("Problema com Item (Lote)"); }} variant="primary" className="h-auto py-3 px-6 text-xs uppercase font-bold tracking-widest">
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

export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Carregando suporte...</p>
      </div>
    }>
       <UserSAC />
    </Suspense>
  );
}
