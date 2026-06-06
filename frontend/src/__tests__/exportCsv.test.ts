import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportShortlistCsv } from '../utils/exportCsv';
import { CandidateRanking } from '../types';

const mockCandidates: CandidateRanking[] = [
  { name: 'Ana Garcia', email: 'ana@example.com', score: 8.5, recommendation: 'AVANZAR', evidence: [], strengths: [], gaps: [], red_flags: [], experience_years: 5, skills: ['React', 'TypeScript'], status: 'Shortlisted' },
  { name: 'Bob Smith', score: 5.0, recommendation: 'RECHAZAR', evidence: [], strengths: [], gaps: [], red_flags: [] },
];

describe('exportShortlistCsv', () => {
  let clickMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clickMock = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({ href: '', download: '', click: clickMock } as unknown as HTMLAnchorElement);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
    localStorage.clear();
  });

  it('does not throw with valid candidates', () => {
    expect(() => exportShortlistCsv(mockCandidates, 'Senior Developer')).not.toThrow();
  });

  it('triggers a click to download', () => {
    exportShortlistCsv(mockCandidates, 'Dev');
    expect(clickMock).toHaveBeenCalledOnce();
  });

  it('does not throw with empty array', () => {
    expect(() => exportShortlistCsv([], 'Dev')).not.toThrow();
  });

  it('calls URL.revokeObjectURL to clean up', () => {
    exportShortlistCsv(mockCandidates, 'Dev');
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
