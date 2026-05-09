export interface Criterion {
  name: string;
  weight: number;
  observable_signs: string;
  degradation_signs: string;
}

export interface CandidateRanking {
  rank?: number;
  name: string;
  score: number;
  recommendation: 'AVANZAR'|'CONSIDERAR'|'RECHAZAR';
  evidence: string[];
  strengths: string[];
  gaps: string[];
  red_flags: string[];
}

export interface ExecutiveSummary {
  top_3: string[];
  consider: string[];
  key_differentiator: string;
  total_evaluated: number;
}

export interface EvaluationResult {
  job_description: string;
  profile_analysis: {
    criteria: Criterion[];
  };
  candidate_rankings: CandidateRanking[];
  executive_summary: ExecutiveSummary;
}

export type AppStep = 'JD' | 'CRITERIA' | 'CVS' | 'RESULTS';
