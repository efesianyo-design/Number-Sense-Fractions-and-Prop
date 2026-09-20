import React, { useState } from 'react';
import { FractionDenominator, FractionStripItem, ActivityLog, StudentProfile } from '../../types';
import { MathView } from '../MathView';
import { FRACTION_PALETTE, fractionToLatex, simplifyFraction } from '../../utils/math';
import { playSound } from '../../utils/audio';
import { fireMathConfetti } from '../../utils/confetti';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  HelpCircle, 
  Sparkles, 
  Layers,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

export interface WordProblemScenario {
  id: string;
  title: string;
  category: string;
  story: string;
  fractions: { label: string; num: number; den: FractionDenominator }[];
  question1: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  question2: {
    prompt: string;
    targetGapNum: number;
    targetGapDen: FractionDenominator;
    options: { num: number; den: FractionDenominator }[];
    correctIndex: number;
    stepLatex: string;
  };
}

export const SCENARIOS: WordProblemScenario[] = [
  {
    id: 'sugar-bread',
    title: 'Sharing a Loaf of Sugar Bread',
    category: 'Ghanaian Market & Fair Share',
    story: 'Mary and John bought a fresh loaf of warm Accra sugar bread. Mary ate 1/3 of the loaf in the morning, and John ate 1/6 in the afternoon.',
    fractions: [
      { label: 'Mary (Morning)', num: 1, den: 3 },
      { label: 'John (Afternoon)', num: 1, den: 6 },
    ],
    question1: {
      prompt: 'Who ate the larger share of the sugar bread?',
      options: ['Mary ate more (1/3 > 1/6)', 'John ate more (1/6 > 1/3)', 'They ate equal amounts'],
      correctIndex: 0,
      explanation: '1/3 = 2/6, which is larger than 1/6. Therefore, Mary ate more.',
    },
    question2: {
      prompt: 'What fraction of the whole loaf is left for dinner?',
      targetGapNum: 1,
      targetGapDen: 2,
      options: [
        { num: 1, den: 2 },
        { num: 1, den: 3 },
        { num: 1, den: 4 },
        { num: 2, den: 3 },
      ],
      correctIndex: 0,
      stepLatex: '1 - \\left(\\frac{1}{3} + \\frac{1}{6}\\right) = 1 - \\left(\\frac{2}{6} + \\frac{1}{6}\\right) = 1 - \\frac{3}{6} = \\frac{3}{6} = \\frac{1}{2}',
    },
  },
  {
    id: 'sobolo-jug',
    title: "Akua's Refreshing Sobolo Jug",
    category: 'Local Beverage Proportions',
    story: 'Akua is preparing a 1-liter jug of iced Sobolo. She pours in 3/8 liter of concentrated hibiscus extract and 1/4 liter of fresh ginger juice.',
    fractions: [
      { label: 'Hibiscus Extract', num: 3, den: 8 },
      { label: 'Ginger Juice', num: 1, den: 4 },
    ],
    question1: {
      prompt: 'What is the combined volume of hibiscus and ginger in the jug?',
      options: ['5/8 liter', '4/12 liter', '7/8 liter', '1/2 liter'],
      correctIndex: 0,
      explanation: '3/8 + 1/4 = 3/8 + 2/8 = 5/8 liter.',
    },
    question2: {
      prompt: 'What fraction of the jug is remaining for ice water to fill it to 1 Whole?',
      targetGapNum: 3,
      targetGapDen: 8,
      options: [
        { num: 3, den: 8 },
        { num: 1, den: 8 },
        { num: 1, den: 2 },
        { num: 5, den: 8 },
      ],
      correctIndex: 0,
      stepLatex: '1 - \\left(\\frac{3}{8} + \\frac{1}{4}\\right) = 1 - \\left(\\frac{3}{8} + \\frac{2}{8}\\right) = 1 - \\frac{5}{8} = \\frac{3}{8}',
    },
  },
  {
    id: 'kwame-farm',
    title: "Kwame's Agricultural Farm Plot",
    category: 'Land & Crop Geometry',
    story: 'Kwame partitioned his 1-hectare community garden plot. He planted cassava on 2/5 of the land and sweet maize on 3/10 of the land.',
    fractions: [
      { label: 'Cassava', num: 2, den: 5 },
      { label: 'Sweet Maize', num: 3, den: 10 },
    ],
    question1: {
      prompt: 'Which crop occupies a larger fraction of the plot?',
      options: ['Cassava (2/5 = 4/10)', 'Sweet Maize (3/10)', 'Both occupy equal area'],
      correctIndex: 0,
      explanation: '2/5 = 4/10. Since 4/10 > 3/10, cassava occupies more land.',
    },
    question2: {
      prompt: 'What fraction of the plot remains unplanted and ready for vegetables?',
      targetGapNum: 3,
      targetGapDen: 10,
      options: [
        { num: 3, den: 10 },
        { num: 1, den: 5 },
        { num: 7, den: 10 },
        { num: 1, den: 2 },
      ],
      correctIndex: 0,
      stepLatex: '1 - \\left(\\frac{2}{5} + \\frac{3}{10}\\right) = 1 - \\left(\\frac{4}{10} + \\frac{3}{10}\\right) = 1 - \\frac{7}{10} = \\frac{3}{10}',
    },
  },
  {
    id: 'kofi-prep',
    title: "Kofi's 1-Hour Evening Prep",
    category: 'Time Management',
    story: 'Kofi allocated a 1-hour study block after dinner. He solved mathematics problems for 1/4 hour and read science notes for 5/12 hour.',
    fractions: [
      { label: 'Mathematics Prep', num: 1, den: 4 },
      { label: 'Science Prep', num: 5, den: 12 },
    ],
    question1: {
      prompt: 'What total fraction of the hour did Kofi spend on Math and Science combined?',
      options: ['8/12 hour = 2/3 hour', '6/16 hour', '7/12 hour', '1/2 hour'],
      correctIndex: 0,
      explanation: '1/4 + 5/12 = 3/12 + 5/12 = 8/12 = 2/3 hour (40 minutes).',
    },
    question2: {
      prompt: 'What fraction of the hour is remaining for Kofi to read English Literature?',
      targetGapNum: 1,
      targetGapDen: 3,
      options: [
        { num: 1, den: 3 },
        { num: 1, den: 4 },
        { num: 1, den: 6 },
        { num: 5, den: 12 },
      ],
      correctIndex: 0,
      stepLatex: '1 - \\left(\\frac{1}{4} + \\frac{5}{12}\\right) = 1 - \\left(\\frac{3}{12} + \\frac{5}{12}\\right) = 1 - \\frac{8}{12} = \\frac{4}{12} = \\frac{1}{3}',
    },
  },
];

interface FractionWordProblemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadScenarioToTracks: (scenario: WordProblemScenario) => void;
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  student: StudentProfile | null;
}

export const FractionWordProblemsModal: React.FC<FractionWordProblemsModalProps> = ({
  isOpen,
  onClose,
  onLoadScenarioToTracks,
  onLogActivity,
  student,
}) => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);
  const [userAns1, setUserAns1] = useState<number | null>(null);
  const [userAns2, setUserAns2] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentScenario = SCENARIOS[selectedScenarioIndex];

  const handleSelectScenario = (idx: number) => {
    setSelectedScenarioIndex(idx);
    setUserAns1(null);
    setUserAns2(null);
    setIsSubmitted(false);
    playSound('click');
  };

  const handleCheckAnswers = () => {
    if (userAns1 === null || userAns2 === null) return;
    setIsSubmitted(true);

    const isQ1Correct = userAns1 === currentScenario.question1.correctIndex;
    const isQ2Correct = userAns2 === currentScenario.question2.correctIndex;
    const allCorrect = isQ1Correct && isQ2Correct;

    if (allCorrect) {
      playSound('success');
      fireMathConfetti();
    } else {
      playSound('pop');
    }

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Fraction Equivalence',
      title: `Word Problem: ${currentScenario.title}`,
      details: `Solved scenario with Q1: ${isQ1Correct ? 'Correct' : 'Incorrect'}, Q2: ${isQ2Correct ? 'Correct' : 'Incorrect'}`,
      latexExpression: currentScenario.question2.stepLatex,
      success: allCorrect,
      score: allCorrect ? 35 : isQ1Correct || isQ2Correct ? 20 : 5,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-yellow-300 font-black">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Missing Gap & Word Problem Scenarios
              </h2>
              <p className="text-xs text-blue-100 opacity-90">
                Solve real-world subtraction and comparison problems using fraction strips.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body with 2-column layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
          
          {/* Left Scenario Sidebar */}
          <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200 p-4 space-y-2 shrink-0">
            <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">
              Select Scenario
            </div>
            {SCENARIOS.map((sc, idx) => {
              const isSelected = selectedScenarioIndex === idx;
              return (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(idx)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold leading-snug">{sc.title}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {sc.category}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>

          {/* Right Problem Interaction Area */}
          <div className="flex-1 p-5 sm:p-7 space-y-6 overflow-y-auto">
            
            {/* Story Card */}
            <div className="bg-amber-50/80 border-2 border-amber-200 rounded-2xl p-4 sm:p-5 relative shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider bg-amber-200/70 px-2.5 py-0.5 rounded-full">
                  {currentScenario.category}
                </span>
                <button
                  onClick={() => {
                    onLoadScenarioToTracks(currentScenario);
                    onClose();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Load into Comparison Tracks</span>
                </button>
              </div>

              <h3 className="text-base font-black text-slate-900 mb-2">
                {currentScenario.title}
              </h3>

              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {currentScenario.story}
              </p>

              {/* Visual Strip Preview of Story Fractions */}
              <div className="mt-4 pt-4 border-t border-amber-200/80">
                <div className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-2">
                  <span>Visual Quantities:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentScenario.fractions.map((f, i) => {
                    const palette = FRACTION_PALETTE[f.den];
                    return (
                      <div 
                        key={i}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${palette.bg} text-white shadow-xs`}
                      >
                        <span>{f.label}:</span>
                        <MathView latex={`\\frac{${f.num}}{${f.den}}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Question 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-blue-600 tracking-wider">
                  Question 1: Comparison & Size
                </span>
                {isSubmitted && (
                  userAns1 === currentScenario.question1.correctIndex ? (
                    <span className="flex items-center gap-1 text-green-700 font-bold text-xs bg-green-100 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-700 font-bold text-xs bg-rose-100 px-2.5 py-0.5 rounded-full">
                      <XCircle className="w-3.5 h-3.5" /> Incorrect
                    </span>
                  )
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-800">
                {currentScenario.question1.prompt}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {currentScenario.question1.options.map((opt, i) => {
                  const isSelected = userAns1 === i;
                  return (
                    <button
                      key={i}
                      onClick={() => { setUserAns1(i); playSound('pop'); }}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-100 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {isSubmitted && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
                  <span className="font-bold text-slate-800">Explanation: </span>
                  {currentScenario.question1.explanation}
                </div>
              )}
            </div>

            {/* Question 2 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">
                  Question 2: Finding the Missing Gap (Subtraction from 1 Whole)
                </span>
                {isSubmitted && (
                  userAns2 === currentScenario.question2.correctIndex ? (
                    <span className="flex items-center gap-1 text-green-700 font-bold text-xs bg-green-100 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-700 font-bold text-xs bg-rose-100 px-2.5 py-0.5 rounded-full">
                      <XCircle className="w-3.5 h-3.5" /> Incorrect
                    </span>
                  )
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-800">
                {currentScenario.question2.prompt}
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {currentScenario.question2.options.map((opt, i) => {
                  const isSelected = userAns2 === i;
                  return (
                    <button
                      key={i}
                      onClick={() => { setUserAns2(i); playSound('pop'); }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-100 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-base font-bold">
                        <MathView latex={`\\frac{${opt.num}}{${opt.den}}`} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {isSubmitted && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold">Step-by-Step Algebraic Proof:</div>
                  <div className="font-serif text-sm bg-white p-2 rounded-lg border border-emerald-200 text-center font-bold">
                    <MathView latex={currentScenario.question2.stepLatex} />
                  </div>
                </div>
              )}
            </div>

            {/* Check Button & Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setUserAns1(null);
                  setUserAns2(null);
                  setIsSubmitted(false);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Selections
              </button>

              <button
                disabled={userAns1 === null || userAns2 === null}
                onClick={handleCheckAnswers}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl shadow-md cursor-pointer transition-all flex items-center gap-2 text-xs uppercase tracking-wider"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Check & Record Score</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
