"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Users, ShoppingCart, LogOut, MessageCircle, ClipboardList, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: ClipboardList, label: "Pedidos", href: "/admin/orders" },
  { icon: Package, label: "Produtos", href: "/admin/products" },
  { icon: Users, label: "Usuários", href: "/admin/users" },
  { icon: MessageCircle, label: "SAC", href: "/admin/sac" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botão Sanduíche para Mobile */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-6 right-6 z-[60] p-3 bg-white rounded-2xl border border-slate-200 shadow-md text-slate-600 active:scale-95 transition-all flex items-center justify-center"
        title="Menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay Background para Mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm lg:hidden z-40 animate-in fade-in"
        />
      )}

      {/* Sidebar de Navegação */}
      <aside className={cn(
        "fixed left-4 top-4 bottom-4 w-64 glass rounded-2xl p-6 flex flex-col gap-8 z-50 transition-all duration-300",
        "lg:translate-x-0",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-[110%] lg:translate-x-0"
      )}>
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
          P
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-800">Admin PDV</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/separador"
          onClick={() => setIsOpen(false)}
          className={cn(
            "flex lg:hidden items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
            pathname === "/separador"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
              : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
          )}
        >
          <Package size={20} />
          Separador
        </Link>
      </nav>

      <button 
        onClick={async () => {
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
          } catch (e) {
            console.error('Logout failed', e);
          } finally {
            window.location.href = "/";
          }
        }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors"
      >
        <LogOut size={20} />
        Sair
      </button>
      </aside>
    </>
  );
}
