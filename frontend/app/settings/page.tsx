// frontend/src/app/settings/page.tsx
"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

// --- DATOS ---
const ICON_CATEGORIES = {
  "Dinero & Finanzas": ["💸", "💰", "💳", "🏦", "📉", "📈", "💎", "🧾"],
  "Comida & Bebida": ["🍔", "🍕", "🥗", "🍣", "☕", "🍺", "🍷", "🛒", "🥦"],
  "Transporte": ["🚗", "🚌", "🚕", "✈️", "⛽", "🚲", "🔧", "🅿️"],
  "Hogar & Servicios": ["🏠", "💡", "💧", "🔥", "📡", "🛠️", "🛏️", "🧹"],
  "Ocio & Tecnología": ["🎉", "🎮", "📱", "💻", "🎬", "📚", "🎨", "🎵"],
  "Salud & Bienestar": ["💊", "🏥", "🏋️", "🧘", "🩺", "🦷", "👶", "💅"],
  "Mascotas & Varios": ["🐶", "🐱", "🎁", "👔", "🎓", "🚨", "📝", "🗳️", "🎯", "✈️", "🏖️"]
};

// --- INTERFACES ---
interface Category { id: number; name: string; icon: string; type: string; }
interface Account { id: number; name: string; type: string; balance: number; }
interface Goal { id: number; name: string; target_amount: number; current_amount: number; icon: string; }

export default function Settings() {
  // --- ESTADOS FORMULARIOS ---
  // Cuentas
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState("Debit");
  const [accBalance, setAccBalance] = useState("0");

  // Categorías
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState("Expense");
  const [catIcon, setCatIcon] = useState("💸");
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Metas (NUEVO)
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalIcon, setGoalIcon] = useState("🎯");
  const [showGoalIconPicker, setShowGoalIconPicker] = useState(false);

  // --- LISTAS DE DATOS ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]); // <--- Lista de Metas

  // --- CARGAR DATOS ---
  const fetchData = async () => {
    try {
      // Agregamos la llamada a /goals/
      const [resCat, resAcc, resGoals] = await Promise.all([
        axios.get("http://127.0.0.1:8000/categories/"),
        axios.get("http://127.0.0.1:8000/accounts/"),
        axios.get("http://127.0.0.1:8000/goals/") 
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
      await axios.post("http://127.0.0.1:8000/accounts/", { name: accName, type: accType, balance: parseFloat(accBalance) });
      alert("✅ Cuenta creada");
      setAccName(""); setAccBalance("0");
      fetchData();
    } catch (error) { alert("Error al crear cuenta"); }
  };

  const handleDeleteAccount = async (id: number) => {
    if(!confirm("¿Borrar cuenta? Solo se puede si no tiene movimientos.")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/accounts/${id}`);
      fetchData();
    } catch (error) { alert("❌ No se puede borrar: Tiene transacciones asociadas."); }
  };

  // --- LOGICA CATEGORÍAS ---
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/categories/", { name: catName, type: catType, icon: catIcon, budget_limit: 0 });
      setCatName(""); setShowIconPicker(false);
      fetchData();
    } catch (error) { alert("Error al crear categoría"); }
  };

  const handleDeleteCategory = async (id: number) => {
    if(!confirm("¿Borrar categoría?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/categories/${id}`);
      fetchData();
    } catch (error) { alert("❌ No se puede borrar: Tiene gastos asociados."); }
  };

  // --- LOGICA METAS (NUEVO) ---
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/goals/", { 
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
      await axios.delete(`http://127.0.0.1:8000/goals/${id}`);
      fetchData();
    } catch (error) { alert("Error al eliminar meta"); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-700">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <div><h1 className="text-2xl font-semibold text-gray-800">Configuración</h1></div>
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition">⬅ Volver al Dashboard</Link>
        </div>

        {/* GRID PRINCIPAL (Ahora 3 Columnas en pantallas grandes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* --- COLUMNA 1: CUENTAS --- */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-1 rounded text-xs">🏦</span> Nueva Cuenta
              </h2>
              <form onSubmit={handleCreateAccount} className="space-y-5">
                <input type="text" placeholder="Nombre (Ej: Banco X)" className="w-full p-2 border rounded-lg" value={accName} onChange={e => setAccName(e.target.value)} required />
                <div className="grid grid-cols-2 gap-2">
                    <select className="w-full p-2 border rounded-lg bg-white" value={accType} onChange={e => setAccType(e.target.value)}>
                      <option value="Debit">Débito</option><option value="Cash">Efectivo</option><option value="Credit">Crédito</option>
                    </select>
                    <input type="number" placeholder="Saldo Inicial" className="w-full p-2 border rounded-lg" value={accBalance} onChange={e => setAccBalance(e.target.value)} />
                </div>
                <button className="w-full bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-700">Guardar Cuenta</button>
              </form>
            </section>

            {/* LISTA DE CUENTAS */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase">Mis Cuentas</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 group">
                    <div>
                      <div className="text-sm font-medium text-gray-700">{acc.name}</div>
                      <div className="text-xs text-gray-400">{acc.type} • Saldo: ${acc.balance}</div>
                    </div>
                    <button onClick={() => handleDeleteAccount(acc.id)} className="text-gray-300 hover:text-red-500 transition px-2" title="Borrar cuenta vacía">🗑️</button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* --- COLUMNA 2: CATEGORÍAS --- */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
              <h2 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-purple-100 text-purple-600 p-1 rounded text-xs">🏷️</span> Nueva Categoría
              </h2>
              <form onSubmit={handleCreateCategory} className="space-y-5">
                <input type="text" placeholder="Nombre (Ej: Cine)" className="w-full p-2 border rounded-lg" value={catName} onChange={e => setCatName(e.target.value)} required />
                
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">Icono</label>
                  <button type="button" onClick={() => setShowIconPicker(!showIconPicker)} className="w-full p-3 border rounded-lg flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition">
                    <span className="flex items-center gap-2 text-gray-700"><span className="text-2xl">{catIcon}</span> <span className="text-sm">Cambiar icono...</span></span>
                    <span className="text-gray-400">▼</span>
                  </button>

                  {showIconPicker && (
                    <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl p-4 max-h-64 overflow-y-auto">
                      {Object.entries(ICON_CATEGORIES).map(([categoryName, icons]) => (
                        <div key={categoryName} className="mb-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">{categoryName}</h4>
                          <div className="grid grid-cols-6 gap-2">
                            {icons.map((icon) => (
                              <button key={icon} type="button" onClick={() => { setCatIcon(icon); setShowIconPicker(false); }} className="text-xl p-2 hover:bg-purple-50 rounded transition hover:scale-110">{icon}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                    <button type="button" onClick={() => setCatType("Expense")} className={`flex-1 py-2 text-sm rounded border ${catType === "Expense" ? "bg-red-50 text-red-700 border-red-200" : "bg-white"}`}>Gasto</button>
                    <button type="button" onClick={() => setCatType("Income")} className={`flex-1 py-2 text-sm rounded border ${catType === "Income" ? "bg-green-50 text-green-700 border-green-200" : "bg-white"}`}>Ingreso</button>
                </div>
                <button className="w-full bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-700">Guardar Categoría</button>
              </form>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase">Mis Categorías</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {categories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 group">
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-8 text-center">{cat.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                    </div>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-300 hover:text-red-500 transition px-2">🗑️</button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* --- COLUMNA 3: METAS (NUEVO) --- */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
              <h2 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-600 p-1 rounded text-xs">🎯</span> Nueva Meta
              </h2>
              <form onSubmit={handleCreateGoal} className="space-y-5">
                <input type="text" placeholder="Meta (Ej: Viaje a Japón)" className="w-full p-2 border rounded-lg" value={goalName} onChange={e => setGoalName(e.target.value)} required />
                <input type="number" placeholder="Monto Objetivo ($)" className="w-full p-2 border rounded-lg" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} required />
                
                {/* Picker Icono Meta */}
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">Icono</label>
                  <button type="button" onClick={() => setShowGoalIconPicker(!showGoalIconPicker)} className="w-full p-3 border rounded-lg flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition">
                    <span className="flex items-center gap-2 text-gray-700"><span className="text-2xl">{goalIcon}</span> <span className="text-sm">Cambiar icono...</span></span>
                    <span className="text-gray-400">▼</span>
                  </button>

                  {showGoalIconPicker && (
                    <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl p-4 max-h-64 overflow-y-auto right-0">
                      {Object.entries(ICON_CATEGORIES).map(([categoryName, icons]) => (
                        <div key={categoryName} className="mb-4">
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">{categoryName}</h4>
                          <div className="grid grid-cols-6 gap-2">
                            {icons.map((icon) => (
                              <button key={icon} type="button" onClick={() => { setGoalIcon(icon); setShowGoalIconPicker(false); }} className="text-xl p-2 hover:bg-purple-50 rounded transition hover:scale-110">{icon}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="w-full bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-700">Crear Meta</button>
              </form>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase">Mis Metas</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {goals.map(goal => (
                  <div key={goal.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 group">
                    <div>
                      <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span>{goal.icon}</span> {goal.name}
                      </div>
                      <div className="text-xs text-gray-400">Objetivo: ${goal.target_amount}</div>
                    </div>
                    <button onClick={() => handleDeleteGoal(goal.id)} className="text-gray-300 hover:text-red-500 transition px-2">🗑️</button>
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