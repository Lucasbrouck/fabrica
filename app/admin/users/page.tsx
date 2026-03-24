"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui-button";
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Shield, 
  User as UserIcon,
  X,
  Loader2,
  Mail,
  Lock,
  UserCircle,
  Edit,
  CreditCard,
  FileText,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER",
    cnpj: "",
    phone: "",
    postalCode: "",
    address: "",
    addressNumber: "",
    complement: "",
    province: "",
    city: "",
    state: "",
  });
  const [step, setStep] = useState(1);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit Modal State
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editTab, setEditTab] = useState("GERAL"); // GERAL or FINANCEIRO

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = async (user: any) => {
    setSelectedUser(user);
    setEditTab("GERAL");
    setIsEditModalOpen(true);
    setEditFormData({ ...user }); // Start with base data
    
    // Fetch full detail with orders
    try {
      const res = await fetch(`/api/admin/users/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setEditFormData(data);
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      if (res.ok) {
        alert("Usuário atualizado com sucesso!");
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao atualizar");
      }
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar usuário");
      }

      await fetchUsers();
      setIsModalOpen(false);
      setStep(1);
      setFormData({ name: "", email: "", password: "", role: "CUSTOMER", cnpj: "", phone: "", postalCode: "", address: "", addressNumber: "", complement: "", province: "", city: "", state: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleResetPassword = async (id: string) => {
    if (!confirm("Tem certeza que deseja resetar a senha? O usuário deverá redefinir no Primeiro Acesso.")) return;

    try {
      const res = await fetch(`/api/admin/users/${id}/reset-password`, {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
      } else {
        alert(data.error || "Erro ao resetar senha");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir usuário");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const filteredUsers = users.filter(user => {
    const nameStr = user.name ? user.name.toLowerCase() : "";
    const emailStr = user.email ? user.email.toLowerCase() : "";
    const searchStr = search ? search.toLowerCase() : "";

    const matchesSearch = nameStr.includes(searchStr) || 
                          emailStr.includes(searchStr);
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Usuários</h1>
          <p className="text-slate-500">Gerencie administradores e clientes do sistema.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 shadow-blue-200"
        >
          <UserPlus size={18} />
          Novo Usuário
        </Button>
      </div>

      {/* Role Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
         {["ALL", "CUSTOMER", "GESTOR", "SEPARADOR", "ADMIN"].map((r) => (
            <button
               key={r}
               onClick={() => setRoleFilter(r)}
               className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm",
                  roleFilter === r 
                     ? "bg-slate-900 text-white shadow-lg" 
                     : "bg-white/80 hover:bg-white text-slate-600 border border-slate-100"
               )}
            >
               {r === "ALL" ? "Todos" : r}
            </button>
         ))}
      </div>

      {/* Filters & Stats */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border-none glass focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
        </div>
        <div className="flex gap-4">
          <div className="glass px-6 py-3 rounded-xl flex items-center gap-3">
            <Users className="text-blue-500" size={20} />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</p>
              <p className="font-bold text-slate-700 leading-tight">{users.length}</p>
            </div>
          </div>
          <div className="glass px-6 py-3 rounded-xl flex items-center gap-3">
            <Shield className="text-amber-500" size={20} />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Admins</p>
              <p className="font-bold text-slate-700 leading-tight">
                {users.filter(u => u.role === "ADMIN").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/20 bg-white/30">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Papel</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cadastrado em</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                          {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        user.role === "ADMIN" 
                          ? "bg-amber-100 text-amber-700 border border-amber-200" 
                          : user.role === "GESTOR"
                            ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                            : user.role === "SEPARADOR"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-1">
                      <button 
                        onClick={() => handleEditOpen(user)}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        title="Editar Usuário"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleResetPassword(user.id)}
                        className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                        title="Resetar Senha"
                      >
                        <Lock size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir Usuário"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-md p-8 border-white/60 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg text-white">
                  <UserPlus size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Novo Usuário</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-center gap-2">
                  <X size={16} />
                  {error}
                </div>
              )}

              {step === 1 ? (
                /* STEP 1: Escolha de Papel */
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-600">Escolha o tipo de acesso do usuário:</p>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: "CUSTOMER", label: "Cliente", desc: "Acesso à loja e histórico de pedidos" },
                      { value: "GESTOR", label: "Gestor", desc: "Acompanhamento e despacho de pedidos" },
                      { value: "SEPARADOR", label: "Separador", desc: "Visualização de picking list" },
                      { value: "ADMIN", label: "Administrador", desc: "Acesso total ao sistema" }
                    ].map((item) => (
                      <label 
                        key={item.value} 
                        className={cn(
                          "p-4 border-2 rounded-2xl cursor-pointer transition-all flex flex-col gap-0.5",
                          formData.role === item.value 
                            ? "border-blue-500 bg-blue-50/50" 
                            : "border-slate-100 hover:border-slate-200 bg-slate-50/20"
                        )}
                      >
                        <input 
                          type="radio" 
                          name="role" 
                          value={item.value} 
                          checked={formData.role === item.value}
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                          className="opacity-0 absolute"
                        />
                        <span className="font-bold text-slate-800 text-sm">{item.label}</span>
                        <span className="text-xs text-slate-400">{item.desc}</span>
                      </label>
                    ))}
                  </div>

                  <Button 
                    type="button" 
                    variant="primary" 
                    className="w-full py-3 mt-4"
                    onClick={() => setStep(2)}
                  >
                    Continuar
                  </Button>
                </div>
              ) : (
                /* STEP 2: Formulário adequado */
                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Dados de Acesso ({formData.role})</p>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                    <div className="relative">
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        required
                        type="text" 
                        placeholder="João Silva"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        required
                        type="email" 
                        placeholder="joao@exemplo.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {formData.role === "CUSTOMER" && (
                    <div className="space-y-4 pt-2 border-t border-slate-100 mt-2">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dados do Cliente</p>
                       
                       <div className="space-y-1.5">
                         <label className="text-xs font-bold text-slate-500 uppercase ml-1">CNPJ</label>
                         <input 
                           type="text" 
                           placeholder="00.000.000/0000-00"
                           value={formData.cnpj}
                           onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                           className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                         />
                       </div>

                       <div className="space-y-1.5">
                         <label className="text-xs font-bold text-slate-500 uppercase ml-1">Telefone</label>
                         <input 
                           type="text" 
                           placeholder="(00) 00000-0000"
                           value={formData.phone}
                           onChange={(e) => setFormData({...formData, phone: e.target.value})}
                           className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                         />
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-500 uppercase ml-1">CEP</label>
                           <div className="relative">
                              <input 
                                type="text" 
                                placeholder="00000-000"
                                value={formData.postalCode}
                                onChange={(e) => handleCepLookup(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              />
                              {isCepLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 size={16} className="animate-spin text-blue-500" /></div>}
                           </div>
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-500 uppercase ml-1">Número</label>
                           <input 
                             type="text" 
                             placeholder="123"
                             value={formData.addressNumber}
                             onChange={(e) => setFormData({...formData, addressNumber: e.target.value})}
                             className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                           />
                         </div>
                       </div>

                       <div className="space-y-1.5">
                         <label className="text-xs font-bold text-slate-500 uppercase ml-1">Endereço</label>
                         <input 
                           type="text" 
                           placeholder="Rua, Avenida..."
                           value={formData.address}
                           onChange={(e) => setFormData({...formData, address: e.target.value})}
                           className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                         />
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-500 uppercase ml-1">Bairro</label>
                           <input 
                             type="text" 
                             placeholder="Bairro"
                             value={formData.province}
                             onChange={(e) => setFormData({...formData, province: e.target.value})}
                             className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                           />
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-500 uppercase ml-1">Cidade</label>
                           <input 
                             type="text" 
                             readOnly
                             value={formData.city}
                             className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-100 focus:outline-none cursor-not-allowed"
                           />
                         </div>
                       </div>
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                     <Lock size={16} className="text-blue-500 shrink-0" />
                     <p className="text-[11px] text-slate-600 font-medium">O usuário deverá criar sua senha no <span className="font-bold text-slate-800">Primeiro Acesso</span>.</p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="flex-1 py-3"
                      onClick={() => setStep(1)}
                    >
                      Voltar
                    </Button>
                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="flex-1 py-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin text-white" size={20} />
                      ) : (
                        "Criar Usuário"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-2xl p-8 border-white/60 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg text-white">
                  <Edit size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Editar Usuário</h2>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs Header */}
            {selectedUser.role === "CUSTOMER" && (
              <div className="flex gap-2 border-b border-slate-100 mb-6">
                <button 
                  onClick={() => setEditTab("GERAL")}
                  className={cn(
                    "pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
                    editTab === "GERAL" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <UserPlus size={16} /> Dados Gerais
                </button>
                <button 
                  onClick={() => setEditTab("FINANCEIRO")}
                  className={cn(
                    "pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
                    editTab === "FINANCEIRO" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <CreditCard size={16} /> Financeiro
                </button>
              </div>
            )}

            {/* TAB: GERAL */}
            {editTab === "GERAL" && (
              <form onSubmit={handleEditUser} className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                    <input 
                      required
                      type="text" 
                      value={editFormData.name || ""}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                    <input 
                      required
                      type="email" 
                      value={editFormData.email || ""}
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                {selectedUser.role === "CUSTOMER" && (
                    <div className="space-y-4 pt-2 border-t border-slate-100 mt-2">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dados do Cliente</p>
                       
                       <div className="space-y-1.5">
                         <label className="text-xs font-bold text-slate-500 uppercase ml-1">CNPJ</label>
                         <input 
                           type="text" 
                           value={editFormData.cnpj || ""}
                           onChange={(e) => setEditFormData({...editFormData, cnpj: e.target.value})}
                           className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none"
                         />
                       </div>

                       <div className="space-y-1.5">
                         <label className="text-xs font-bold text-slate-500 uppercase ml-1">Telefone</label>
                         <input 
                           type="text" 
                           value={editFormData.phone || ""}
                           onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                           className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none"
                         />
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-500 uppercase ml-1">CEP</label>
                           <input 
                             type="text" 
                             value={editFormData.postalCode || ""}
                             onChange={(e) => {
                               setEditFormData({...editFormData, postalCode: e.target.value});
                               // Could add CEP lookup here too if needed
                             }}
                             className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none"
                           />
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-500 uppercase ml-1">Número</label>
                           <input 
                             type="text" 
                             value={editFormData.addressNumber || ""}
                             onChange={(e) => setEditFormData({...editFormData, addressNumber: e.target.value})}
                             className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none"
                           />
                         </div>
                       </div>

                       <div className="space-y-1.5">
                         <label className="text-xs font-bold text-slate-500 uppercase ml-1">Endereço</label>
                         <input 
                           type="text" 
                           value={editFormData.address || ""}
                           onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                           className="w-full px-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 outline-none"
                         />
                       </div>
                    </div>
                )}

                <Button type="submit" variant="primary" className="w-full py-3 mt-4" disabled={isSubmitting}>
                   {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Salvar Alterações"}
                </Button>
              </form>
            )}

            {/* TAB: FINANCEIRO */}
            {editTab === "FINANCEIRO" && (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                {/* Parametrização Boleto e Custos */}
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Vencimento do Boleto</p>
                      <p className="text-xs text-slate-500">Defina quantos dias o cliente tem para pagar após a emissão.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1"
                        className="w-16 px-2 py-1.5 rounded-xl border border-blue-200 text-center font-bold text-blue-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editFormData.boletoDueDays || 28}
                        onChange={(e) => setEditFormData({...editFormData, boletoDueDays: e.target.value})}
                      />
                      <span className="text-xs font-bold text-blue-500">DIAS</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-100/50">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Frete (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-2 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                        value={editFormData.shippingCost !== undefined ? editFormData.shippingCost : 0}
                        onChange={(e) => setEditFormData({...editFormData, shippingCost: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Taxa (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-2 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                        value={editFormData.taxCost !== undefined ? editFormData.taxCost : 0}
                        onChange={(e) => setEditFormData({...editFormData, taxCost: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Dias de Pedidos */}
                <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Dias de Pedidos Permitidos</p>
                    <p className="text-xs text-slate-500">Selecione os dias da semana em que o cliente pode efetuar pedidos.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((day) => {
                      const isSelected = editFormData.orderDays?.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const current = editFormData.orderDays || [];
                            const updated = current.includes(day)
                              ? current.filter((d: string) => d !== day)
                              : [...current, day];
                            setEditFormData({ ...editFormData, orderDays: updated });
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                            isSelected 
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100" 
                              : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>



                {/* Historico de Pedidos */}
                <div className="space-y-3">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Últimos Pedidos</p>
                   {editFormData.orders && editFormData.orders.length > 0 ? (
                      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50">
                            <tr className="border-b border-slate-100">
                              <th className="px-4 py-3 text-slate-500 font-bold">ID</th>
                              <th className="px-4 py-3 text-slate-500 font-bold">Total</th>
                              <th className="px-4 py-3 text-slate-500 font-bold text-center">Status</th>
                              <th className="px-4 py-3 text-slate-500 font-bold text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {editFormData.orders.map((order: any) => (
                              <tr key={order.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="px-4 py-3 font-bold text-slate-700">#{order.displayId || order.id.slice(0,6)}</td>
                                <td className="px-4 py-3 text-slate-600 font-medium">R$ {order.totalPrice ? order.totalPrice.toFixed(2) : "0.00"}</td>
                                <td className="px-4 py-3 text-center">
                                   <span className={cn(
                                     "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                     order.asaasPaymentStatus === "CONFIRMED" || order.status === "DELIVERED" 
                                       ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                     order.asaasPaymentStatus === "OVERDUE" 
                                       ? "bg-red-50 text-red-600 border border-red-100" 
                                       : "bg-amber-50 text-amber-600 border border-amber-100"
                                   )}>
                                     {order.asaasPaymentStatus === "CONFIRMED" ? "PAGO" :
                                      order.asaasPaymentStatus === "OVERDUE" ? "VENCIDO" :
                                      order.asaasPaymentStatus === "PENDING" || order.asaasPaymentStatus === "RECEIVED" ? "PENDENTE" : order.asaasPaymentStatus || order.status}
                                   </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                   <a 
                                     href={`/api/orders/${order.id}/pdf`} 
                                     target="_blank" 
                                     className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                                   >
                                     <FileText size={14} /> Boleto
                                   </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                   ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                         <p className="text-sm text-slate-400">Nenhum pedido registrado para este cliente.</p>
                      </div>
                   )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                   <Button 
                     type="button" 
                     variant="primary" 
                     className="w-full py-3" 
                     disabled={isSubmitting}
                     onClick={handleEditUser}
                   >
                      {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Salvar Alterações Financeiras"}
                   </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
