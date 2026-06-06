import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Download, FileText, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, PlusCircle } from 'lucide-react';
import { CandidateRanking, CandidateStatus } from '../../types';
import { useCandidateFilters, SortColumn } from '../../hooks/useCandidateFilters';
import { ScoreBadge } from './ScoreBadge';
import { NotesDrawer } from './NotesDrawer';
import { FilterBar } from './FilterBar';
import { exportShortlistCsv } from '../../utils/exportCsv';

interface Props {
  candidates: CandidateRanking[];
  position: string;
  onNewEvaluation: () => void;
}

const STATUS_PILL: Record<CandidateStatus, string> = {
  'Pendiente': 'bg-gray-100 text-gray-600',
  'En proceso': 'bg-blue-100 text-blue-700',
  'Descartado': 'bg-red-100 text-red-700',
  'Shortlisted': 'bg-green-100 text-green-700',
};

export function CandidateDashboard({ candidates: initialCandidates, position, onNewEvaluation }: Props) {
  const [candidates, setCandidates] = useState<CandidateRanking[]>(() =>
    initialCandidates.map(c => ({
      ...c,
      status: (localStorage.getItem('tb_status_' + c.name) as CandidateStatus) ?? c.status ?? 'Pendiente',
    }))
  );
  const [activeCandidate, setActiveCandidate] = useState<CandidateRanking | null>(null);

  const {
    filters, updateFilters, clearFilters,
    sortCol, sortDir, toggleSort,
    allSkills,
    filtered,
    paginated,
    page, setPage, totalPages,
    resultCount,
  } = useCandidateFilters(candidates);

  const handleStatusChange = useCallback((name: string, status: CandidateStatus) => {
    setCandidates(prev => prev.map(c => c.name === name ? { ...c, status } : c));
    setActiveCandidate(prev => prev?.name === name ? { ...prev, status } : prev);
  }, []);

  function SortIcon({ col }: { col: SortColumn }) {
    if (sortCol !== col) return <ArrowUpDown size={14} className="opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileText size={48} className="text-gray-300 mb-4" />
        <p className="text-lg font-medium text-gray-500 mb-2">Sin candidatos evaluados</p>
        <p className="text-sm text-gray-400 mb-6">Inicia una evaluación para ver el dashboard.</p>
        <button
          onClick={onNewEvaluation}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          <PlusCircle size={16} />
          Nueva evaluación
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dashboard de Candidatos</h2>
          <p className="text-sm text-gray-500">{position}</p>
        </div>
        <button
          onClick={() => exportShortlistCsv(filtered, position)}
          disabled={resultCount === 0}
          title={resultCount === 0 ? 'No hay candidatos para exportar' : undefined}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={15} />
          Exportar shortlist
        </button>
      </div>

      <FilterBar
        filters={filters}
        allSkills={allSkills}
        resultCount={resultCount}
        onUpdate={updateFilters}
        onClear={clearFilters}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {([
                ['name', 'Nombre'],
                ['score', 'Score'],
                ['experience_years', 'Experiencia'],
                [null, 'Skills'],
                ['status', 'Estado'],
                [null, 'Notas'],
              ] as [SortColumn | null, string][]).map(([col, label]) => (
                <th
                  key={label}
                  onClick={col ? () => toggleSort(col) : undefined}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide ${col ? 'cursor-pointer hover:text-gray-700 select-none' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    {col && <SortIcon col={col} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  Ningún candidato cumple los filtros actuales.
                </td>
              </tr>
            ) : (
              paginated.map(c => {
                const hasNote = !!localStorage.getItem('tb_notes_' + c.name);
                const status = c.status ?? 'Pendiente';
                return (
                  <motion.tr
                    key={c.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div>{c.name}</div>
                      {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={c.score} breakdown={c.score_breakdown} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.experience_years != null ? `${c.experience_years} año${c.experience_years !== 1 ? 's' : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.skills?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {c.skills.slice(0, 3).map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded">
                              {s}
                            </span>
                          ))}
                          {c.skills.length > 3 && (
                            <span className="text-xs text-gray-400">+{c.skills.length - 3}</span>
                          )}
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_PILL[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setActiveCandidate(c)}
                        className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Ver/editar notas"
                      >
                        <FileText size={16} className="text-gray-400" />
                        {hasNote && (
                          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </button>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <NotesDrawer
        candidate={activeCandidate}
        onClose={() => setActiveCandidate(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
