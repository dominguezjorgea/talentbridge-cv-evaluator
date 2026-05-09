import { Criterion, CandidateRanking } from '../types';

const API_BASE = '/api';

async function apiFetch<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Error de servidor' }));
    throw new Error((err as { error?: string }).error || 'Error de servidor');
  }
  return response.json() as Promise<T>;
}

export async function extractCriteria(jd: string): Promise<Criterion[]> {
  return apiFetch<Criterion[]>('/extract-criteria', { jobDescription: jd });
}

export async function evaluateCandidate(
  cv: string,
  criteria: Criterion[],
  jd: string
): Promise<CandidateRanking> {
  const results = await apiFetch<CandidateRanking[]>('/evaluate-candidates', {
    jobDescription: jd,
    criteria,
    cvs: [{ filename: 'cv.txt', content: cv }],
  });
  return results[0];
}

export async function generateExecutiveSummary(
  rankings: CandidateRanking[],
  criteria: Criterion[]
): Promise<{ top_3: string[]; consider: string[]; key_differentiator: string }> {
  return apiFetch('/generate-summary', { rankings, criteria });
}
