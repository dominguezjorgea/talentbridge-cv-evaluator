import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save } from 'lucide-react';
import { CandidateRanking, CandidateStatus } from '../../types';

interface Props {
  candidate: CandidateRanking | null;
  onClose: () => void;
  onStatusChange: (name: string, status: CandidateStatus) => void;
}

const STATUSES: CandidateStatus[] = ['Pendiente', 'En proceso', 'Descartado', 'Shortlisted'];

const STATUS_COLORS: Record<CandidateStatus, string> = {
  'Pendiente': 'bg-gray-100 text-gray-700',
  'En proceso': 'bg-blue-100 text-blue-700',
  'Descartado': 'bg-red-100 text-red-700',
  'Shortlisted': 'bg-green-100 text-green-700',
};

export function NotesDrawer({ candidate, onClose, onStatusChange }: Props) {
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!candidate) return;
    setNote(localStorage.getItem('tb_notes_' + candidate.name) ?? '');
    setSaved(false);
  }, [candidate]);

  function handleSave() {
    if (!candidate) return;
    localStorage.setItem('tb_notes_' + candidate.name, note);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleStatusChange(status: CandidateStatus) {
    if (!candidate) return;
    localStorage.setItem('tb_status_' + candidate.name, status);
    onStatusChange(candidate.name, status);
  }

  return (
    <AnimatePresence>
      {candidate && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="font-semibold text-gray-900">{candidate.name}</h2>
                <p className="text-sm text-gray-500">{candidate.email ?? 'Sin email'}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 border-b">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Estado</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      (candidate.status ?? 'Pendiente') === s
                        ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-current'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 px-6 py-4 flex flex-col gap-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notas internas</p>
              <textarea
                className="flex-1 resize-none rounded-lg border border-gray-200 p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Agrega notas sobre este candidato..."
                maxLength={500}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{note.length}/500</span>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Save size={14} />
                  {saved ? 'Guardado' : 'Guardar'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
