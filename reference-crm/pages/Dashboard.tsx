import React, { useEffect, useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { suggestNextAction } from '../services/geminiService';

const Dashboard = () => {
  const { contacts, deals } = useCRM();
  const [suggestions, setSuggestions] = useState<{name: string, reason: string}[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Calculate Metrics
  const totalPipelineValue = deals.reduce((acc, deal) => acc + deal.value, 0);
  const totalDeals = deals.length;
  const wonDeals = deals.filter(d => d.stage === 'Ganado').length;
  const winRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;

  // Chart Data Preparation
  const dealsByStage = deals.reduce((acc, deal) => {
    acc[deal.stage] = (acc[deal.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.keys(dealsByStage).map(stage => ({
    name: stage,
    count: dealsByStage[stage]
  }));

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#64748b'];

  useEffect(() => {
    const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        const result = await suggestNextAction(contacts);
        try {
            const parsed = JSON.parse(result);
            setSuggestions(parsed);
        } catch (e) {
            console.error("Failed to parse JSON suggestion", e);
        }
        setLoadingSuggestions(false);
    }
    // Only fetch if we haven't fetched yet (simple check for demo)
    if (suggestions.length === 0 && contacts.length > 0) {
        fetchSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Panel Principal</h2>
        <div className="text-sm text-slate-500">Última actualización: Hoy, {new Date().toLocaleTimeString()}</div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-medium">Pipeline Total</h3>
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <DollarSign size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">${totalPipelineValue.toLocaleString()}</p>
          <span className="text-xs text-green-500 font-medium mt-1 flex items-center gap-1">
             <TrendingUp size={12} /> +12% vs mes anterior
          </span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-medium">Contactos Activos</h3>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Users size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{contacts.length}</p>
          <span className="text-xs text-slate-400 mt-1">Total de la base de datos</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-medium">Tasa de Cierre</h3>
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">{winRate}%</p>
          <span className="text-xs text-slate-400 mt-1">De oportunidades ganadas</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
           <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 text-sm font-medium">Acción Requerida</h3>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <AlertCircle size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">3</p>
          <span className="text-xs text-amber-600 mt-1">Negocios estancados > 15 días</span>
        </div>
      </div>

      {/* AI & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Negocios por Etapa</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40}>
                    {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-xl shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-yellow-400" />
                <h3 className="text-lg font-semibold">Sugerencias Gemini</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {loadingSuggestions ? (
                     <div className="flex flex-col gap-2 animate-pulse">
                        <div className="h-16 bg-white/10 rounded-lg"></div>
                        <div className="h-16 bg-white/10 rounded-lg"></div>
                     </div>
                ) : suggestions.length > 0 ? (
                    suggestions.map((s, idx) => (
                        <div key={idx} className="bg-white/10 p-4 rounded-lg border border-white/5 hover:bg-white/20 transition-colors cursor-pointer">
                            <p className="font-semibold text-sm text-indigo-200">{s.name}</p>
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{s.reason}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-slate-400">No hay sugerencias por el momento.</p>
                )}
            </div>
            <button 
                className="mt-4 w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
                onClick={() => window.location.reload()} // Quick hack to refresh suggestions in demo
            >
                Actualizar Análisis
            </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
