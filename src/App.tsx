import React, { useState, useEffect, useCallback } from 'react';
import { StudentProfile, ActivityLog, FormLevel } from './types';
import { Header, WorkspaceMode } from './components/Header';
import { WorkspaceZoomContainer } from './components/WorkspaceZoomContainer';
import { StudentGateModal } from './components/StudentGateModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { SocraticCoachDrawer } from './components/SocraticCoachDrawer';
import { DailyStreakModal } from './components/DailyStreakModal';
import { PerformanceChartModal } from './components/PerformanceChartModal';
import { WhiteboardOverlay } from './components/WhiteboardOverlay';
import { loadStreakData, recordActivityPractice, StreakData } from './utils/streak';

import { FractionStripsMode } from './components/modes/FractionStripsMode';
import { JumpNumberLineMode } from './components/modes/JumpNumberLineMode';
import { HundredGridMode } from './components/modes/HundredGridMode';
import { FairShareKitchenMode } from './components/modes/FairShareKitchenMode';
import { sound, playSound } from './utils/audio';

const STORAGE_KEY_STUDENT = 'math_studio_active_student_v1';
const STORAGE_KEY_LOGS = 'math_studio_student_logs_v1';

export default function App() {
  // Active Workspace Mode
  const [activeMode, setActiveMode] = useState<WorkspaceMode>('fractions');
  const [liveLatex, setLiveLatex] = useState<string>('1 = \\frac{2}{2} = 100\\%');

  // Student Profile
  const [student, setStudent] = useState<StudentProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENT);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Daily Streak Data
  const [streakData, setStreakData] = useState<StreakData>(() => loadStreakData());
  const [isStreakModalOpen, setIsStreakModalOpen] = useState<boolean>(false);
  const [isPerfModalOpen, setIsPerfModalOpen] = useState<boolean>(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState<boolean>(false);

  // Activity Logs
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals & Drawers
  const [isStudentGateOpen, setIsStudentGateOpen] = useState<boolean>(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(false);
  const [isSocraticCoachOpen, setIsSocraticCoachOpen] = useState<boolean>(false);
  const [socraticContext, setSocraticContext] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Require entry gate if no student profile
  useEffect(() => {
    if (!student) {
      setIsStudentGateOpen(true);
    } else {
      // Refresh streak data for current student
      const current = loadStreakData();
      setStreakData(current);
    }
  }, [student]);

  // Persist student profile
  const handleSaveStudentProfile = (profile: StudentProfile) => {
    setStudent(profile);
    localStorage.setItem(STORAGE_KEY_STUDENT, JSON.stringify(profile));
    setIsStudentGateOpen(false);
  };

  // Log activity with auto-streak update
  const handleLogActivity = useCallback((logData: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog: ActivityLog = {
      ...logData,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    setLogs((prev) => {
      const updated = [newLog, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated.slice(0, 300)));
      } catch (e) {
        console.warn('Could not persist logs to localStorage:', e);
      }
      return updated;
    });

    // Update practice streak
    const { streak, isNewDay } = recordActivityPractice();
    setStreakData(streak);
    if (isNewDay && streak.currentStreak > 1) {
      setIsStreakModalOpen(true);
    }
  }, []);

  // Clear Logs
  const handleClearLogs = () => {
    setLogs([]);
    localStorage.removeItem(STORAGE_KEY_LOGS);
  };

  // Seed Demo Logs for classroom grading demonstration
  const handleSeedLogs = () => {
    const sampleStudents = [
      { name: 'Kwame Mensah', level: 'Form 1' as FormLevel },
      { name: 'Ama Osei', level: 'Form 1' as FormLevel },
      { name: 'Kofi Asante', level: 'Form 2' as FormLevel },
      { name: 'Akosua Darko', level: 'Form 2' as FormLevel },
      { name: 'Emmanuel Agyeman', level: 'Form 3' as FormLevel },
    ];

    const demoLogs: ActivityLog[] = [
      {
        id: `seed-1`,
        studentId: 'stu-demo-1',
        studentName: sampleStudents[0].name,
        studentLevel: sampleStudents[0].level,
        topic: 'Fraction Equivalence',
        title: 'Snap Equivalence: 2/4 ≡ 1/2',
        details: 'Placed two 1/4 pieces under 1/2 bar',
        latexExpression: '\\frac{2}{4} = \\frac{1}{2} = 50\\%',
        success: true,
        score: 25,
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: `seed-2`,
        studentId: 'stu-demo-2',
        studentName: sampleStudents[1].name,
        studentLevel: sampleStudents[1].level,
        topic: 'Unlike Denominators',
        title: 'Common Denominator Conversion: 1/3 + 1/4',
        details: 'Converted to 4/12 + 3/12 = 7/12',
        latexExpression: '\\frac{1}{3} + \\frac{1}{4} = \\frac{7}{12}',
        success: true,
        score: 30,
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: `seed-3`,
        studentId: 'stu-demo-3',
        studentName: sampleStudents[2].name,
        studentLevel: sampleStudents[2].level,
        topic: 'Number Line Jumps',
        title: 'Vector Addition Jump from 0 to 3/4',
        details: 'Displacement +0.75 on quarter subdivisions',
        latexExpression: '0 + \\frac{3}{4} = \\frac{3}{4}',
        success: true,
        score: 20,
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: `seed-4`,
        studentId: 'stu-demo-4',
        studentName: sampleStudents[3].name,
        studentLevel: sampleStudents[3].level,
        topic: 'Market Discount',
        title: 'Ghanaian Textbook Discount GH₵ 240 @ 25%',
        details: 'Calculated savings of GH₵ 60, Final price GH₵ 180',
        latexExpression: '\\text{GH₵ } 240 - 60 = \\text{GH₵ } 180',
        success: true,
        score: 25,
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: `seed-5`,
        studentId: 'stu-demo-5',
        studentName: sampleStudents[4].name,
        studentLevel: sampleStudents[4].level,
        topic: 'SHS 1-Min Challenge',
        title: 'Speech Day Punch Proportions (Ratio 3:2)',
        details: 'Calculated 12L Sobolo in 20L punch',
        latexExpression: '\\frac{3}{5} \\times 20\\text{L} = 12\\text{L}',
        success: true,
        score: 100,
        timeSpentSeconds: 38,
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ];

    setLogs((prev) => [...demoLogs, ...prev]);
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleOpenSocraticWithContext = (context: string) => {
    setSocraticContext(context);
    setIsSocraticCoachOpen(true);
  };

  const getModeTitle = () => {
    switch (activeMode) {
      case 'fractions': return 'Fraction Strips & Equivalence';
      case 'numberline': return 'Jump Number Line & Rounding';
      case 'grid': return '100-Grid Percent & Ratio Scaler';
      case 'kitchen': return 'Fair-Share Kitchen & Challenges';
    }
  };

  return (
    <div
      id="math-studio-app-root"
      className="w-full h-[100dvh] min-h-[100dvh] flex flex-col bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none"
    >
      {/* Top Header Navigation Ribbon */}
      <Header
        activeMode={activeMode}
        onSelectMode={setActiveMode}
        liveLatex={liveLatex}
        student={student}
        dailyStreak={streakData.currentStreak}
        onOpenDailyStreak={() => setIsStreakModalOpen(true)}
        onOpenPerformanceChart={() => setIsPerfModalOpen(true)}
        isWhiteboardOpen={isWhiteboardOpen}
        onToggleWhiteboard={() => setIsWhiteboardOpen((prev) => !prev)}
        onOpenStudentGate={() => setIsStudentGateOpen(true)}
        onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
        onOpenSocraticCoach={() => {
          setSocraticContext(`Workspace: ${getModeTitle()}`);
          setIsSocraticCoachOpen(true);
        }}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Workspace with 2-Finger Pinch Zoom & Pan Support */}
      <main id="main-workspace-area" className="flex-1 w-full relative overflow-hidden flex flex-col">
        <WorkspaceZoomContainer>
          {activeMode === 'fractions' && (
            <FractionStripsMode
              onLogActivity={handleLogActivity}
              onUpdateLiveLatex={setLiveLatex}
              student={student}
            />
          )}

          {activeMode === 'numberline' && (
            <JumpNumberLineMode
              onLogActivity={handleLogActivity}
              onUpdateLiveLatex={setLiveLatex}
              student={student}
            />
          )}

          {activeMode === 'grid' && (
            <HundredGridMode
              onLogActivity={handleLogActivity}
              onUpdateLiveLatex={setLiveLatex}
              student={student}
            />
          )}

          {activeMode === 'kitchen' && (
            <FairShareKitchenMode
              onLogActivity={handleLogActivity}
              onUpdateLiveLatex={setLiveLatex}
              onOpenSocraticCoach={handleOpenSocraticWithContext}
              student={student}
            />
          )}
        </WorkspaceZoomContainer>

        {/* Global Whiteboard / Smartboard Annotation Overlay */}
        <WhiteboardOverlay
          isOpen={isWhiteboardOpen}
          onClose={() => setIsWhiteboardOpen(false)}
        />
      </main>

      {/* Footer Utility Bar */}
      <footer id="app-footer" className="h-9 sm:h-10 bg-slate-100 border-t border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 text-slate-500 text-[10px] font-bold">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setIsAdminPortalOpen(true)}
            className="hover:text-blue-600 flex items-center gap-1 uppercase tracking-tight cursor-pointer transition-colors"
          >
            Super Admin Portal (1234)
          </button>
          <span>•</span>
          <button
            onClick={() => setIsPerfModalOpen(true)}
            className="hover:text-blue-600 flex items-center gap-1 uppercase tracking-tight cursor-pointer transition-colors"
          >
            Student Performance Analytics
          </button>
          <span className="hidden sm:inline">•</span>
          <span className="text-green-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Auto-Save Active
          </span>
        </div>
        <div className="text-[10px] font-medium text-slate-400 italic hidden md:block">
          Math is the language of the universe. Explore with Sir Eugene Tech.
        </div>
      </footer>

      {/* Mandatory Student Entry Gate Modal */}
      <StudentGateModal
        isOpen={isStudentGateOpen}
        onSaveProfile={handleSaveStudentProfile}
        currentProfile={student}
        onClose={() => setIsStudentGateOpen(false)}
        isDismissable={!!student}
      />

      {/* Super Admin & Teacher Grading Portal Modal (PIN: 1234) */}
      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
        logs={logs}
        onClearLogs={handleClearLogs}
        onSeedLogs={handleSeedLogs}
      />

      {/* Daily Streak & Practice Milestone Modal */}
      <DailyStreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        streakData={streakData}
        studentName={student?.name || 'Kojo Mensah'}
      />

      {/* Student Performance & Mastery Analytics Dashboard Modal */}
      <PerformanceChartModal
        isOpen={isPerfModalOpen}
        onClose={() => setIsPerfModalOpen(false)}
        logs={logs}
        student={student}
      />

      {/* Socratic Math Coach Drawer (Offline Heuristics + Gemini 3.7 Flash) */}
      <SocraticCoachDrawer
        isOpen={isSocraticCoachOpen}
        onClose={() => setIsSocraticCoachOpen(false)}
        student={student}
        currentModeTitle={getModeTitle()}
        currentProblemContext={socraticContext || `Student exploring ${getModeTitle()}`}
      />
    </div>
  );
}
