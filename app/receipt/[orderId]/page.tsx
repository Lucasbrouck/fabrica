"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui-button";
import { CheckCircle, PenTool, Loader2, ShoppingBag, User, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function ReceiptPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (res.ok) {
          setOrder(data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  // Drawing Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getPos = (e: any) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDrawing = (e: any) => {
      setIsDrawing(true);
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: any) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      setIsDrawing(false);
      ctx.closePath();
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("touchstart", startDrawing);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      window.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("touchstart", startDrawing);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDrawing);
    };
  }, [isDrawing, loading]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleConfirm = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signature = canvas.toDataURL("image/png");
    
    // Check if canvas is empty (simplified check)
    if (signature.length < 2000) {
       alert("Por favor, forneça uma assinatura.");
       return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });

      if (res.ok) {
        setCompleted(true);
      } else {
        alert("Erro ao confirmar recebimento.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-6 text-center">
      <Loader2 className="animate-spin text-blue-600" size={48} />
      <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Validando Pedido...</p>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4 p-6 text-center">
      <X className="text-red-500" size={64} />
      <h1 className="text-2xl font-black text-slate-900 uppercase">Pedido não encontrado</h1>
      <p className="text-slate-500 font-medium">Link inválido ou expirado.</p>
    </div>
  );

  if (completed || order.status === 'DELIVERED') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6 p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-100">
        <CheckCircle size={48} />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Recebimento Confirmado!</h1>
        <p className="text-slate-500 font-medium">Obrigado pela preferência.</p>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm w-full max-w-sm">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pedido</p>
         <p className="font-mono font-bold text-slate-900 text-xl">#{order.displayId}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full flex flex-col h-full gap-6">
        {/* Header */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                <ShoppingBag size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Confirmar Entrega</h1>
                <p className="text-sm text-slate-500 font-medium">Verifique os detalhes e assine abaixo.</p>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido</p>
                 <p className="font-mono font-bold text-slate-900">#{order.displayId}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                 <p className="font-bold text-slate-900 line-clamp-1">{order.user.name}</p>
              </div>
           </div>
        </div>

        {/* Signature Area */}
        <div className="flex-1 bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
           <div className="p-6 pb-2 flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-900">
                 <PenTool size={18} />
                 <span className="text-xs font-black uppercase tracking-widest">Assinatura Digital</span>
              </div>
              <button 
                onClick={clearCanvas}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700"
              >
                Limpar
              </button>
           </div>
           
           <div className="flex-1 bg-slate-50 rounded-[1.8rem] relative overflow-hidden m-2 border-2 border-dashed border-slate-200">
              <canvas 
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-full cursor-crosshair touch-none"
              />
           </div>
           
           <div className="p-6 pt-2">
              <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest leading-relaxed">
                Ao confirmar, você declara que recebeu os produtos <br /> em perfeitas condições.
              </p>
           </div>
        </div>

        {/* Action */}
        <Button 
           onClick={handleConfirm}
           disabled={submitting}
           className="w-full py-8 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-base shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-transform active:scale-95"
        >
          {submitting ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20} /> Confirmar Recebimento</>}
        </Button>
      </div>
    </div>
  );
}
