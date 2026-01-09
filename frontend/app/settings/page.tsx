// frontend/src/app/settings/page.tsx
"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

// --- DATOS DE ICONOS ---
const ICON_CATEGORIES = {
  "Finanzas & Dinero": ["💸", "💰", "💳", "🏦", "📉", "📈", "💎", "🧾", "🪙", "💴", "💵", "💶"],
  "Comida & Bebida": ["🍔", "🍕", "🥗", "🍣", "☕", "🍺", "🍷", "🛒", "🥦", "🍎", "🍩", "🌮", "🍰", "🍇"],
  "Transporte & Auto": ["🚗", "🚌", "🚕", "✈️", "⛽", "🚲", "🔧", "🅿️", "🚨", "🏍️", "🚂", "🚢"],
  "Hogar & Servicios": ["🏠", "💡", "💧", "🔥", "📡", "🛠️", "🛏️", "🧹", "🚿", "🚪", "🔌", "🗑️"],
  "Ocio & Tecnología": ["🎉", "🎮", "📱", "💻", "🎬", "📚", "🎨", "🎵", "📷", "🎫", "🎲", "🎧"],
  "Salud & Bienestar": ["💊", "🏥", "🏋️", "🧘", "🩺", "🦷", "👶", "💅", "💆", "🚑", "👓", "🧴"],
  "Ropa & Compras": ["🛍️", "👕", "👗", "👟", "🕶️", "💍", "🎒", "🧢", "⌚", "👢"],
  "Varios & Mascotas": ["🐶", "🐱", "🎁", "🎓", "📝", "🗳️", "🎯", "🏖️", "🐾", "💼", "🔧", "📦"]
};

// --- INTERFACES ---
interface Category { id: number; name: string; icon: string; type: string; }
interface Account { id: number; name: string; type: string; balance: number; }
interface Goal { id: number; name: string; target_amount: number; current_amount: number; icon: string; }

export default function Settings() {
  const API_URL = "https://finanzas-api-y9ke.onrender.com";

  // --- ESTADOS FORMULARIOS ---
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState("Cash");
  const [accBalance, setAccBalance] = useState("0");

  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState("Expense");
  const [catIcon, setCatIcon] = useState("💸");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalIcon, setGoalIcon] = useState("🎯");
  const [showGoalIconPicker, setShowGoalIconPicker] = useState(false);

  // --- ESTADOS DE DATOS ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // --- CARGAR DATOS ---
  const fetchData = async () => {
    try {
      const [resCat, resAcc, resGoals] = await Promise.all([
        axios.get(`${API_URL}/categories/`),
        axios.get(`${API_URL}/accounts/`),
        axios.get(`${API_URL}/goals/`) 
      ]);
      setCategories(resCat.data);
      setAccounts(resAcc.data);
      setGoals(resGoals.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LOGICA ---
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/accounts/`, { name: accName, type: accType, balance: parseFloat(accBalance) });
      setAccName(""); setAccBalance("0");
      fetchData();
    } catch (error) { alert("Error al crear cuenta"); }
  };

  const handleDeleteAccount = async (id: number) => {
    if(!confirm("¿Borrar cuenta? Solo se puede si no tiene movimientos.")) return;
    try { await axios.delete(`${API_URL}/accounts/${id}`); fetchData(); } 
    catch (error) { alert("❌ No se puede borrar: Tiene transacciones asociadas."); }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/categories/`, { name: catName, type: catType, icon: catIcon, budget_limit: 0 });
      setCatName(""); setShowIconPicker(false);
      fetchData();
    } catch (error) { alert("Error al crear categoría"); }
  };

  const handleDeleteCategory = async (id: number) => {
    if(!confirm("¿Borrar categoría?")) return;
    try { await axios.delete(`${API_URL}/categories/${id}`); fetchData(); } 
    catch (error) { alert("❌ No se puede borrar: Tiene gastos asociados."); }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/goals/`, { name: goalName, target_amount: parseFloat(goalTarget), current_amount: 0, icon: goalIcon });
      setGoalName(""); setGoalTarget(""); setShowGoalIconPicker(false);
      fetchData();
    } catch (error) { alert("Error al crear meta"); }
  };

  const handleDeleteGoal = async (id: number) => {
    if(!confirm("¿Borrar esta meta?")) return;
    try { await axios.delete(`${API_URL}/goals/${id}`); fetchData(); } 
    catch (error) { alert("Error al eliminar meta"); }
  };

  const accTypesES: Record<string, string> = {
      "Cash": "Efectivo", "Debit": "Débito", "Credit": "Crédito", 
      "Savings": "Ahorro", "Investment": "Inversión"
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans text-gray-700">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER NAVBAR */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-white shadow-sm sticky top-2 z-30">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center rounded-xl shadow-lg shadow-slate-200 text-xl">
               ⚙️
             </div>
             <div>
                <h1 className="text-xl font-bold text-gray-800 leading-none">Ajustes</h1>
                <p className="text-xs text-gray-400 font-medium">Personaliza tu experiencia</p>
             </div>
          </div>
          <Link href="/" className="mt-3 sm:mt-0 bg-white border border-gray-200 text-gray-600 px-5 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 hover:shadow-md transition flex items-center gap-2">
            ⬅ <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          
          {/* --- COLUMNA 1: CUENTAS --- */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-blue-50 text-blue-600 p-2 rounded-lg text-lg">🏦</span> Nueva Cuenta
              </h2>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Nombre</label>
                    <input type="text" placeholder="Ej: Cartera" className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none transition font-medium" value={accName} onChange={e => setAccName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Tipo</label>
                        <select className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-200 outline-none transition font-medium text-sm appearance-none" value={accType} onChange={e => setAccType(e.target.value)}>
                            {Object.entries(accTypesES).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Saldo</label>
                        <input type="number" className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-200 outline-none transition font-medium" value={accBalance} onChange={e => setAccBalance(e.target.value)} />
                    </div>
                </div>
                <button className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-200 hover:-translate-y-0.5 transition-all duration-200">Guardar Cuenta</button>
              </form>
            </section>

            {/* LISTA DE CUENTAS */}
            <section className="bg-white/60 backdrop-blur-md p-5 rounded-3xl border border-white/50 shadow-sm">
              <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider ml-1">Mis Cuentas Activas</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {accounts.map(acc => (
                  <div key={acc.id} className="group flex justify-between items-center p-3 bg-white hover:bg-blue-50 rounded-2xl border border-gray-100 hover:border-blue-100 transition shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center font-bold text-xs group-hover:bg-blue-200 group-hover:text-blue-700 transition">
                        {acc.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-700 text-sm">{acc.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{accTypesES[acc.type] || acc.type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="block font-bold text-gray-800 text-sm">${acc.balance.toLocaleString()}</span>
                       <button onClick={() => handleDeleteAccount(acc.id)} className="text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* --- COLUMNA 2: CATEGORÍAS --- */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 relative z-20 overflow-visible">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-t-3xl"></div>
              <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-purple-50 text-purple-600 p-2 rounded-lg text-lg">🏷️</span> Categoría
              </h2>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Nombre</label>
                    <input type="text" placeholder="Ej: Cine" className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition font-medium" value={catName} onChange={e => setCatName(e.target.value)} required />
                </div>
                
                <div className="relative">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Icono</label>
                  <button type="button" onClick={() => setShowIconPicker(!showIconPicker)} className="w-full p-3 bg-gray-50 rounded-xl border border-transparent hover:bg-gray-100 flex items-center justify-between transition">
                    <span className="flex items-center gap-2 text-gray-700 font-bold"><span className="text-2xl">{catIcon}</span> <span className="text-sm font-normal text-gray-500">Cambiar icono</span></span>
                    <span className="text-gray-400 text-xs">▼</span>
                  </button>

                  {showIconPicker && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-4 max-h-80 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                      {Object.entries(ICON_CATEGORIES).map(([categoryName, icons]) => (
                        <div key={categoryName} className="mb-4">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wide border-b border-gray-100 pb-1">{categoryName}</h4>
                          <div className="grid grid-cols-6 gap-2">
                            {icons.map((icon) => (
                              <button key={icon} type="button" onClick={() => { setCatIcon(icon); setShowIconPicker(false); }} className="text-xl p-2 hover:bg-purple-100 rounded-lg transition hover:scale-110">{icon}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gray-100 p-1 rounded-xl flex">
                    <button type="button" onClick={() => setCatType("Expense")} className={`flex-1 py-2 text-xs rounded-lg font-bold transition-all ${catType === "Expense" ? "bg-white text-red-500 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>Gasto</button>
                    <button type="button" onClick={() => setCatType("Income")} className={`flex-1 py-2 text-xs rounded-lg font-bold transition-all ${catType === "Income" ? "bg-white text-green-500 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>Ingreso</button>
                </div>
                <button className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-200 hover:-translate-y-0.5 transition-all duration-200">Crear Categoría</button>
              </form>
            </section>

            <section className="bg-white/60 backdrop-blur-md p-5 rounded-3xl border border-white/50 shadow-sm">
              <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider ml-1">Mis Categorías</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {categories.map(cat => (
                  <div key={cat.id} className="group flex justify-between items-center p-2 hover:bg-white rounded-xl transition border border-transparent hover:border-gray-100 hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-700">{cat.icon}</span>
                      <span className="text-sm font-bold text-gray-700">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${cat.type === 'Income' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-300 hover:text-red-500 transition px-2 opacity-0 group-hover:opacity-100">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* --- COLUMNA 3: METAS --- */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 relative overflow-visible">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-t-3xl"></div>
              <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-emerald-50 text-emerald-600 p-2 rounded-lg text-lg">🎯</span> Nueva Meta
              </h2>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Nombre Meta</label>
                    <input type="text" placeholder="Ej: Viaje" className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50 outline-none transition font-medium" value={goalName} onChange={e => setGoalName(e.target.value)} required />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Objetivo ($)</label>
                    <input type="number" placeholder="0.00" className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-emerald-200 outline-none transition font-medium" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} required />
                </div>
                
                <div className="relative">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Icono</label>
                  <button type="button" onClick={() => setShowGoalIconPicker(!showGoalIconPicker)} className="w-full p-3 bg-gray-50 rounded-xl border border-transparent hover:bg-gray-100 flex items-center justify-between transition">
                    <span className="flex items-center gap-2 text-gray-700 font-bold"><span className="text-2xl">{goalIcon}</span> <span className="text-sm font-normal text-gray-500">Cambiar icono</span></span>
                    <span className="text-gray-400 text-xs">▼</span>
                  </button>

                  {showGoalIconPicker && (
                    <div className="absolute top-full right-0 mt-2 w-full bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-4 max-h-80 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                      {Object.entries(ICON_CATEGORIES).map(([categoryName, icons]) => (
                        <div key={categoryName} className="mb-4">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wide border-b border-gray-100 pb-1">{categoryName}</h4>
                          <div className="grid grid-cols-6 gap-2">
                            {icons.map((icon) => (
                              <button key={icon} type="button" onClick={() => { setGoalIcon(icon); setShowGoalIconPicker(false); }} className="text-xl p-2 hover:bg-emerald-100 rounded-lg transition hover:scale-110">{icon}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all duration-200">Crear Meta</button>
              </form>
            </section>

            <section className="bg-white/60 backdrop-blur-md p-5 rounded-3xl border border-white/50 shadow-sm">
              <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider ml-1">Mis Metas</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {goals.map(goal => {
                    // Cálculo simple de progreso visual (random o 0 si no hay lógica de backend para actualizarlo aún)
                    const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                    return (
                        <div key={goal.id} className="group p-4 bg-white hover:bg-emerald-50 rounded-2xl border border-gray-100 hover:border-emerald-100 transition shadow-sm hover:shadow-md">
                            <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl bg-gray-50 w-10 h-10 flex items-center justify-center rounded-full">{goal.icon}</span>
                                <div>
                                    <div className="font-bold text-gray-800 text-sm">{goal.name}</div>
                                    <div className="text-[10px] text-gray-400">Meta: ${goal.target_amount.toLocaleString()}</div>
                                </div>
                            </div>
                            <button onClick={() => handleDeleteGoal(goal.id)} className="text-gray-300 hover:text-red-500 transition p-1 opacity-0 group-hover:opacity-100">✕</button>
                            </div>
                            
                            <div className="w-full bg-gray-100 rounded-full h-2 mb-1 overflow-hidden">
                                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                                <span>${goal.current_amount.toLocaleString()}</span>
                                <span>{progress.toFixed(0)}%</span>
                            </div>
                        </div>
                    );
                })}
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}