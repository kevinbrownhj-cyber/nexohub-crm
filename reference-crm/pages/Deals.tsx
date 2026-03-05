import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { Deal, DealStage } from '../types';
import { analyzeDeal } from '../services/geminiService';
import { DollarSign, Calendar, AlertCircle, X, BrainCircuit, ArrowRight } from 'lucide-react';

const Deals = () => {
  const { deals, updateDeal, contacts } = useCRM();
  const [analyzingDeal, setAnalyzingDeal] = useState<string | null>(null); // ID of deal being analyzed
  const [analysisResult, setAnalysisResult] = useState<{id: string, text: string} | null>(null);

  const stages = Object.values(DealStage);

  const getDealsByStage = (stage: DealStage) => deals.filter(deal => deal.stage === stage);

  const getStageColor = (stage: DealStage) => {
      switch(stage) {
          case DealStage.NEW: return 'bg-blue-500';
          case DealStage.QUALIFICATION: return 'bg-indigo-500';
          case DealStage.PROPOSAL: return 'bg-purple-500';
          case DealStage.NEGOTIATION: return 'bg-amber-500';
          case DealStage.WON: return 'bg-emerald-500';
          case DealStage.LOST: return 'bg-red-500';
          default: return 'bg-slate-500';
      }
  }

  const handleStageChange = (deal: Deal, newStage: string) => {
      updateDeal({ ...deal, stage: newStage as DealStage });
  };

  const handleAnalyze = async (deal: Deal) => {
      setAnalyzingDeal(deal.id);
      const contact = contacts.find(c => c.id === deal.contactId);
      if (contact) {
        const result = await analyzeDeal(deal, contact);
        setAnalysisResult({ id: deal.id, text: result });
      } else {
        setAnalysisResult({ id: deal.id, text: "No se encontró contacto asociado."});
      }
      setAnalyzingDeal(null);
  };

  const closeAnalysis = () => setAnalysisResult(null);

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Pipeline de Ventas</h2>
        <div className="flex gap-2">
            <span className="text-sm text-slate-500 self-center mr-2">Vista Kanban</span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-4 h-full min-w-[1200px]">
            {stages.map(stage => (
                <div key={stage} className="flex-1 flex flex-col bg-slate-100 rounded-xl min-w-[280px] max-w-xs h-full">
                    {/* Column Header */}
                    <div className="p-3 border-b border-slate-200/50 flex items-center justify-between sticky top-0 bg-slate-100 rounded-t-xl z-10">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStageColor(stage)}`}></div>
                            <span className="font-semibold text-slate-700 text-sm uppercase tracking-wide">{stage}</span>
                        </div>
                        <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full font-bold">
                            {getDealsByStage(stage).length}
                        </span>
                    </div>

                    {/* Column Content */}
                    <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                        {getDealsByStage(stage).map(deal => {
                            const contact = contacts.find(c => c.id === deal.contactId);
                            return (
                                <div key={deal.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow group relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-slate-800 line-clamp-2">{deal.title}</h4>
                                        <button 
                                            onClick={() => handleAnalyze(deal)}
                                            className="text-indigo-400 hover:text-indigo-600 transition-colors"
                                            title="Analizar con IA"
                                        >
                                            {analyzingDeal === deal.id ? (
                                                <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                                            ) : (
                                                <BrainCircuit size={18} />
                                            )}
                                        </button>
                                    </div>
                                    
                                    <div className="text-sm text-slate-500 mb-3 flex items-center gap-1">
                                        <span className="font-medium text-slate-700">{contact?.company}</span>
                                        <span className="text-xs">• {contact?.name}</span>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 text-xs text-slate-500 font-medium">
                                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                            <DollarSign size={12} />
                                            {deal.value.toLocaleString()}
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <Calendar size={12} />
                                            {new Date(deal.expectedCloseDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                        </div>
                                    </div>

                                    {/* Quick Move (Simplified DnD alternative) */}
                                    <div className="absolute top-1/2 -right-2 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 bg-white shadow-lg p-1 rounded-lg z-20">
                                        {stages.map((s) => (
                                            s !== deal.stage && (
                                                <button 
                                                    key={s}
                                                    onClick={() => handleStageChange(deal, s)}
                                                    className="w-4 h-4 rounded-full border border-slate-200 hover:scale-110 transition-transform"
                                                    style={{ backgroundColor: s === DealStage.WON ? '#10b981' : s === DealStage.LOST ? '#ef4444' : '#cbd5e1'}}
                                                    title={`Mover a ${s}`}
                                                ></button>
                                            )
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                         {getDealsByStage(stage).length === 0 && (
                            <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                                Vacío
                            </div>
                         )}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Analysis Result Modal */}
      {analysisResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                 <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                    <div className="flex items-center gap-2 text-indigo-700">
                        <BrainCircuit size={20} />
                        <h3 className="font-bold">Análisis de Oportunidad</h3>
                    </div>
                    <button onClick={closeAnalysis} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                    {analysisResult.text}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
                    <button onClick={closeAnalysis} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Deals;
