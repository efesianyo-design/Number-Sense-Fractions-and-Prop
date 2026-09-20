import React, { useState, useEffect } from 'react';
import { ActivityLog, StudentProfile, FractionDenominator } from '../../types';
import { playSound } from '../../utils/audio';
import { 
  Layers, 
  Sparkles, 
  HelpCircle, 
  Lightbulb, 
  GraduationCap,
  Plus,
  Minus,
  X,
  Divide,
  Scan,
  Ruler,
  SlidersHorizontal,
  Bot,
  Info,
  CheckCircle2,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { WorkspaceMode } from '../Header';
import { AdditionUnlikeDenominatorsTab } from './AdditionUnlikeDenominatorsTab';
import { MissingGapSolverTab } from './MissingGapSolverTab';
import { MultiplicationAreaTab } from './MultiplicationAreaTab';
import { DivisionMeasurementTab } from './DivisionMeasurementTab';
import { FractionWallScannerTab } from './FractionWallScannerTab';
import { NumberLineAnchorsTab } from './NumberLineAnchorsTab';
import { CustomFractionQuestionBar } from './CustomFractionQuestionBar';

export type FractionEngineType = 
  | 'addition' 
  | 'subtraction' 
  | 'multiplication' 
  | 'division' 
  | 'scanner' 
  | 'comparator';

interface FractionStripsModeProps {
  engineMode: FractionEngineType;
  onSelectMode: (mode: WorkspaceMode) => void;
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  onOpenSocraticCoach?: (context: string) => void;
  student: StudentProfile | null;
}

interface EngineInfo {
  id: FractionEngineType;
  title: string;
  shortTitle: string;
  icon: string;
  badge: string;
  description: string;
  socraticCoachTip: string;
  socraticQuestion: string;
  howToSteps: string[];
}

const ENGINE_INFOS: Record<FractionEngineType, EngineInfo> = {
  addition: {
    id: 'addition',
    title: 'Fraction Addition (Like & Unlike LCM)',
    shortTitle: 'Addition',
    icon: '➕',
    badge: 'Sir Eugene LCM Modeler',
    description: 'Model like and unlike denominator fraction addition with interactive snap strips and lowest common denominator calibration.',
    socraticCoachTip: 'Place addend strips end-to-end. To find their sum, test subdivision tiles in the bottom tier until tile edges align perfectly with all addend joints!',
    socraticQuestion: 'Why does 1/2 + 1/3 equal 5/6 instead of 2/5? Notice how both fractions convert cleanly into matching 1/6 unit pieces!',
    howToSteps: [
      'Toggle between "Like Terms" (direct numerator sum) and "Unlike Terms" (LCM modeling).',
      'Select addends or click a classroom preset to load fractions.',
      'Test different denominator tiles in the bottom lane until all addend joints lock perfectly.',
      'Observe the step-by-step KaTeX algebra derivation and click "Lock & Log Sum" to record progress.',
    ],
  },
  subtraction: {
    id: 'subtraction',
    title: 'Fraction Subtraction (Take-Away & Missing Gap)',
    shortTitle: 'Subtraction',
    icon: '➖',
    badge: 'Sir Eugene Gap Solver',
    description: 'Explore subtraction through visual take-away models and missing-gap completion to 1 Whole.',
    socraticCoachTip: 'Model subtraction by cutting away portions from a starting minuend strip or finding the missing piece needed to complete 1 Whole.',
    socraticQuestion: 'When taking 1/3 from 5/6, we rename 1/3 to 2/6. Why does 5/6 - 2/6 leave exactly 3/6 = 1/2?',
    howToSteps: [
      'Select "Take-Away Subtraction" (a/b - c/d) or "Gap Completion" (1 - Σ parts).',
      'In Take-Away mode: Adjust minuend and subtrahend denominators; observe the crosshatched subtraction and remaining emerald difference strip.',
      'In Gap Completion mode: Read the Ghanaian story problem and drop unit pieces into the lane until 1 Whole is filled.',
    ],
  },
  multiplication: {
    id: 'multiplication',
    title: 'Fraction Multiplication (2D Area Grid)',
    shortTitle: 'Multiplication',
    icon: '✖️',
    badge: 'Sir Eugene 2D Area Model',
    description: 'Visualize fraction multiplication as finding a "fraction of a fraction" via width × height 2D area overlays.',
    socraticCoachTip: 'Multiplication of fractions means finding a "fraction of a fraction". Model it as an area rectangle of Width (Factor 1) × Height (Factor 2).',
    socraticQuestion: 'Why is 2/3 × 3/4 = 6/12 = 1/2? Notice that the overlapping rectangle contains 6 out of the 12 equal grid cells!',
    howToSteps: [
      'Pick Factor 1 (columns partition) and Factor 2 (rows partition).',
      'Adjust the highlighted numerators to shade columns and rows.',
      'The glowing amber intersection grid cells represent the numerator of the product, while the total cells represent the denominator.',
    ],
  },
  division: {
    id: 'division',
    title: 'Fraction Division (Measurement & Ratio)',
    shortTitle: 'Division',
    icon: '➗',
    badge: 'Sir Eugene Ratio Modeler',
    description: 'Understand division as measurement: "How many copies of the divisor strip fit inside the dividend strip?"',
    socraticCoachTip: 'Think of fraction division as measurement: "How many copies of the divisor strip fit inside the dividend strip?" Subdivide both by LCM to see the exact ratio.',
    socraticQuestion: 'In 1/4 ÷ 1/3, we rename both to twelfths: 3/12 ÷ 4/12. How many groups of 4 fit into 3? Exactly 3/4 of a group!',
    howToSteps: [
      'Configure Dividend (strip being measured) and Divisor (measuring unit).',
      'Click "Align Units via LCM" to subdivide both strips into identical unit increments.',
      'Use the ratio bracket and count how many divisor units fit within the dividend length.',
    ],
  },
  scanner: {
    id: 'scanner',
    title: 'Rainbow Fraction Wall & Train Scanner',
    shortTitle: 'Wall Scanner',
    icon: '🧱',
    badge: 'Sir Eugene Edge-Lock Scanner',
    description: 'Slide a composite fraction train across the Rainbow Wall to discover common denominator edge alignments.',
    socraticCoachTip: 'Build a composite fraction train and slide it up and down the Rainbow Wall. When all joint edges coincide with wall row borders, that row is a common denominator!',
    socraticQuestion: 'When scanning train 1/3 + 1/4, which wall rows light up green? Why do 6ths fail but 12ths succeed?',
    howToSteps: [
      'Add fraction tiles to assemble your custom test train at the top.',
      'Scrub or click wall rows from 1/2 down to 1/16.',
      'Look for the green glowing "PERFECT EDGE-LOCK" banner indicating common denominator alignment.',
    ],
  },
  comparator: {
    id: 'comparator',
    title: 'Snap Strips & Fraction Comparator Axis',
    shortTitle: 'Comparator',
    icon: '📏',
    badge: 'Sir Eugene Subdivision Axis',
    description: 'Compare fractions side-by-side on modular snap tracks and project boundaries directly onto a calibrated axis.',
    socraticCoachTip: 'Position fraction strips directly above the modular number line axis. Scrub subdivisions (2 to 16) to calibrate equivalent fraction ticks.',
    socraticQuestion: 'Which subdivisions have a tick mark landing exactly at 1/2? Notice the sequence: 1/2 = 2/4 = 3/6 = 4/8 = 5/10 = 6/12 = 8/16.',
    howToSteps: [
      'Drag and place fractions onto the top measuring tray.',
      'Change the number line subdivision slider to see dynamic tick marks and labels.',
      'Observe vertical projection rays dropping from strip boundaries directly onto the number line axis.',
    ],
  },
};

export const FractionStripsMode: React.FC<FractionStripsModeProps> = ({
  engineMode,
  onSelectMode,
  onLogActivity,
  onUpdateLiveLatex,
  onOpenSocraticCoach,
  student,
}) => {
  const [showHowToModal, setShowHowToModal] = useState<boolean>(false);

  // Custom fractions passed from CustomFractionQuestionBar
  const [customFractions, setCustomFractions] = useState<{
    f1?: { num: number; den: FractionDenominator };
    f2?: { num: number; den: FractionDenominator };
  }>({});

  const currentInfo = ENGINE_INFOS[engineMode] || ENGINE_INFOS.addition;

  const handleLoadCustomProblem = (params: {
    tab: WorkspaceMode;
    f1: { num: number; den: FractionDenominator };
    f2: { num: number; den: FractionDenominator };
    operation: '+' | '-' | '*' | '/';
    isStudentChallenge?: boolean;
    customPrompt?: string;
  }) => {
    onSelectMode(params.tab);
    setCustomFractions({ f1: params.f1, f2: params.f2 });
    playSound('snap');

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Fraction Operations',
      title: `Loaded Custom Problem: ${params.f1.num}/${params.f1.den} ${params.operation} ${params.f2.num}/${params.f2.den}`,
      details: params.customPrompt || `Custom ${params.operation} challenge in ${params.tab}`,
      latexExpression: `\\frac{${params.f1.num}}{${params.f1.den}} ${params.operation === '*' ? '\\times' : params.operation === '/' ? '\\div' : params.operation} \\frac{${params.f2.num}}{${params.f2.den}}`,
      success: true,
      score: 10,
    });
  };

  const handleAskCoach = () => {
    if (onOpenSocraticCoach) {
      onOpenSocraticCoach(`Workspace: ${currentInfo.title}. Core Concept: ${currentInfo.socraticCoachTip}`);
    }
  };

  return (
    <div id="fraction-engine-workspace" className="flex-1 flex flex-col p-3 sm:p-5 max-w-6xl mx-auto w-full overflow-y-auto space-y-4">
      
      {/* 1. Top Custom Problem & Word Problem Input Bar */}
      <CustomFractionQuestionBar 
        onLoadCustomProblem={handleLoadCustomProblem} 
        currentMode={engineMode}
      />

      {/* 2. Direct Engine Header Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-3.5 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-md">
            {currentInfo.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900">
                {currentInfo.title}
              </h2>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200">
                {currentInfo.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              {currentInfo.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* How to Use Modal Trigger */}
          <button
            onClick={() => {
              setShowHowToModal(true);
              playSound('pop');
            }}
            className="px-3 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs"
          >
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span>💡 How to Use</span>
          </button>

          {/* Ask AI Coach Trigger */}
          <button
            onClick={handleAskCoach}
            className="px-3 py-1.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs"
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Ask AI Coach</span>
          </button>

          {/* Student Profile Quick Indicator */}
          {student && (
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl text-xs">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800">{student.name}</span>
              <span className="text-slate-400 font-medium">({student.level})</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Direct Active Engine Workspace Canvas */}
      <div className="w-full">
        {engineMode === 'addition' && (
          <AdditionUnlikeDenominatorsTab
            onLogActivity={onLogActivity}
            onUpdateLiveLatex={onUpdateLiveLatex}
            student={student}
            initialFractions={customFractions}
          />
        )}

        {engineMode === 'subtraction' && (
          <MissingGapSolverTab
            onLogActivity={onLogActivity}
            onUpdateLiveLatex={onUpdateLiveLatex}
            student={student}
            initialFractions={customFractions}
          />
        )}

        {engineMode === 'multiplication' && (
          <MultiplicationAreaTab
            onLogActivity={onLogActivity}
            onUpdateLiveLatex={onUpdateLiveLatex}
            student={student}
            initialFractions={customFractions}
          />
        )}

        {engineMode === 'division' && (
          <DivisionMeasurementTab
            onLogActivity={onLogActivity}
            onUpdateLiveLatex={onUpdateLiveLatex}
            student={student}
          />
        )}

        {engineMode === 'scanner' && (
          <FractionWallScannerTab
            onLogActivity={onLogActivity}
            onUpdateLiveLatex={onUpdateLiveLatex}
            student={student}
          />
        )}

        {engineMode === 'comparator' && (
          <NumberLineAnchorsTab
            onLogActivity={onLogActivity}
            onUpdateLiveLatex={onUpdateLiveLatex}
            student={student}
          />
        )}
      </div>

      {/* 4. Docked Bottom Socratic AI Coach Guidance Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Lightbulb className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              Sir Eugene AI • Socratic Coach & Guidance
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-400 bg-slate-800/90 px-2.5 py-0.5 rounded-full border border-slate-700">
            Active: {currentInfo.icon} {currentInfo.title}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Pedagogical Guidance Tip */}
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Pedagogical Core Concept:</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-medium">
              {currentInfo.socraticCoachTip}
            </p>
          </div>

          {/* Socratic Inquiry Question */}
          <div className="bg-indigo-900/30 p-3 rounded-2xl border border-indigo-700/40 space-y-1">
            <div className="font-bold text-indigo-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Socratic Inquiry Challenge:</span>
            </div>
            <p className="text-indigo-100 leading-relaxed font-medium italic">
              "{currentInfo.socraticQuestion}"
            </p>
          </div>
        </div>
      </div>

      {/* 5. "How to Use" Guided Instructions Modal */}
      {showHowToModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    How to Use {currentInfo.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Interactive guide by Sir Eugene Technologies.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowHowToModal(false);
                  playSound('pop');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Engine Walkthrough */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-blue-950 flex items-center gap-1.5">
                    <span>{currentInfo.icon}</span>
                    <span>{currentInfo.title}</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-900">
                    {currentInfo.badge}
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-blue-900 list-disc list-inside">
                  {currentInfo.howToSteps.map((step, sIdx) => (
                    <li key={sIdx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              {/* All Engines Overview */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-slate-600">
                  All 6 Sir Eugene Interactive Engines:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.values(ENGINE_INFOS).map((engine) => (
                    <button
                      key={engine.id}
                      onClick={() => {
                        onSelectMode(engine.id);
                        setShowHowToModal(false);
                        playSound('click');
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2 cursor-pointer transition-all ${
                        engine.id === engineMode 
                          ? 'bg-blue-600 text-white border-blue-600 font-bold' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-base">{engine.icon}</span>
                      <div>
                        <div className="font-black text-[11px] leading-tight">{engine.shortTitle}</div>
                        <div className={`text-[10px] ${engine.id === engineMode ? 'text-blue-100' : 'text-slate-500'}`}>
                          {engine.badge}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setShowHowToModal(false);
                  playSound('click');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
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
