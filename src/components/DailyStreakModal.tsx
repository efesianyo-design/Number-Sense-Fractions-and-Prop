import React from 'react';
import { StreakData, getTodayDateString } from '../utils/streak';
import { Flame, Trophy, Calendar, Sparkles, Award, CheckCircle2 } from 'lucide-react';
import { fireSuperConfetti } from '../utils/confetti';
import { playSound } from '../utils/audio';

interface DailyStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakData: StreakData;
  studentName?: string;
}

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({
  isOpen,
  onClose,
  streakData,
  studentName,
}) => {
  if (!isOpen) return null;

  // Generate last 7 days calendar view
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const isToday = dateStr === getTodayDateString();
    const hasPracticed = streakData.historyDates.includes(dateStr);

    return { dateStr, dayName, isToday, hasPracticed };
  });

  const milestones = [
    { days: 3, label: '3-Day Spark', bonus: '+50 XP', icon: '🔥' },
    { days: 7, label: '7-Day Master', bonus: '+150 XP', icon: '⚡' },
    { days: 14, label: '2-Week Legend', bonus: '+350 XP', icon: '🌟' },
    { days: 30, label: '1-Month Math Champion', bonus: '+1000 XP', icon: '👑' },
  ];

  return (
    <div
      id="daily-streak-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        id="daily-streak-card"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-800 relative overflow-hidden"
      >
        {/* Header Ribbon */}
        <button
          id="close-streak-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl bg-slate-100 transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500 shadow-sm animate-bounce">
            <Flame className="w-8 h-8 fill-orange-500" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-500" /> Daily Math Practice
            </div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              {streakData.currentStreak} Day Streak!
            </h2>
          </div>
        </div>

        {/* Motivational Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-xs font-medium text-slate-700 flex items-center justify-between">
          <div>
            <p className="font-bold text-orange-800 text-sm">Keep the momentum going!</p>
            <p className="text-slate-600 mt-0.5">
              Practice every day to unlock Ghanaian SHS mastery badges and multiplier bonuses.
            </p>
          </div>
          <button
            onClick={() => {
              fireSuperConfetti();
              playSound('success');
            }}
            className="shrink-0 ml-3 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-colors"
          >
            Celebrate 🎉
          </button>
        </div>

        {/* 7-Day Activity Week Tracker */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" /> Past 7 Days Activity
          </h4>
          <div className="grid grid-cols-7 gap-2">
            {last7Days.map((d) => (
              <div
                key={d.dateStr}
                className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                  d.hasPracticed
                    ? 'bg-orange-50 border-orange-300 text-orange-800 shadow-xs'
                    : d.isToday
                    ? 'bg-slate-50 border-blue-400 text-slate-700'
                    : 'bg-slate-50/60 border-slate-200 text-slate-400'
                }`}
              >
                <span className="text-[10px] font-bold uppercase">{d.dayName}</span>
                <div className="my-1.5 flex items-center justify-center">
                  {d.hasPracticed ? (
                    <Flame className="w-5 h-5 fill-orange-500 text-orange-500 animate-pulse" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
                  )}
                </div>
                <span className="text-[9px] font-bold">
                  {d.isToday ? 'Today' : d.hasPracticed ? 'Done' : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone Badges */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" /> Streak Milestones
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            {milestones.map((m) => {
              const achieved = streakData.currentStreak >= m.days;
              return (
                <div
                  key={m.days}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    achieved
                      ? 'bg-amber-50 border-amber-300 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                  }`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs truncate flex items-center gap-1">
                      {m.label}
                      {achieved && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                    </div>
                    <div className="text-[11px] text-amber-700 font-bold">{m.bonus}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Summary Bento */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Best Record</div>
            <div className="text-xl font-black text-orange-600 mt-0.5">{streakData.bestStreak} Days</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Total Days Practiced</div>
            <div className="text-xl font-black text-blue-600 mt-0.5">{streakData.totalPracticeDays} Days</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
        >
          <Award className="w-4 h-4" />
          Continue Practicing
        </button>
      </div>
    </div>
  );
};
