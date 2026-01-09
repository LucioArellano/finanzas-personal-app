// frontend/src/app/settings/page.tsx
"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

// --- DATOS DE ICONOS (Expandidos y Categorizados) ---
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

  // --- LOGICA CUENTAS ---
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/accounts/`, { name: accName, type: accType, balance: parseFloat(accBalance) });
      alert("✅ Cuenta creada");
      setAccName(""); setAccBalance("0");
      fetchData();
    } catch (error) { alert("Error al crear cuenta"); }
  };

  const handleDeleteAccount = async (id: number) => {
    if(!confirm("¿Borrar cuenta? Solo se puede si no tiene movimientos.")) return;
    try {
      await axios.delete(`${API_URL}/accounts/${id}`);
      fetchData();
    } catch (error) { alert("❌ No se puede borrar: Tiene transacciones asociadas."); }
  };

  // --- LOGICA CATEGORÍAS ---
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/categories/`, { name: catName, type: catType, icon: catIcon, budget_limit: 0 });
      setCatName(""); setShowIconPicker(false);
      alert("✅ Categoría creada");
      fetchData();
    } catch (error) { alert("Error al crear categoría"); }
  };

  const handleDeleteCategory = async (id: number) => {
    if(!confirm("¿Borrar categoría?")) return;
    try {
      await axios.delete(`${API_URL}/categories/${id}`);
      fetchData();
    } catch (error) { alert("❌ No se puede borrar: Tiene gastos asociados."); }
  };

  // --- LOGICA METAS ---
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/goals/`, { 
        name: goalName, 
        target_amount: parseFloat(goalTarget), 
        current_amount: 0, 
        icon: goalIcon 
      });
      alert("✅ Meta creada");
      setGoalName(""); setGoalTarget(""); setShowGoalIconPicker(false);
      fetchData();
    } catch (error) { alert("Error al crear meta"); }
  };

  const handleDeleteGoal = async (id: number) => {
    if(!confirm("¿Borrar esta meta de ahorro?")) return;
    try {
      await axios.delete(`${API_URL}/goals/${id}`);
      fetchData();
    } catch (error) { alert("Error al eliminar meta"); }
  };

  // Diccionario simple para mostrar tipos de cuenta en español
  const accTypesES: Record<string, string> = {
      "Cash": "Efectivo", "Debit": "Débito", "Credit": "Crédito", 
      "Savings": "Ahorro", "Investment": "Inversión"
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 font-sans text-gray-700">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-center pb-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
             <span className="text-3xl">⚙️</span>
             <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
          </div>
          <Link href="/" className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-100 transition shadow-sm">
            ⬅ Volver al Dashboard
          </Link>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          
          {/* --- COLUMNA 1: CUENTAS --- */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-sm">🏦</span> Nueva Cuenta
              </h2>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Nombre</label>
                    <input type="text" placeholder="Ej: Cartera" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-500 transition" value={accName} onChange={e => setAccName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Tipo</label>
                        <select className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none" value={accType} onChange={e => setAccType(e.target.value)}>
                        <option value="Cash">Efectivo</option>
                        <option value="Debit">Débito</option>
                        <option value="Savings">Ahorro</option>
                        <option value="Credit">Crédito</option>
                        <option value="Investment">Inversión</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Saldo</label>
                        <input type="number" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none" value={accBalance} onChange={e => setAccBalance(e.target.value)} />
                    </div>
                </div>
                <button className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition shadow-lg shadow-slate-200">Guardar Cuenta</button>
              </form>
            </section>

            {/* LISTA DE CUENTAS */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider">Mis Cuentas Activas</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center p-3 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-100 transition group">
                    <div>
                      <div className="font-bold text-gray-700 text-sm">{acc.name}</div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                         <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-gray-500">{accTypesES[acc.type] || acc.type}</span>
                         <span>${acc.balance.toLocaleString()}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteAccount(acc.id)} className="text-gray-300 hover:text-red-500 transition px-2 opacity-0 group-hover:opacity-100" title="Borrar cuenta vacía">🗑️</button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* --- COLUMNA 2: CATEGORÍAS --- */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative z-10">
              <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg text-sm">🏷️</span> Nueva Categoría
              </h2>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Nombre</label>
                    <input type="text" placeholder="Ej: Cine" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-purple-500 transition" value={catName} onChange={e => setCatName(e.target.value)} required />
                </div>
                
                <div className="relative">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Icono</label>
                  <button type="button" onClick={() => setShowIconPicker(!showIconPicker)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-gray-100 transition">
                    <span className="flex items-center gap-2 text-gray-700 font-bold"><span className="text-xl">{catIcon}</span> <span className="text-sm font-normal text-gray-500">Seleccionar...</span></span>
                    <span className="text-gray-400 text-xs">▼</span>
                  </button>

                  {showIconPicker && (
                    <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-4 max-h-80 overflow-y-auto animate-in fade-in zoom-in duration-200">
                      {Object.entries(ICON_CATEGORIES).map(([categoryName, icons]) => (
                        <div key={categoryName} className="mb-4">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wide">{categoryName}</h4>
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

                <div className="flex gap-2">
                    <button type="button" onClick={() => setCatType("Expense")} className={`flex-1 py-3 text-sm rounded-xl font-bold border transition ${catType === "Expense" ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-gray-500 border-gray-100"}`}>Gasto</button>
                    <button type="button" onClick={() => setCatType("Income")} className={`flex-1 py-3 text-sm rounded-xl font-bold border transition ${catType === "Income" ? "bg-green-50 text-green-600 border-green-200" : "bg-white text-gray-500 border-gray-100"}`}>Ingreso</button>
                </div>
                <button className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200">Crear Categoría</button>
              </form>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider">Mis Categorías</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {categories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-2 hover:bg-purple-50 rounded-xl border border-transparent hover:border-purple-100 transition group">
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full">{cat.icon}</span>
                      <span className="text-sm font-bold text-gray-700">{cat.name}</span>
                    </div>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-300 hover:text-red-500 transition px-2 opacity-0 group-hover:opacity-100">🗑️</button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* --- COLUMNA 3: METAS --- */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
              <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg text-sm">🎯</span> Nueva Meta
              </h2>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Nombre Meta</label>
                    <input type="text" placeholder="Ej: Viaje" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-emerald-500 transition" value={goalName} onChange={e => setGoalName(e.target.value)} required />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Objetivo ($)</label>
                    <input type="number" placeholder="0.00" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-emerald-500 transition" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} required />
                </div>
                
                {/* Picker Icono Meta */}
                <div className="relative">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Icono</label>
                  <button type="button" onClick={() => setShowGoalIconPicker(!showGoalIconPicker)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-gray-100 transition">
                    <span className="flex items-center gap-2 text-gray-700 font-bold"><span className="text-xl">{goalIcon}</span> <span className="text-sm font-normal text-gray-500">Seleccionar...</span></span>
                    <span className="text-gray-400 text-xs">▼</span>
                  </button>

                  {showGoalIconPicker && (
                    <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-4 max-h-80 overflow-y-auto right-0 animate-in fade-in zoom-in duration-200">
                      {Object.entries(ICON_CATEGORIES).map(([categoryName, icons]) => (
                        <div key={categoryName} className="mb-4">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wide">{categoryName}</h4>
                          <div className="grid grid-cols-6 gap-2">
                            {icons.map((icon) => (
                              <button key={icon} type="button" onClick={() => { setGoalIcon(icon); setShowGoalIconPicker(false); }} className="text-xl p-2 hover:bg-emerald-50 rounded-lg transition hover:scale-110">{icon}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">Crear Meta</button>
              </form>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider">Mis Metas</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {goals.map(goal => (
                  <div key={goal.id} className="flex justify-between items-center p-3 hover:bg-emerald-50 rounded-xl border border-transparent hover:border-emerald-100 transition group">
                    <div>
                      <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <span className="text-lg">{goal.icon}</span> {goal.name}
                      </div>
                      <div className="text-xs text-emerald-600 font-medium mt-1">Objetivo: ${goal.target_amount.toLocaleString()}</div>
                    </div>
                    <button onClick={() => handleDeleteGoal(goal.id)} className="text-gray-300 hover:text-red-500 transition px-2 opacity-0 group-hover:opacity-100">🗑️</button>
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}