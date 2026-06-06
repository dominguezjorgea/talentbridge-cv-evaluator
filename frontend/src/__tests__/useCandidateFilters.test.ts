import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCandidateFilters } from '../hooks/useCandidateFilters';
import { CandidateRanking } from '../types';

const candidates: CandidateRanking[] = [
  { name: 'Ana', score: 9, recommendation: 'AVANZAR', evidence: [], strengths: [], gaps: [], red_flags: [], experience_years: 6, skills: ['React', 'TS'], status: 'Shortlisted' },
  { name: 'Bob', score: 6.5, recommendation: 'CONSIDERAR', evidence: [], strengths: [], gaps: [], red_flags: [], experience_years: 2, skills: ['Python'], status: 'Pendiente' },
  { name: 'Carlos', score: 4, recommendation: 'RECHAZAR', evidence: [], strengths: [], gaps: [], red_flags: [], experience_years: 1, skills: ['Java'], status: 'Descartado' },
];

describe('useCandidateFilters', () => {
  it('returns all candidates with no filters', () => {
    const { result } = renderHook(() => useCandidateFilters(candidates));
    expect(result.current.resultCount).toBe(3);
  });

  it('filters by minScore', () => {
    const { result } = renderHook(() => useCandidateFilters(candidates));
    act(() => result.current.updateFilters({ minScore: 70 }));
    expect(result.current.resultCount).toBe(1);
  });

  it('filters by minExperience', () => {
    const { result } = renderHook(() => useCandidateFilters(candidates));
    act(() => result.current.updateFilters({ minExperience: 5 }));
    expect(result.current.resultCount).toBe(1);
  });

  it('filters by status', () => {
    const { result } = renderHook(() => useCandidateFilters(candidates));
    act(() => result.current.updateFilters({ selectedStatuses: ['Pendiente'] }));
    expect(result.current.resultCount).toBe(1);
  });

  it('filters by skills', () => {
    const { result } = renderHook(() => useCandidateFilters(candidates));
    act(() => result.current.updateFilters({ selectedSkills: ['React'] }));
    expect(result.current.resultCount).toBe(1);
  });

  it('clearFilters resets to all candidates', () => {
    const { result } = renderHook(() => useCandidateFilters(candidates));
    act(() => result.current.updateFilters({ minScore: 80 }));
    act(() => result.current.clearFilters());
    expect(result.current.resultCount).toBe(3);
  });

  it('toggleSort switches direction on same column', () => {
    const { result } = renderHook(() => useCandidateFilters(candidates));
    expect(result.current.sortDir).toBe('desc');
    act(() => result.current.toggleSort('score'));
    expect(result.current.sortDir).toBe('asc');
  });

  it('allSkills collects unique skills from all candidates', () => {
    const { result } = renderHook(() => useCandidateFilters(candidates));
    expect(result.current.allSkills).toContain('React');
    expect(result.current.allSkills).toContain('Python');
    expect(result.current.allSkills).toContain('Java');
  });
});
