import { useState } from 'react';
import { ScoreBreakdown } from '../../types';

interface Props {
  score: number;
  breakdown?: ScoreBreakdown;
}

export function ScoreBadge({ score, breakdown }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const pct = Math.round(score * 10);

  const colorClass =
    pct >= 80 ? 'bg-green-100 text-green-800 border-green-300' :
    pct >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                'bg-red-100 text-red-800 border-red-300';

  return (
    <div className="relative inline-block">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border cursor-default ${colorClass}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {pct}%
      </span>
      {showTooltip && breakdown && (
        <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-lg bg-gray-900 text-white text-xs p-3 shadow-lg">
          <p className="font-semibold mb-1.5">Desglose del score</p>
          <div className="space-y-1">
            <div className="flex justify-between"><span>Skills match</span><span>{Math.round(breakdown.skills_match * 10)}%</span></div>
            <div className="flex justify-between"><span>Experiencia</span><span>{Math.round(breakdown.experience * 10)}%</span></div>
            <div className="flex justify-between"><span>Formacion</span><span>{Math.round(breakdown.education * 10)}%</span></div>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
