import React, { useState, useEffect } from 'react';
import { FractionDenominator, StudentProfile, ActivityLog } from '../../types';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { 
  createRational, 
  addRational,
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
  Puzzle, 
  ShieldCheck,
  Zap,
  Info,
  Lock,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface WhatsLeftGapWorkspaceProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
  initialAddends?: { num: number; den: FractionDenominator }[];
  initialScenarioTitle?: string;
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

interface PlacedPart {
  id: string;
  num: number;
  den: FractionDenominator;
  isInitialGiven?: boolean;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

export const WhatsLeftGapWorkspace: React.FC<WhatsLeftGapWorkspaceProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  student,
  initialAddends,
  initialScenarioTitle,
}) => {
  // Given consumed pieces on bottom track
  const [givenPieces, setGivenPieces] = useState<PlacedPart[]>(
    initialAddends && initialAddends.length > 0
      ? initialAddends.map((a, i) => ({ id: `init-${i}`, num: a.num, den: a.den, isInitialGiven: true }))
      : [
          { id: 'g1', num: 1, den: 3, isInitialGiven: true },
          { id: 'g2', num: 1, den: 6, isInitialGiven: true },
        ]
  );

  // Pieces placed by learner to fill the gap
  const [gapFilledPieces, setGapFilledPieces] = useState<PlacedPart[]>([]);
  const [isLockedComplete, setIsLockedComplete] = useState<boolean>(false);
  const [scenarioTitle, setScenarioTitle] = useState<string>(
    initialScenarioTitle || 'Sharing Sugar Bread (1/3 + 1/6 Consumed)'
  );

  // Compute exact rational sums
  const partsToRationals = (parts: PlacedPart[]): Rational[] =>
    parts.map(p => createRational(p.num, p.den));

  const exactGiven = sumRationals(partsToRationals(givenPieces));
  const exactFilled = sumRationals(partsToRationals(gapFilledPieces));
  const exactTotal = addRational(exactGiven, exactFilled);
  const oneWhole = createRational(1, 1);

  const consumedVal = rationalToDecimal(exactGiven);
  const userFilledVal = rationalToDecimal(exactFilled);
  const totalTrackVal = rationalToDecimal(exactTotal);

  const exactRemainingGap = subtractRational(oneWhole, exactTotal);
  const remainingGapVal = Math.max(0, rationalToDecimal(exactRemainingGap));

  const isOverfilled = compareRational(exactTotal, oneWhole) > 0;
  const isPerfectWhole = compareRational(exactTotal, oneWhole) === 0;

  // Exact target gap
  const targetGapRational = subtractRational(oneWhole, exactGiven);
  const targetGapFrac = { num: targetGapRational.numerator, den: targetGapRational.denominator };

  // Update live KaTeX
  useEffect(() => {
    if (isPerfectWhole) {
      const partsStr = givenPieces.map(p => `\\frac{${p.num}}{${p.den}}`).join(' + ');
      const gapPartsStr = gapFilledPieces.map(p => `\\frac{${p.num}}{${p.den}}`).join(' + ');
      const proofLatex = `1 - (${partsStr}) = \\frac{${targetGapFrac.num}}{${targetGapFrac.den}} \\quad \\checkmark`;
      onUpdateLiveLatex(proofLatex);
    } else {
      const partsStr = givenPieces.map(p => `\\frac{${p.num}}{${p.den}}`).join(' + ');
      onUpdateLiveLatex(`1 - (${partsStr}) = \\text{Remaining Gap: } ${(remainingGapVal * 100).toFixed(1)}\\%`);
    }
  }, [givenPieces, gapFilledPieces, isPerfectWhole]);

  // Check completion trigger
  useEffect(() => {
    if (isPerfectWhole && !isLockedComplete && gapFilledPieces.length > 0) {
      setIsLockedComplete(true);
      playSound('chime');
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });

      onLogActivity({
        studentId: student?.id || 'guest',
        studentName: student?.name || 'Guest Student',
        studentLevel: student?.level || 'Form 1',
        topic: 'Missing Gap',
        title: 'Solved "What\'s Left?" Gap Challenge',
        details: `Filled remaining gap with ${gapFilledPieces.map(p => `${p.num}/${p.den}`).join(' + ')} to complete 1 Whole.`,
        latexExpression: `1 - ${rationalToLatex(exactGiven)} = \\frac{${targetGapFrac.num}}{${targetGapFrac.den}}`,
        success: true,
        score: 15,
      });
    }
  }, [isPerfectWhole, isLockedComplete, gapFilledPieces]);

  // Try snapping candidate piece into gap
  const handleTrySnapTile = (den: FractionDenominator) => {
    if (isLockedComplete) {
      playSound('pop');
      return;
    }

    const pieceVal = 1 / den;
    if (totalTrackVal + pieceVal > 1.0001) {
      // Overfill warning
      playSound('slice');
      return;
    }

    const newPiece: PlacedPart = {
      id: `gap-p-${Date.now()}`,
      num: 1,
      den,
      isInitialGiven: false,
    };

    setGapFilledPieces(prev => [...prev, newPiece]);
    playSound('snap');
  };

  const handleRemoveGapPiece = (id: string) => {
    if (isLockedComplete) return;
    setGapFilledPieces(prev => prev.filter(p => p.id !== id));
    playSound('drop');
  };

  const handleResetGap = () => {
    setGapFilledPieces([]);
    setIsLockedComplete(false);
    playSound('pop');
  };

  // Preset Story Scenarios
  const handleLoadScenario = (type: 'bread' | 'sobolo' | 'farm' | 'waakye') => {
    setIsLockedComplete(false);
    setGapFilledPieces([]);

    if (type === 'bread') {
      setScenarioTitle('Sharing Sugar Bread: Mary eats 1/3, John eats 1/6');
      setGivenPieces([
        { id: 'b1', num: 1, den: 3, isInitialGiven: true },
        { id: 'b2', num: 1, den: 6, isInitialGiven: true },
      ]);
    } else if (type === 'sobolo') {
      setScenarioTitle('Sobolo Beverage Jug: 3/8 L Hibiscus + 1/4 L Ginger');
      setGivenPieces([
        { id: 's1', num: 3, den: 8, isInitialGiven: true },
        { id: 's2', num: 1, den: 4, isInitialGiven: true },
      ]);
    } else if (type === 'farm') {
      setScenarioTitle('Community Farm Plot: 2/5 Cassava + 3/10 Sweet Maize');
      setGivenPieces([
        { id: 'f1', num: 2, den: 5, isInitialGiven: true },
        { id: 'f2', num: 3, den: 10, isInitialGiven: true },
      ]);
    } else if (type === 'waakye') {
      setScenarioTitle('Waakye Pot: 1/4 Pot Beans + 3/8 Pot Rice');
      setGivenPieces([
        { id: 'w1', num: 1, den: 4, isInitialGiven: true },
        { id: 'w2', num: 3, den: 8, isInitialGiven: true },
      ]);
    }
    playSound('snap');
  };

  return (
    <div id="whats-left-gap-studio" className="space-y-5">
      
      {/* 1. Header & Pre-Loaded Scenarios */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-sm">
              🧩
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                "What's Left?" Gap-Filling & Subtraction Engine
              </h3>
              <p className="text-xs text-slate-500">
                Place consumed parts onto the problem track, identify the glowing gap zone, and snap matching tiles to complete 1 Whole.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetGap}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Gap Tiles</span>
            </button>
          </div>
        </div>

        {/* Story Scenarios Navigation Ribbon */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-700">Pre-Loaded Scenarios:</span>
          <button
            onClick={() => handleLoadScenario('bread')}
            className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold cursor-pointer transition-all"
          >
            🥖 Sugar Bread (1/3 + 1/6)
          </button>
          <button
            onClick={() => handleLoadScenario('sobolo')}
            className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-bold cursor-pointer transition-all"
          >
            🍹 Sobolo Jug (3/8 + 1/4)
          </button>
          <button
            onClick={() => handleLoadScenario('farm')}
            className="px-2.5 py-1 rounded-xl bg-green-50 hover:bg-green-100 border border-green-200 text-green-900 font-bold cursor-pointer transition-all"
          >
            🌾 Farm Plot (2/5 + 3/10)
          </button>
          <button
            onClick={() => handleLoadScenario('waakye')}
            className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold cursor-pointer transition-all"
          >
            🍲 Waakye Pot (1/4 + 3/8)
          </button>
        </div>
      </div>

      {/* 2. Interactive Tracks Canvas */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 text-white shadow-md space-y-5">
        
        {/* Scenario Context Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">
              Active Context: {scenarioTitle}
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {isPerfectWhole ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 1 Whole Complete (100%)
              </span>
            ) : (
              <span>Remaining Gap: {(remainingGapVal * 100).toFixed(1)}%</span>
            )}
          </div>
        </div>

        {/* TRACK 1: Fixed 1 Whole Reference Track */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1 text-slate-400 font-mono">
            <span>0.0</span>
            <span className="text-red-400 font-bold">FIXED 1 WHOLE REFERENCE (100%)</span>
            <span>1.0</span>
          </div>

          <div className="w-full bg-slate-950 h-10 rounded-2xl border-2 border-red-900/60 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-600 opacity-80"></div>
            <span className="relative z-10 text-white font-black text-xs tracking-wider flex items-center gap-2">
              <span>1 WHOLE</span>
              <span className="text-[10px] opacity-80">(1/1 = 100%)</span>
            </span>
          </div>
        </div>

        {/* TRACK 2: Problem Track (Consumed Parts + Glowing Gap Zone) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1 text-slate-300 font-bold">
            <span>Problem Track: Given Parts + Missing Gap</span>
            <span className="font-mono text-[11px] text-slate-400">
              Filled: {(totalTrackVal * 100).toFixed(1)}% / 100%
            </span>
          </div>

          <div className={`w-full bg-slate-950 h-14 rounded-2xl border-2 transition-all relative overflow-hidden flex items-center p-1 ${
            isPerfectWhole 
              ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' 
              : 'border-slate-700'
          }`}>
            {/* Zero Baseline Line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 z-30"></div>

            {/* Consumed / Given Pieces */}
            {givenPieces.map((piece) => {
              const style = FRACTION_COLORS[piece.den];
              const pct = (piece.num / piece.den) * 100;
              return (
                <div
                  key={piece.id}
                  className={`h-full ${style.bg} ${style.text} rounded-xl px-2 flex items-center justify-center font-black text-xs shadow-md border border-white/20 relative z-10`}
                  style={{ width: `${pct}%` }}
                >
                  <div className="text-center">
                    <div>{piece.num === 1 ? `1/${piece.den}` : `${piece.num}/${piece.den}`}</div>
                    <div className="text-[9px] opacity-80 font-mono">({pct.toFixed(0)}%)</div>
                  </div>
                </div>
              );
            })}

            {/* User Gap Filled Pieces */}
            {gapFilledPieces.map((piece) => {
              const style = FRACTION_COLORS[piece.den];
              const pct = (piece.num / piece.den) * 100;
              return (
                <div
                  key={piece.id}
                  className={`h-full ${style.bg} ${style.text} rounded-xl px-2 flex items-center justify-between gap-1 font-black text-xs shadow-md border-2 border-amber-300 relative z-10 animate-pulse`}
                  style={{ width: `${pct}%` }}
                >
                  <div className="truncate">1/{piece.den}</div>
                  {!isLockedComplete && (
                    <button
                      onClick={() => handleRemoveGapPiece(piece.id)}
                      className="text-white/70 hover:text-white cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Glowing Translucent Gap Zone */}
            {remainingGapVal > 0.001 && (
              <div
                className="h-full bg-amber-500/15 border-2 border-dashed border-amber-400/80 rounded-xl flex items-center justify-center text-amber-300 font-bold text-xs relative z-10 animate-pulse"
                style={{ width: `${remainingGapVal * 100}%` }}
              >
                <div className="text-center px-1">
                  <div className="text-[11px] font-black uppercase tracking-wider">Gap Zone</div>
                  <div className="text-[10px] font-mono opacity-90">{(remainingGapVal * 100).toFixed(1)}% needed</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Candidate Fraction Tiles Palette (Snap to Fill Gap) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                Snap Candidate Fraction Tiles into Gap Zone:
              </span>
            </div>

            <span className="text-[11px] text-slate-400">
              Click candidate tile to test fit
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {AVAILABLE_DENOMINATORS.map((den) => {
              const style = FRACTION_COLORS[den];
              const pieceVal = 1 / den;
              const willOverfill = totalTrackVal + pieceVal > 1.0001;

              return (
                <button
                  key={`cand-${den}`}
                  disabled={isLockedComplete}
                  onClick={() => handleTrySnapTile(den)}
                  className={`p-2.5 rounded-2xl border font-black text-xs shadow-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    willOverfill
                      ? 'opacity-40 bg-slate-800 text-slate-400 border-slate-700 hover:opacity-60'
                      : `${style.bg} ${style.text} ${style.border} hover:scale-105 active:scale-95`
                  }`}
                >
                  <div className="text-sm">1/{den}</div>
                  <div className="text-[10px] opacity-90 font-mono">{(100 / den).toFixed(1)}%</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Live Step-by-Step KaTeX Proof Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-slate-400">
            <span>Live Step-by-Step KaTeX Subtraction Proof</span>
            {isPerfectWhole && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Exact Solution Verified
              </span>
            )}
          </div>

          <div className="text-sm sm:text-base font-mono text-cyan-300 py-1 overflow-x-auto">
            <MathView
              latex={`1 - \\left(${givenPieces.map(p => `\\frac{${p.num}}{${p.den}}`).join(' + ')}\\right) = 1 - ${rationalToLatex(exactGiven)} = \\frac{${targetGapFrac.num}}{${targetGapFrac.den}}`}
            />
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            To find what fraction remains of 1 Whole, combine all consumed parts into a single common denominator fraction, then subtract from <span className="font-mono text-white">1 Whole = {exactGiven.denominator}/{exactGiven.denominator}</span>.
          </p>
        </div>

      </div>

    </div>
  );
};
