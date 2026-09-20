import React, { useState, useMemo, useEffect } from 'react';
import { FractionDenominator, FractionStripItem, ActivityLog, StudentProfile } from '../../types';
import { DENOMINATORS, FRACTION_PALETTE, fractionToLatex, simplifyFraction, lcm } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti } from '../../utils/confetti';
import { 
  Scale, 
  Plus, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  ArrowRightLeft, 
  HelpCircle,
  TrendingUp,
  Layers,
  Award
} from 'lucide-react';

interface FractionComparatorTabProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
}

interface ChallengePreset {
  id: string;
  title: string;
  description: string;
  laneA: { num: number; den: FractionDenominator }[];
  laneB: { num: number; den: FractionDenominator }[];
  prompt: string;
}

const CHALLENGE_PRESETS: ChallengePreset[] = [
  {
    id: 'ch-1',
    title: 'Which is greater: 2/3 or 3/4?',
    description: 'Compare two benchmark fractions with different denominators.',
    laneA: [{ num: 2, den: 3 }],
    laneB: [{ num: 3, den: 4 }],
    prompt: 'Load 2/3 in Lane A and 3/4 in Lane B to see the exact difference.',
  },
  {
    id: 'ch-2',
    title: 'Compare 3/5 vs 5/8',
    description: 'Subtle comparison requiring common denominator LCM(5, 8) = 40.',
    laneA: [{ num: 3, den: 5 }],
    laneB: [{ num: 5, den: 8 }],
    prompt: 'Look at the shaded gap difference (1/40 = 2.5%).',
  },
  {
    id: 'ch-3',
    title: 'Equivalence Challenge: 2/4 vs 4/8',
    description: 'Verify if two fractions represent identical lengths.',
    laneA: [{ num: 2, den: 4 }],
    laneB: [{ num: 4, den: 8 }],
    prompt: 'Notice how the ends align perfectly to 1/2 = 50%.',
  },
  {
    id: 'ch-4',
    title: 'Unit Fractions: 1/3 vs 1/4',
    description: 'The denominator rule: larger denominator means smaller piece.',
    laneA: [{ num: 1, den: 3 }],
    laneB: [{ num: 1, den: 4 }],
    prompt: 'See how 1/3 exceeds 1/4 by exactly 1/12.',
  },
];

export const FractionComparatorTab: React.FC<FractionComparatorTabProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  student,
}) => {
  const [laneAItems, setLaneAItems] = useState<FractionStripItem[]>([
    { id: 'a-1', numerator: 1, denominator: 3, color: FRACTION_PALETTE[3].bg },
    { id: 'a-2', numerator: 1, denominator: 3, color: FRACTION_PALETTE[3].bg },
  ]);

  const [laneBItems, setLaneBItems] = useState<FractionStripItem[]>([
    { id: 'b-1', numerator: 1, denominator: 4, color: FRACTION_PALETTE[4].bg },
    { id: 'b-2', numerator: 1, denominator: 4, color: FRACTION_PALETTE[4].bg },
    { id: 'b-3', numerator: 1, denominator: 4, color: FRACTION_PALETTE[4].bg },
  ]);

  const [activeLane, setActiveLane] = useState<'A' | 'B'>('A');

  // Compute lane A statistics
  const laneAStats = useMemo(() => {
    let totalVal = 0;
    let commonDen = 1;
    laneAItems.forEach(i => {
      commonDen = lcm(commonDen, i.denominator);
    });
    let totalNum = 0;
    laneAItems.forEach(i => {
      totalVal += 1 / i.denominator;
      totalNum += commonDen / i.denominator;
    });
    const simplified = simplifyFraction(totalNum, commonDen);
    return { totalVal, rawNum: totalNum, rawDen: commonDen, simplifiedNum: simplified.num, simplifiedDen: simplified.den };
  }, [laneAItems]);

  // Compute lane B statistics
  const laneBStats = useMemo(() => {
    let totalVal = 0;
    let commonDen = 1;
    laneBItems.forEach(i => {
      commonDen = lcm(commonDen, i.denominator);
    });
    let totalNum = 0;
    laneBItems.forEach(i => {
      totalVal += 1 / i.denominator;
      totalNum += commonDen / i.denominator;
    });
    const simplified = simplifyFraction(totalNum, commonDen);
    return { totalVal, rawNum: totalNum, rawDen: commonDen, simplifiedNum: simplified.num, simplifiedDen: simplified.den };
  }, [laneBItems]);

  // Comparison evaluation
  const comparisonResult = useMemo(() => {
    const diff = laneAStats.totalVal - laneBStats.totalVal;
    const absDiff = Math.abs(diff);
    const commonDen = lcm(laneAStats.simplifiedDen, laneBStats.simplifiedDen);
    const convertedNumA = laneAStats.simplifiedNum * (commonDen / laneAStats.simplifiedDen);
    const convertedNumB = laneBStats.simplifiedNum * (commonDen / laneBStats.simplifiedDen);
    const diffNum = Math.abs(convertedNumA - convertedNumB);
    const simplifiedDiff = simplifyFraction(diffNum, commonDen);

    let relation: 'gt' | 'lt' | 'eq' = 'eq';
    let relationSymbol = '=';
    if (diff > 0.0001) {
      relation = 'gt';
      relationSymbol = '>';
    } else if (diff < -0.0001) {
      relation = 'lt';
      relationSymbol = '<';
    }

    const latexStatement = `\\frac{${laneAStats.simplifiedNum}}{${laneAStats.simplifiedDen}} ${relationSymbol} \\frac{${laneBStats.simplifiedNum}}{${laneBStats.simplifiedDen}}`;
    const diffLatex = `\\Delta = \\left|\\frac{${laneAStats.simplifiedNum}}{${laneAStats.simplifiedDen}} - \\frac{${laneBStats.simplifiedNum}}{${laneBStats.simplifiedDen}}\\right| = \\frac{${simplifiedDiff.num}}{${simplifiedDiff.den}}`;

    return {
      relation,
      relationSymbol,
      diff,
      absDiff,
      simplifiedDiff,
      commonDen,
      convertedNumA,
      convertedNumB,
      latexStatement,
      diffLatex,
    };
  }, [laneAStats, laneBStats]);

  // Sync to KaTeX ribbon and audio
  useEffect(() => {
    onUpdateLiveLatex(`\\text{Inequality: } ${comparisonResult.latexStatement}`);
  }, [comparisonResult, onUpdateLiveLatex]);

  const handleAddPiece = (den: FractionDenominator, lane: 'A' | 'B') => {
    playSound('snap');
    const newItem: FractionStripItem = {
      id: `piece-${lane}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      numerator: 1,
      denominator: den,
      color: FRACTION_PALETTE[den]?.bg || 'bg-blue-600',
    };

    if (lane === 'A') {
      setLaneAItems(prev => [...prev, newItem]);
    } else {
      setLaneBItems(prev => [...prev, newItem]);
    }
  };

  const handleRemovePiece = (id: string, lane: 'A' | 'B') => {
    playSound('pop');
    if (lane === 'A') {
      setLaneAItems(prev => prev.filter(item => item.id !== id));
    } else {
      setLaneBItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleClearLane = (lane: 'A' | 'B') => {
    playSound('click');
    if (lane === 'A') setLaneAItems([]);
    else setLaneBItems([]);
  };

  const handleBridgeGap = () => {
    const diffData = comparisonResult.simplifiedDiff;
    if (diffData.num === 0) return;
    const targetDen = diffData.den as FractionDenominator;
    const count = diffData.num;

    // Check if targetDen is in palette
    if ((DENOMINATORS as readonly number[]).includes(targetDen)) {
      const newItems: FractionStripItem[] = [];
      for (let i = 0; i < count; i++) {
        newItems.push({
          id: `bridge-${Date.now()}-${i}`,
          numerator: 1,
          denominator: targetDen,
          color: FRACTION_PALETTE[targetDen]?.bg || 'bg-amber-500',
        });
      }

      if (comparisonResult.relation === 'gt') {
        // Lane B is smaller, add to B
        setLaneBItems(prev => [...prev, ...newItems]);
      } else if (comparisonResult.relation === 'lt') {
        // Lane A is smaller, add to A
        setLaneAItems(prev => [...prev, ...newItems]);
      }

      playSound('success');
      fireMathConfetti();

      onLogActivity({
        studentId: student?.id || 'guest',
        studentName: student?.name || 'Guest Student',
        studentLevel: student?.level || 'Form 1',
        topic: 'Inequality Comparator',
        title: `Bridged Gap (+${count}/${targetDen})`,
        details: `Added ${count} × 1/${targetDen} to balance Lane A and Lane B. Resulting in equality!`,
        latexExpression: comparisonResult.diffLatex,
        success: true,
        score: 25,
      });
    } else {
      playSound('pop');
    }
  };

  const handleLoadChallenge = (challenge: ChallengePreset) => {
    playSound('snap');
    const itemsA: FractionStripItem[] = [];
    challenge.laneA.forEach((f, idx) => {
      for (let i = 0; i < f.num; i++) {
        itemsA.push({
          id: `ch-a-${idx}-${i}-${Math.random().toString(36).substring(2, 5)}`,
          numerator: 1,
          denominator: f.den,
          color: FRACTION_PALETTE[f.den]?.bg || 'bg-blue-600',
        });
      }
    });

    const itemsB: FractionStripItem[] = [];
    challenge.laneB.forEach((f, idx) => {
      for (let i = 0; i < f.num; i++) {
        itemsB.push({
          id: `ch-b-${idx}-${i}-${Math.random().toString(36).substring(2, 5)}`,
          numerator: 1,
          denominator: f.den,
          color: FRACTION_PALETTE[f.den]?.bg || 'bg-green-600',
        });
      }
    });

    setLaneAItems(itemsA);
    setLaneBItems(itemsB);

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Inequality Comparator',
      title: `Loaded Challenge: ${challenge.title}`,
      details: challenge.description,
      latexExpression: `\\text{Challenge: } ${challenge.title}`,
      success: true,
      score: 10,
    });
  };

  return (
    <div id="fraction-comparator-workspace" className="space-y-6 animate-fadeIn">
      
      {/* Top Challenge Presets Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            Quick Comparison Challenges
          </span>
          <span className="text-xs text-slate-500 font-medium">Click to load preset into lanes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {CHALLENGE_PRESETS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => handleLoadChallenge(ch)}
              className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/50 transition-all cursor-pointer group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 leading-snug">
                {ch.title}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {ch.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Comparison Canvas with Shared Metric Ruler */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-7 shadow-inner space-y-6 relative">
        
        {/* Shared Unit-Length Ruler (0 to 1 Whole with tick marks) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>0</span>
            <span className="hidden sm:inline">1/4 (25%)</span>
            <span>1/2 (50%)</span>
            <span className="hidden sm:inline">3/4 (75%)</span>
            <span>1 Whole (100%)</span>
          </div>

          <div className="h-4 w-full bg-slate-100 rounded-lg border border-slate-300 relative flex items-center overflow-hidden">
            {/* Major Ticks */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-600" />
            <div className="absolute left-[25%] top-0 bottom-0 w-0.5 bg-slate-400" />
            <div className="absolute left-[33.333%] top-0 bottom-0 w-0.5 bg-slate-300 border-dashed" />
            <div className="absolute left-[50%] top-0 bottom-0 w-1 bg-slate-700" />
            <div className="absolute left-[66.666%] top-0 bottom-0 w-0.5 bg-slate-300 border-dashed" />
            <div className="absolute left-[75%] top-0 bottom-0 w-0.5 bg-slate-400" />
            <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-slate-600" />

            {/* Sub-divisions */}
            {[1/8, 3/8, 5/8, 7/8, 1/12, 5/12, 7/12, 11/12].map((f, i) => (
              <div 
                key={i} 
                className="absolute top-0 bottom-0 w-px bg-slate-300"
                style={{ left: `${f * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* Dual Lane Comparison Stage */}
        <div className="space-y-4">
          
          {/* LANE A */}
          <div 
            id="lane-a-container"
            onClick={() => setActiveLane('A')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              activeLane === 'A' 
                ? 'bg-cyan-50/40 border-cyan-500 shadow-md ring-4 ring-cyan-50' 
                : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  A
                </span>
                <span className="font-bold text-sm text-slate-800">
                  Lane A (Top Value)
                </span>
                {activeLane === 'A' && (
                  <span className="text-[10px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-400 text-xs font-semibold">Value:</span>
                  <div className="font-bold text-slate-900 text-sm font-serif">
                    <MathView latex={fractionToLatex(laneAStats.simplifiedNum, laneAStats.simplifiedDen)} />
                  </div>
                  <span className="text-slate-500 font-mono text-xs">
                    ({(laneAStats.totalVal * 100).toFixed(1)}%)
                  </span>
                </div>

                {laneAItems.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClearLane('A'); }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Clear Lane A"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Strip Visual Bar */}
            <div className="h-14 w-full bg-white rounded-xl border-2 border-slate-200 flex relative overflow-hidden shadow-inner">
              {laneAItems.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs italic">
                  Lane A is empty. Tap fraction tiles below to add pieces...
                </div>
              ) : (
                <div className="w-full h-full flex items-center">
                  {laneAItems.map((item) => {
                    const widthPct = (1 / item.denominator) * 100;
                    const palette = FRACTION_PALETTE[item.denominator] || FRACTION_PALETTE[2];

                    return (
                      <div
                        key={item.id}
                        style={{ width: `${widthPct}%` }}
                        onClick={(e) => { e.stopPropagation(); handleRemovePiece(item.id, 'A'); }}
                        className={`h-full ${palette.bg} border-r-2 border-white flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-xs transition-transform hover:scale-[1.02] cursor-pointer group relative select-none`}
                        title={`Tap to remove 1/${item.denominator}`}
                      >
                        <MathView latex={`\\frac{1}{${item.denominator}}`} />
                        <span className="absolute hidden group-hover:block bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded -top-5 z-20">
                          Remove
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Gap Overlay Indicator Between Lane A and Lane B */}
          <div className="relative flex items-center justify-center py-1">
            <div className="w-full border-t border-slate-200 absolute" />
            
            <div className="z-10 bg-white px-4 py-1.5 rounded-full border border-slate-300 shadow-sm flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                Comparison Displacement ($\Delta$):
              </span>
              <span className="font-bold text-xs font-serif text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                <MathView latex={comparisonResult.diffLatex} />
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                ({(comparisonResult.absDiff * 100).toFixed(1)}% difference)
              </span>
            </div>
          </div>

          {/* LANE B */}
          <div 
            id="lane-b-container"
            onClick={() => setActiveLane('B')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              activeLane === 'B' 
                ? 'bg-amber-50/40 border-amber-500 shadow-md ring-4 ring-amber-50' 
                : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  B
                </span>
                <span className="font-bold text-sm text-slate-800">
                  Lane B (Bottom Value)
                </span>
                {activeLane === 'B' && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-400 text-xs font-semibold">Value:</span>
                  <div className="font-bold text-slate-900 text-sm font-serif">
                    <MathView latex={fractionToLatex(laneBStats.simplifiedNum, laneBStats.simplifiedDen)} />
                  </div>
                  <span className="text-slate-500 font-mono text-xs">
                    ({(laneBStats.totalVal * 100).toFixed(1)}%)
                  </span>
                </div>

                {laneBItems.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleClearLane('B'); }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Clear Lane B"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Strip Visual Bar */}
            <div className="h-14 w-full bg-white rounded-xl border-2 border-slate-200 flex relative overflow-hidden shadow-inner">
              {laneBItems.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs italic">
                  Lane B is empty. Tap fraction tiles below to add pieces...
                </div>
              ) : (
                <div className="w-full h-full flex items-center">
                  {laneBItems.map((item) => {
                    const widthPct = (1 / item.denominator) * 100;
                    const palette = FRACTION_PALETTE[item.denominator] || FRACTION_PALETTE[2];

                    return (
                      <div
                        key={item.id}
                        style={{ width: `${widthPct}%` }}
                        onClick={(e) => { e.stopPropagation(); handleRemovePiece(item.id, 'B'); }}
                        className={`h-full ${palette.bg} border-r-2 border-white flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-xs transition-transform hover:scale-[1.02] cursor-pointer group relative select-none`}
                        title={`Tap to remove 1/${item.denominator}`}
                      >
                        <MathView latex={`\\frac{1}{${item.denominator}}`} />
                        <span className="absolute hidden group-hover:block bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded -top-5 z-20">
                          Remove
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Real-Time Dynamic Inequality Card */}
        <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col md:flex-row items-center justify-between gap-4 ${
          comparisonResult.relation === 'eq'
            ? 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-100'
            : comparisonResult.relation === 'gt'
            ? 'bg-cyan-50/70 border-cyan-400 ring-4 ring-cyan-50'
            : 'bg-amber-50/70 border-amber-400 ring-4 ring-amber-50'
        }`}>
          
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-md ${
              comparisonResult.relation === 'eq'
                ? 'bg-emerald-600 text-white animate-bounce'
                : comparisonResult.relation === 'gt'
                ? 'bg-cyan-600 text-white'
                : 'bg-amber-600 text-white'
            }`}>
              {comparisonResult.relationSymbol}
            </div>

            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Mathematical Inequality Statement
              </div>
              <div className="text-xl sm:text-2xl font-black font-serif text-slate-900 flex items-center gap-3">
                <MathView latex={comparisonResult.latexStatement} />
              </div>
            </div>
          </div>

          {/* Status & Bridge Gap Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            {comparisonResult.relation === 'eq' ? (
              <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Perfect Equivalence Achieved!</span>
              </div>
            ) : (
              <button
                id="bridge-the-gap-btn"
                onClick={handleBridgeGap}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Bridge Gap (+{comparisonResult.simplifiedDiff.num}/{comparisonResult.simplifiedDiff.den} to {comparisonResult.relation === 'gt' ? 'Lane B' : 'Lane A'})</span>
              </button>
            )}

            <button
              onClick={() => {
                setLaneAItems([]);
                setLaneBItems([]);
                playSound('click');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Both</span>
            </button>
          </div>

        </div>

      </div>

      {/* Piece Selection Tray (Bottom Drawer) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
            Tap to Add Fraction Tile to Lane {activeLane}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Target Lane:</span>
            <button
              onClick={() => { setActiveLane('A'); playSound('pop'); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                activeLane === 'A' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Lane A
            </button>
            <button
              onClick={() => { setActiveLane('B'); playSound('pop'); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                activeLane === 'B' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Lane B
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 pt-1">
          {DENOMINATORS.map((den) => {
            const palette = FRACTION_PALETTE[den] || FRACTION_PALETTE[2];
            return (
              <button
                key={den}
                id={`add-piece-den-${den}`}
                onClick={() => handleAddPiece(den, activeLane)}
                className={`py-2 px-2 rounded-xl ${palette.bg} text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm hover:opacity-90 active:scale-95 cursor-pointer transition-all`}
              >
                <span className="text-[10px] opacity-80 uppercase">+{`1/${den}`}</span>
                <MathView latex={`\\frac{1}{${den}}`} />
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
