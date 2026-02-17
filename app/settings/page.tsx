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
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 font-sans text-gray-700">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER SIMPLE (Estilo Dashboard) */}
        <div className="flex justify-between items-center pb-2">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white text-slate-800 border border-gray-100 flex items-center justify-center rounded-2xl shadow-sm text-2xl">
               ⚙️
             </div>
             <div>
                <h1 className="text-2xl font-bold text-gray-800">Ajustes</h1>
                <p className="text-sm text-gray-400 font-medium">Gestiona tus cuentas y categorías</p>
             </div>
          </div>
          <Link href="/" className="bg-white border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition shadow-sm hover:shadow flex items-center gap-2">
            ⬅ Volver
          </Link>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          
          {/* --- COLUMNA 1: CUENTAS --- */}
          <div className="space-y-6">
            {/* Tarjeta Formulario */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="bg-blue-100 text-blue-600 w-10 h-10 flex items-center justify-center rounded-2xl text-lg">🏦</span> 
                Nueva Cuenta
              </h2>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Nombre</label>
                    <input type="text" placeholder="Ej: Cartera" className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none transition font-medium text-gray-700" value={accName} onChange={e => setAccName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Tipo</label>
                        <select className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-200 outline-none transition font-medium text-sm appearance-none text-gray-700" value={accType} onChange={e => setAccType(e.target.value)}>
                            {Object.entries(accTypesES).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Saldo</label>
                        <input type="number" className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-blue-200 outline-none transition font-medium text-gray-700" value={accBalance} onChange={e => setAccBalance(e.target.value)} />
                    </div>
                </div>
                <button className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold hover:bg-slate-700 hover:shadow-lg hover:shadow-slate-200 hover:-translate-y-0.5 transition-all duration-200">Guardar</button>
              </form>
            </section>

            {/* Lista de Cuentas */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider ml-1">Cuentas Activas</h3>
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {accounts.map(acc => (
                  <div key={acc.id} className="group flex justify-between items-center p-3 hover:bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-sm">
                        {acc.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-700 text-sm">{acc.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{accTypesES[acc.type] || acc.type}</div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                       <span className="block font-bold text-gray-800 text-sm">${acc.balance.toLocaleString()}</span>
                       <button onClick={() => handleDeleteAccount(acc.id)} className="text-[10px] text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold px-1">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* --- COLUMNA 2: CATEGORÍAS --- */}
          <div className="space-y-6">
            {/* Tarjeta Formulario */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative z-20">
              <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="bg-purple-100 text-purple-600 w-10 h-10 flex items-center justify-center rounded-2xl text-lg">🏷️</span> 
                Categoría
              </h2>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Nombre</label>
                    <input type="text" placeholder="Ej: Cine" className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition font-medium text-gray-700" value={catName} onChange={e => setCatName(e.target.value)} required />
                </div>
                
                <div className="relative">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Icono</label>
                  <button type="button" onClick={() => setShowIconPicker(!showIconPicker)} className="w-full p-3 bg-gray-50 rounded-xl border border-transparent hover:bg-gray-100 flex items-center justify-between transition">
                    <span className="flex items-center gap-2 text-gray-700 font-bold"><span className="text-2xl">{catIcon}</span> <span className="text-sm font-normal text-gray-500">Seleccionar...</span></span>
                    <span className="text-gray-400 text-xs">▼</span>
                  </button>

                  {/* Picker de Iconos Limpio */}
                  {showIconPicker && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-4 max-h-80 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                      {Object.entries(ICON_CATEGORIES).map(([categoryName, icons]) => (
                        <div key={categoryName} className="mb-4">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wide border-b border-gray-100 pb-1">{categoryName}</h4>
                          <div className="grid grid-cols-6 gap-2">
                            {icons.map((icon) => (
                              <button key={icon} type="button" onClick={() => { setCatIcon(icon); setShowIconPicker(false); }} className="text-xl p-2 hover:bg-purple-50 rounded-lg transition hover:scale-110">{icon}</button>
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
                <button className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-bold hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-200 hover:-translate-y-0.5 transition-all duration-200">Crear</button>
              </form>
            </section>

            {/* Lista de Categorías */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider ml-1">Mis Categorías</h3>
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {categories.map(cat => (
                  <div key={cat.id} className="group flex justify-between items-center p-2 hover:bg-gray-50 rounded-xl transition border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-700">{cat.icon}</span>
                      <span className="text-sm font-bold text-gray-700">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className={`text-[10px] font-bold px-2 py-1 rounded-lg ${cat.type === 'Income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                             {cat.type === 'Income' ? 'Ingreso' : 'Gasto'}
                         </div>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-300 hover:text-red-500 transition px-1 opacity-0 group-hover:opacity-100">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* --- COLUMNA 3: METAS --- */}
          <div className="space-y-6">
            {/* Tarjeta Formulario */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative z-10">
              <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-3">
                <span className="bg-emerald-100 text-emerald-600 w-10 h-10 flex items-center justify-center rounded-2xl text-lg">🎯</span> 
                Nueva Meta
              </h2>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Nombre Meta</label>
                    <input type="text" placeholder="Ej: Viaje" className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50 outline-none transition font-medium text-gray-700" value={goalName} onChange={e => setGoalName(e.target.value)} required />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Objetivo ($)</label>
                    <input type="number" placeholder="0.00" className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-emerald-200 outline-none transition font-medium text-gray-700" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} required />
                </div>
                
                <div className="relative">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Icono</label>
                  <button type="button" onClick={() => setShowGoalIconPicker(!showGoalIconPicker)} className="w-full p-3 bg-gray-50 rounded-xl border border-transparent hover:bg-gray-100 flex items-center justify-between transition">
                    <span className="flex items-center gap-2 text-gray-700 font-bold"><span className="text-2xl">{goalIcon}</span> <span className="text-sm font-normal text-gray-500">Seleccionar...</span></span>
                    <span className="text-gray-400 text-xs">▼</span>
                  </button>

                  {/* Picker Meta Limpio */}
                  {showGoalIconPicker && (
                    <div className="absolute top-full right-0 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-4 max-h-80 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
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

                <button className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all duration-200">Guardar Meta</button>
              </form>
            </section>

            {/* Lista de Metas */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider ml-1">Mis Metas</h3>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {goals.map(goal => {
                    const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
                    return (
                        <div key={goal.id} className="group p-4 hover:bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition">
                            <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{goal.icon}</span>
                                <div>
                                    <div className="font-bold text-gray-800 text-sm">{goal.name}</div>
                                    <div className="text-[10px] text-gray-400">Meta: ${goal.target_amount.toLocaleString()}</div>
                                </div>
                            </div>
                            <button onClick={() => handleDeleteGoal(goal.id)} className="text-gray-300 hover:text-red-500 transition p-1 opacity-0 group-hover:opacity-100 font-bold">✕</button>
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