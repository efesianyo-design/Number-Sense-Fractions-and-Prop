import React, { useEffect, useRef } from 'react';
import { FractionDenominator, ComparisonTrack, FractionStripItem } from '../../types';
import { simplifyFraction, fractionToLatex, FRACTION_PALETTE, DENOMINATORS } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti } from '../../utils/confetti';
import { 
  ArrowRightLeft, 
  Sparkles, 
  Scale, 
  Plus, 
  CheckCircle, 
  Equal,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface FractionComparisonCardProps {
  track1?: ComparisonTrack;
  track2?: ComparisonTrack;
  track1Items?: FractionStripItem[];
  track2Items?: FractionStripItem[];
  track1Sum: {
    totalValue: number;
    simplifiedNum: number;
    simplifiedDen: number;
  };
  track2Sum: {
    totalValue: number;
    simplifiedNum: number;
    simplifiedDen: number;
  };
  onAddPieceToTrack?: (trackIdx: number, den: FractionDenominator) => void;
  onClearTrack?: (trackIdx: number) => void;
  onBridgeGap?: (diffDen: FractionDenominator, count: number) => void;
}

export const FractionComparisonCard: React.FC<FractionComparisonCardProps> = ({
  track1,
  track2,
  track1Items,
  track2Items,
  track1Sum,
  track2Sum,
  onAddPieceToTrack,
  onClearTrack,
  onBridgeGap,
}) => {
  const items1 = track1?.items ?? track1Items ?? [];
  const items2 = track2?.items ?? track2Items ?? [];
  const hasPieces = items1.length > 0 || items2.length > 0;
  const val1 = track1Sum?.totalValue ?? 0;
  const val2 = track2Sum?.totalValue ?? 0;

  // Comparison relation: '>', '<', or '='
  const diffVal = val1 - val2;
  const isEquivalent = Math.abs(diffVal) < 0.0001 && hasPieces && val1 > 0;
  const isGreater = diffVal > 0.0001;
  const isLess = diffVal < -0.0001;

  // Compute exact simplified delta fraction
  const deltaFraction = React.useMemo(() => {
    if (!hasPieces || Math.abs(diffVal) < 0.0001 || !track1Sum || !track2Sum) return null;
    const commonDen = (track1Sum.simplifiedDen || 1) * (track2Sum.simplifiedDen || 1);
    const num1 = (track1Sum.simplifiedNum || 0) * (track2Sum.simplifiedDen || 1);
    const num2 = (track2Sum.simplifiedNum || 0) * (track1Sum.simplifiedDen || 1);
    const rawDiffNum = Math.abs(num1 - num2);
    return simplifyFraction(rawDiffNum, commonDen);
  }, [hasPieces, diffVal, track1Sum, track2Sum]);

  // Previous equivalence ref to trigger celebration only once when equality is first reached
  const prevEquivalentRef = useRef(false);
  useEffect(() => {
    if (isEquivalent && !prevEquivalentRef.current) {
      playSound('success');
      fireMathConfetti();
    }
    prevEquivalentRef.current = isEquivalent;
  }, [isEquivalent]);

  if (!hasPieces) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-semibold">
          <Scale className="w-4 h-4 text-blue-500" />
          <span>Real-Time Track 1 vs Track 2 Inequality Engine: Add pieces to both tracks to compare.</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="track-comparison-inspector"
      className={`rounded-2xl p-4 sm:p-5 border-2 transition-all shadow-md ${
        isEquivalent
          ? 'bg-emerald-50/70 border-emerald-400 ring-4 ring-emerald-100/80 animate-fadeIn'
          : isGreater
          ? 'bg-cyan-50/70 border-cyan-400 ring-2 ring-cyan-100'
          : 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-100'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Engine Title & Track 1 */}
        <div className="flex items-center space-x-3">
          <div 
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-sm ${
              isEquivalent ? 'bg-emerald-500' : isGreater ? 'bg-cyan-600' : 'bg-amber-500'
            }`}
          >
            <Scale className="w-5 h-5" />
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <span>Track 1 vs Track 2 Comparison Engine</span>
              {isEquivalent && (
                <span className="bg-emerald-200 text-emerald-900 px-2 py-0.2 rounded-full font-bold text-[9px] flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-700" /> EQUIVALENT
                </span>
              )}
            </div>

            {/* Dynamic Comparison Inequality Sentence */}
            <div className="flex items-center gap-3 mt-1">
              {/* Fraction 1 */}
              <div className="text-base sm:text-lg font-black text-slate-800 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-400 block font-normal -mb-1">Track 1</span>
                <MathView latex={fractionToLatex(track1Sum.simplifiedNum, track1Sum.simplifiedDen)} />
              </div>

              {/* Operator */}
              <div 
                className={`text-xl sm:text-2xl font-black px-2.5 py-0.5 rounded-xl shadow-xs ${
                  isEquivalent 
                    ? 'bg-emerald-600 text-white' 
                    : isGreater 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-amber-500 text-white'
                }`}
              >
                {isEquivalent ? '=' : isGreater ? '>' : '<'}
              </div>

              {/* Fraction 2 */}
              <div className="text-base sm:text-lg font-black text-slate-800 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-400 block font-normal -mb-1">Track 2</span>
                <MathView latex={fractionToLatex(track2Sum.simplifiedNum, track2Sum.simplifiedDen)} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Difference Delta Badge and Equalize Action */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {deltaFraction && deltaFraction.num > 0 && (
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Difference (Δ):</span>
              <div className="text-sm font-bold text-slate-800">
                <MathView latex={`\\Delta = \\frac{${deltaFraction.num}}{${deltaFraction.den}}`} />
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                ({(Math.abs(diffVal) * 100).toFixed(1)}%)
              </span>
            </div>
          )}

          {/* Quick Action to bridge gap and equalize tracks */}
          {deltaFraction && (DENOMINATORS as readonly number[]).includes(deltaFraction.den) && (
            <button
              onClick={() => {
                if (onBridgeGap) {
                  onBridgeGap(deltaFraction.den as FractionDenominator, 1);
                } else if (onAddPieceToTrack) {
                  const targetTrackIdx = isGreater ? 1 : 0;
                  onAddPieceToTrack(targetTrackIdx, deltaFraction.den as FractionDenominator);
                  playSound('snap');
                  fireMathConfetti();
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Bridge Δ (+1/{deltaFraction.den} to Track {isGreater ? '2' : '1'})</span>
            </button>
          )}
        </div>
      </div>

      {/* KaTeX Algebraic Equation Statement */}
      <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Mathematical Statement:</span>
          <div className="font-serif font-bold text-slate-900 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
            {isEquivalent ? (
              <MathView latex={`\\frac{${track1Sum.simplifiedNum}}{${track1Sum.simplifiedDen}} = \\frac{${track2Sum.simplifiedNum}}{${track2Sum.simplifiedDen}} \\quad \\text{(Tracks are perfectly equal in length)}`} />
            ) : isGreater ? (
              <MathView latex={`\\frac{${track1Sum.simplifiedNum}}{${track1Sum.simplifiedDen}} > \\frac{${track2Sum.simplifiedNum}}{${track2Sum.simplifiedDen}} \\quad \\left(\\text{Track 1 exceeds Track 2 by } \\frac{${deltaFraction?.num || 0}}{${deltaFraction?.den || 1}}\\right)`} />
            ) : (
              <MathView latex={`\\frac{${track1Sum.simplifiedNum}}{${track1Sum.simplifiedDen}} < \\frac{${track2Sum.simplifiedNum}}{${track2Sum.simplifiedDen}} \\quad \\left(\\text{Track 1 is less than Track 2 by } \\frac{${deltaFraction?.num || 0}}{${deltaFraction?.den || 1}}\\right)`} />
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Track 1: {(val1 * 100).toFixed(0)}% vs Track 2: {(val2 * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
};
