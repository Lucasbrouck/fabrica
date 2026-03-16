"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui-button";
import { Plus, Search, Filter, MoreVertical, Trash2, Edit, Package, X, Loader2, AlertCircle, Settings2, Hash } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  
  // Category Management Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [productFormData, setProductFormData] = useState({
    name: "",
    price: "",
    categoryId: "",
    barcode: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories")
      ]);
      const [prodData, catData] = await Promise.all([
        prodRes.json(),
        catRes.json()
      ]);
      setProducts(prodData);
      setCategories(catData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- PRODUCT ACTIONS ---
  const handleOpenProductCreate = () => {
    setProductModalMode('create');
    setEditingProduct(null);
    setProductFormData({ name: "", price: "", categoryId: categories[0]?.id || "", barcode: "" });
    setError("");
    setProductModalOpen(true);
  };

  const handleOpenProductEdit = (product: any) => {
    setProductModalMode('edit');
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      price: product.price.toString(),
      categoryId: product.categoryId,
      barcode: product.barcode || ""
    });
    setError("");
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    const url = productModalMode === 'create' ? "/api/products" : `/api/products/${editingProduct.id}`;
    const method = productModalMode === 'create' ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productFormData),
      });

      if (!res.ok) throw new Error("Erro ao salvar produto");

      await fetchData();
      setProductModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir produto");
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- CATEGORY ACTIONS ---
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (!res.ok) throw new Error("Erro ao criar categoria");
      setNewCategoryName("");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar categoria");
      setEditingCategory(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem certeza? Isso pode afetar produtos desta categoria.")) return;
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir categoria");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Produtos</h1>
          <p className="text-slate-500 font-medium">Gerencie seu cardápio e categorias.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            className="flex items-center gap-2 rounded-2xl px-6 py-6 border-slate-200 font-bold text-slate-600"
            onClick={() => { setError(""); setCategoryModalOpen(true); }}
          >
            <Settings2 size={20} />
            Categorias
          </Button>
          <Button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-6 shadow-lg shadow-blue-100 transition-all font-bold" 
            onClick={handleOpenProductCreate}
          >
            <Plus size={20} />
            Novo Produto
          </Button>
        </div>
      </div>

      <div className="glass-card !p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-40 glass rounded-3xl animate-pulse" />
            ))
          ) : products.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
                <Package size={32} />
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhum produto cadastrado ainda</p>
            </div>
          ) : products.map((product) => (
            <div key={product.id} className="glass-card group hover:scale-[1.02] transition-all border-white/60 !p-4 flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                    {product.category?.name || "Sem Categoria"}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mb-0.5 uppercase tracking-tight leading-tight line-clamp-2">{product.name}</h3>
                <p className="text-lg font-black text-blue-600">{formatPrice(product.price)}</p>
              </div>
              
              <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-1 rounded-xl font-bold text-[10px] py-4 h-auto"
                  onClick={() => handleOpenProductEdit(product)}
                >
                  <Edit size={14} />
                  Editar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:bg-red-50 rounded-xl py-4 h-auto"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Modal - Create/Edit */}
      {productModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <Package size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {productModalMode === 'create' ? 'Novo Produto' : 'Editar Produto'}
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Configurações do Item</p>
                  </div>
                </div>
                <button onClick={() => setProductModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Nome do Produto</label>
                  <input 
                    required
                    type="text" 
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                    placeholder="Ex: Coca-Cola 2L"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Preço (R$)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={productFormData.price}
                      onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Categoria</label>
                    <select
                      required
                      value={productFormData.categoryId}
                      onChange={(e) => setProductFormData({ ...productFormData, categoryId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700 appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Código / Prefixo (Opcional)</label>
                  <input 
                    type="text" 
                    value={productFormData.barcode || ""}
                    onChange={(e) => setProductFormData({ ...productFormData, barcode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700 uppercase"
                    placeholder="Ex: FJ"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold ring-1 ring-red-100">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                    className="w-full py-7 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 transition-all"
                  >
                    {isSaving ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Hash size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Categorias</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Gerenciar Organização</p>
                </div>
              </div>
              <button 
                onClick={() => setCategoryModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              {/* Add New Category */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                 <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nova Categoria</label>
                 <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nome da categoria..."
                      className="flex-1 bg-white border border-slate-200 rounded-2xl py-3 px-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700"
                    />
                    <Button 
                      onClick={handleCreateCategory}
                      disabled={isSaving || !newCategoryName.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 font-bold"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={20} />}
                    </Button>
                 </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 text-xs font-bold ring-1 ring-red-100">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* List Categories */}
              <div className="space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Categorias Existentes</p>
                <div className="grid gap-3">
                  {categories.map(category => (
                    <div key={category.id} className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all group">
                      {editingCategory?.id === category.id ? (
                        <div className="flex-1 flex gap-2">
                          <input 
                            autoFocus
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="flex-1 bg-slate-50 border border-indigo-200 rounded-xl py-2 px-4 focus:outline-none font-bold text-slate-700"
                          />
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="bg-emerald-500 hover:bg-emerald-600 rounded-xl"
                            onClick={() => handleUpdateCategory(category.id, editingCategory.name)}
                          >
                            OK
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs">
                            {category._count?.products || 0}
                          </div>
                          <span className="flex-1 font-bold text-slate-700 uppercase">{category.name}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setError(""); setEditingCategory({ ...category }); }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => { setError(""); handleDeleteCategory(category.id); }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-8 border-t border-slate-100 bg-slate-50/50">
               <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">A exclusão de categorias só é permitida se não houver produtos vinculados.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
