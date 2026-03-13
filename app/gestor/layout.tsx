import { AdminNotifications } from "@/components/admin-notifications";

export default function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 px-8 py-8">
      <AdminNotifications />
      <main className="w-full h-full">
        {children}
      </main>
    </div>
  );
}
