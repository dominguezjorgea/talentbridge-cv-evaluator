import { X, SlidersHorizontal } from 'lucide-react';
import { CandidateStatus } from '../../types';
import { FilterState } from '../../hooks/useCandidateFilters';

interface Props {
  filters: FilterState;
  allSkills: string[];
  resultCount: number;
  onUpdate: (partial: Partial<FilterState>) => void;
  onClear: () => void;
}

const STATUSES: CandidateStatus[] = ['Pendiente', 'En proceso', 'Descartado', 'Shortlisted'];

function hasActiveFilters(f: FilterState): boolean {
  return f.minScore > 0 || f.minExperience > 0 || f.selectedSkills.length > 0 || f.selectedStatuses.length > 0;
}

export function FilterBar({ filters, allSkills, resultCount, onUpdate, onClear }: Props) {
  function toggleSkill(skill: string) {
    const next = filters.selectedSkills.includes(skill)
      ? filters.selectedSkills.filter(s => s !== skill)
      : [...filters.selectedSkills, skill];
    onUpdate({ selectedSkills: next });
  }

  function toggleStatus(status: CandidateStatus) {
    const next = filters.selectedStatuses.includes(status)
      ? filters.selectedStatuses.filter(s => s !== status)
      : [...filters.selectedStatuses, status];
    onUpdate({ selectedStatuses: next });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <SlidersHorizontal size={16} />
          <span>Filtros</span>
          <span className="text-gray-400">({resultCount} resultado{resultCount !== 1 ? 's' : ''})</span>
        </div>
        {hasActiveFilters(filters) && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <X size={12} />
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">
            Score mínimo: <span className="text-gray-800">{filters.minScore}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.minScore}
            onChange={e => onUpdate({ minScore: Number(e.target.value) })}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>0%</span><span>100%</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">
            Experiencia mínima: <span className="text-gray-800">{filters.minExperience} año{filters.minExperience !== 1 ? 's' : ''}</span>
          </label>
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={filters.minExperience}
            onChange={e => onUpdate({ minExperience: Number(e.target.value) })}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>0</span><span>20 años</span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Estado</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                filters.selectedStatuses.includes(s)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {allSkills.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
            {allSkills.map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-2.5 py-0.5 text-xs rounded-full border transition-colors ${
                  filters.selectedSkills.includes(skill)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
