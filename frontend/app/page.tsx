// frontend/src/app/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from "recharts";

// --- COMPONENTE MODAL (Responsivo) ---
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center z-[100] p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in duration-200">
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- INTERFACES & DATOS ---
interface Account { id: number; name: string; type: string; balance: number; }
interface Category { id: number; name: string; type: string; icon: string; }
interface Transaction { id: number; amount: number; description: string; date: string; category_id: number; account_id: number; }
interface Goal { id: number; name: string; target_amount: number; current_amount: number; icon: string; }

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

// 1. AQUI AGREGAMOS LA LISTA COMPLETA DE ICONOS
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

export default function Home() {
  const API_URL = "https://finanzas-api-y9ke.onrender.com";  
  
  // --- ESTADOS ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [pieData, setPieData] = useState<any[]>([]); 
  const [barData, setBarData] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState("");

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // 2. ESTADO PARA EL PICKER DE ICONOS
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Forms
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState("Cash");
  const [newAccBalance, setNewAccBalance] = useState("0");
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("Expense");
  const [newCatIcon, setNewCatIcon] = useState("🏷️");

  // Filtro Global Fecha
  const [filterDate, setFilterDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Form Transacciones
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [selCat, setSelCat] = useState("");
  const [selAcc, setSelAcc] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]); 
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- HELPERS ---
  const getDisplayDate = (isoDate: string) => {
    if (!isoDate) return "";
    const [year, month] = isoDate.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const monthName = date.toLocaleDateString('es-ES', { month: 'short' }); 
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`; 
  };

  const changeMonth = (offset: number) => {
    const [y, m] = filterDate.split("-");
    const date = new Date(parseInt(y), parseInt(m) - 1 + offset);
    setFilterDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  // --- FETCH ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [year, month] = filterDate.split("-");
      const [resTx, resCat, resAcc, resGoals, resAnalysis] = await Promise.all([
        axios.get(`${API_URL}/transactions/?month=${month}&year=${year}`),
        axios.get(`${API_URL}/categories/`),
        axios.get(`${API_URL}/accounts/`),
        axios.get(`${API_URL}/goals/`),
        axios.get(`${API_URL}/analysis/?month=${month}&year=${year}`)
      ]);
      setTransactions(resTx.data);
      setCategories(resCat.data);
      setAccounts(resAcc.data);
      setGoals(resGoals.data);
      setAnalysis(resAnalysis.data.message);
      processChartData(resTx.data, resCat.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [filterDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const processChartData = (txs: Transaction[], cats: Category[]) => {
    const expenses = txs.filter(t => cats.find(c => c.id === t.category_id)?.type === "Expense");
    const grouped = expenses.reduce((acc: any, curr) => {
      const cat = cats.find(c => c.id === curr.category_id);
      if(cat) acc[cat.name] = (acc[cat.name] || 0) + curr.amount;
      return acc;
    }, {});
    setPieData(Object.keys(grouped).map(key => ({ name: key, value: grouped[key] })));

    let income = 0, expense = 0;
    txs.forEach(t => {
      const type = cats.find(c => c.id === t.category_id)?.type;
      if (type === "Income") income += t.amount;
      if (type === "Expense") expense += t.amount;
    });
    setBarData([{ name: "Ing", monto: income, fill: "#10B981" }, { name: "Gas", monto: expense, fill: "#EF4444" }]);
  };

  // --- HANDLERS ---
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await axios.post(`${API_URL}/accounts/`, { name: newAccName, type: newAccType, balance: parseFloat(newAccBalance) });
        setShowAccountModal(false); setNewAccName(""); fetchData(); 
    } catch (error) { alert("Error"); }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await axios.post(`${API_URL}/categories/`, { name: newCatName, type: newCatType, icon: newCatIcon, budget_limit: 0 });
        setShowCategoryModal(false); setNewCatName(""); setShowIconPicker(false); fetchData(); 
    } catch (error) { alert("Error"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selCat || !selAcc) return;
    try {
        const payload = { amount: parseFloat(amount), description: desc, account_id: parseInt(selAcc), category_id: parseInt(selCat), date: txDate };
        editingId ? await axios.put(`${API_URL}/transactions/${editingId}`, payload) : await axios.post(`${API_URL}/transactions/`, payload);
        setAmount(""); setDesc(""); setEditingId(null); fetchData(); 
    } catch (error) { alert("Error"); }
  };

  const handleDelete = async (id: number) => {
    if(confirm("¿Borrar?")) { await axios.delete(`${API_URL}/transactions/${id}`); fetchData(); }
  };

  const startEditing = (tx: Transaction) => {
    setEditingId(tx.id); setAmount(tx.amount.toString()); setDesc(tx.description);
    setSelCat(tx.category_id.toString()); setSelAcc(tx.account_id.toString()); setTxDate(tx.date.split("T")[0]);
    document.getElementById("transaction-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-700 pb-20 sm:pb-12">
      
      {/* --- NAVBAR RESPONSIVO --- */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
                <span className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold flex-shrink-0">F</span>
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-transparent hover:border-gray-300 transition">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 text-gray-500 hover:text-blue-600 rounded-md">◀</button>
                    <div className="relative px-1 text-center min-w-[90px] sm:min-w-[120px]">
                        <span className="text-xs sm:text-sm font-bold capitalize truncate block">{getDisplayDate(filterDate)}</span>
                        <input type="month" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-1.5 text-gray-500 hover:text-blue-600 rounded-md">▶</button>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-gray-400 uppercase">Total</p>
                    <p className="font-bold text-gray-800">${totalBalance.toLocaleString()}</p>
                </div>
                <button onClick={() => window.location.href=`${API_URL}/export`} className="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-100 transition" title="Descargar Excel">📊</button>
                <Link href="/settings" className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition" title="Ajustes">⚙️</Link>
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* --- AI INSIGHT --- */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 text-white shadow-lg flex gap-3 items-center">
            <div className="text-2xl">🤖</div>
            <p className="text-sm font-medium opacity-90 leading-tight">{loading ? "Analizando..." : analysis || "Sin datos suficientes para análisis."}</p>
        </div>

        {/* --- TARJETA SALDO MOVIL --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center sm:hidden">
            <div>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Patrimonio Total</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">${totalBalance.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 text-blue-600 p-2 rounded-full">💰</div>
        </div>

        {/* --- ACCIONES RÁPIDAS --- */}
        <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            <button onClick={() => { setNewAccType("Cash"); setShowAccountModal(true); }} className="flex-1 min-w-[120px] bg-blue-600 text-white px-3 py-3 rounded-xl font-bold shadow-md shadow-blue-100 text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 active:scale-95 transition">
                <span>💳</span> <span className="whitespace-nowrap">Cuenta</span>
            </button>
            <button onClick={() => { setNewAccType("Savings"); setShowAccountModal(true); }} className="flex-1 min-w-[120px] bg-emerald-500 text-white px-3 py-3 rounded-xl font-bold shadow-md shadow-emerald-100 text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 active:scale-95 transition">
                <span>🐷</span> <span className="whitespace-nowrap">Meta</span>
            </button>
            <button onClick={() => setShowCategoryModal(true)} className="flex-1 min-w-[120px] bg-purple-600 text-white px-3 py-3 rounded-xl font-bold shadow-md shadow-purple-100 text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 active:scale-95 transition">
                <span>🏷️</span> <span className="whitespace-nowrap">Categoría</span>
            </button>
        </div>

        {/* --- GRID DE CONTENIDO --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* 1. FORMULARIO */}
            <div className="lg:col-span-3 order-1 lg:order-1" id="transaction-form">
                <div className={`bg-white p-5 rounded-2xl shadow-sm border transition-colors duration-300 ${editingId ? "border-blue-300 ring-2 ring-blue-50" : "border-gray-100"}`}>
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase">
                        {editingId ? "✏️ Editando..." : "📝 Nuevo Movimiento"}
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Monto</label>
                                <input type="number" placeholder="$0" className="w-full p-2.5 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700" value={amount} onChange={e => setAmount(e.target.value)} required />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Fecha</label>
                                <input type="date" className="w-full p-2.5 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium text-gray-600" value={txDate} onChange={e => setTxDate(e.target.value)} required />
                            </div>
                        </div>

                        <input type="text" placeholder="Concepto (Ej: Uber)" className="w-full p-2.5 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm" value={desc} onChange={e => setDesc(e.target.value)} required />
                        
                        <div className="grid grid-cols-2 gap-2">
                            <select className="p-2.5 bg-gray-50 rounded-lg outline-none text-xs w-full truncate" value={selCat} onChange={e => setSelCat(e.target.value)} required>
                                <option value="">Categoría</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                            </select>
                            <select className="p-2.5 bg-gray-50 rounded-lg outline-none text-xs w-full truncate" value={selAcc} onChange={e => setSelAcc(e.target.value)} required>
                                <option value="">Cuenta</option>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>

                        <div className="flex gap-2 pt-1">
                            {editingId && <button type="button" onClick={() => { setEditingId(null); setAmount(""); setDesc(""); }} className="w-1/3 bg-gray-100 text-gray-500 py-2.5 rounded-lg font-bold text-xs">Cancelar</button>}
                            <button className={`flex-1 text-white py-2.5 rounded-lg font-bold text-sm shadow-md transition ${editingId ? "bg-blue-600" : "bg-slate-800"}`}>
                                {editingId ? "Actualizar" : "Registrar"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* 2. GRÁFICOS */}
            <div className="lg:col-span-6 space-y-4 order-2 lg:order-2">
                {/* Metas */}
                {goals.length > 0 && (
                     <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                        {goals.map(goal => {
                             const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                             return (
                                <div key={goal.id} className="min-w-[160px] bg-white p-3 rounded-xl border border-gray-100 shadow-sm snap-start">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xl">{goal.icon}</span>
                                        <span className="text-xs font-bold text-emerald-600">{progress.toFixed(0)}%</span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-700 truncate">{goal.name}</p>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                             )
                        })}
                     </div>
                )}

                {/* Gráficos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-60 flex flex-col">
                        <h3 className="font-bold text-gray-700 text-xs uppercase mb-2">Balance Mensual</h3>
                        <div className="flex-1 w-full min-h-0 relative">
                            {barData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                        <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                                        <Bar dataKey="monto" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p className="text-center text-xs text-gray-300 mt-10">Sin datos</p>}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 h-60 flex flex-col">
                        <h3 className="font-bold text-gray-700 text-xs uppercase mb-2">Gastos por Categoría</h3>
                        <div className="flex-1 w-full min-h-0 relative">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                                        </Pie>
                                        <Tooltip contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                                        <Legend wrapperStyle={{fontSize: '10px'}} iconSize={8} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <p className="text-center text-xs text-gray-300 mt-10">Sin gastos</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. HISTORIAL */}
            <div className="lg:col-span-3 space-y-4 order-3 lg:order-3">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 text-xs uppercase">Últimos Movimientos</h3>
                    <div className="space-y-3">
                        {transactions.map(tx => {
                            const cat = categories.find(c => c.id === tx.category_id);
                            const isExpense = cat?.type === "Expense";
                            return (
                                <div key={tx.id} onClick={() => startEditing(tx)} className={`flex justify-between items-center py-2 border-b border-gray-50 last:border-0 cursor-pointer active:bg-gray-50 transition ${editingId === tx.id ? "bg-blue-50 -mx-2 px-2 rounded-lg" : ""}`}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${isExpense ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"}`}>
                                            {cat?.icon || "📄"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-700 text-xs truncate max-w-[120px]">{tx.description}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(tx.date).toLocaleDateString('es-ES', {day:'numeric', month:'short'})}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-sm ${isExpense ? "text-red-500" : "text-emerald-500"}`}>
                                            {isExpense ? "-" : "+"}${tx.amount}
                                        </p>
                                        <div className="flex justify-end gap-2 mt-1">
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }} className="text-[10px] text-gray-300 hover:text-red-500">Borrar</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {transactions.length === 0 && <p className="text-center text-gray-300 text-xs py-2">Nada por aquí</p>}
                    </div>
                </div>
                
                <div className="hidden lg:block bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                     <h3 className="font-bold text-gray-800 mb-3 text-xs uppercase">Mis Cuentas</h3>
                     <div className="space-y-2">
                        {accounts.map(acc => (
                            <div key={acc.id} className="flex justify-between text-sm">
                                <span className="text-gray-600 truncate max-w-[100px]">{acc.name}</span>
                                <span className="font-bold text-gray-800">${acc.balance.toLocaleString()}</span>
                            </div>
                        ))}
                     </div>
                </div>
            </div>

        </div>
      </main>

      {/* --- MODALES --- */}
      <Modal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} title={newAccType === "Savings" ? "🐷 Nueva Meta" : "💳 Nueva Cuenta"}>
        <form onSubmit={handleCreateAccount} className="space-y-4">
            <div><label className="text-xs font-bold text-gray-400 uppercase">Nombre</label><input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100" value={newAccName} onChange={e => setNewAccName(e.target.value)} required /></div>
            <div><label className="text-xs font-bold text-gray-400 uppercase">Saldo Inicial</label><input type="number" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100" value={newAccBalance} onChange={e => setNewAccBalance(e.target.value)} /></div>
            <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Crear</button>
        </form>
      </Modal>

      {/* 3. AQUI ESTÁ EL CAMBIO PRINCIPAL DEL MODAL CATEGORIA */}
      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="🏷️ Nueva Categoría">
        <form onSubmit={handleCreateCategory} className="space-y-4">
            <div><label className="text-xs font-bold text-gray-400 uppercase">Nombre</label><input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100" value={newCatName} onChange={e => setNewCatName(e.target.value)} required /></div>
            
            <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs font-bold text-gray-400 uppercase">Tipo</label><select className="w-full p-3 bg-gray-50 rounded-xl" value={newCatType} onChange={e => setNewCatType(e.target.value)}><option value="Expense">Gasto</option><option value="Income">Ingreso</option></select></div>
                
                {/* Nuevo Selector de Iconos Visual */}
                <div className="relative">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Icono</label>
                  <button type="button" onClick={() => setShowIconPicker(!showIconPicker)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 flex items-center justify-between transition">
                    <span className="flex items-center gap-2 text-gray-700 font-bold"><span className="text-2xl">{newCatIcon}</span> <span className="text-sm font-normal text-gray-500">Elegir...</span></span>
                    <span className="text-gray-400 text-xs">▼</span>
                  </button>

                  {showIconPicker && (
                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                      {Object.entries(ICON_CATEGORIES).map(([categoryName, icons]) => (
                        <div key={categoryName} className="mb-4">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wide border-b border-gray-100 pb-1">{categoryName}</h4>
                          <div className="grid grid-cols-5 gap-2">
                            {icons.map((icon) => (
                              <button key={icon} type="button" onClick={() => { setNewCatIcon(icon); setShowIconPicker(false); }} className="text-xl p-1 hover:bg-purple-50 rounded-lg transition hover:scale-110">{icon}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </div>
            
            <button className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold">Crear</button>
        </form>
      </Modal>

    </div>
  );
}