export interface Criterion {
  name: string;
  weight: number;
  observable_signs: string;
  degradation_signs: string;
}

export type CandidateStatus = 'Pendiente' | 'En proceso' | 'Descartado' | 'Shortlisted';

export interface ScoreBreakdown {
  skills_match: number;
  experience: number;
  education: number;
}

export interface CandidateRanking {
  rank?: number;
  name: string;
  email?: string;
  score: number;
  recommendation: 'AVANZAR' | 'CONSIDERAR' | 'RECHAZAR';
  evidence: string[];
  strengths: string[];
  gaps: string[];
  red_flags: string[];
  experience_years?: number;
  skills?: string[];
  score_breakdown?: ScoreBreakdown;
  evaluated_at?: string;
  status?: CandidateStatus;
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

export type AppStep = 'JD' | 'CRITERIA' | 'CVS' | 'RESULTS' | 'DASHBOARD';
