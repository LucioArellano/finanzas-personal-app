// frontend/src/app/page.tsx
"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from "recharts";

// --- INTERFACES ---
interface Account { id: number; name: string; type: string; balance: number; }
interface Category { id: number; name: string; type: string; icon: string; }
interface Transaction { id: number; amount: number; description: string; date: string; category_id: number; account_id: number; }
interface Goal { id: number; name: string; target_amount: number; current_amount: number; icon: string; }

// --- DICCIONARIO ---
const TRANSLATIONS: Record<string, string> = {
    "Cash": "Efectivo", "Debit": "Débito", "Credit": "Crédito",
    "Savings": "Ahorro", "Investment": "Inversión", "Income": "Ingreso", "Expense": "Gasto"
};

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [pieData, setPieData] = useState<any[]>([]); 
  const [barData, setBarData] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState("");

  // ESTADO FECHA
  const [filterDate, setFilterDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // --- ESTADOS FORMULARIO ---
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [selCat, setSelCat] = useState("");
  const [selAcc, setSelAcc] = useState("");
  
  // NUEVO: Estado para saber si estamos editando
  const [editingId, setEditingId] = useState<number | null>(null);

  const getDisplayDate = (isoDate: string) => {
    if (!isoDate) return "";
    const [year, month] = isoDate.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const monthName = date.toLocaleDateString('es-ES', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [year, month] = filterDate.split("-");
      const [resTx, resCat, resAcc, resGoals, resAnalysis] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/transactions/?month=${month}&year=${year}`),
        axios.get("http://127.0.0.1:8000/categories/"),
        axios.get("http://127.0.0.1:8000/accounts/"),
        axios.get("http://127.0.0.1:8000/goals/"),
        axios.get(`http://127.0.0.1:8000/analysis/?month=${month}&year=${year}`)
      ]);
      setTransactions(resTx.data);
      setCategories(resCat.data);
      setAccounts(resAcc.data);
      setGoals(resGoals.data);
      setAnalysis(resAnalysis.data.message);
      processChartData(resTx.data, resCat.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterDate]);

  const processChartData = (txs: Transaction[], cats: Category[]) => {
    const expenses = txs.filter(t => {
      const cat = cats.find(c => c.id === t.category_id);
      return cat && cat.type === "Expense";
    });
    const groupedExpenses = expenses.reduce((acc: any, curr) => {
      const cat = cats.find(c => c.id === curr.category_id);
      if(cat) acc[cat.name] = (acc[cat.name] || 0) + curr.amount;
      return acc;
    }, {});
    setPieData(Object.keys(groupedExpenses).map(key => ({ name: key, value: groupedExpenses[key] })));

    let totalIncome = 0, totalExpense = 0;
    txs.forEach(t => {
      const cat = cats.find(c => c.id === t.category_id);
      if (cat?.type === "Income") totalIncome += t.amount;
      if (cat?.type === "Expense") totalExpense += t.amount;
    });
    setBarData([
      { name: "Ingresos", monto: totalIncome, fill: "#10B981" }, 
      { name: "Gastos", monto: totalExpense, fill: "#EF4444" }   
    ]);
  };

  // --- FUNCIONES EDICIÓN ---
  const startEditing = (tx: Transaction) => {
    setEditingId(tx.id);
    setAmount(tx.amount.toString());
    setDesc(tx.description);
    setSelCat(tx.category_id.toString());
    setSelAcc(tx.account_id.toString());
    // Scroll suave hacia arriba para ver el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setAmount(""); setDesc(""); setSelCat(""); setSelAcc("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selCat || !selAcc) { alert("Selecciona cuenta y categoría"); return; }
    try {
        const payload = {
            amount: parseFloat(amount),
            description: desc,
            account_id: parseInt(selAcc),
            category_id: parseInt(selCat)
        };

        if (editingId) {
            // MODO ACTUALIZAR (PUT)
            await axios.put(`http://127.0.0.1:8000/transactions/${editingId}`, payload);
            alert("✅ Movimiento actualizado");
            setEditingId(null); // Salir modo edición
        } else {
            // MODO CREAR (POST)
            await axios.post("http://127.0.0.1:8000/transactions/", payload);
        }

      setAmount(""); setDesc(""); // Reset solo si no estamos editando (o tras editar)
      fetchData(); // Recargar datos
    } catch (error) { alert("Error al guardar"); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("¿Borrar movimiento?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/transactions/${id}`);
      fetchData();
    } catch (error) { alert("Error al borrar"); }
  };

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  const downloadExcel = () => {
    // Al redirigir al navegador a esta URL, iniciará la descarga automáticamente
    window.location.href = "http://127.0.0.1:8000/export";
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-700 pb-12">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold">F</span>
                <h1 className="text-xl font-bold text-gray-800 hidden sm:block">Finanzas App</h1>
            </div>
            <div className="relative group">
                <div className="flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg px-4 py-2 group-hover:bg-gray-200 transition cursor-pointer border border-transparent group-hover:border-gray-300">
                    <span>📅</span>
                    <span className="capitalize">{getDisplayDate(filterDate)}</span>
                    <span className="text-xs text-gray-400">▼</span>
                </div>
                <input type="month" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Cambiar fecha" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs text-gray-400 uppercase">Patrimonio Total</p>
              <p className="font-bold text-gray-800 text-lg">${totalBalance.toLocaleString()}</p>
            </div>
            {/* Botón Excel */}
            <button onClick={downloadExcel} className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2" title="Descargar historial en Excel">
    📊 <span className="hidden md:inline">Excel</span> </button>
            <Link href="/settings" className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition">⚙️ Ajustes</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* --- AI INSIGHT --- */}
<div className="mb-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex items-start gap-4">
    <div className="text-3xl bg-white/10 w-12 h-12 flex items-center justify-center rounded-full flex-shrink-0">
        🤖
    </div>
    <div>
        <h3 className="font-bold text-blue-200 text-xs uppercase tracking-wider mb-1">Análisis Inteligente</h3>
        <p className="text-sm md:text-base font-medium leading-relaxed opacity-90">
            {loading ? "Analizando tus finanzas..." : analysis}
        </p>
    </div>
</div>
        {/* SECCIÓN CUENTAS */}
        <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Mis Cuentas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between md:hidden">
                <span className="text-slate-400 text-sm font-medium">Patrimonio Total</span>
                <span className="text-3xl font-bold">${totalBalance.toLocaleString()}</span>
            </div>
            {accounts.map(acc => (
                <div key={acc.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-gray-50 to-white rounded-bl-full -mr-2 -mt-2 z-0"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3">
                            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">{TRANSLATIONS[acc.type] || acc.type}</span>
                            <span className="text-xs text-gray-300">Activa</span>
                        </div>
                        <h3 className="font-semibold text-gray-600 text-sm mb-1">{acc.name}</h3>
                        <div className="text-2xl font-bold text-slate-800">${acc.balance.toLocaleString()}</div>
                    </div>
                </div>
            ))}
            {accounts.length === 0 && <Link href="/settings" className="border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center p-6 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition cursor-pointer">+ Agregar Cuenta</Link>}
            </div>
        </section>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* IZQUIERDA: FORMULARIO */}
            <div className="lg:col-span-3 space-y-6">
                <div className={`bg-white p-6 rounded-2xl shadow-sm border sticky top-24 z-30 transition-colors duration-300 ${editingId ? "border-blue-300 ring-2 ring-blue-50" : "border-gray-100"}`}>
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className={`p-1 rounded ${editingId ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                            {editingId ? "✏️" : "📝"}
                        </span> 
                        {editingId ? "Editar Movimiento" : "Registrar"}
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Monto</label>
                            <input type="number" placeholder="$0.00" className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 transition font-bold text-lg text-gray-700" value={amount} onChange={e => setAmount(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Concepto</label>
                            <input type="text" placeholder="Ej: Supermercado" className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-100 transition text-sm" value={desc} onChange={e => setDesc(e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <select className="p-3 bg-gray-50 rounded-xl outline-none text-sm w-full" value={selCat} onChange={e => setSelCat(e.target.value)} required>
                                <option value="">Categoría</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                            </select>
                            <select className="p-3 bg-gray-50 rounded-xl outline-none text-sm w-full" value={selAcc} onChange={e => setSelAcc(e.target.value)} required>
                                <option value="">Cuenta</option>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex gap-2">
                            {editingId && (
                                <button type="button" onClick={cancelEditing} className="w-1/3 bg-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-300 transition text-sm">
                                    Cancelar
                                </button>
                            )}
                            <button className={`flex-1 text-white py-3 rounded-xl font-bold transition shadow-lg transform active:scale-95 ${editingId ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-slate-800 hover:bg-slate-700 shadow-slate-200"}`}>
                                {editingId ? "Actualizar" : "Guardar"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* CENTRO: GRÁFICOS */}
            <div className="lg:col-span-6 space-y-6">
                {goals.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800">🎯 Metas de Ahorro</h3>
                            <Link href="/settings" className="text-xs text-blue-500 hover:underline">Ver todas</Link>
                        </div>
                        <div className="space-y-4">
                            {goals.slice(0, 3).map(goal => {
                                const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                                return (
                                    <div key={goal.id}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700 flex items-center gap-2">{goal.icon} {goal.name}</span>
                                            <span className="font-bold text-gray-900">{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-64 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-2">⚖️ Balance del Mes</h3>
                    <div className="flex-1 w-full min-h-0 relative">
                        {loading ? <div className="absolute inset-0 flex items-center justify-center text-gray-400">Cargando...</div> : transactions.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={70} tick={{fontSize: 12}} />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                                    <Bar dataKey="monto" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm"><p>Sin datos</p></div>}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-2">📊 Gastos por Categoría</h3>
                    <div className="flex-1 w-full min-h-0 relative">
                        {loading ? <div className="absolute inset-0 flex items-center justify-center text-gray-400">Cargando...</div> : pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                            </Pie>
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        ) : <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm"><span className="text-2xl mb-2">📅</span><p>Sin gastos este mes</p></div>}
                    </div>
                </div>
            </div>

            {/* DERECHA: HISTORIAL */}
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">⏱️ Historial Mes</h3>
                    <div className="space-y-4">
                        {transactions.slice().reverse().map(tx => {
                            const cat = categories.find(c => c.id === tx.category_id);
                            const isExpense = cat?.type === "Expense";
                            return (
                                <div key={tx.id} className={`flex justify-between items-center group py-2 border-b border-gray-50 last:border-0 ${editingId === tx.id ? "bg-blue-50 rounded px-2 -mx-2" : ""}`}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${isExpense ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"}`}>
                                            {cat?.icon || "📄"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-700 text-xs truncate">{tx.description}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-2">
                                        <div>
                                            <p className={`font-bold text-sm ${isExpense ? "text-red-500" : "text-emerald-500"}`}>
                                                {isExpense ? "-" : "+"}${tx.amount}
                                            </p>
                                        </div>
                                        {/* BOTONES ACCIÓN */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button onClick={() => startEditing(tx)} className="p-1 text-gray-400 hover:text-blue-500 bg-gray-50 hover:bg-blue-50 rounded" title="Editar">✏️</button>
                                            <button onClick={() => handleDelete(tx.id)} className="p-1 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded" title="Borrar">🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {transactions.length === 0 && <p className="text-center text-gray-400 text-xs py-4">No hay datos para esta fecha</p>}
                    </div>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}