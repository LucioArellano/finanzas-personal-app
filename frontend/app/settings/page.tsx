// frontend/src/app/settings/page.tsx
"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

interface Account { id: number; name: string; type: string; balance: number; }
interface Category { id: number; name: string; type: string; icon: string; }
interface Goal { id: number; name: string; target_amount: number; current_amount: number; icon: string; }

export default function Settings() {
  const API_URL = "https://finanzas-api-y9ke.onrender.com"; // Asegúrate de que coincida con tu page.tsx principal

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // NOTA: Si ya activaste la seguridad en el backend, esto fallará (401) hasta que hagamos el Login.
  // Si aún no has reiniciado el backend con el código nuevo, funcionará bien.
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (type: "accounts" | "categories" | "goals", id: number) => {
    if (!confirm("¿Estás seguro de borrar esto? Si tiene datos asociados, podría fallar.")) return;
    try {
      await axios.delete(`${API_URL}/${type}/${id}`);
      fetchData(); // Recargar
    } catch (error) {
      alert("No se pudo borrar. Asegúrate de que no tenga transacciones asociadas.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-700 pb-12">
      
      {/* --- NAVBAR --- */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Link href="/" className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition">
                    ◀
                </Link>
                <h1 className="font-bold text-lg text-gray-800">Ajustes</h1>
            </div>
            <div className="w-8 h-8 bg-slate-800 text-white flex items-center justify-center rounded-lg font-bold">
                S
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {loading ? (
            <div className="text-center py-20 text-gray-400 animate-pulse">Cargando configuración...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* --- 1. CATEGORÍAS --- */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
                        <h3 className="font-bold text-gray-800 text-sm uppercase flex items-center gap-2">
                            🏷️ Categorías
                        </h3>
                        <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full font-bold">{categories.length}</span>
                    </div>
                    
                    <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1 scrollbar-thin">
                        {categories.map(cat => (
                            <div key={cat.id} className="group flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl w-8 text-center">{cat.icon}</span>
                                    <div>
                                        <p className="font-bold text-sm text-gray-700">{cat.name}</p>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cat.type === 'Income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {cat.type === 'Income' ? 'Ingreso' : 'Gasto'}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete("categories", cat.id)}
                                    className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Borrar"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- 2. CUENTAS --- */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
                        <h3 className="font-bold text-gray-800 text-sm uppercase flex items-center gap-2">
                            💳 Cuentas
                        </h3>
                        <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full font-bold">{accounts.length}</span>
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1 scrollbar-thin">
                        {accounts.map(acc => (
                            <div key={acc.id} className="group flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center font-bold text-xs">
                                        {acc.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-700">{acc.name}</p>
                                        <p className="text-[10px] text-gray-400 capitalize">{acc.type}</p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                    <p className="text-xs font-bold text-gray-600">${acc.balance.toLocaleString()}</p>
                                    <button 
                                        onClick={() => handleDelete("accounts", acc.id)}
                                        className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- 3. METAS --- */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                     <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-2">
                        <h3 className="font-bold text-gray-800 text-sm uppercase flex items-center gap-2">
                            🎯 Metas
                        </h3>
                        <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full font-bold">{goals.length}</span>
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1 scrollbar-thin">
                        {goals.map(goal => {
                            const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                            return (
                                <div key={goal.id} className="group p-3 hover:bg-gray-50 rounded-lg transition border border-transparent hover:border-gray-100">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{goal.icon}</span>
                                            <span className="font-bold text-sm text-gray-700">{goal.name}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete("goals", goal.id)}
                                            className="text-gray-300 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-500">
                                        <span>${goal.current_amount.toLocaleString()}</span>
                                        <span>de ${goal.target_amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {goals.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No hay metas activas</p>}
                    </div>
                </div>

            </div>
        )}
      </main>
    </div>
  );
}