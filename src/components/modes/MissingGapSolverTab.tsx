import React, { useState, useMemo, useEffect } from 'react';
import { FractionDenominator, FractionStripItem, ActivityLog, StudentProfile } from '../../types';
import { DENOMINATORS, FRACTION_PALETTE, fractionToLatex, simplifyFraction, lcm, gcd } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti } from '../../utils/confetti';
import { 
  Scissors, 
  Puzzle, 
  Plus, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  HelpCircle,
  ArrowRight,
  Lightbulb,
  Layers,
  Award,
  Minus
} from 'lucide-react';

interface MissingGapSolverTabProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
  initialFractions?: {
    f1?: { num: number; den: FractionDenominator };
    f2?: { num: number; den: FractionDenominator };
  };
}

export interface WordProblemStory {
  id: string;
  title: string;
  category: string;
  story: string;
  takenFractions: { label: string; num: number; den: FractionDenominator }[];
  targetGap: { num: number; den: FractionDenominator };
  stepProofLatex: string;
  explanation: string;
}

export const WORD_PROBLEMS: WordProblemStory[] = [
  {
    id: 'sugar-bread',
    title: 'Accra Sugar Bread Sharing',
    category: 'Ghanaian Market & Fair Share',
    story: 'Mary and John bought a fresh loaf of warm Accra sugar bread. Mary ate 1/3 of the loaf in the morning, and John ate 1/6 in the afternoon.',
    takenFractions: [
      { label: 'Mary (Morning)', num: 1, den: 3 },
      { label: 'John (Afternoon)', num: 1, den: 6 },
    ],
    targetGap: { num: 1, den: 2 },
    stepProofLatex: '1 - \\left(\\frac{1}{3} + \\frac{1}{6}\\right) = 1 - \\left(\\frac{2}{6} + \\frac{1}{6}\\right) = 1 - \\frac{3}{6} = \\frac{3}{6} = \\frac{1}{2}',
    explanation: '1/3 is equivalent to 2/6. Adding John\'s 1/6 gives 3/6 = 1/2. Subtracting from 1 whole loaf leaves 1/2 of the loaf.',
  },
  {
    id: 'sobolo-jug',
    title: "Akua's Sobolo Beverage Jug",
    category: 'Local Beverage Proportions',
    story: 'Akua prepares a 1-liter jug of iced Sobolo. She pours in 1/4 liter ginger juice and 3/8 liter hibiscus extract.',
    takenFractions: [
      { label: 'Ginger Juice', num: 1, den: 4 },
      { label: 'Hibiscus Extract', num: 3, den: 8 },
    ],
    targetGap: { num: 3, den: 8 },
    stepProofLatex: '1 - \\left(\\frac{1}{4} + \\frac{3}{8}\\right) = 1 - \\left(\\frac{2}{8} + \\frac{3}{8}\\right) = 1 - \\frac{5}{8} = \\frac{3}{8}',
    explanation: '1/4 = 2/8. Adding 3/8 = 5/8 total concentrate. Subtracting 5/8 from 1 Whole jug leaves 3/8 remaining for ice water.',
  },
  {
    id: 'classroom-fabric',
    title: 'Classroom Kente Fabric Project',
    category: 'Geometry & Craft',
    story: 'The class has a 1-meter strip of colorful fabric. They use 2/5 for wall banners and 3/10 for student costumes.',
    takenFractions: [
      { label: 'Wall Banners', num: 2, den: 5 },
      { label: 'Costumes', num: 3, den: 10 },
    ],
    targetGap: { num: 3, den: 10 },
    stepProofLatex: '1 - \\left(\\frac{2}{5} + \\frac{3}{10}\\right) = 1 - \\left(\\frac{4}{10} + \\frac{3}{10}\\right) = 1 - \\frac{7}{10} = \\frac{3}{10}',
    explanation: '2/5 = 4/10. 4/10 + 3/10 = 7/10 total fabric used. 1 - 7/10 leaves 3/10 of the meter unused.',
  },
  {
    id: 'kwame-farm',
    title: "Kwame's 1-Hectare Farm Plot",
    category: 'Agriculture & Land Allocation',
    story: 'Kwame partitioned his 1-hectare land. He planted cassava on 1/2 of the plot and sweet potatoes on 1/4 of the plot.',
    takenFractions: [
      { label: 'Cassava', num: 1, den: 2 },
      { label: 'Sweet Potatoes', num: 1, den: 4 },
    ],
    targetGap: { num: 1, den: 4 },
    stepProofLatex: '1 - \\left(\\frac{1}{2} + \\frac{1}{4}\\right) = 1 - \\left(\\frac{2}{4} + \\frac{1}{4}\\right) = 1 - \\frac{3}{4} = \\frac{1}{4}',
    explanation: '1/2 + 1/4 = 2/4 + 1/4 = 3/4 planted. 1 - 3/4 leaves 1/4 hectare unplanted for organic vegetables.',
  },
  {
    id: 'kofi-prep',
    title: "Kofi's 1-Hour Evening Study Block",
    category: 'Time Management',
    story: 'Kofi has a 1-hour study schedule. He worked on Math problems for 1/4 hour and read Science notes for 5/12 hour.',
    takenFractions: [
      { label: 'Mathematics', num: 1, den: 4 },
      { label: 'Science', num: 5, den: 12 },
    ],
    targetGap: { num: 1, den: 3 },
    stepProofLatex: '1 - \\left(\\frac{1}{4} + \\frac{5}{12}\\right) = 1 - \\left(\\frac{3}{12} + \\frac{5}{12}\\right) = 1 - \\frac{8}{12} = \\frac{4}{12} = \\frac{1}{3}',
    explanation: '1/4 = 3/12. 3/12 + 5/12 = 8/12 = 2/3 hour spent. 1 - 8/12 = 4/12 = 1/3 hour (20 minutes) left for English Literature.',
  },
];

interface TakeAwayPreset {
  id: string;
  title: string;
  minuend: { num: number; den: FractionDenominator };
  subtrahend: { num: number; den: FractionDenominator };
  description: string;
}

const TAKEAWAY_PRESETS: TakeAwayPreset[] = [
  {
    id: 'ta1',
    title: '5/6 - 1/3 = 1/2',
    minuend: { num: 5, den: 6 },
    subtrahend: { num: 1, den: 3 },
    description: '1/3 renames to 2/6. Taking 2/6 from 5/6 leaves 3/6 = 1/2.',
  },
  {
    id: 'ta2',
    title: '3/4 - 1/2 = 1/4',
    minuend: { num: 3, den: 4 },
    subtrahend: { num: 1, den: 2 },
    description: '1/2 renames to 2/4. Taking 2/4 from 3/4 leaves 1/4.',
  },
  {
    id: 'ta3',
    title: '7/8 - 1/4 = 5/8',
    minuend: { num: 7, den: 8 },
    subtrahend: { num: 1, den: 4 },
    description: '1/4 renames to 2/8. Taking 2/8 from 7/8 leaves 5/8.',
  },
  {
    id: 'ta4',
    title: '4/5 - 1/2 = 3/10',
    minuend: { num: 4, den: 5 },
    subtrahend: { num: 1, den: 2 },
    description: 'Convert to 10ths: 8/10 - 5/10 = 3/10.',
  },
  {
    id: 'ta5',
    title: '2/3 - 1/4 = 5/12',
    minuend: { num: 2, den: 3 },
    subtrahend: { num: 1, den: 4 },
    description: 'Convert to 12ths: 8/12 - 3/12 = 5/12.',
  },
];

export const MissingGapSolverTab: React.FC<MissingGapSolverTabProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  student,
  initialFractions,
}) => {
  // Mode toggle: 'takeaway' vs 'gap'
  const [subtractionMode, setSubtractionMode] = useState<'takeaway' | 'gap'>('takeaway');

  // --- Take-Away State ---
  const [minuend, setMinuend] = useState<{ num: number; den: FractionDenominator }>(
    initialFractions?.f1 || { num: 5, den: 6 }
  );
  const [subtrahend, setSubtrahend] = useState<{ num: number; den: FractionDenominator }>(
    initialFractions?.f2 || { num: 1, den: 3 }
  );

  // --- Gap Completion State ---
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number>(0);
  const [placedItems, setPlacedItems] = useState<FractionStripItem[]>([
    { id: 'item-1', numerator: 1, denominator: 3, color: FRACTION_PALETTE[3].bg },
    { id: 'item-2', numerator: 1, denominator: 6, color: FRACTION_PALETTE[6].bg },
  ]);

  // Sync initialFractions
  useEffect(() => {
    if (initialFractions?.f1 && initialFractions?.f2) {
      setMinuend(initialFractions.f1);
      setSubtrahend(initialFractions.f2);
      setSubtractionMode('takeaway');
    }
  }, [initialFractions]);

  // --- Take-Away Computation ---
  const takeawayAnalysis = useMemo(() => {
    const common = lcm(minuend.den, subtrahend.den);
    const mNum = minuend.num * (common / minuend.den);
    const sNum = subtrahend.num * (common / subtrahend.den);
    const diffNum = mNum - sNum;
    const isNegative = diffNum < 0;
    const simpDiff = simplifyFraction(Math.abs(diffNum), common);

    const latex = `\\frac{${minuend.num}}{${minuend.den}} - \\frac{${subtrahend.num}}{${subtrahend.den}} = \\frac{${mNum}}{${common}} - \\frac{${sNum}}{${common}} = \\frac{${diffNum}}{${common}}${
      simpDiff.den !== common && !isNegative ? ` = \\frac{${simpDiff.num}}{${simpDiff.den}}` : ''
    }`;

    return {
      common,
      mNum,
      sNum,
      diffNum,
      isNegative,
      simpDiff,
      latex,
      minuendVal: minuend.num / minuend.den,
      subtrahendVal: subtrahend.num / subtrahend.den,
    };
  }, [minuend, subtrahend]);

  // --- Gap Analysis Computation ---
  const currentStory = WORD_PROBLEMS[selectedStoryIndex];
  const gapAnalysis = useMemo(() => {
    let totalVal = 0;
    let commonDen = 1;
    placedItems.forEach(i => {
      commonDen = lcm(commonDen, i.denominator);
    });

    let totalNum = 0;
    placedItems.forEach(i => {
      totalVal += 1 / i.denominator;
      totalNum += (commonDen / i.denominator);
    });

    const simplifiedTaken = simplifyFraction(totalNum, commonDen);
    const isWhole = Math.abs(totalVal - 1) < 0.001;
    const isOverWhole = totalVal > 1.001;
    const hasGap = totalVal > 0.001 && totalVal < 0.999;

    const gapNumerator = Math.max(0, commonDen - totalNum);
    const gapFraction = simplifyFraction(gapNumerator, commonDen);

    const subtractionLatex = `1 - \\left(${
      placedItems.length > 0
        ? placedItems.map((i) => `\\frac{1}{${i.denominator}}`).join(' + ')
        : '0'
    }\\right) = 1 - \\frac{${simplifiedTaken.num}}{${simplifiedTaken.den}} = \\frac{${gapFraction.num}}{${gapFraction.den}}`;

    return {
      totalVal,
      simplifiedTaken,
      gapFraction,
      hasGap,
      isWhole,
      isOverWhole,
      subtractionLatex,
    };
  }, [placedItems]);

  // Sync Live KaTeX
  useEffect(() => {
    if (subtractionMode === 'takeaway') {
      onUpdateLiveLatex(`\\text{Take-Away Subtraction: } ${takeawayAnalysis.latex}`);
    } else {
      onUpdateLiveLatex(`\\text{Missing Gap Subtraction: } ${gapAnalysis.subtractionLatex}`);
    }
  }, [subtractionMode, takeawayAnalysis, gapAnalysis, onUpdateLiveLatex]);

  // Handle take-away preset
  const handleLoadTakeawayPreset = (p: TakeAwayPreset) => {
    setMinuend(p.minuend);
    setSubtrahend(p.subtrahend);
    playSound('jump');
  };

  // Celebrate take-away
  const handleCelebrateTakeaway = () => {
    playSound('success');
    fireMathConfetti();
    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Fraction Subtraction',
      title: `Subtracted: ${takeawayAnalysis.latex}`,
      details: `Solved ${minuend.num}/${minuend.den} - ${subtrahend.num}/${subtrahend.den} = ${takeawayAnalysis.simpDiff.num}/${takeawayAnalysis.simpDiff.den}`,
      latexExpression: takeawayAnalysis.latex,
      success: true,
      score: 30,
    });
  };

  // Add piece to gap completion
  const handleAddPiece = (den: FractionDenominator) => {
    playSound('snap');
    const newItem: FractionStripItem = {
      id: `strip-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      numerator: 1,
      denominator: den,
      color: FRACTION_PALETTE[den]?.bg || 'bg-blue-600',
    };

    setPlacedItems(prev => {
      const next = [...prev, newItem];
      let nextSum = 0;
      next.forEach(i => nextSum += 1 / i.denominator);
      if (Math.abs(nextSum - 1) < 0.001) {
        playSound('success');
        fireMathConfetti();
        onLogActivity({
          studentId: student?.id || 'guest',
          studentName: student?.name || 'Guest Student',
          studentLevel: student?.level || 'Form 1',
          topic: 'Missing Gap',
          title: `Filled Missing Gap for "${currentStory.title}"`,
          details: `Successfully completed 1 Whole using subtraction: ${gapAnalysis.subtractionLatex}`,
          latexExpression: gapAnalysis.subtractionLatex,
          success: true,
          score: 30,
        });
      }
      return next;
    });
  };

  const pMin = FRACTION_PALETTE[minuend.den] || FRACTION_PALETTE[6];
  const pSub = FRACTION_PALETTE[subtrahend.den] || FRACTION_PALETTE[3];

  return (
    <div id="fraction-subtraction-engine" className="space-y-5 animate-fadeIn">
      
      {/* 1. Header Toolbar & Mode Toggle */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                Fraction Subtraction & Gap Solver
                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Take-Away & Gap Completer
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Model fraction subtraction by cutting away portions from a starting strip or finding the missing piece to reach 1 Whole.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (subtractionMode === 'takeaway') {
                  setMinuend({ num: 5, den: 6 });
                  setSubtrahend({ num: 1, den: 3 });
                } else {
                  setSelectedStoryIndex(0);
                  setPlacedItems([
                    { id: 'item-1', numerator: 1, denominator: 3, color: FRACTION_PALETTE[3].bg },
                    { id: 'item-2', numerator: 1, denominator: 6, color: FRACTION_PALETTE[6].bg },
                  ]);
                }
                playSound('pop');
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">Subtraction Strategy:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setSubtractionMode('takeaway');
                playSound('click');
              }}
              className={`px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                subtractionMode === 'takeaway'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              ✂️ Take-Away Subtraction (a/b - c/d)
            </button>
            <button
              onClick={() => {
                setSubtractionMode('gap');
                playSound('click');
              }}
              className={`px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                subtractionMode === 'gap'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              🧩 Gap Completion (1 - Σ Parts)
            </button>
          </div>
        </div>

        {/* Presets Ribbon */}
        {subtractionMode === 'takeaway' ? (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Take-Away Presets:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TAKEAWAY_PRESETS.map((p) => {
                const isMatch = minuend.num === p.minuend.num && minuend.den === p.minuend.den &&
                  subtrahend.num === p.subtrahend.num && subtrahend.den === p.subtrahend.den;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleLoadTakeawayPreset(p)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                      isMatch
                        ? 'bg-rose-600 border-rose-600 text-white shadow-xs scale-[1.02]'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {p.title}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Select Word Problem Story:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {WORD_PROBLEMS.map((story, idx) => (
                <button
                  key={story.id}
                  onClick={() => {
                    setSelectedStoryIndex(idx);
                    setPlacedItems(
                      story.takenFractions.map((f, i) => ({
                        id: `item-${i + 1}`,
                        numerator: 1,
                        denominator: f.den,
                        color: FRACTION_PALETTE[f.den]?.bg || 'bg-blue-600',
                      }))
                    );
                    playSound('jump');
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    selectedStoryIndex === idx
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {story.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Mode Content */}
      {subtractionMode === 'takeaway' ? (
        /* --- Take-Away Interactive Model --- */
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
          
          {/* Fraction Adjuster Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Minuend Control */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Minuend (Start Strip):
                </span>
                <span className="text-sm font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                  {minuend.num}/{minuend.den}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {([2, 3, 4, 5, 6, 8, 10, 12] as FractionDenominator[]).map((d) => (
                  <button
                    key={`m-den-${d}`}
                    onClick={() => {
                      setMinuend({ den: d, num: Math.min(minuend.num, d) });
                      playSound('click');
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                      minuend.den === d
                        ? 'bg-rose-600 text-white border-rose-700'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {d}ths
                  </button>
                ))}
              </div>
            </div>

            {/* Subtrahend Control */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Subtrahend (Take-Away Strip):
                </span>
                <span className="text-sm font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                  {subtrahend.num}/{subtrahend.den}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {([2, 3, 4, 5, 6, 8, 10, 12] as FractionDenominator[]).map((d) => (
                  <button
                    key={`s-den-${d}`}
                    onClick={() => {
                      setSubtrahend({ den: d, num: Math.min(subtrahend.num, d) });
                      playSound('click');
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
                      subtrahend.den === d
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {d}ths
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Visual Take-Away Strip Canvas */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Visual Take-Away Model (Shared 1 Whole Reference)</span>
              <span className="font-mono text-slate-500">
                LCM Common Units: {takeawayAnalysis.common}ths
              </span>
            </div>

            {/* Top Row: Minuend with Cross-hatched Subtrahend */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500">
                1. Minuend Strip ({minuend.num}/{minuend.den}) with Take-Away portion marked:
              </span>
              <div className="w-full h-14 bg-slate-100 rounded-2xl border-2 border-slate-300 p-1 flex relative overflow-hidden shadow-inner">
                {/* Minuend Base */}
                <div
                  style={{ width: `${takeawayAnalysis.minuendVal * 100}%` }}
                  className={`h-full ${pMin.bg} rounded-xl flex items-center justify-between px-3 text-white font-black text-xs relative overflow-hidden shadow-xs`}
                >
                  {/* Take-away cut overlay */}
                  <div
                    style={{ width: `${(takeawayAnalysis.subtrahendVal / takeawayAnalysis.minuendVal) * 100}%` }}
                    className="absolute left-0 top-0 bottom-0 bg-rose-950/70 border-r-2 border-white flex items-center justify-center text-rose-200 text-[10px] font-black italic shadow-inner"
                  >
                    ✂️ Taken -{subtrahend.num}/{subtrahend.den}
                  </div>

                  <span className="relative z-10">{minuend.num}/{minuend.den}</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Remaining Difference */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500">
                2. Remaining Difference Strip:
              </span>
              <div className="w-full h-14 bg-slate-100 rounded-2xl border-2 border-slate-300 p-1 flex relative overflow-hidden shadow-inner">
                <div
                  style={{ width: `${Math.max(0, (takeawayAnalysis.minuendVal - takeawayAnalysis.subtrahendVal) * 100)}%` }}
                  className="h-full bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs transition-all border border-emerald-600 animate-fadeIn"
                >
                  <span>
                    Difference = {takeawayAnalysis.diffNum}/{takeawayAnalysis.common}
                    {takeawayAnalysis.simpDiff.den !== takeawayAnalysis.common && ` (${takeawayAnalysis.simpDiff.num}/${takeawayAnalysis.simpDiff.den})`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Big Equation & Lock Banner */}
          <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-xl border border-rose-800 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Live Subtraction Equation
              </span>
              <button
                onClick={handleCelebrateTakeaway}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Lock & Log Subtraction
              </button>
            </div>
            <div className="bg-slate-950/70 rounded-2xl p-4 text-center overflow-x-auto">
              <MathView
                latex={takeawayAnalysis.latex}
                displayMode={true}
                className="text-lg sm:text-xl text-amber-300 font-bold"
              />
            </div>
          </div>

        </div>
      ) : (
        /* --- Gap Completion Word Problem Mode --- */
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
          
          {/* Story Card */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                {currentStory.category}
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                Target Gap = {currentStory.targetGap.num}/{currentStory.targetGap.den}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {currentStory.story}
            </p>
          </div>

          {/* 1 Whole Reference vs Placed Pieces */}
          <div className="space-y-4">
            <div className="w-full h-14 bg-slate-100 rounded-2xl border-2 border-slate-300 p-1 flex relative overflow-hidden shadow-inner">
              <div className="w-full h-full bg-slate-800 rounded-xl flex items-center justify-center text-white font-black text-xs">
                1 Whole Reference
              </div>
            </div>

            {/* Placed Pieces Lane */}
            <div className="w-full h-14 bg-slate-100 rounded-2xl border-2 border-slate-300 p-1 flex relative overflow-hidden shadow-inner gap-1">
              {placedItems.map((item) => (
                <div
                  key={item.id}
                  style={{ width: `${(1 / item.denominator) * 100}%` }}
                  className={`h-full ${item.color} rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs relative group`}
                >
                  <span>1/{item.denominator}</span>
                  <button
                    onClick={() => {
                      playSound('pop');
                      setPlacedItems(prev => prev.filter(i => i.id !== item.id));
                    }}
                    className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Missing Gap Shaded Area */}
              {gapAnalysis.hasGap && (
                <div
                  style={{ width: `${(1 - gapAnalysis.totalVal) * 100}%` }}
                  className="h-full bg-amber-400/20 border-2 border-dashed border-amber-500 rounded-xl flex items-center justify-center text-amber-800 font-black text-xs animate-pulse"
                >
                  Missing Gap: {gapAnalysis.gapFraction.num}/{gapAnalysis.gapFraction.den}
                </div>
              )}
            </div>
          </div>

          {/* Palette to Add Pieces */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700">Add Test Pieces to Fill Gap:</span>
            <div className="flex flex-wrap gap-1.5">
              {([2, 3, 4, 5, 6, 8, 10, 12] as FractionDenominator[]).map((d) => (
                <button
                  key={`gap-tile-${d}`}
                  onClick={() => handleAddPiece(d)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-700 cursor-pointer transition-all active:scale-95"
                >
                  + 1/{d}
                </button>
              ))}
            </div>
          </div>

          {/* Big Equation */}
          <div className="bg-slate-950 text-white rounded-2xl p-4 text-center overflow-x-auto">
            <MathView
              latex={gapAnalysis.subtractionLatex}
              displayMode={true}
              className="text-base sm:text-lg text-amber-300 font-bold"
            />
          </div>

        </div>
      )}

    </div>
  );
};
