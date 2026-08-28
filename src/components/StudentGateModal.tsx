import React, { useState } from 'react';
import { StudentProfile, FormLevel } from '../types';
import { User, GraduationCap, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import { playSound } from '../utils/audio';

interface StudentGateModalProps {
  isOpen: boolean;
  onSaveProfile: (profile: StudentProfile) => void;
  currentProfile: StudentProfile | null;
  onClose?: () => void;
  isDismissable?: boolean;
}

const AVATARS = ['🌟', '🦉', '🚀', '📐', '🧠', '🔬', '💡', '⚡'];

export const StudentGateModal: React.FC<StudentGateModalProps> = ({
  isOpen,
  onSaveProfile,
  currentProfile,
  onClose,
  isDismissable = false,
}) => {
  const [name, setName] = useState(currentProfile?.name || '');
  const [classOrHouse, setClassOrHouse] = useState(currentProfile?.classOrHouse || '');
  const [level, setLevel] = useState<FormLevel>(currentProfile?.level || 'Form 1');
  const [avatarSeed, setAvatarSeed] = useState(currentProfile?.avatarSeed || AVATARS[0]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full student name.');
      return;
    }
    if (!classOrHouse.trim()) {
      setError('Please enter your class, house, or student ID.');
      return;
    }

    const profile: StudentProfile = {
      id: currentProfile?.id || `stu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      classOrHouse: classOrHouse.trim(),
      level,
      avatarSeed,
      createdAt: currentProfile?.createdAt || new Date().toISOString(),
    };

    playSound('success');
    onSaveProfile(profile);
    if (onClose) onClose();
  };

  return (
    <div id="student-gate-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div id="student-gate-modal-card" className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-800 relative">
        {isDismissable && onClose && (
          <button
            id="close-student-gate-btn"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}

        <div className="flex items-center space-x-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl shadow-sm">
            {avatarSeed}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Sir Eugene Technologies
            </div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              Student Studio Gate
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Welcome to the high-performance Number Sense, Fractions & Proportions Studio. Enter your student credentials to log progress, track equivalences, and access Ghanaian SHS challenges.
        </p>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" /> Full Name
            </label>
            <input
              id="student-name-input"
              type="text"
              required
              placeholder="e.g. Kwame Mensah / Ama Osei"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 text-sm font-semibold focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" /> Level
              </label>
              <select
                id="student-level-select"
                value={level}
                onChange={(e) => setLevel(e.target.value as FormLevel)}
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-xl px-3 py-2.5 text-slate-800 text-sm font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Form 1">Form 1 (Year 1 SHS)</option>
                <option value="Form 2">Form 2 (Year 2 SHS)</option>
                <option value="Form 3">Form 3 (Year 3 SHS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" /> Class / House / ID
              </label>
              <input
                id="student-class-input"
                type="text"
                required
                placeholder="e.g. Form 1 Science B / Aggrey House"
                value={classOrHouse}
                onChange={(e) => { setClassOrHouse(e.target.value); setError(''); }}
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 text-sm font-semibold focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Choose Avatar Badge
            </label>
            <div className="flex gap-2 justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
              {AVATARS.map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => { setAvatarSeed(av); playSound('click'); }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-transform cursor-pointer ${
                    avatarSeed === av
                      ? 'bg-blue-100 border-2 border-blue-600 scale-110 shadow-xs'
                      : 'hover:bg-slate-200'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <button
            id="enter-studio-submit-btn"
            type="submit"
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            Launch Math Studio Workspace
          </button>
        </form>
      </div>
    </div>
  );
};
