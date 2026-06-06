import { CandidateRanking } from '../types';

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDate(date: Date): string {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

export function exportShortlistCsv(candidates: CandidateRanking[], position: string): void {
  if (candidates.length === 0) return;

  const dateStr = formatDate(new Date());
  const slug = slugify(position);
  const filename = `shortlist-${slug}-${dateStr}.csv`;

  const headers = [
    'Nombre',
    'Email',
    'Score (%)',
    'Posicion',
    'Experiencia (anos)',
    'Skills',
    'Estado',
    'Notas',
  ];

  const rows: string[] = [headers.map(escapeCsvValue).join(',')];

  for (const c of candidates) {
    const notes = localStorage.getItem(`tb_notes_${c.name}`) ?? '';
    const row = [
      escapeCsvValue(c.name),
      escapeCsvValue(c.email ?? ''),
      escapeCsvValue(Math.round(c.score * 10).toString()),
      escapeCsvValue(position),
      escapeCsvValue((c.experience_years ?? 0).toString()),
      escapeCsvValue((c.skills ?? []).join('; ')),
      escapeCsvValue(c.status ?? 'Pendiente'),
      escapeCsvValue(notes),
    ];
    rows.push(row.join(','));
  }

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
