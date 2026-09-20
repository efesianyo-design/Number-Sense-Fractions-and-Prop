import React, { useState } from 'react';
import { FractionDenominator, StudentProfile, ActivityLog } from '../../types';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { 
  BookOpen, 
  Sparkles, 
  PenTool, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight,
  ShieldCheck,
  Send,
  Plus,
  Trash2,
  Lightbulb,
  Scale,
  Puzzle
} from 'lucide-react';

interface WordProblemSolverCreatorWorkspaceProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
  onSendToGapWorkspace: (params: { title: string; addends: { num: number; den: FractionDenominator }[] }) => void;
}

interface WordScenario {
  id: string;
  title: string;
  badge: string;
  icon: string;
  story: string;
  fractions: { label: string; num: number; den: FractionDenominator }[];
  questions: {
    id: string;
    type: 'compare' | 'sum' | 'gap';
    prompt: string;
    correctAnswer: string;
    options: string[];
    explanation: string;
    latex: string;
  }[];
}

const PRELOADED_SCENARIOS: WordScenario[] = [
  {
    id: 'sugar-bread',
    title: 'Sharing Sugar Bread / Banana',
    badge: 'Ghanaian Snack',
    icon: '🥖',
    story: 'Mary and John receive 1 whole loaf of fresh Ghanaian sugar bread. Mary eats 1/3 of the loaf in the morning, and John eats 1/6 of the loaf in the afternoon.',
    fractions: [
      { label: 'Mary (Morning)', num: 1, den: 3 },
      { label: 'John (Afternoon)', num: 1, den: 6 },
    ],
    questions: [
      {
        id: 'q1',
        type: 'compare',
        prompt: '1. Who ate a larger portion of the sugar bread loaf?',
        options: ['Mary (1/3)', 'John (1/6)', 'Both ate equal portions'],
        correctAnswer: 'Mary (1/3)',
        explanation: '1/3 = 2/6. Since 2/6 > 1/6, Mary ate more bread than John.',
        latex: '\\frac{1}{3} = \\frac{2}{6} > \\frac{1}{6}',
      },
      {
        id: 'q2',
        type: 'sum',
        prompt: '2. What total fraction of the loaf did Mary and John eat altogether?',
        options: ['2/9', '3/6 = 1/2', '5/6', '2/6'],
        correctAnswer: '3/6 = 1/2',
        explanation: '1/3 + 1/6 = 2/6 + 1/6 = 3/6 = 1/2 loaf eaten altogether.',
        latex: '\\frac{1}{3} + \\frac{1}{6} = \\frac{2}{6} + \\frac{1}{6} = \\frac{3}{6} = \\frac{1}{2}',
      },
      {
        id: 'q3',
        type: 'gap',
        prompt: '3. What fraction of the sugar bread loaf is left over for tomorrow?',
        options: ['1/2', '1/3', '1/6', '2/3'],
        correctAnswer: '1/2',
        explanation: '1 Whole - 1/2 eaten = 1/2 loaf remaining.',
        latex: '1 - \\frac{1}{2} = \\frac{1}{2}',
      },
    ],
  },
  {
    id: 'sobolo-jug',
    title: 'Sobolo Beverage Jug',
    badge: 'Drink Proportion',
    icon: '🍹',
    story: 'Kofi prepares a 1-liter pitcher of refreshing Ghanaian Sobolo drink. He pours in 3/8 liter of dark hibiscus extract and 1/4 liter of spicy ginger juice.',
    fractions: [
      { label: 'Hibiscus Extract', num: 3, den: 8 },
      { label: 'Ginger Juice', num: 1, den: 4 },
    ],
    questions: [
      {
        id: 'q1',
        type: 'compare',
        prompt: '1. Which ingredient has the larger volume in the jug?',
        options: ['Hibiscus extract (3/8 L)', 'Ginger juice (1/4 L)', 'Equal volume'],
        correctAnswer: 'Hibiscus extract (3/8 L)',
        explanation: '1/4 L = 2/8 L. Since 3/8 L > 2/8 L, hibiscus extract is larger.',
        latex: '\\frac{3}{8} > \\frac{1}{4} = \\frac{2}{8}',
      },
      {
        id: 'q2',
        type: 'sum',
        prompt: '2. What is the total volume of liquid added so far?',
        options: ['4/12 L', '5/8 L', '4/8 L', '7/8 L'],
        correctAnswer: '5/8 L',
        explanation: '3/8 + 1/4 = 3/8 + 2/8 = 5/8 L total.',
        latex: '\\frac{3}{8} + \\frac{1}{4} = \\frac{3}{8} + \\frac{2}{8} = \\frac{5}{8}',
      },
      {
        id: 'q3',
        type: 'gap',
        prompt: '3. What fraction of the 1-liter jug remains to be filled with cold ice water?',
        options: ['3/8 L', '5/8 L', '1/8 L', '1/2 L'],
        correctAnswer: '3/8 L',
        explanation: '1 - 5/8 = 8/8 - 5/8 = 3/8 L remains for ice water.',
        latex: '1 - \\frac{5}{8} = \\frac{3}{8}',
      },
    ],
  },
  {
    id: 'farm-plot',
    title: 'Community Farm Plot (Cassava & Maize)',
    badge: 'Agriculture Land',
    icon: '🌾',
    story: 'The junior high agriculture club cultivates a 1-hectare community plot. They plant cassava on 2/5 of the hectare and sweet maize on 3/10 of the hectare.',
    fractions: [
      { label: 'Cassava Area', num: 2, den: 5 },
      { label: 'Sweet Maize Area', num: 3, den: 10 },
    ],
    questions: [
      {
        id: 'q1',
        type: 'compare',
        prompt: '1. Which crop occupies more land on the farm?',
        options: ['Cassava (2/5)', 'Sweet Maize (3/10)', 'Equal area'],
        correctAnswer: 'Cassava (2/5)',
        explanation: '2/5 = 4/10. Since 4/10 > 3/10, cassava occupies more land.',
        latex: '\\frac{2}{5} = \\frac{4}{10} > \\frac{3}{10}',
      },
      {
        id: 'q2',
        type: 'sum',
        prompt: '2. What total fraction of the farm plot is cultivated with crops?',
        options: ['5/15', '7/10', '6/10', '8/10'],
        correctAnswer: '7/10',
        explanation: '2/5 + 3/10 = 4/10 + 3/10 = 7/10 hectare cultivated.',
        latex: '\\frac{2}{5} + \\frac{3}{10} = \\frac{4}{10} + \\frac{3}{10} = \\frac{7}{10}',
      },
      {
        id: 'q3',
        type: 'gap',
        prompt: '3. What fraction of the 1-hectare plot remains unplanted for vegetables?',
        options: ['3/10', '7/10', '1/5', '2/10'],
        correctAnswer: '3/10',
        explanation: '1 - 7/10 = 10/10 - 7/10 = 3/10 hectare unplanted.',
        latex: '1 - \\frac{7}{10} = \\frac{3}{10}',
      },
    ],
  },
];

export const WordProblemSolverCreatorWorkspace: React.FC<WordProblemSolverCreatorWorkspaceProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  student,
  onSendToGapWorkspace,
}) => {
  const [activeScenarioId, setActiveScenarioId] = useState<string>('sugar-bread');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { isCorrect: boolean; message: string }>>({});

  // Custom Problem Creator Modal / Form
  const [showCreatorModal, setShowCreatorModal] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customNarrative, setCustomNarrative] = useState<string>('');
  const [customFractions, setCustomFractions] = useState<{ num: number; den: FractionDenominator }[]>([
    { num: 1, den: 4 },
    { num: 1, den: 6 },
  ]);

  const activeScenario = PRELOADED_SCENARIOS.find(s => s.id === activeScenarioId) || PRELOADED_SCENARIOS[0];

  const handleSelectAnswer = (qId: string, option: string) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleValidateQuestion = (question: WordScenario['questions'][0]) => {
    const chosen = selectedAnswers[question.id];
    if (!chosen) {
      playSound('pop');
      return;
    }

    const isCorrect = chosen === question.correctAnswer;
    setFeedback(prev => ({
      ...prev,
      [question.id]: {
        isCorrect,
        message: isCorrect ? `Correct! ${question.explanation}` : `Incorrect. ${question.explanation}`,
      },
    }));

    if (isCorrect) {
      playSound('success');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
      onUpdateLiveLatex(question.latex);

      onLogActivity({
        studentId: student?.id || 'guest',
        studentName: student?.name || 'Guest Student',
        studentLevel: student?.level || 'Form 1',
        topic: 'Missing Gap',
        title: `Solved Word Problem: ${activeScenario.title}`,
        details: `Answered question correctly: "${question.prompt}"`,
        latexExpression: question.latex,
        success: true,
        score: 10,
      });
    } else {
      playSound('slice');
    }
  };

  // Custom problem creation
  const handleAddCustomFraction = () => {
    if (customFractions.length >= 3) return;
    setCustomFractions(prev => [...prev, { num: 1, den: 8 }]);
  };

  const handleRemoveCustomFraction = (idx: number) => {
    setCustomFractions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateCustomFraction = (idx: number, field: 'num' | 'den', val: number) => {
    setCustomFractions(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleAutoLoadCustomProblem = () => {
    if (!customTitle.trim()) {
      playSound('pop');
      return;
    }

    onSendToGapWorkspace({
      title: customTitle,
      addends: customFractions,
    });
    setShowCreatorModal(false);
    playSound('snap');
  };

  return (
    <div id="word-problem-solver-creator-studio" className="space-y-5">
      
      {/* 1. Pre-Loaded Scenarios Header & Creator Trigger */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-black text-sm">
              📖
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Contextual Word Problem Solver & Custom Creator
              </h3>
              <p className="text-xs text-slate-500">
                Explore real Ghanaian curriculum scenarios or write custom story problems for interactive gap-solving.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreatorModal(true)}
              className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>✍️ Custom Problem Creator</span>
            </button>
          </div>
        </div>

        {/* Scenario Selector Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {PRELOADED_SCENARIOS.map((sc) => {
            const isActive = activeScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => {
                  setActiveScenarioId(sc.id);
                  setSelectedAnswers({});
                  setFeedback({});
                  playSound('click');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isActive
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{sc.icon}</span>
                  <div>
                    <div className="text-xs font-black leading-tight">{sc.title}</div>
                    <div className={`text-[10px] ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                      {sc.badge}
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-200 text-slate-700'
                }`}>
                  {sc.questions.length} Qs
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Active Scenario Narrative & Questions */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-md space-y-5">
        
        {/* Story Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span className="text-lg">{activeScenario.icon}</span>
              <span>Curriculum Context: {activeScenario.title}</span>
            </span>

            <button
              onClick={() => {
                onSendToGapWorkspace({
                  title: activeScenario.title,
                  addends: activeScenario.fractions.map(f => ({ num: f.num, den: f.den })),
                });
                playSound('snap');
              }}
              className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Puzzle className="w-3.5 h-3.5" />
              <span>Load into "What's Left?" Manipulative Track</span>
            </button>
          </div>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
            "{activeScenario.story}"
          </p>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800 text-xs">
            {activeScenario.fractions.map((f, fIdx) => (
              <span key={fIdx} className="bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 text-slate-300">
                <strong className="text-white">{f.label}:</strong> {f.num}/{f.den}
              </span>
            ))}
          </div>
        </div>

        {/* Multi-Step Interactive Questions */}
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Interactive Mathematical Inquiry Questions:
          </h4>

          {activeScenario.questions.map((q, idx) => {
            const userChoice = selectedAnswers[q.id];
            const qFeedback = feedback[q.id];

            return (
              <div
                key={q.id}
                className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3"
              >
                <div className="text-sm font-bold text-slate-100">
                  {q.prompt}
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt) => {
                    const isSelected = userChoice === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectAnswer(q.id, opt)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                          isSelected ? 'border-white bg-white text-blue-600 font-black' : 'border-slate-500'
                        }`}>
                          {isSelected ? '✓' : ''}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Validation and Feedback */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => handleValidateQuestion(q)}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Check Answer</span>
                  </button>

                  {qFeedback && (
                    <div className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                      qFeedback.isCorrect
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                        : 'bg-rose-950/80 text-rose-300 border-rose-700'
                    }`}>
                      <span>{qFeedback.message}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* 3. Custom Problem Creator Modal */}
      {showCreatorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-900">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
                  ✍️
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Custom Word Problem Creator
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create your own context, quantities, and auto-evaluate gap solutions.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreatorModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Story Title:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kente Weaving Ribbon Share"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Story Narrative:
                </label>
                <textarea
                  placeholder="Describe who used which fraction of the whole item..."
                  value={customNarrative}
                  onChange={(e) => setCustomNarrative(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Addend Fractions Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    Consumed Fractions (up to 3):
                  </label>
                  {customFractions.length < 3 && (
                    <button
                      onClick={handleAddCustomFraction}
                      className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Fraction
                    </button>
                  )}
                </div>

                {customFractions.map((frac, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-600">Part {idx + 1}:</span>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={frac.num}
                      onChange={(e) => handleUpdateCustomFraction(idx, 'num', parseInt(e.target.value) || 1)}
                      className="w-14 px-2 py-1 rounded-lg border border-slate-300 text-center font-bold"
                    />
                    <span className="font-black text-slate-500">/</span>
                    <select
                      value={frac.den}
                      onChange={(e) => handleUpdateCustomFraction(idx, 'den', parseInt(e.target.value) as FractionDenominator)}
                      className="px-2 py-1 rounded-lg border border-slate-300 font-bold"
                    >
                      {[2, 3, 4, 5, 6, 8, 10, 12, 16].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>

                    {customFractions.length > 1 && (
                      <button
                        onClick={() => handleRemoveCustomFraction(idx)}
                        className="text-rose-500 hover:text-rose-700 ml-auto cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowCreatorModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleAutoLoadCustomProblem}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>✨ Auto-Load into Manipulative Canvas</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
