import React, { useState, useEffect } from 'react';
import { FractionDenominator, StudentProfile, ActivityLog } from '../../types';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { 
  createRational, 
  sumRationals, 
  subtractRational, 
  compareRational, 
  rationalToDecimal, 
  rationalToLatex,
  Rational 
} from '../../utils/rationalMath';
import confetti from 'canvas-confetti';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  Scale, 
  Link2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Compass
} from 'lucide-react';

interface InequalityBuilderWorkspaceProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
}

const AVAILABLE_DENOMINATORS: FractionDenominator[] = [2, 3, 4, 5, 6, 8, 10, 12, 16];

const FRACTION_COLORS: Record<FractionDenominator, { bg: string; text: string; border: string; bar: string }> = {
  1: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', bar: '#ef4444' },
  2: { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600', bar: '#f43f5e' },
  3: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600', bar: '#f97316' },
  4: { bg: 'bg-yellow-500', text: 'text-slate-950', border: 'border-yellow-600', bar: '#eab308' },
  5: { bg: 'bg-green-600', text: 'text-white', border: 'border-green-700', bar: '#16a34a' },
  6: { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-700', bar: '#0d9488' },
  8: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', bar: '#2563eb' },
  10: { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700', bar: '#9333ea' },
  12: { bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-800', bar: '#334155' },
  16: { bg: 'bg-fuchsia-600', text: 'text-white', border: 'border-fuchsia-700', bar: '#c026d3' },
};

interface LanePiece {
  id: string;
  num: number;
  den: FractionDenominator;
}

// Math helpers
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

export const InequalityBuilderWorkspace: React.FC<InequalityBuilderWorkspaceProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  student,
}) => {
  // Dual Comparison Lanes
  const [laneA, setLaneA] = useState<LanePiece[]>([{ id: 'a1', num: 1, den: 4 }]);
  const [laneB, setLaneB] = useState<LanePiece[]>([{ id: 'b1', num: 1, den: 8 }]);
  const [selectedTargetLane, setSelectedTargetLane] = useState<'A' | 'B'>('A');

  // Compute exact rational sums
  const piecesToRationals = (pieces: LanePiece[]): Rational[] =>
    pieces.map(p => createRational(p.num, p.den));

  const exactA = sumRationals(piecesToRationals(laneA));
  const exactB = sumRationals(piecesToRationals(laneB));

  const sumAVal = rationalToDecimal(exactA);
  const sumBVal = rationalToDecimal(exactB);

  // Exact comparison
  const cmpResult = compareRational(exactA, exactB);
  const isExactEqual = cmpResult === 0 && exactA.numerator > 0;

  // Exact difference
  const exactDiff = subtractRational(exactA, exactB);
  const diffVal = Math.abs(rationalToDecimal(exactDiff));
  const diffFrac = diffVal > 0 ? { num: Math.abs(exactDiff.numerator), den: exactDiff.denominator } : null;

  // Inequality state
  let inequalitySymbol = '=';
  let inequalityColor = 'text-emerald-400';
  let comparisonType: 'greater' | 'less' | 'equal' = 'equal';

  if (cmpResult > 0) {
    inequalitySymbol = '>';
    inequalityColor = 'text-cyan-400';
    comparisonType = 'greater';
  } else if (cmpResult < 0) {
    inequalitySymbol = '<';
    inequalityColor = 'text-amber-400';
    comparisonType = 'less';
  }

  // Update live KaTeX
  useEffect(() => {
    let expr = '';
    if (laneA.length === 0 && laneB.length === 0) {
      expr = '\\text{Add pieces to Lane A and Lane B to compare}';
    } else {
      const exprA = rationalToLatex(exactA);
      const exprB = rationalToLatex(exactB);
      expr = `${exprA} ${inequalitySymbol} ${exprB}`;
      if (diffFrac) {
        expr += ` \\quad (\\Delta = \\frac{${diffFrac.num}}{${diffFrac.den}})`;
      }
    }
    onUpdateLiveLatex(expr);
  }, [exactA.numerator, exactA.denominator, exactB.numerator, exactB.denominator, inequalitySymbol]);

  // Handlers to add pieces
  const handleAddPiece = (den: FractionDenominator) => {
    const newPiece: LanePiece = {
      id: `p-${Date.now()}-${Math.random()}`,
      num: 1,
      den,
    };
    if (selectedTargetLane === 'A') {
      if (sumAVal + 1 / den > 1.5) {
        playSound('pop');
        return;
      }
      setLaneA(prev => [...prev, newPiece]);
    } else {
      if (sumBVal + 1 / den > 1.5) {
        playSound('pop');
        return;
      }
      setLaneB(prev => [...prev, newPiece]);
    }
    playSound('pickup');
  };

  const handleRemovePiece = (lane: 'A' | 'B', id: string) => {
    if (lane === 'A') {
      setLaneA(prev => prev.filter(p => p.id !== id));
    } else {
      setLaneB(prev => prev.filter(p => p.id !== id));
    }
    playSound('drop');
  };

  const handleClearAll = () => {
    setLaneA([]);
    setLaneB([]);
    playSound('pop');
  };

  // Bridge the gap action: computes exact missing piece and adds to smaller lane
  const handleBridgeTheGap = () => {
    if (!diffFrac || diffFrac.num === 0) {
      playSound('pop');
      return;
    }

    // Determine smaller lane
    const targetLane = sumAVal < sumBVal ? 'A' : 'B';
    const validDen = ([1, 2, 3, 4, 5, 6, 8, 10, 12, 16] as FractionDenominator[]).includes(diffFrac.den as any)
      ? (diffFrac.den as FractionDenominator)
      : 12;

    const bridgePiece: LanePiece = {
      id: `bridge-${Date.now()}`,
      num: diffFrac.num,
      den: validDen,
    };

    if (targetLane === 'A') {
      setLaneA(prev => [...prev, bridgePiece]);
    } else {
      setLaneB(prev => [...prev, bridgePiece]);
    }

    playSound('success');
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.65 },
    });

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Fraction Comparator',
      title: 'Bridged Inequality Gap',
      details: `Added ${diffFrac.num}/${diffFrac.den} to balance Lane ${targetLane} with exact equality.`,
      latexExpression: `${rationalToLatex(exactA)} = ${rationalToLatex(exactB)}`,
      success: true,
      score: 10,
    });
  };

  // Preset comparative examples
  const handleLoadPreset = (type: 'unit' | 'equivalent' | 'close') => {
    if (type === 'unit') {
      setLaneA([{ id: 'p1', num: 1, den: 3 }]);
      setLaneB([{ id: 'p2', num: 1, den: 6 }]);
    } else if (type === 'equivalent') {
      setLaneA([{ id: 'p1', num: 1, den: 2 }]);
      setLaneB([{ id: 'p2', num: 1, den: 4 }, { id: 'p3', num: 1, den: 4 }]);
    } else if (type === 'close') {
      setLaneA([{ id: 'p1', num: 1, den: 4 }, { id: 'p2', num: 1, den: 6 }]);
      setLaneB([{ id: 'p3', num: 1, den: 2 }]);
    }
    playSound('snap');
  };

  return (
    <div id="inequality-builder-studio" className="space-y-5">
      
      {/* 1. Palette & Preset Controls */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-black text-sm">
              ⚖️
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Dual-Lane Inequality Sentence Builder
              </h3>
              <p className="text-xs text-slate-500">
                Construct fraction models in Lane A and Lane B to generate real-time comparison sentences.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Target Lane Selector */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                onClick={() => { setSelectedTargetLane('A'); playSound('click'); }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedTargetLane === 'A' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700'
                }`}
              >
                Add to Lane A
              </button>
              <button
                onClick={() => { setSelectedTargetLane('B'); playSound('click'); }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedTargetLane === 'B' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-700'
                }`}
              >
                Add to Lane B
              </button>
            </div>

            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Tile Add Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-bold text-slate-600 mr-1">
            Drop into <strong className={selectedTargetLane === 'A' ? 'text-blue-600' : 'text-purple-600'}>Lane {selectedTargetLane}</strong>:
          </span>
          {AVAILABLE_DENOMINATORS.map((den) => {
            const style = FRACTION_COLORS[den];
            return (
              <button
                key={`btn-add-${den}`}
                onClick={() => handleAddPiece(den)}
                className={`px-3 py-1.5 rounded-xl border ${style.bg} ${style.text} ${style.border} text-xs font-black shadow-2xs hover:scale-105 active:scale-95 cursor-pointer transition-all flex items-center gap-1`}
              >
                <Plus className="w-3 h-3" />
                <span>1/{den}</span>
              </button>
            );
          })}
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-bold">Quick Scenarios:</span>
          <button
            onClick={() => handleLoadPreset('unit')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium cursor-pointer"
          >
            1/3 vs 1/6 (Unit Inequality)
          </button>
          <button
            onClick={() => handleLoadPreset('equivalent')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium cursor-pointer"
          >
            1/2 vs 2/4 (Exact Equivalence)
          </button>
          <button
            onClick={() => handleLoadPreset('close')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium cursor-pointer"
          >
            (1/4 + 1/6) vs 1/2 (Compound Test)
          </button>
        </div>
      </div>

      {/* 2. Dynamic KaTeX Inequality Card */}
      <div className={`border-2 rounded-3xl p-4 sm:p-6 shadow-md transition-all ${
        isExactEqual 
          ? 'bg-slate-950 border-emerald-500 shadow-emerald-500/10' 
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Main Visual Inequality Sentence */}
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
              <span>Dynamic Mathematical Sentence</span>
              {isExactEqual && (
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.2 rounded-full uppercase">
                  Perfect Equality Balance
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-2xl sm:text-3xl font-black">
              {/* Lane A readout */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-blue-950/80 border border-blue-600/40 text-blue-300">
                <span className="text-xs text-blue-400 font-bold">Lane A:</span>
                <MathView latex={rationalToLatex(exactA)} />
                <span className="text-xs font-mono text-blue-400">({(sumAVal * 100).toFixed(1)}%)</span>
              </div>

              {/* Central Dynamic Inequality Sign */}
              <div className={`w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl font-black ${inequalityColor} shadow-inner`}>
                {inequalitySymbol}
              </div>

              {/* Lane B readout */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-purple-950/80 border border-purple-600/40 text-purple-300">
                <span className="text-xs text-purple-400 font-bold">Lane B:</span>
                <MathView latex={rationalToLatex(exactB)} />
                <span className="text-xs font-mono text-purple-400">({(sumBVal * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* Difference Displacement & Bridge the Gap button */}
          <div className="flex flex-col sm:items-end gap-2">
            {diffFrac && (
              <div className="bg-slate-800/90 border border-amber-500/30 rounded-2xl px-3.5 py-2 text-xs font-bold text-amber-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Displacement Gap:</span>
                <MathView latex={`\\Delta = \\frac{${diffFrac.num}}{${diffFrac.den}}`} />
                <span className="font-mono text-[11px] text-slate-400">({(diffVal * 100).toFixed(1)}%)</span>
              </div>
            )}

            {diffFrac && (
              <button
                onClick={handleBridgeTheGap}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md"
              >
                <Link2 className="w-4 h-4" />
                <span>Bridge the Gap (Snap Balance)</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 3. Dual Comparative Lanes Canvas */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 text-white shadow-md space-y-4">
        
        {/* Zero baseline ruler mark */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 border-b border-slate-800 pb-2">
          <span>Origin (0.0)</span>
          <span className="text-slate-400">1 WHOLE REFERENCE (1.0 = 100%)</span>
          <span>1.0</span>
        </div>

        {/* LANE A */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2 font-bold text-blue-400">
              <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px]">A</span>
              <span>Lane A: {laneA.map(p => `1/${p.den}`).join(' + ') || 'Empty'}</span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">Total: {(sumAVal * 100).toFixed(1)}%</span>
          </div>

          <div className="w-full bg-slate-950 h-12 rounded-2xl border-2 border-blue-900/60 relative overflow-hidden flex items-center p-1">
            {/* Zero baseline mark */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 z-30"></div>

            {/* Lane Pieces */}
            <div className="h-full flex items-center gap-1 z-10">
              {laneA.map((piece) => {
                const style = FRACTION_COLORS[piece.den];
                const pct = (piece.num / piece.den) * 100;
                return (
                  <div
                    key={piece.id}
                    className={`h-full ${style.bg} ${style.text} rounded-xl px-2.5 flex items-center justify-between gap-2 font-black text-xs shadow-md border border-white/20 transition-all`}
                    style={{ width: `${pct * 5}px`, minWidth: '48px' }}
                  >
                    <span>1/{piece.den}</span>
                    <button
                      onClick={() => handleRemovePiece('A', piece.id)}
                      className="hover:text-red-300 opacity-70 hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Shaded Excess Overlay when Lane A is larger */}
            {comparisonType === 'greater' && diffVal > 0.001 && (
              <div
                className="absolute top-0 bottom-0 bg-cyan-400/20 border-l-2 border-dashed border-cyan-400 flex items-center justify-center text-[10px] font-black text-cyan-300 z-20"
                style={{
                  left: `${sumBVal * 100}%`,
                  width: `${diffVal * 100}%`,
                }}
              >
                Excess: +{diffFrac ? `${diffFrac.num}/${diffFrac.den}` : ''}
              </div>
            )}
          </div>
        </div>

        {/* LANE B */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2 font-bold text-purple-400">
              <span className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center text-[10px]">B</span>
              <span>Lane B: {laneB.map(p => `1/${p.den}`).join(' + ') || 'Empty'}</span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">Total: {(sumBVal * 100).toFixed(1)}%</span>
          </div>

          <div className="w-full bg-slate-950 h-12 rounded-2xl border-2 border-purple-900/60 relative overflow-hidden flex items-center p-1">
            {/* Zero baseline mark */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 z-30"></div>

            {/* Lane Pieces */}
            <div className="h-full flex items-center gap-1 z-10">
              {laneB.map((piece) => {
                const style = FRACTION_COLORS[piece.den];
                const pct = (piece.num / piece.den) * 100;
                return (
                  <div
                    key={piece.id}
                    className={`h-full ${style.bg} ${style.text} rounded-xl px-2.5 flex items-center justify-between gap-2 font-black text-xs shadow-md border border-white/20 transition-all`}
                    style={{ width: `${pct * 5}px`, minWidth: '48px' }}
                  >
                    <span>1/{piece.den}</span>
                    <button
                      onClick={() => handleRemovePiece('B', piece.id)}
                      className="hover:text-red-300 opacity-70 hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Shaded Excess Overlay when Lane B is larger */}
            {comparisonType === 'less' && diffVal > 0.001 && (
              <div
                className="absolute top-0 bottom-0 bg-amber-400/20 border-l-2 border-dashed border-amber-400 flex items-center justify-center text-[10px] font-black text-amber-300 z-20"
                style={{
                  left: `${sumAVal * 100}%`,
                  width: `${diffVal * 100}%`,
                }}
              >
                Excess: +{diffFrac ? `${diffFrac.num}/${diffFrac.den}` : ''}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
