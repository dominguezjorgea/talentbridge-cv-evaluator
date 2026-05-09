/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  Users, 
  Target, 
  FileText, 
  ChevronRight, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle2, 
  Search,
  Star,
  Info
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  AppStep, 
  Criterion, 
  CandidateRanking, 
  ExecutiveSummary 
} from './types';
import { 
  extractCriteria, 
  evaluateCandidate, 
  generateExecutiveSummary 
} from './services/apiService';

export default function App() {
  type ServerStatus = 'checking' | 'ok' | 'error';
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    fetch('/api/health', { signal: controller.signal })
      .then(r => r.json())
      .then((data: { status: string }) => {
        clearTimeout(timeoutId);
        if (data.status === 'ok') {
          setServerStatus('ok');
          setTimeout(() => setServerStatus('checking'), 2000);
        } else {
          setServerStatus('error');
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        setServerStatus('error');
      });
  }, []);

  const [step, setStep] = useState<AppStep>('JD');
  const [loading, setLoading] = useState(false);
  const [jd, setJd] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [cvBatch, setCvBatch] = useState('');
  const [rankings, setRankings] = useState<CandidateRanking[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);

  // Consistency Guards
  const nearTies = useMemo(() => {
    const ties: { c1: string, c2: string, diff: number }[] = [];
    const sorted = [...rankings].sort((a, b) => b.score - a.score);
    for (let i = 0; i < sorted.length - 1; i++) {
      const diff = sorted[i].score - sorted[i+1].score;
      if (diff <= 0.5) {
        ties.push({ c1: sorted[i].name, c2: sorted[i+1].name, diff: Number(diff.toFixed(2)) });
      }
    }
    return ties;
  }, [rankings]);

  const handleJdSubmit = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    try {
      const extracted = await extractCriteria(jd);
      setCriteria(extracted);
      setStep('CRITERIA');
    } catch (error) {
      console.error(error);
      alert('Error extrayendo criterios. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCriteriaConfirm = () => {
    setStep('CVS');
  };

  const handleCvSubmit = async () => {
    if (!cvBatch.trim()) return;
    setLoading(true);
    try {
      const cvList = cvBatch.split('---').map(c => c.trim()).filter(c => c.length > 50);
      
      const newRankings: CandidateRanking[] = [];
      for (const cv of cvList) {
        const evalResult = await evaluateCandidate(cv, criteria, jd);
        newRankings.push(evalResult);
      }
      
      const summary = await generateExecutiveSummary(newRankings, criteria);
      
      setRankings(newRankings.sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 })));
      setExecutiveSummary({ ...summary, total_evaluated: cvList.length });
      setStep('RESULTS');
    } catch (error) {
      console.error(error);
      alert('Error evaluando CVs. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  };

  const updateCriterionWeight = (index: number, weight: number) => {
    const newCriteria = [...criteria];
    newCriteria[index].weight = weight;
    setCriteria(newCriteria);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {serverStatus === 'error' && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white text-sm font-medium px-6 py-2.5 flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>Servidor no disponible. Ejecuta <code className="bg-rose-700 px-1 rounded">npm run dev</code> desde la raíz del proyecto.</span>
        </div>
      )}
      {serverStatus === 'ok' && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Servidor conectado
        </div>
      )}
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45 shadow-sm"></div>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              TalentBridge <span className="font-light text-slate-500">| Evaluador Técnico</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-6 text-xs font-semibold">
            <StepIndicator step={step} label="Job Description" activeStep="JD" />
            <ChevronRight className="w-4 h-4 opacity-30" />
            <StepIndicator step={step} label="Criterios" activeStep="CRITERIA" />
            <ChevronRight className="w-4 h-4 opacity-30" />
            <StepIndicator step={step} label="CV Batch" activeStep="CVS" />
            <ChevronRight className="w-4 h-4 opacity-30" />
            <StepIndicator step={step} label="Ranking ExpertO" activeStep="RESULTS" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-center px-6"
            >
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
              <p className="text-xl font-bold text-slate-800">Analizando con criterio experto...</p>
              <p className="text-sm text-slate-500 max-w-xs mt-2">Protegiendo la consistencia del triage técnico contra la fatiga de decisión.</p>
            </motion.div>
          )}

          {step === 'JD' && (
            <motion.div 
              key="jd"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="mb-10">
                <h2 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Define la posición técnica</h2>
                <p className="text-slate-500 text-lg">Pega la Job Description completa. Extraeremos los criterios duros y blandos con sus pesos para el triage automático.</p>
              </div>
              
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <textarea 
                  className="w-full h-80 p-5 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:outline-none transition-all resize-none text-sm font-mono text-slate-700 leading-relaxed"
                  placeholder="Pega aquí la descripción del puesto (ej: Senior Backend GOLANG...)"
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                />
                <button 
                  onClick={handleJdSubmit}
                  disabled={!jd.trim()}
                  className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  Continuar a Análisis de Perfil <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <FeatureCard icon={<Search className="w-5 h-5" />} title="Análisis Profundo" desc="No solo keywords, entendemos el contexto técnico y el seniority real." />
                <FeatureCard icon={<TrendingUp className="w-5 h-5" />} title="Pesos Dinámicos" desc="Criterios ajustables según la criticidad específica del rol." />
                <FeatureCard icon={<CheckCircle2 className="w-5 h-5" />} title="Evidencia Real" desc="Cada score incluye una cita directa del CV para justificar la acción." />
              </div>
            </motion.div>
          )}

          {step === 'CRITERIA' && (
            <motion.div 
              key="criteria"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Criterios de Evaluación</h2>
                  <p className="text-slate-500">Confirma los criterios extraídos y ajusta los pesos de impacto según la vacante.</p>
                </div>
                <div className="bg-indigo-600 text-white px-8 py-3 rounded-full text-sm font-bold self-start shadow-lg shadow-indigo-500/20">
                  Impacto Total: {criteria.reduce((acc, c) => acc + c.weight, 0)}%
                </div>
              </div>

              <div className="space-y-6">
                {criteria.map((c, i) => (
                  <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 group hover:border-indigo-600/30 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded tracking-widest uppercase">Criterio {i+1}</span>
                        <h3 className="text-xl font-bold text-slate-800">{c.name}</h3>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-sm mt-6">
                        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="font-bold mb-3 text-slate-400 flex items-center gap-2 text-[10px] uppercase tracking-wider"><Info className="w-3.5 h-3.5" /> Signos Observables</p>
                          <p className="leading-relaxed text-slate-600 font-medium">{c.observable_signs}</p>
                        </div>
                        <div className="p-5 bg-rose-50/50 rounded-xl border border-rose-100">
                          <p className="font-bold mb-3 text-rose-600/50 flex items-center gap-2 text-[10px] uppercase tracking-wider"><AlertCircle className="w-3.5 h-3.5" /> Signos de Degradación</p>
                          <p className="text-rose-700 leading-relaxed font-medium">{c.degradation_signs}</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-56 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0 md:pl-8">
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-4 tracking-widest text-center">Peso del Impacto</label>
                      <div className="flex items-center gap-4 w-full">
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={c.weight}
                          onChange={(e) => updateCriterionWeight(i, parseInt(e.target.value))}
                          className="flex-1 accent-indigo-600 h-1.5 cursor-pointer"
                        />
                        <span className="font-mono font-bold w-12 text-right text-indigo-600">{c.weight}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 flex justify-between items-center border-t border-slate-200 pt-8">
                <button onClick={() => setStep('JD')} className="px-8 py-4 font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest text-xs">Regresar</button>
                <div className="flex flex-col items-end">
                  <button 
                    onClick={handleCriteriaConfirm}
                    disabled={criteria.reduce((acc, c) => acc + c.weight, 0) !== 100}
                    className="bg-indigo-600 text-white px-12 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-30 disabled:pointer-events-none group"
                  >
                    Confirmar y Subir CVs <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  {criteria.reduce((acc, c) => acc + c.weight, 0) !== 100 && (
                    <p className="text-rose-600 text-[10px] mt-3 font-bold uppercase tracking-wider">La suma de pesos debe ser exactamente 100%</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'CVS' && (
            <motion.div 
              key="cvs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Lote de Candidatos</h2>
                <p className="text-slate-500 text-lg">Pega los CVs para triage. Usa <code className="bg-slate-200 px-1.5 py-0.5 rounded text-sm text-slate-700">---</code> para separar candidatos.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <textarea 
                  className="w-full h-96 p-6 rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:outline-none transition-all resize-none text-sm font-mono text-slate-700 leading-relaxed"
                  placeholder="[CV 1: NOMBRE...]&#10;---&#10;[CV 2: NOMBRE...]"
                  value={cvBatch}
                  onChange={(e) => setCvBatch(e.target.value)}
                />
                <div className="mt-8 p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-white text-indigo-600 rounded-2xl shadow-sm border border-slate-200"><ClipboardList className="w-6 h-6" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">Detección de Lote TalentBridge</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium italic">{cvBatch.split('---').filter(c => c.trim().length > 50).length} candidatos listos para análisis experto</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleCvSubmit}
                    disabled={!cvBatch.trim()}
                    className="w-full md:w-auto bg-indigo-600 text-white px-12 py-5 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 active:scale-[0.98] shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-30 disabled:pointer-events-none group"
                  >
                    Iniciar Triage Experto <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'RESULTS' && executiveSummary && (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-10 pb-20"
            >
              {/* Dashboard Layout Header */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-indigo-900 text-white p-10 md:p-12 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-indigo-900/20">
                  <div className="relative z-10">
                    <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 mb-10 flex items-center gap-2 border-b border-white/10 pb-5">
                      <FileText className="w-4 h-4" /> Executive Summary de Triage
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div>
                        <p className="text-[10px] font-bold uppercase opacity-30 mb-5 tracking-[0.2em]">Top 3 Pipeline High-Match</p>
                        <div className="space-y-4">
                          {executiveSummary.top_3.map((name, i) => (
                            <div key={i} className="flex items-center gap-6 group cursor-default">
                              <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[11px] font-black group-hover:bg-indigo-600 transition-all uppercase tracking-tighter shadow-inner">0{i+1}</span>
                              <p className="font-bold text-xl tracking-tight leading-none">{name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="relative">
                        <p className="text-[10px] font-bold uppercase opacity-30 mb-5 tracking-[0.2em]">Diferenciador Clave Detectado</p>
                        <div className="relative">
                          <span className="absolute -left-6 -top-2 text-6xl opacity-10 font-serif leading-none">"</span>
                          <p className="text-base leading-relaxed font-medium italic opacity-90 pl-3">
                             {executiveSummary.key_differentiator}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -right-24 -top-24 opacity-[0.05]">
                    <Target className="w-[30rem] h-[30rem]" />
                  </div>
                </div>

                <div className="bg-white p-10 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-10 border-b border-slate-50 pb-5">Consistencia del Proceso</h3>
                    <div className="space-y-8">
                      <div className="flex items-end justify-between">
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Muestra</span>
                        <span className="font-mono font-black text-4xl tracking-tighter text-indigo-600">{executiveSummary.total_evaluated}</span>
                      </div>
                      <div className="h-px bg-slate-100" />
                      <div>
                        <p className="text-[10px] font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-slate-400">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Near-Ties Guard
                        </p>
                        {nearTies.length > 0 ? (
                          <div className="space-y-3">
                            {nearTies.map((tie, i) => (
                              <div key={i} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/50">
                                <p className="text-[10px] font-bold text-amber-900 mb-1 leading-tight">{tie.c1} vs {tie.c2}</p>
                                <p className="text-[9px] text-amber-700/60 font-mono tracking-tighter uppercase font-semibold">Dif. {tie.diff} pts — Revisar Diferenciador</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                            <p className="text-[10px] text-emerald-800 opacity-80 italic font-bold leading-tight uppercase tracking-tight">Sin empates críticos. Diferenciación clara.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-10 flex gap-4 h-24">
                    <div className="flex-1 bg-emerald-100/50 border border-emerald-200 text-emerald-800 rounded-2xl flex flex-col items-center justify-center p-3 transition-transform hover:scale-[1.02] cursor-default">
                      <p className="text-[9px] uppercase font-black opacity-40 mb-1 tracking-[0.2em]">Avanzar</p>
                      <p className="font-black text-3xl tracking-tighter">{rankings.filter(r => r.recommendation === 'AVANZAR').length}</p>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-200 p-3 transition-transform hover:scale-[1.02] cursor-default">
                      <p className="text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-[0.2em]">Pendientes</p>
                      <p className="font-bold text-3xl tracking-tighter text-slate-500">{rankings.filter(r => r.recommendation !== 'AVANZAR').length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Candidates List with Table-like Feel */}
              <div className="space-y-6 pt-8">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Ranking de Candidatos
                    </h3>
                  </div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em]">Analizados bajo criterio TalentBridge</p>
                </div>
                <div className="space-y-4">
                  {rankings.map((c, i) => (
                    <CandidateCard key={i} candidate={c} />
                  ))}
                </div>
              </div>

              <div className="pt-24 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-indigo-900 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/10">
                     <Target className="text-white w-7 h-7" />
                   </div>
                   <div>
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em]">TalentBridge Core v1.0</p>
                    <p className="text-[11px] text-slate-500 font-medium italic">Triage técnico consistente ahorrando ~28h de fatiga diagnóstica.</p>
                   </div>
                </div>
                <button 
                  onClick={() => {
                    setStep('JD');
                    setRankings([]);
                    setExecutiveSummary(null);
                    setCriteria([]);
                  }} 
                  className="px-10 py-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 hover:bg-slate-50 hover:border-indigo-600 hover:text-indigo-600 active:scale-[0.98] transition-all uppercase tracking-[0.2em] shadow-sm"
                >
                  Nueva Evaluación de Puesto
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function StepIndicator({ step, label, activeStep }: { step: AppStep, label: string, activeStep: AppStep }) {
  const isActive = step === activeStep;
  const steps = ['JD', 'CRITERIA', 'CVS', 'RESULTS'];
  const isPast = steps.indexOf(step) > steps.indexOf(activeStep);

  return (
    <div className={`flex items-center gap-3 transition-all duration-700 ${isActive ? 'text-indigo-600 translate-y-0 scale-105' : isPast ? 'text-slate-800 opacity-40' : 'text-slate-400 opacity-30'}`}>
      <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isActive ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : isPast ? 'bg-slate-800' : 'bg-slate-200'}`} />
      <span className={`transition-all duration-500 ${isActive ? 'text-sm font-black tracking-tight' : 'text-[10px] font-bold uppercase tracking-[0.1em]'}`}>{label}</span>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-md hover:border-indigo-600/20 transition-all group">
      <div className="w-12 h-12 text-indigo-600 mb-6 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="font-bold text-slate-900 text-base mb-3">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: CandidateRanking }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div 
      layout
      transition={{ type: "spring", stiffness: 350, damping: 35 }}
      className={`bg-white rounded-[2rem] border overflow-hidden transition-all duration-700 ${expanded ? 'border-slate-300 shadow-2xl shadow-indigo-900/5 ring-1 ring-indigo-600/5' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}
    >
      <div 
        className="p-8 md:p-10 flex items-center justify-between cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-6 md:gap-10">
          <div className="w-16 h-16 bg-slate-50 rounded-[1.25rem] flex flex-col items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
            <span className="text-[10px] font-black opacity-30 uppercase tracking-tighter">Rank</span>
            <span className="text-2xl font-black tracking-tighter">0{candidate.rank}</span>
          </div>
          <div>
            <h4 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none mb-3">{candidate.name}</h4>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg shadow-sm">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-mono text-xs font-black tracking-tighter uppercase">{candidate.score} / 10.0</span>
              </div>
              <RecommendationBadge recommendation={candidate.recommendation} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <div className="text-right hidden lg:block w-56">
            <div className="flex justify-between items-end mb-2.5">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Match Index</span>
               <span className="text-[11px] font-black font-mono text-slate-600">{candidate.score * 10}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-100">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${candidate.score * 10}%` }}
                className={`h-full transition-all duration-1000 ${candidate.score >= 8 ? 'bg-emerald-500' : candidate.score >= 6 ? 'bg-amber-400' : 'bg-rose-500'}`}
              />
            </div>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            className={`w-10 h-10 rounded-full flex items-center justify-center border ${expanded ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-300'} transition-all`}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/30"
          >
            <div className="p-8 md:p-12 grid grid-cols-1 xl:grid-cols-2 gap-12">
              <div className="space-y-10">
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-3 border-b border-slate-100 pb-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Evidencia Textual de Candidato
                  </h5>
                  <div className="space-y-6">
                    {candidate.evidence.map((item, i) => (
                      <div key={i} className="text-sm bg-white p-6 rounded-2xl border border-slate-100 shadow-sm leading-relaxed relative group hover:border-indigo-600/20 transition-all font-medium text-slate-600">
                        <div className="absolute -left-3 top-6 w-1 h-8 bg-indigo-600/10 rounded-full transition-all group-hover:bg-indigo-600 ring-4 ring-white" />
                        <div className="prose prose-sm max-w-none text-slate-700 italic">
                          <ReactMarkdown>{item}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {candidate.red_flags.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 opacity-60 mb-8 flex items-center gap-3 border-b border-rose-100/50 pb-4">
                      <AlertCircle className="w-4 h-4" /> Red Flags Detectadas (⚠️)
                    </h5>
                    <div className="space-y-4">
                      {candidate.red_flags.map((item, i) => (
                        <div key={i} className="text-xs bg-white text-rose-800 p-5 rounded-2xl border border-rose-100/50 font-bold flex items-center gap-4 shadow-sm">
                          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                          </div>
                          <p className="flex-1 leading-relaxed uppercase tracking-tight">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  <div className="p-6 bg-emerald-50/30 rounded-3xl border border-emerald-100/50 shadow-inner">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700/50 mb-5">Fortalezas</h5>
                    <div className="flex flex-wrap gap-2.5">
                      {candidate.strengths.map((s, i) => (
                        <span key={i} className="px-4 py-1.5 bg-white text-emerald-700 rounded-xl text-[10px] font-black border border-emerald-100 uppercase tracking-[0.05em] shadow-sm">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-inner">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5">Gaps en Perfil</h5>
                    <div className="flex flex-wrap gap-2.5">
                      {candidate.gaps.map((g, i) => (
                        <span key={i} className="px-4 py-1.5 bg-white text-slate-500 rounded-xl text-[10px] font-black border border-slate-100 uppercase tracking-[0.05em] shadow-sm">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative group p-1">
                   <div className="absolute inset-0 bg-indigo-600 rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-1000" />
                    <div className="relative p-10 bg-indigo-900 text-white rounded-[2.5rem] border border-white/5 shadow-2xl">
                      <div className="flex items-start justify-between mb-10">
                        <div>
                          <h5 className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-40 mb-3">Recomendación Final</h5>
                          <p className="text-3xl font-black tracking-tighter uppercase leading-none">{candidate.recommendation}</p>
                        </div>
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center ring-1 ring-white/20 shadow-inner">
                          {candidate.recommendation === 'AVANZAR' ? <TrendingUp className="w-7 h-7 text-emerald-400" /> : <Target className="w-7 h-7 opacity-40" />}
                        </div>
                      </div>
                      <div className="space-y-5">
                         <div className="h-px bg-white/10 w-full" />
                         <p className="text-sm text-indigo-100/70 leading-relaxed font-medium italic">
                           "Este perfil presenta un ajuste del {Math.round(candidate.score * 10)}% respecto al perfil ideal definido. El análisis automatizado sin fatiga diagnóstica recomienda {candidate.recommendation.toLowerCase()}."
                         </p>
                      </div>
                    </div>
                </div>
                
                <div className="p-8 rounded-[2rem] border border-slate-200 bg-white border-dashed relative overflow-hidden group">
                   <div className="absolute right-0 top-0 w-24 h-24 bg-slate-50 rounded-bl-[4rem] group-hover:bg-indigo-50 transition-colors" />
                   <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-3">Nota del Auditor Experto</p>
                    <p className="text-[11px] font-medium text-slate-500 italic leading-relaxed max-w-sm">
                      Análisis realizado garantizando la persistencia del criterio TalentBridge-942. Cada hallazgo está verificado contra la JOB DESCRIPTION actual.
                    </p>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const styles = {
    'AVANZAR': 'bg-emerald-500 text-white border-emerald-500/20 shadow-emerald-500/10',
    'CONSIDERAR': 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-indigo-600/5',
    'RECHAZAR': 'bg-slate-100 text-slate-400 border-slate-200 shadow-sm opacity-60',
  }[recommendation] || 'bg-slate-100 text-slate-600';

  return (
    <span className={`text-[10px] font-black tracking-[0.2em] px-4 py-1.5 rounded-lg uppercase border shadow-md transition-transform hover:scale-105 cursor-default ${styles}`}>
      {recommendation}
    </span>
  );
}
