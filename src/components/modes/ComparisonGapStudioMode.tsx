import React, { useState } from 'react';
import { FractionDenominator, StudentProfile, ActivityLog } from '../../types';
import { DirectComparisonOrderingWorkspace } from './DirectComparisonOrderingWorkspace';
import { InequalityBuilderWorkspace } from './InequalityBuilderWorkspace';
import { WhatsLeftGapWorkspace } from './WhatsLeftGapWorkspace';
import { WordProblemSolverCreatorWorkspace } from './WordProblemSolverCreatorWorkspace';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { 
  Ruler, 
  Scale, 
  Puzzle, 
  BookOpen, 
  HelpCircle, 
  Bot, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Info,
  ChevronRight,
  Lightbulb,
  X
} from 'lucide-react';

export type StudioSubWorkspace = 
  | 'comparison_ordering'
  | 'inequality_builder'
  | 'whats_left_gap'
  | 'word_problems';

interface ComparisonGapStudioModeProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  onOpenSocraticCoach?: (initialContext?: string) => void;
  student: StudentProfile | null;
}

export const ComparisonGapStudioMode: React.FC<ComparisonGapStudioModeProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  onOpenSocraticCoach,
  student,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<StudioSubWorkspace>('comparison_ordering');
  const [showHowToUseModal, setShowHowToUseModal] = useState<boolean>(false);

  // Cross-workspace communication: sending custom problem from Word Problem solver to What's Left? Gap solver
  const [gapWorkspaceParams, setGapWorkspaceParams] = useState<{
    title?: string;
    addends?: { num: number; den: FractionDenominator }[];
  }>({});

  const handleSelectSubTab = (tab: StudioSubWorkspace) => {
    setActiveSubTab(tab);
    playSound('click');
  };

  const handleSendToGapWorkspace = (params: { title: string; addends: { num: number; den: FractionDenominator }[] }) => {
    setGapWorkspaceParams(params);
    setActiveSubTab('whats_left_gap');
    playSound('snap');
  };

  // Socratic contextual hints
  const getSocraticPrompt = () => {
    switch (activeSubTab) {
      case 'comparison_ordering':
        return 'To compare unit fractions: Remember that dividing a whole into more slices makes each slice smaller. So 1/2 is always bigger than 1/16!';
      case 'inequality_builder':
        return 'Align fractions in Lane A and Lane B along the zero baseline. Notice the shaded displacement gap Δ showing exactly how much larger one lane is!';
      case 'whats_left_gap':
        return 'To find what is left of 1 Whole: First combine your given parts using a common denominator, then subtract from 1 Whole (e.g. 6/6 - 3/6 = 3/6 = 1/2).';
      case 'word_problems':
        return 'Read the story carefully. Identify the fractional parts eaten or used, add them together, and subtract from the whole to see what remains!';
    }
  };

  return (
    <div
      id="comparison-gap-studio-main"
      className="flex-1 min-h-0 flex flex-col p-3 sm:p-6 space-y-4 max-w-7xl mx-auto w-full h-full overflow-y-auto custom-studio-scrollbar pb-24"
    >
      
      {/* 1. Studio Navigation Header Ribbon */}
      <div className="bg-white border border-slate-200 rounded-3xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Title & Brand Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md font-black text-xl shrink-0">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Comparison, Gap-Filling & Word Problem Studio
              </h2>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-black uppercase tracking-wider border border-blue-200">
                Sir Eugene Technologies
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Offline-first interactive manipulatives: Shrinking unit ordering, real-time inequalities & gap subtraction.
            </p>
          </div>
        </div>

        {/* Sub-Workspace Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => handleSelectSubTab('comparison_ordering')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'comparison_ordering'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>📏 Direct Compare & Order</span>
          </button>

          <button
            onClick={() => handleSelectSubTab('inequality_builder')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'inequality_builder'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>⚖️ Inequality Builder</span>
          </button>

          <button
            onClick={() => handleSelectSubTab('whats_left_gap')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'whats_left_gap'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <Puzzle className="w-3.5 h-3.5" />
            <span>🧩 What's Left? Gap</span>
          </button>

          <button
            onClick={() => handleSelectSubTab('word_problems')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'word_problems'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>📖 Word Problems & Creator</span>
          </button>

          {/* How to Use Modal Trigger */}
          <button
            onClick={() => setShowHowToUseModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs ml-auto"
            title="How to use this manipulative"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Guide</span>
          </button>
        </div>

      </div>

      {/* 2. Active Sub-Workspace Content */}
      <div className="w-full">
        {activeSubTab === 'comparison_ordering' && (
          <DirectComparisonOrderingWorkspace
            onLogActivity={onLogActivity}
            onUpdateLiveLatex={onUpdateLiveLatex}
            student={student}
          />
        )}

        {activeSubTab === 'inequality_builder' && (
          <InequalityBuilderWorkspace
            onLogActivity={onLogActivity}
            onUpdateLiveLatex={onUpdateLiveLatex}
            student={student}
          />
        )}

        {activeSubTab === 'whats_left_gap' && (
          <WhatsLeftGapWorkspace
            onLogActivity={onLogActivity}
            onUpdateLiveLatex={onUpdateLiveLatex}
            student={student}
            initialAddends={gapWorkspaceParams.addends}
            initialScenarioTitle={gapWorkspaceParams.title}
          />
        )}

        {activeSubTab === 'word_problems' && (
          <WordProblemSolverCreatorWorkspace
            onLogActivity={onLogActivity}
            onUpdateLiveLatex={onUpdateLiveLatex}
            student={student}
            onSendToGapWorkspace={handleSendToGapWorkspace}
          />
        )}
      </div>

      {/* 3. Docked Socratic AI Coach Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 text-white rounded-3xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Sir Eugene AI Socratic Coach</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              {getSocraticPrompt()}
            </p>
          </div>
        </div>

        {onOpenSocraticCoach && (
          <button
            onClick={() => onOpenSocraticCoach(getSocraticPrompt())}
            className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-95 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Coach</span>
          </button>
        )}
      </div>

      {/* 4. Interactive "How to Use This Manipulative" Guide Modal */}
      {showHowToUseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 text-slate-900">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
                  💡
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    How to Use Fraction Comparison & Gap Studio
                  </h3>
                  <p className="text-xs text-slate-500">
                    4 Core Routines for Mastery by Sir Eugene Technologies
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHowToUseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              
              <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-100 space-y-1">
                <div className="font-black text-blue-900 flex items-center gap-1.5">
                  <span>1. 📏 Direct Comparison & Shrinking Unit Modeler (Routines 1 & 2)</span>
                </div>
                <p className="leading-relaxed">
                  Click unit fractions from the palette to align them on the zero-baseline ruler. Notice that as denominators increase (2 → 3 → 4 → 8 → 16), the slice size shrinks! Use the Ordering Tray to practice arranging fractions in least-to-greatest or greatest-to-least order.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-100 space-y-1">
                <div className="font-black text-purple-900 flex items-center gap-1.5">
                  <span>2. ⚖️ Real-Time Inequality Sentence Engine (Routine 2)</span>
                </div>
                <p className="leading-relaxed">
                  Build fractions in Lane A and Lane B. The engine dynamically evaluates whether Lane A &gt; B, A &lt; B, or A = B. View the exact displacement gap Δ and click <strong>[ 🔗 Bridge the Gap ]</strong> to automatically snap the balancing tile.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-100 space-y-1">
                <div className="font-black text-amber-900 flex items-center gap-1.5">
                  <span>3. 🧩 "What's Left?" Gap-Filling & Subtraction Engine (Routine 4)</span>
                </div>
                <p className="leading-relaxed">
                  Place consumed parts onto the problem track under the fixed 1 Whole reference bar. The glowing dashed Gap Zone shows what is missing. Drag and snap candidate tiles into the gap to complete the whole and generate a step-by-step KaTeX subtraction proof!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-green-50/80 border border-green-100 space-y-1">
                <div className="font-black text-green-900 flex items-center gap-1.5">
                  <span>4. 📖 Word Problem Solver & Custom Creator (Routine 3)</span>
                </div>
                <p className="leading-relaxed">
                  Solve Ghanaian curriculum scenarios (Sugar bread, Sobolo drinks, cassava farms) with step-by-step guidance. Use the <strong>✍️ Custom Problem Creator</strong> to write your own problems and auto-load them into the manipulative canvas.
                </p>
              </div>

            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowHowToUseModal(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer shadow-md"
              >
                Got It, Let's Explore!
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
