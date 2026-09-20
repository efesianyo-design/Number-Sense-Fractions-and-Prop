import React, { useState, useMemo, useEffect } from 'react';
import { FractionDenominator, ActivityLog, StudentProfile, FractionStripItem } from '../../types';
import { DENOMINATORS, FRACTION_PALETTE, fractionToLatex, simplifyFraction, lcm, gcd } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti } from '../../utils/confetti';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight,
  Layers,
  Award,
  ChevronRight,
  Lightbulb
} from 'lucide-react';

interface AdditionUnlikeDenominatorsTabProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
  initialFractions?: {
    f1?: { num: number; den: FractionDenominator };
    f2?: { num: number; den: FractionDenominator };
  };
}

interface Addend {
  id: string;
  num: number;
  den: FractionDenominator;
}

interface AdditionPreset {
  id: string;
  title: string;
  description: string;
  isLikeTerms?: boolean;
  addends: { num: number; den: FractionDenominator }[];
}

const LIKE_PRESETS: AdditionPreset[] = [
  {
    id: 'like1',
    title: '1/4 + 2/4 = 3/4',
    description: 'Identical quarter tiles combine directly: 1 + 2 = 3 quarters.',
    isLikeTerms: true,
    addends: [{ num: 1, den: 4 }, { num: 2, den: 4 }],
  },
  {
    id: 'like2',
    title: '2/5 + 1/5 = 3/5',
    description: 'Same fifths denominator: (2 + 1)/5 = 3/5.',
    isLikeTerms: true,
    addends: [{ num: 2, den: 5 }, { num: 1, den: 5 }],
  },
  {
    id: 'like3',
    title: '3/8 + 2/8 = 5/8',
    description: 'Unit size is 1/8: 3 eighths + 2 eighths = 5/8.',
    isLikeTerms: true,
    addends: [{ num: 3, den: 8 }, { num: 2, den: 8 }],
  },
  {
    id: 'like4',
    title: '1/6 + 4/6 = 5/6',
    description: 'Same sixths unit: 1/6 + 4/6 = 5/6.',
    isLikeTerms: true,
    addends: [{ num: 1, den: 6 }, { num: 4, den: 6 }],
  },
  {
    id: 'like5',
    title: '3/12 + 5/12 = 8/12 = 2/3',
    description: 'Same twelfths combine to 8/12, then simplify to 2/3.',
    isLikeTerms: true,
    addends: [{ num: 3, den: 12 }, { num: 5, den: 12 }],
  },
];

const PRESETS: AdditionPreset[] = [
  {
    id: 'p1',
    title: '1/2 + 1/3 (Benchmark Sixths)',
    description: 'Halves and Thirds require LCM(2, 3) = 6.',
    addends: [{ num: 1, den: 2 }, { num: 1, den: 3 }],
  },
  {
    id: 'p2',
    title: '1/3 + 1/4 (Twelfths Bridge)',
    description: 'Thirds and Fourths subdivide cleanly into 12ths.',
    addends: [{ num: 1, den: 3 }, { num: 1, den: 4 }],
  },
  {
    id: 'p3',
    title: '1/4 + 1/6 (Multiple of 12)',
    description: 'Fourths and Sixths share LCM(4, 6) = 12.',
    addends: [{ num: 1, den: 4 }, { num: 1, den: 6 }],
  },
  {
    id: 'p4',
    title: '2/3 + 1/6 (One-Way Conversion)',
    description: 'Only 2/3 needs renaming into 4/6 to add 1/6.',
    addends: [{ num: 2, den: 3 }, { num: 1, den: 6 }],
  },
  {
    id: 'p5',
    title: '1/2 + 1/4 (Halves & Quarters)',
    description: 'Halves rename to 2/4, resulting in 3/4.',
    addends: [{ num: 1, den: 2 }, { num: 1, den: 4 }],
  },
  {
    id: 'p6',
    title: '2/5 + 1/2 (Tenths Family)',
    description: 'Fifths and Halves convert to Tenths: 4/10 + 5/10 = 9/10.',
    addends: [{ num: 2, den: 5 }, { num: 1, den: 2 }],
  },
  {
    id: 'p7',
    title: '3/8 + 1/4 (Eighths Family)',
    description: 'Fourths scale to 2/8, giving total 5/8.',
    addends: [{ num: 3, den: 8 }, { num: 1, den: 4 }],
  },
];

export const AdditionUnlikeDenominatorsTab: React.FC<AdditionUnlikeDenominatorsTabProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  student,
  initialFractions,
}) => {
  // Mode: Like terms (same denominator) vs Unlike terms (LCM modeling)
  const [additionMode, setAdditionMode] = useState<'unlike' | 'like'>('unlike');

  // Addends in top row
  const [addends, setAddends] = useState<Addend[]>([
    { id: 'a1', num: initialFractions?.f1?.num || 1, den: initialFractions?.f1?.den || 2 },
    { id: 'a2', num: initialFractions?.f2?.num || 1, den: initialFractions?.f2?.den || 3 },
  ]);

  // Selected testing denominator for bottom test lane
  const [testedDen, setTestedDen] = useState<FractionDenominator | null>(6);
  const [showExplanation, setShowExplanation] = useState(true);

  // Sync initialFractions if provided
  useEffect(() => {
    if (initialFractions?.f1 && initialFractions?.f2) {
      setAddends([
        { id: 'a1', num: initialFractions.f1.num, den: initialFractions.f1.den },
        { id: 'a2', num: initialFractions.f2.num, den: initialFractions.f2.den },
      ]);
      const isLike = initialFractions.f1.den === initialFractions.f2.den;
      setAdditionMode(isLike ? 'like' : 'unlike');
      const c = lcm(initialFractions.f1.den, initialFractions.f2.den);
      setTestedDen((DENOMINATORS as readonly number[]).includes(c) ? (c as FractionDenominator) : 12);
    }
  }, [initialFractions]);

  // Calculate sum and LCM
  const { totalValue, commonDen, convertedAddends, totalCommonNum, simplifiedSum, isProperLCM } = useMemo(() => {
    let common = 1;
    let sumVal = 0;
    addends.forEach((a) => {
      common = lcm(common, a.den);
      sumVal += a.num / a.den;
    });

    let totalNum = 0;
    const conv = addends.map((a) => {
      const mult = common / a.den;
      const newNum = a.num * mult;
      totalNum += newNum;
      return {
        ...a,
        mult,
        newNum,
        commonDen: common,
      };
    });

    const simp = simplifyFraction(totalNum, common);
    const properLCM = testedDen !== null && (testedDen % common === 0 || common % testedDen === 0 && Math.abs(sumVal * testedDen - Math.round(sumVal * testedDen)) < 0.0001);

    return {
      totalValue: sumVal,
      commonDen: common,
      convertedAddends: conv,
      totalCommonNum: totalNum,
      simplifiedSum: simp,
      isProperLCM: properLCM,
    };
  }, [addends, testedDen]);

  // Check if tested denominator aligns with each individual addend and the total sum
  const testedDenAnalysis = useMemo(() => {
    if (!testedDen) return null;

    // Check if every addend partition point lands on a testedDen grid line
    let currentPos = 0;
    let allJointsAlign = true;
    const jointAlignments: { pos: number; aligns: boolean }[] = [];

    addends.forEach((a) => {
      currentPos += a.num / a.den;
      const testedIndex = currentPos * testedDen;
      const isInteger = Math.abs(testedIndex - Math.round(testedIndex)) < 0.0001;
      if (!isInteger) allJointsAlign = false;
      jointAlignments.push({ pos: currentPos, aligns: isInteger });
    });

    const totalTestedUnits = totalValue * testedDen;
    const isTotalInteger = Math.abs(totalTestedUnits - Math.round(totalTestedUnits)) < 0.0001;
    const countNeeded = Math.round(totalTestedUnits);

    const isLcmMatch = testedDen === commonDen;
    const isValidMultiple = allJointsAlign && isTotalInteger;

    return {
      den: testedDen,
      allJointsAlign,
      isTotalInteger,
      countNeeded,
      isLcmMatch,
      isValidMultiple,
      jointAlignments,
    };
  }, [testedDen, addends, totalValue, commonDen]);

  // Live KaTeX formula sync
  const stepByStepLatex = useMemo(() => {
    if (addends.length === 0) return '0 = 0';
    const originalParts = addends.map((a) => `\\frac{${a.num}}{${a.den}}`).join(' + ');
    const convertedParts = convertedAddends.map((a) => `\\frac{${a.newNum}}{${commonDen}}`).join(' + ');
    const combinedNumerator = `\\frac{${convertedAddends.map((a) => a.newNum).join(' + ')}}{${commonDen}}`;
    const finalFrac = `\\frac{${totalCommonNum}}{${commonDen}}`;
    const simpFrac = simplifiedSum.den !== commonDen ? ` = \\frac{${simplifiedSum.num}}{${simplifiedSum.den}}` : '';

    return `${originalParts} = ${convertedParts} = ${combinedNumerator} = ${finalFrac}${simpFrac}`;
  }, [addends, convertedAddends, commonDen, totalCommonNum, simplifiedSum]);

  useEffect(() => {
    onUpdateLiveLatex(`\\text{Addition: } ${stepByStepLatex}`);
  }, [stepByStepLatex, onUpdateLiveLatex]);

  // Load a preset
  const handleLoadPreset = (preset: AdditionPreset) => {
    setAddends(preset.addends.map((a, idx) => ({ id: `a_${Date.now()}_${idx}`, num: a.num, den: a.den })));
    let cDen = 1;
    preset.addends.forEach((a) => { cDen = lcm(cDen, a.den); });
    setTestedDen((DENOMINATORS as readonly number[]).includes(cDen) ? (cDen as FractionDenominator) : 12);
    playSound('jump');
  };

  // Add a unit piece to top row
  const handleAddUnitAddend = (den: FractionDenominator) => {
    if (totalValue + 1 / den > 2.05) {
      playSound('pop');
      return;
    }
    const newAddend: Addend = {
      id: `add_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      num: 1,
      den,
    };
    setAddends((prev) => [...prev, newAddend]);
    playSound('snap');
  };

  // Remove addend
  const handleRemoveAddend = (id: string) => {
    if (addends.length <= 1) return;
    setAddends((prev) => prev.filter((a) => a.id !== id));
    playSound('slice');
  };

  // Change addend numerator/denominator
  const handleUpdateAddend = (id: string, num: number, den: FractionDenominator) => {
    setAddends((prev) => prev.map((a) => (a.id === id ? { ...a, num, den } : a)));
    playSound('click');
  };

  // Select a testing denominator
  const handleTestDenominator = (den: FractionDenominator) => {
    setTestedDen(den);
    if (den === commonDen) {
      playSound('success');
      fireMathConfetti();
      onLogActivity({
        studentId: student?.id || 'guest',
        studentName: student?.name || 'Guest Student',
        studentLevel: student?.level || 'Form 1',
        topic: 'Fraction Addition',
        title: `Found Common Denominator (${den}ths) for Addition`,
        details: `Subdivided ${addends.map((a) => `${a.num}/${a.den}`).join(' + ')} into ${totalCommonNum}/${den}`,
        latexExpression: stepByStepLatex,
        success: true,
        score: 30,
      });
    } else {
      playSound('pop');
    }
  };

  // Total width scale: 1 Whole is 100% of container when total <= 1, or scaled
  const maxScale = Math.max(1, Math.ceil(totalValue));

  return (
    <div id="fraction-addition-engine" className="space-y-5 animate-fadeIn">
      {/* 1. Header Toolbar & Quick Presets */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                Fraction Addition & Unlike Denominators Modeler
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  LCM Auto-Partition
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Join fractions with unlike denominators, test subdivision tiles, and discover the exact Common Denominator.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAddends([{ id: 'a1', num: 1, den: 2 }, { id: 'a2', num: 1, den: 3 }]);
                setTestedDen(6);
                playSound('pop');
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset (1/2 + 1/3)
            </button>
          </div>
        </div>

        {/* Mode Toggle: Like Terms vs. Unlike Terms */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700">Addition Strategy Mode:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setAdditionMode('like');
                handleLoadPreset(LIKE_PRESETS[0]);
                playSound('click');
              }}
              className={`px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                additionMode === 'like'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              🤝 Like Terms (Same Denominator)
            </button>
            <button
              onClick={() => {
                setAdditionMode('unlike');
                handleLoadPreset(PRESETS[0]);
                playSound('click');
              }}
              className={`px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                additionMode === 'unlike'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              🔀 Unlike Terms (LCM Modeling)
            </button>
          </div>
        </div>

        {/* Quick Classroom Presets */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{additionMode === 'like' ? 'Like Denominator Presets:' : 'Unlike Denominators (LCM) Presets:'}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {additionMode === 'like' ? 'Direct numerator sum (a+b)/d' : 'Multi-step multiplier conversion'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(additionMode === 'like' ? LIKE_PRESETS : PRESETS).map((p) => {
              const isMatch = addends.length === p.addends.length &&
                addends.every((a, idx) => a.num === p.addends[idx]?.num && a.den === p.addends[idx]?.den);

              return (
                <button
                  key={p.id}
                  onClick={() => handleLoadPreset(p)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    isMatch
                      ? additionMode === 'like'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs scale-[1.02]'
                        : 'bg-amber-500 border-amber-500 text-slate-950 font-black shadow-xs scale-[1.02]'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {p.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Main Two-Tier Strip Model Canvas */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-6">
        
        {/* Top Tier: Addends Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Top Tier: Addends Joined End-to-End</span>
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              Total Length = {(totalValue * 100).toFixed(1)}% of 1 Whole ({totalValue.toFixed(3)})
            </span>
          </div>

          {/* 1 Whole Reference Ruler */}
          <div className="w-full relative h-3 flex items-center">
            <div className="w-full h-1 bg-slate-200 rounded-full relative">
              <div className="absolute left-0 top-0 h-full bg-slate-400 w-full" />
              <div className="absolute right-0 -top-3 text-[9px] font-bold font-mono text-slate-400">
                1 Whole (100%)
              </div>
            </div>
          </div>

          {/* Addends Train Strip */}
          <div className="w-full h-16 bg-slate-50 border-2 border-slate-300 rounded-2xl flex items-center relative overflow-hidden shadow-inner p-1">
            {addends.map((addend, idx) => {
              const palette = FRACTION_PALETTE[addend.den] || FRACTION_PALETTE[2];
              const pieceWidthPct = (addend.num / addend.den / maxScale) * 100;

              return (
                <div
                  key={addend.id}
                  style={{ width: `${pieceWidthPct}%` }}
                  className={`h-full ${palette.bg} border-r-2 border-white/90 rounded-xl flex items-center justify-between px-3 text-white shadow-xs transition-all relative group select-none`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-black drop-shadow-xs">
                      {addend.num > 1 ? `${addend.num}/${addend.den}` : `1/${addend.den}`}
                    </span>
                    <span className="text-[9px] font-medium text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      {( (addend.num / addend.den) * 100 ).toFixed(1)}%
                    </span>
                  </div>

                  {addends.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAddend(addend.id);
                      }}
                      title="Remove piece"
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md bg-black/30 hover:bg-black/60 text-white flex items-center justify-center text-xs transition-opacity cursor-pointer"
                    >
                      ✕
                    </button>
                  )}

                  {/* Right Edge Joint Marker */}
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/40 shadow-xs" />
                </div>
              );
            })}

            {/* Empty remaining gap if < maxScale */}
            {totalValue < maxScale && (
              <div 
                style={{ width: `${((maxScale - totalValue) / maxScale) * 100}%` }}
                className="h-full bg-slate-100/50 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px] italic"
              >
                Remaining to Whole
              </div>
            )}
          </div>
        </div>

        {/* Mid Alignment Laser & Joint Indicators */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">Addends:</span>
            <div className="flex items-center space-x-1.5 font-bold">
              {addends.map((a, i) => (
                <React.Fragment key={a.id}>
                  {i > 0 && <span className="text-slate-400">+</span>}
                  <span className={`px-2 py-0.5 rounded-lg text-white text-xs ${FRACTION_PALETTE[a.den].bg}`}>
                    {a.num === 1 ? `1/${a.den}` : `${a.num}/${a.den}`}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-semibold">Least Common Multiple:</span>
            <span className="bg-indigo-100 text-indigo-800 font-black px-2.5 py-0.5 rounded-lg border border-indigo-200">
              LCM = {commonDen}
            </span>
          </div>
        </div>

        {/* Bottom Tier: Subdivided Common Partition Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Bottom Tier: Subdivided Unit Pieces ({testedDen ? `${testedDen}ths` : 'Choose...'})</span>
            </span>

            {testedDenAnalysis && (
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                testedDenAnalysis.isValidMultiple
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {testedDenAnalysis.isValidMultiple ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Exact Alignment! ({testedDenAnalysis.countNeeded} pieces of 1/{testedDen})</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Edge Misalignment! {testedDen}ths do not subdivide all addends cleanly.</span>
                  </>
                )}
              </span>
            )}
          </div>

          {/* Subdivided Test Strip */}
          <div className="w-full h-16 bg-slate-50 border-2 border-slate-300 rounded-2xl flex items-center relative overflow-hidden shadow-inner p-1">
            {testedDen ? (
              Array.from({ length: Math.ceil(maxScale * testedDen) }).map((_, idx) => {
                const piecePos = idx / testedDen;
                const isWithinTotal = piecePos < totalValue - 0.0001;
                const isOverhang = !isWithinTotal && piecePos < Math.ceil(totalValue * testedDen) / testedDen;
                const palette = FRACTION_PALETTE[testedDen] || FRACTION_PALETTE[6];
                const unitWidthPct = (1 / testedDen / maxScale) * 100;

                if (piecePos >= maxScale) return null;

                return (
                  <div
                    key={idx}
                    style={{ width: `${unitWidthPct}%` }}
                    className={`h-full border-r-2 border-white flex flex-col items-center justify-center text-xs font-bold transition-all select-none ${
                      isWithinTotal
                        ? `${palette.bg} text-white shadow-xs`
                        : isOverhang
                        ? 'bg-rose-200 border-rose-400 text-rose-800 opacity-60'
                        : 'bg-slate-200/50 text-slate-400'
                    }`}
                  >
                    <span className="text-[11px] leading-none">1/{testedDen}</span>
                    {isWithinTotal && (
                      <span className="text-[8px] opacity-80 mt-0.5">#{idx + 1}</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs italic">
                Select a denominator from the palette below to test subdivision alignment...
              </div>
            )}
          </div>
        </div>

        {/* 3. Interactive "Try Other Denominators" Palette */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                Try Other Denominators (Test Subdivisions):
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Tap any tile to test if its edges align with both addends:
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
            {DENOMINATORS.map((den) => {
              const isSelected = testedDen === den;
              const isLcm = den === commonDen;
              const palette = FRACTION_PALETTE[den];

              return (
                <button
                  key={den}
                  id={`test-den-${den}-btn`}
                  onClick={() => handleTestDenominator(den)}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 relative ${
                    isSelected
                      ? `${palette.bg} text-white border-transparent shadow-md scale-105 ring-2 ring-blue-500`
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {isLcm && (
                    <span className="absolute -top-2 -right-1 bg-amber-400 text-slate-950 text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full shadow-xs">
                      LCM
                    </span>
                  )}
                  <span className="text-xs sm:text-sm font-black">1/{den}</span>
                  <span className="text-[9px] font-semibold opacity-80">
                    {den}ths
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 4. Live Step-by-Step KaTeX Conversion Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Mathematical Proof & Conversion Steps
              </div>
              <h4 className="text-sm sm:text-base font-black text-white">
                Unlike Denominators to Common Equivalent Fractions
              </h4>
            </div>
          </div>

          <div className="bg-white/10 px-3 py-1 rounded-xl text-xs font-mono text-amber-300 border border-white/10">
            Total = {simplifiedSum.num}/{simplifiedSum.den} ({(totalValue * 100).toFixed(1)}%)
          </div>
        </div>

        {/* Big Display Formula */}
        <div className="bg-slate-950/60 rounded-2xl p-4 sm:p-5 border border-white/10 text-center overflow-x-auto">
          <MathView
            latex={stepByStepLatex}
            displayMode={true}
            className="text-lg sm:text-2xl text-amber-300"
          />
        </div>

        {/* Visual Multiplier Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {convertedAddends.map((item, idx) => (
            <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-blue-200 font-bold">
                <span>Addend #{idx + 1} Conversion</span>
                <span className="bg-blue-500/30 px-2 py-0.5 rounded-md text-amber-300">
                  Scale: ×{item.mult}
                </span>
              </div>
              <div className="flex items-center justify-center py-2 text-white">
                <MathView
                  latex={`\\frac{${item.num} \\times ${item.mult}}{${item.den} \\times ${item.mult}} = \\frac{${item.newNum}}{${item.commonDen}}`}
                  className="text-sm font-semibold"
                />
              </div>
              <div className="text-[10px] text-slate-300 text-center font-medium">
                Rename <span className="text-amber-300 font-bold">{item.num}/{item.den}</span> using common denominator {item.commonDen}
              </div>
            </div>
          ))}

          {/* Summation Card */}
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3 space-y-1.5 sm:col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
              <span>Combine Numerators</span>
              <span className="bg-emerald-500/30 px-2 py-0.5 rounded-md text-emerald-200">
                Sum
              </span>
            </div>
            <div className="flex items-center justify-center py-2 text-white">
              <MathView
                latex={`\\frac{${convertedAddends.map((a) => a.newNum).join(' + ')}}{${commonDen}} = \\frac{${totalCommonNum}}{${commonDen}}`}
                className="text-sm font-semibold text-emerald-300"
              />
            </div>
            <div className="text-[10px] text-emerald-200/80 text-center font-medium">
              Keep common denominator {commonDen} and add the matching unit parts.
            </div>
          </div>
        </div>

        {/* Add Addend Strip Quick Creator */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-amber-400" />
            Add more fraction tiles to the top addends row:
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {DENOMINATORS.slice(0, 7).map((d) => (
              <button
                key={d}
                onClick={() => handleAddUnitAddend(d)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-2.5 py-1 rounded-xl transition-all cursor-pointer"
              >
                +1/{d}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
