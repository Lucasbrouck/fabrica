"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, CheckCircle, Loader2, Scan, AlertTriangle, ListChecks, Plus, Minus, Camera, X } from "lucide-react";
import { Button } from "@/components/ui-button";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/utils";



export default function OrderScanPage() {
  const router = useRouter();
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [lastScanned, setLastScanned] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]); // Catálogo Geral de Produtos
  const inputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<any>(null); // Reutilizado para evitar delay

  const playBeep = (type: "success" | "error" = "success") => {
    try {
      if (!audioContextRef.current) {
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const frequency = type === "success" ? 600 : 300;
      const duration = type === "success" ? 150 : 300;
      
      osc.frequency.value = frequency;
      osc.type = "sine";
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);
      
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (err) {
      console.error("Audio error:", err);
    }
  };

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      
      const initializedItems = data.items.map((item: any) => ({
        ...item,
        pickedQuantity: item.pickedQuantity || 0 
      }));
      
      setOrder({ ...data, items: initializedItems });
      setLoading(false);
    } catch (err) {
      console.error("Fetch order error:", err);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Buscar Catálogo de Produtos para adições dinâmicas
    fetch(`/api/products`)
      .then(res => res.json())
      .then(data => {
         if (Array.isArray(data)) setAllProducts(data);
      })
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Only focus if camera is NOT active or if focus is lost elsewhere
      if (document.activeElement?.tagName !== "INPUT" && !isCameraActive) {
         inputRef.current?.focus();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isCameraActive]);

  // Efeito para o Scanner da Câmera
  useEffect(() => {
    let html5QrCode: any;
    if (isCameraActive) {
      import("html5-qrcode").then((Html5QrcodeModule) => {
         html5QrCode = new Html5QrcodeModule.Html5Qrcode("qr-reader");
         html5QrCode.start(
            { facingMode: "environment" },
            { fps: 30, qrbox: { width: 160, height: 160 } },
            (decodedText: string) => {
               handleScanWithString(decodedText);
            },
            () => {} 
         ).catch(console.error);
      });
    }
    return () => {
      if (html5QrCode) {
         html5QrCode.stop().catch(() => {}); 
      }
    };
  }, [isCameraActive]);

  const handleScanWithString = (text: string) => {
    if (!text.trim()) return;
    
    const scan = text.trim().toUpperCase();
    setErrorMsg(null);

    const prefix = scan.slice(0, 2);

    const foundItem = order.items.find((item: any) => 
       item.product.barcode === prefix
    );

    if (!foundItem) {
      // Procurar no catálogo geral pelo barcode
      const matchedProduct = allProducts.find((p: any) => p.barcode === prefix);

      if (matchedProduct) {
         setOrder((prev: any) => {
            const newItem = {
               id: `temp-${matchedProduct.id}-${Date.now()}`,
               orderId: id,
               productId: matchedProduct.id,
               product: matchedProduct,
               quantity: 0,
               pickedQuantity: 1,
               price: matchedProduct.price,
               createdAt: new Date().toISOString()
            };
            setLastScanned(newItem);
            playBeep("success");
            return {
               ...prev,
               items: [...prev.items, newItem]
            };
         });
         setIsCameraActive(false);
         return;
      } else {
         playBeep("error");
         setErrorMsg(`Código "${prefix}" não encontrado no catálogo.`);
         return;
      }
    }

    setOrder((prev: any) => {
      const updatedItems = prev.items.map((item: any) => {
        if (item.id === foundItem.id) {
             const newPicked = item.pickedQuantity + 1;
             setLastScanned({ ...item, pickedQuantity: newPicked });
             playBeep("success");
             updateItemQuantityOnServer(item.id, newPicked);
             return { ...item, pickedQuantity: newPicked };
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });

    // Desliga a câmera automaticamente após o sucesso da leitura
    setIsCameraActive(false);
  };

  const handleScan = () => {
    if (!barcode.trim()) return;
    handleScanWithString(barcode);
    setBarcode(""); 
  };

  const updateItemQuantityOnServer = async (itemId: string, newQuantity: number) => {
      if (itemId.startsWith("temp-")) return; // Ignora sync para itens novos/temporários
      try {
        const res = await fetch(`/api/orders/${id}/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pickedQuantity: newQuantity }),
        });
        const data = await res.json();
        if (data.affected === 0) {
           setErrorMsg(`Aviso: O item não foi atualizado no servidor. Tente novamente.`);
        }
      } catch (err) {
        console.error("Background sync error:", err);
      }
  };

  const adjustQuantityManual = (itemId: string, increment: boolean) => {
      setErrorMsg(null);
      setOrder((prev: any) => {
        const updatedItems = prev.items.map((item: any) => {
          if (item.id === itemId) {
            const newQty = increment ? item.pickedQuantity + 1 : Math.max(0, item.pickedQuantity - 1);
            updateItemQuantityOnServer(itemId, newQty);
            return { ...item, pickedQuantity: newQty };
          }
          return item;
        });
        return { ...prev, items: updatedItems };
      });
  };

  const handleFinishSeparation = async () => {
    setUpdating(true);
    try {
      const differences = order.items
        .filter((item: any) => item.pickedQuantity !== item.quantity)
        .map((item: any) => {
           const diff = item.pickedQuantity - item.quantity;
           const name = item.product?.name || "Item";
           return `${diff > 0 ? '+' : ''}${diff} ${name}`;
        });

      const autoNote = differences.length > 0 
        ? `Separado com Bip: ${differences.join(', ')}`
        : "Separado com Bip (Ok)";

      const updatedItems = order.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.pickedQuantity, 
        price: item.price
      }));

      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "READY_FOR_PICKUP",
          items: updatedItems,
          notes: autoNote
        }),
      });
      
      if (res.ok) {
        router.push("/separador");
      }
    } catch (err) {
      console.error("Finish error:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="text-slate-500 font-medium">Carregando Pedido...</p>
      </div>
    );
  }

  const pendingItems = order.items.filter((item: any) => item.pickedQuantity < item.quantity);
  const pickedItems = order.items.filter((item: any) => item.pickedQuantity > 0);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50 relative">
      <input
        ref={inputRef}
        type="text"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleScan()}
        className="opacity-0 absolute top-0 left-0 w-0 h-0 pointer-events-none"
        autoFocus={!isCameraActive}
      />

      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/separador")}
            className="p-2.5 bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase">#{order.displayId} • {order.user.name}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Modo Bip/Scanner</p>
          </div>
        </div>

        <div className="flex items-center gap-2">

            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-bold flex items-center gap-1.5"
              >
                <AlertTriangle size={14} /> {errorMsg}
              </motion.div>
            )}
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${isCameraActive ? "bg-blue-50/50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-200 animate-pulse"}`}>
                <Scan size={14} /> {isCameraActive ? "Câmera Ativa" : "Scanner Ativo"}
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-2 p-2 overflow-hidden relative">


        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 uppercase text-xs">Itens Pendentes ({pendingItems.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {pendingItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <CheckCircle size={40} className="text-emerald-500" />
                <p className="font-bold text-sm text-slate-800">Tudo Separado!</p>
                <p className="text-xs">Finalize o pedido abaixo.</p>
              </div>
            ) : (
              pendingItems.map((item: any) => (
                <motion.div 
                  key={item.id}
                  layoutId={item.id}
                  className="p-2 bg-slate-50 rounded-lg border border-slate-200/50 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all"
                >
                  <div>
                    <h4 className="font-black text-slate-900 text-xs uppercase leading-tight">{item.product.name}</h4>
                    <p className="text-xs text-slate-400 font-bold">Faltam: {item.quantity - item.pickedQuantity} / Total: {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <button 
                        onClick={() => adjustQuantityManual(item.id, true)}
                        className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all shadow-sm md:opacity-0 md:group-hover:opacity-100"
                        title="Adicionar Manual"
                     >
                       <Plus size={16} />
                     </button>
                  </div>
                </motion.div>
              ))
             )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-emerald-50/20 rounded-3xl border-2 border-emerald-100 overflow-hidden">
          <div className="p-4 border-b border-emerald-100 bg-emerald-50/80 flex justify-between items-center">
            <h3 className="font-black text-emerald-800 uppercase text-xs">Separados ({pickedItems.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
             {pickedItems.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-emerald-600/40 gap-2">
                 <Scan size={40} className="animate-bounce" />
                 <p className="font-bold text-sm text-emerald-800/60">Aguardando Scan...</p>
                 <p className="text-xs">Passe o QR Code no leitor ou câmera</p>
               </div>
             ) : (
                pickedItems.map((item: any) => {
                  const isLast = lastScanned?.id === item.id;
                  return (
                    <motion.div 
                      key={item.id}
                      initial={isLast ? { scale: 1.05, borderColor: "#10B981" } : {}}
                      animate={isLast ? { scale: 1, borderColor: "#A7F3D0" } : {}}
                      className={`p-2 rounded-lg border flex justify-between items-center transition-all bg-white shadow-sm ${
                         isLast ? "border-emerald-400 bg-emerald-50/20" : "border-emerald-100"
                      }`}
                    >
                      <div>
                        <h4 className="font-black text-slate-900 text-xs uppercase leading-tight">{item.product.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-black text-emerald-700">{item.pickedQuantity} OK</span>
                            {item.pickedQuantity > item.quantity && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">+{item.pickedQuantity - item.quantity} extra</span>
                            )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <button 
                            onClick={() => adjustQuantityManual(item.id, false)}
                            className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
                         >
                           <Minus size={14} />
                         </button>
                         <button 
                            onClick={() => adjustQuantityManual(item.id, true)}
                            className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                         >
                           <Plus size={14} />
                         </button>
                      </div>
                    </motion.div>
                  );
                })
             )}
          </div>
        </div>
      </div>

      {/* Scanner Circular Expansivo */}
      <AnimatePresence>
        {isCameraActive ? (
          <motion.div 
            key="camera-active"
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-52 h-52 rounded-full border-4 border-emerald-500 bg-black shadow-2xl overflow-hidden flex items-center justify-center"
          >
             <div id="qr-reader" className="w-full h-full [&_video]:object-cover" />
             <button 
                onClick={() => setIsCameraActive(false)}
                className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/80 shadow-md backdrop-blur-sm"
             >
                <X size={16} />
             </button>
             <div className="absolute bottom-2 bg-black/60 px-3 py-1 rounded-full text-[10px] text-emerald-300 font-bold uppercase backdrop-blur-sm border border-emerald-500/20">
                Mire o QR
             </div>
          </motion.div>
        ) : (
          <motion.div 
            key="camera-inactive"
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30"
          >
            <button 
               onClick={() => setIsCameraActive(true)}
               className="w-16 h-16 rounded-full bg-emerald-600 text-white border-2 border-emerald-400 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            >
               <Camera size={26} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 bg-white border-t border-slate-200 shadow-lg z-10 flex gap-3">
         <Button 
            variant="secondary" 
            onClick={() => router.push(`/separador/order/${id}`)}
            className="px-6 border border-slate-200 py-5 text-xs font-bold flex items-center gap-2"
         >
             <ListChecks size={16} /> Ajustar Manual
         </Button>
         <Button 
            variant="primary" 
            className="flex-1 py-5 text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-100"
            disabled={updating || pickedItems.length === 0}
            onClick={handleFinishSeparation}
         >
            {updating ? <Loader2 className="animate-spin" /> : "Finalizar Separação"}
         </Button>
      </div>
    </div>
  );
}
