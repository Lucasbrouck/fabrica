"use client";

import { LogOut, Package } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SeparadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
            <Package size={20} />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Separador</h1>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </header>
      
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  );
}
