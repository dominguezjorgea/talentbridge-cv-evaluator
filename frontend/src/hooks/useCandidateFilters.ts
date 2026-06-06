import { useState, useMemo } from 'react';
import { CandidateRanking, CandidateStatus } from '../types';

export interface FilterState {
  minScore: number;
  minExperience: number;
  selectedSkills: string[];
  selectedStatuses: CandidateStatus[];
}

export type SortColumn = 'name' | 'score' | 'experience_years' | 'status';
export type SortDir = 'asc' | 'desc';

const DEFAULT_FILTERS: FilterState = {
  minScore: 0,
  minExperience: 0,
  selectedSkills: [],
  selectedStatuses: [],
};

export function useCandidateFilters(candidates: CandidateRanking[]) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortCol, setSortCol] = useState<SortColumn>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach(c => c.skills?.forEach(s => set.add(s)));
    return Array.from(set).sort();
  }, [candidates]);

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      const pct = c.score * 10;
      if (pct < filters.minScore) return false;
      if (filters.minExperience > 0 && (c.experience_years ?? 0) < filters.minExperience) return false;
      if (filters.selectedSkills.length > 0) {
        const has = filters.selectedSkills.every(s => c.skills?.includes(s));
        if (!has) return false;
      }
      if (filters.selectedStatuses.length > 0) {
        const status = c.status ?? 'Pendiente';
        if (!filters.selectedStatuses.includes(status)) return false;
      }
      return true;
    });
  }, [candidates, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: string | number = 0;
      let vb: string | number = 0;
      if (sortCol === 'name') { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      else if (sortCol === 'score') { va = a.score; vb = b.score; }
      else if (sortCol === 'experience_years') { va = a.experience_years ?? 0; vb = b.experience_years ?? 0; }
      else if (sortCol === 'status') { va = a.status ?? 'Pendiente'; vb = b.status ?? 'Pendiente'; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(col: SortColumn) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(1);
  }

  function updateFilters(partial: Partial<FilterState>) {
    setFilters(prev => ({ ...prev, ...partial }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  return {
    filters, updateFilters, clearFilters,
    sortCol, sortDir, toggleSort,
    allSkills,
    filtered: sorted,
    paginated,
    page, setPage, totalPages,
    resultCount: sorted.length,
  };
}
