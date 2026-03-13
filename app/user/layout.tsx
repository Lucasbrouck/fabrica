"use client";

import { Button } from "@/components/ui-button";
import { ShoppingBag, ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 px-6 py-4 flex justify-around items-center rounded-t-[2rem] shadow-[0_-8px_32px_rgba(0,0,0,0.05)]">
        <Link href="/user/menu" className={`flex flex-col items-center gap-1 ${pathname === '/user/menu' ? 'text-blue-600' : 'text-slate-400'}`}>
          <ShoppingBag size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Produtos</span>
        </Link>
        <Link href="/user/orders" className={`flex flex-col items-center gap-1 ${pathname === '/user/orders' ? 'text-blue-600' : 'text-slate-400'}`}>
          <div className="w-6 h-6 rounded-md border-2 border-current" />
          <span className="text-[10px] font-black uppercase tracking-widest">Pedidos</span>
        </Link>
        <Link href="/user/sac" className={`flex flex-col items-center gap-1 ${pathname === '/user/sac' ? 'text-blue-600' : 'text-slate-400'}`}>
          <MessageCircle size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">SAC</span>
        </Link>
      </nav>
      {children}
    </div>
  );
}
