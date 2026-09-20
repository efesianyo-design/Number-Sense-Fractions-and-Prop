import React from 'react';
import { StudentProfile } from '../types';
import { MathView } from './MathView';
import { 
  Plus,
  Minus,
  X,
  Divide,
  Layers,
  SlidersHorizontal,
  Ruler, 
  Grid3X3, 
  UtensilsCrossed, 
  ShieldCheck, 
  Bot, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Flame,
  TrendingUp,
  PenTool,
  Scale
} from 'lucide-react';
import { playSound } from '../utils/audio';

export type WorkspaceMode = 
  | 'gapstudio'
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'scanner'
  | 'comparator'
  | 'numberline'
  | 'grid'
  | 'kitchen';

interface HeaderProps {
  activeMode: WorkspaceMode;
  onSelectMode: (mode: WorkspaceMode) => void;
  liveLatex: string;
  student: StudentProfile | null;
  dailyStreak: number;
  onOpenDailyStreak: () => void;
  onOpenPerformanceChart: () => void;
  isWhiteboardOpen: boolean;
  onToggleWhiteboard: () => void;
  onOpenStudentGate: () => void;
  onOpenAdminPortal: () => void;
  onOpenSocraticCoach: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onSelectMode,
  liveLatex,
  student,
  dailyStreak,
  onOpenDailyStreak,
  onOpenPerformanceChart,
  isWhiteboardOpen,
  onToggleWhiteboard,
  onOpenStudentGate,
  onOpenAdminPortal,
  onOpenSocraticCoach,
  isMuted,
  onToggleMute,
}) => {
  const modes: { id: WorkspaceMode; title: string; shortTitle: string; icon: React.ReactNode; badge: string }[] = [
    {
      id: 'gapstudio',
      title: 'Compare & Gap Studio',
      shortTitle: 'Compare & Gap',
      icon: <Scale className="w-3.5 h-3.5" />,
      badge: '4 Routines',
    },
    {
      id: 'addition',
      title: 'Addition',
      shortTitle: 'Addition',
      icon: <Plus className="w-3.5 h-3.5" />,
      badge: 'LCM',
    },
    {
      id: 'subtraction',
      title: 'Subtraction',
      shortTitle: 'Subtraction',
      icon: <Minus className="w-3.5 h-3.5" />,
      badge: 'Gap',
    },
    {
      id: 'multiplication',
      title: 'Multiplication',
      shortTitle: 'Multiplication',
      icon: <X className="w-3.5 h-3.5" />,
      badge: '2D Area',
    },
    {
      id: 'division',
      title: 'Division',
      shortTitle: 'Division',
      icon: <Divide className="w-3.5 h-3.5" />,
      badge: 'Ratio',
    },
    {
      id: 'scanner',
      title: 'Wall Scanner',
      shortTitle: 'Scanner',
      icon: <Layers className="w-3.5 h-3.5" />,
      badge: 'Edge-Lock',
    },
    {
      id: 'comparator',
      title: 'Comparator',
      shortTitle: 'Comparator',
      icon: <SlidersHorizontal className="w-3.5 h-3.5" />,
      badge: 'Snap Strips',
    },
    {
      id: 'numberline',
      title: 'Jump Line',
      shortTitle: 'Jump Line',
      icon: <Ruler className="w-3.5 h-3.5" />,
      badge: 'Vectors',
    },
    {
      id: 'grid',
      title: '100-Grid',
      shortTitle: '100-Grid',
      icon: <Grid3X3 className="w-3.5 h-3.5" />,
      badge: 'GH₵ %',
    },
    {
      id: 'kitchen',
      title: 'Kitchen & SHS',
      shortTitle: 'Kitchen',
      icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
      badge: '1-Min',
    },
  ];

  return (
    <header id="app-header" className="bg-[#2563EB] text-white shadow-md sticky top-0 z-40 px-3 sm:px-6 py-2.5 flex flex-col gap-2 shrink-0">
      
      {/* Top Utility & Identity Bar */}
      <div className="flex items-center justify-between gap-2">
        {/* Brand & Studio Title */}
        <div className="flex items-center space-x-3">
          <div className="bg-white p-1 rounded-lg shadow-sm">
            <div className="w-8 h-8 bg-[#FB923C] rounded-md flex items-center justify-center font-bold text-white text-xl">
              Σ
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm sm:text-lg leading-tight tracking-tight text-white truncate max-w-[200px] sm:max-w-none">
                Number Sense Studio
              </h1>
              <span className="hidden md:inline-block text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-white/20 text-blue-100 border border-white/30">
                PWA
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-blue-100/80 font-medium">Sir Eugene Technologies</p>
          </div>
        </div>

        {/* Center Live Math Expression Badge */}
        <div className="hidden xl:flex items-center bg-blue-700/60 border border-blue-400/30 px-3 py-1 rounded-xl shadow-inner max-w-sm overflow-hidden text-white">
          <span className="text-[10px] uppercase font-bold text-blue-200 mr-2 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-yellow-300" /> Live Math:
          </span>
          <div className="text-white text-sm font-mono truncate font-semibold">
            <MathView latex={liveLatex || '1 = \\frac{2}{2} = 100\\%'} />
          </div>
        </div>

        {/* Right Actions: Streak Flame, Whiteboard Pen, Performance Chart, Socratic Coach, Student Profile, Admin, Audio */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          
          {/* Daily Streak Flame Trigger */}
          <button
            id="daily-streak-header-btn"
            onClick={() => { onOpenDailyStreak(); playSound('pop'); }}
            className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-100 text-xs font-black px-2.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs"
            title={`Daily Practice Streak: ${dailyStreak} Days (Click to view)`}
          >
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-bounce" />
            <span>{dailyStreak}d</span>
          </button>

          {/* Whiteboard / Annotation Pen Toggle */}
          <button
            id="whiteboard-toggle-header-btn"
            onClick={() => { onToggleWhiteboard(); playSound('click'); }}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-all cursor-pointer shadow-xs ${
              isWhiteboardOpen
                ? 'bg-amber-400 border-amber-300 text-slate-900 font-bold'
                : 'bg-white/10 hover:bg-white/20 border-white/30 text-white'
            }`}
            title="Whiteboard Drawing & Working Pen (Smartboard mode)"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isWhiteboardOpen ? 'Pen On' : 'Draw'}</span>
          </button>

          {/* Performance Analytics Chart Trigger */}
          <button
            id="performance-chart-header-btn"
            onClick={() => { onOpenPerformanceChart(); playSound('click'); }}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs"
            title="View Mastery Charts & Practice Logs"
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-200" />
            <span className="hidden md:inline">Analytics</span>
          </button>

          {/* Socratic Coach Trigger */}
          <button
            id="open-socratic-coach-header-btn"
            onClick={() => { onOpenSocraticCoach(); playSound('pop'); }}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs"
          >
            <Bot className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            <span className="hidden sm:inline">AI Coach</span>
          </button>

          {/* Student Profile Gate */}
          <button
            id="student-profile-badge-btn"
            onClick={() => { onOpenStudentGate(); playSound('click'); }}
            className="flex items-center gap-2 border-l border-blue-400/40 pl-2.5 sm:pl-3 text-left cursor-pointer hover:opacity-90 transition-opacity"
            title="Edit student profile"
          >
            <div className="hidden lg:block text-right">
              <p className="text-xs font-bold text-white max-w-[90px] truncate leading-tight">
                {student?.name || 'Kojo Mensah'}
              </p>
              <p className="text-[10px] text-blue-200 opacity-90 leading-tight">
                {student?.level || 'Form 2'}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center text-blue-900 font-black text-xs shadow-xs shrink-0">
              {student?.name ? student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'KM'}
            </div>
          </button>

          {/* Super Admin Portal Button */}
          <button
            id="super-admin-portal-header-btn"
            onClick={() => { onOpenAdminPortal(); playSound('click'); }}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs p-1.5 sm:px-2 sm:py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Teacher Grading & Admin Portal (PIN: 1234)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden sm:inline font-medium text-[11px]">Admin</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            id="sound-mute-toggle-btn"
            onClick={() => { onToggleMute(); playSound('click'); }}
            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
              isMuted
                ? 'bg-rose-500/30 border-rose-300 text-white'
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }`}
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-yellow-300" />}
          </button>

        </div>
      </div>

      {/* Mode Navigation Ribbon (9 Interactive Engines) */}
      <div className="flex items-center justify-start sm:justify-center w-full pt-0.5 overflow-hidden">
        <nav id="workspace-mode-ribbon" className="flex items-center bg-blue-900/60 border border-blue-400/20 rounded-full px-1.5 py-1 gap-1 overflow-x-auto no-scrollbar whitespace-nowrap max-w-full shadow-inner">
          {modes.map((m) => {
            const isActive = activeMode === m.id;
            return (
              <button
                id={`mode-tab-${m.id}`}
                key={m.id}
                onClick={() => {
                  onSelectMode(m.id);
                  playSound('snap');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-white text-blue-900 shadow-sm ring-1 ring-white/50 scale-[1.02]'
                    : 'text-white/85 hover:bg-blue-600/50 hover:text-white'
                }`}
                title={m.title}
              >
                <span className={isActive ? 'text-blue-600' : 'text-blue-200'}>{m.icon}</span>
                <span>{m.title}</span>
                <span className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-blue-100 text-blue-800' : 'bg-white/15 text-blue-100'
                }`}>
                  {m.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

    </header>
  );
};

