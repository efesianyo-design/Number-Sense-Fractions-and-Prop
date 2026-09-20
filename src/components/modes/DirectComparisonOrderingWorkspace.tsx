import React, { useState } from 'react';
import { FractionDenominator, StudentProfile, ActivityLog } from '../../types';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { createRational, compareRational } from '../../utils/rationalMath';
import { ContinuousPartitionSlider } from './ContinuousPartitionSlider';
import confetti from 'canvas-confetti';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  ArrowUpDown, 
  HelpCircle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

interface DirectComparisonOrderingWorkspaceProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
}

const AVAILABLE_UNIT_DENOMINATORS: FractionDenominator[] = [2, 3, 4, 5, 6, 8, 10, 12, 16];

export const FRACTION_COLORS: Record<FractionDenominator, { bg: string; text: string; border: string; bar: string; name: string }> = {
  1: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-600', bar: '#ef4444', name: 'Whole' },
  2: { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600', bar: '#f43f5e', name: 'Halves' },
  3: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600', bar: '#f97316', name: 'Thirds' },
  4: { bg: 'bg-yellow-500', text: 'text-slate-950', border: 'border-yellow-600', bar: '#eab308', name: 'Fourths' },
  5: { bg: 'bg-green-600', text: 'text-white', border: 'border-green-700', bar: '#16a34a', name: 'Fifths' },
  6: { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-700', bar: '#0d9488', name: 'Sixths' },
  8: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', bar: '#2563eb', name: 'Eighths' },
  10: { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700', bar: '#9333ea', name: 'Tenths' },
  12: { bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-800', bar: '#334155', name: 'Twelfths' },
  16: { bg: 'bg-fuchsia-600', text: 'text-white', border: 'border-fuchsia-700', bar: '#c026d3', name: 'Sixteenths' },
};

interface PlacedUnitStrip {
  id: string;
  den: FractionDenominator;
}

export const DirectComparisonOrderingWorkspace: React.FC<DirectComparisonOrderingWorkspaceProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  student,
}) => {
  // Side-by-side comparison stage items
  const [stageItems, setStageItems] = useState<PlacedUnitStrip[]>([
    { id: 'init-2', den: 2 },
    { id: 'init-3', den: 3 },
    { id: 'init-4', den: 4 },
    { id: 'init-8', den: 8 },
  ]);

  // Stage orientation
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Ordering Tray Challenge State
  const [targetOrderMode, setTargetOrderMode] = useState<'ascending' | 'descending'>('ascending');
  const [challengeFractions, setChallengeFractions] = useState<FractionDenominator[]>([8, 2, 4, 3]);
  const [userOrderedSlots, setUserOrderedSlots] = useState<(FractionDenominator | null)[]>([null, null, null, null]);
  const [orderCheckResult, setOrderCheckResult] = useState<{ isCorrect: boolean; message: string } | null>(null);

  // Add unit fraction to stage
  const handleAddStrip = (den: FractionDenominator) => {
    if (stageItems.length >= 8) {
      playSound('pop');
      return;
    }
    const newItem: PlacedUnitStrip = {
      id: `strip-${den}-${Date.now()}`,
      den,
    };
    const nextList = [...stageItems, newItem];
    setStageItems(nextList);
    playSound('pickup');

    // Update latex readout
    const fracStrings = nextList.map(s => `\\frac{1}{${s.den}}`).join(', ');
    onUpdateLiveLatex(`\\text{Comparing: } ${fracStrings}`);
  };

  const handleRemoveStrip = (id: string) => {
    const nextList = stageItems.filter(s => s.id !== id);
    setStageItems(nextList);
    playSound('drop');
  };

  const handleClearStage = () => {
    setStageItems([]);
    playSound('pop');
  };

  const handleLoadPresetShrinking = () => {
    setStageItems([
      { id: 's-2', den: 2 },
      { id: 's-3', den: 3 },
      { id: 's-4', den: 4 },
      { id: 's-5', den: 5 },
      { id: 's-6', den: 6 },
      { id: 's-8', den: 8 },
      { id: 's-10', den: 10 },
      { id: 's-12', den: 12 },
    ]);
    playSound('snap');
    onUpdateLiveLatex('\\frac{1}{2} > \\frac{1}{3} > \\frac{1}{4} > \\frac{1}{5} > \\frac{1}{6} > \\frac{1}{8} > \\frac{1}{10} > \\frac{1}{12}');
  };

  // Ordering Challenge Handlers
  const handlePickForSlot = (den: FractionDenominator, slotIndex: number) => {
    const nextSlots = [...userOrderedSlots];
    nextSlots[slotIndex] = den;
    setUserOrderedSlots(nextSlots);
    setOrderCheckResult(null);
    playSound('snap');
  };

  const handleClearSlot = (slotIndex: number) => {
    const nextSlots = [...userOrderedSlots];
    nextSlots[slotIndex] = null;
    setUserOrderedSlots(nextSlots);
    setOrderCheckResult(null);
    playSound('pop');
  };

  const handleGenerateNewChallenge = () => {
    const shuffled = [...AVAILABLE_UNIT_DENOMINATORS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);
    setChallengeFractions(selected);
    setUserOrderedSlots([null, null, null, null]);
    setOrderCheckResult(null);
    playSound('click');
  };

  const handleCheckOrder = () => {
    if (userOrderedSlots.some(s => s === null)) {
      setOrderCheckResult({
        isCorrect: false,
        message: 'Please fill all 4 slots before checking!',
      });
      playSound('pop');
      return;
    }

    // Use exact Rational comparison to prevent float rounding
    const rationals = userOrderedSlots.map(d => createRational(1, d as number));
    let correct = true;

    for (let i = 0; i < rationals.length - 1; i++) {
      const cmp = compareRational(rationals[i], rationals[i + 1]);
      if (targetOrderMode === 'ascending') {
        // Least to greatest (1/16 -> 1/2): smaller value must come first (cmp <= 0)
        if (cmp > 0) {
          correct = false;
          break;
        }
      } else {
        // Greatest to least (1/2 -> 1/16): larger value must come first (cmp >= 0)
        if (cmp < 0) {
          correct = false;
          break;
        }
      }
    }

    if (correct) {
      setOrderCheckResult({
        isCorrect: true,
        message: `Outstanding! Correct ${targetOrderMode === 'ascending' ? 'Least to Greatest' : 'Greatest to Least'} order!`,
      });
      playSound('success');
      confetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.7 },
      });

      const latexChain = userOrderedSlots.map(d => `\\frac{1}{${d}}`).join(targetOrderMode === 'ascending' ? ' < ' : ' > ');
      onUpdateLiveLatex(latexChain);

      onLogActivity({
        studentId: student?.id || 'guest',
        studentName: student?.name || 'Guest Student',
        studentLevel: student?.level || 'Form 1',
        topic: 'Fraction Comparator',
        title: `Ordered Unit Fractions (${targetOrderMode})`,
        details: `Successfully ordered fractions: ${userOrderedSlots.map(d => `1/${d}`).join(', ')}`,
        latexExpression: latexChain,
        success: true,
        score: 10,
      });
    } else {
      setOrderCheckResult({
        isCorrect: false,
        message: targetOrderMode === 'ascending' 
          ? 'Not quite. Remember: larger denominator means a SMALLER piece! Start with the smallest piece.'
          : 'Not quite. Remember: smaller denominator means a LARGER piece! Start with the biggest piece.',
      });
      playSound('slice');
    }
  };

  return (
    <div id="direct-comparison-ordering-studio" className="space-y-5">
      
      {/* 1. Unit Fraction Palette Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm">
              📏
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Unit Fraction Palette (Shrinking Unit Modeler)
              </h3>
              <p className="text-xs text-slate-500">
                Click any tile to drop it onto the shared zero-baseline comparison stage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadPresetShrinking}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Full Shrinking Cascade</span>
            </button>
            <button
              onClick={() => setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{orientation === 'horizontal' ? 'Vertical Align' : 'Horizontal Align'}</span>
            </button>
            <button
              onClick={handleClearStage}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Unit Tile Clickable Palette */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {AVAILABLE_UNIT_DENOMINATORS.map((den) => {
            const style = FRACTION_COLORS[den];
            return (
              <button
                key={`pal-${den}`}
                onClick={() => handleAddStrip(den)}
                className={`p-2.5 rounded-2xl border ${style.bg} ${style.text} ${style.border} font-bold shadow-xs hover:scale-105 active:scale-95 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 group`}
              >
                <div className="text-base font-black leading-none">1/{den}</div>
                <div className="text-[10px] opacity-90 font-mono">{(100 / den).toFixed(1)}%</div>
                <div className="text-[9px] uppercase tracking-wider font-semibold opacity-75">{style.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Comparison Stage (Zero-Baseline Align) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 text-white shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <h4 className="text-sm font-black tracking-tight text-white">
              Zero-Baseline Comparative Stage
            </h4>
            <span className="bg-blue-950 text-blue-300 border border-blue-800/80 text-[10px] font-bold px-2 py-0.5 rounded-full">
              Shared Origin (0.0)
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {stageItems.length} Strips Aligned
          </div>
        </div>

        {/* 1 Whole Reference Track at Top */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span>0.0</span>
            <span className="text-amber-300 font-bold">1 WHOLE REFERENCE (100%)</span>
            <span>1.0</span>
          </div>
          <div className="w-full bg-slate-800/90 h-8 rounded-xl border border-slate-700 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-600 opacity-90"></div>
            <span className="relative z-10 text-white font-black text-xs tracking-wider flex items-center gap-2">
              <span>1 WHOLE</span>
              <span className="text-[10px] opacity-80">(1/1 = 100%)</span>
            </span>
          </div>
        </div>

        {/* Dynamic Comparison Racks */}
        {stageItems.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-800 rounded-2xl text-center space-y-2">
            <p className="text-slate-400 text-sm font-medium">
              No fraction strips on stage. Click any tile in the palette above to align unit fractions!
            </p>
          </div>
        ) : (
          <div className={`space-y-2 ${orientation === 'vertical' ? 'overflow-x-auto py-2' : ''}`}>
            {stageItems.map((item, idx) => {
              const style = FRACTION_COLORS[item.den];
              const pctWidth = (1 / item.den) * 100;

              return (
                <div key={item.id} className="space-y-1 group">
                  <div className="flex items-center justify-between text-xs px-1 text-slate-300">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-slate-500 font-mono text-[10px]">#{idx + 1}</span>
                      <span className="text-white">1/{item.den}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({pctWidth.toFixed(2)}%)</span>
                    </div>
                    <button
                      onClick={() => handleRemoveStrip(item.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Remove strip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Strip Visual Bar with zero baseline alignment */}
                  <div className="w-full bg-slate-950/80 h-9 rounded-xl border border-slate-800/80 relative overflow-hidden flex items-center">
                    {/* Zero baseline indicator mark */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 z-20"></div>

                    {/* Proportional Unit Strip */}
                    <div
                      className={`h-full ${style.bg} ${style.text} flex items-center justify-center font-black text-xs shadow-inner transition-all duration-300 relative border-r-2 border-white/40`}
                      style={{ width: `${pctWidth}%` }}
                    >
                      <span className="truncate px-1">1/{item.den}</span>
                    </div>

                    {/* Ghost remainder indicating what is missing to make 1 whole */}
                    <div
                      className="h-full bg-slate-800/20 border-l border-dashed border-slate-700/50 flex items-center px-2 text-[10px] text-slate-500 font-mono"
                      style={{ width: `${100 - pctWidth}%` }}
                    >
                      Gap: {item.den - 1}/{item.den}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. Core Shrinking Unit Discovery Banner */}
        <div className="bg-gradient-to-r from-blue-950/80 to-indigo-950/80 border border-blue-700/40 rounded-2xl p-4 flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-black uppercase tracking-wider text-amber-300">
              Fundamental Math Principle: The Shrinking Unit Rule
            </h5>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              As the denominator increases (<span className="font-mono text-amber-300">2 → 3 → 4 → 8 → 16</span>), the whole is sliced into more equal parts, so each individual unit piece becomes <strong className="text-amber-300 underline">strictly smaller</strong>!
            </p>
            <div className="pt-1 text-xs font-mono text-cyan-300">
              \frac&#123;1&#125;&#123;2&#125; (50\%) &gt; \frac&#123;1&#125;&#123;3&#125; (33.3\%) &gt; \frac&#123;1&#125;&#123;4&#125; (25\%) &gt; \frac&#123;1&#125;&#123;8&#125; (12.5\%) &gt; \frac&#123;1&#125;&#123;16&#125; (6.25\%)
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Continuous Unit Partition Modeler */}
      <ContinuousPartitionSlider initialDenominator={4} />

      {/* 4. Ordering Tray Challenge (Least to Greatest / Greatest to Least) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-sm">
              🎯
            </span>
            <div>
              <h4 className="text-sm font-black text-slate-900 tracking-tight">
                Fraction Ordering Tray Routine
              </h4>
              <p className="text-xs text-slate-500">
                Arrange the 4 target fractions in exact mathematical sequence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                onClick={() => {
                  setTargetOrderMode('ascending');
                  setOrderCheckResult(null);
                  playSound('click');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  targetOrderMode === 'ascending' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Ascending (Least → Greatest)
              </button>
              <button
                onClick={() => {
                  setTargetOrderMode('descending');
                  setOrderCheckResult(null);
                  playSound('click');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  targetOrderMode === 'descending' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Descending (Greatest → Least)
              </button>
            </div>

            <button
              onClick={handleGenerateNewChallenge}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Shuffle</span>
            </button>
          </div>
        </div>

        {/* Given Target Tiles to Place */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>Fractions to Order:</span>
            <span className="text-slate-400 font-normal">(Click a fraction then click a slot, or click below)</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {challengeFractions.map((den) => {
              const style = FRACTION_COLORS[den];
              const isPlaced = userOrderedSlots.includes(den);
              return (
                <button
                  key={`chal-${den}`}
                  disabled={isPlaced}
                  onClick={() => {
                    // Find first empty slot
                    const emptyIdx = userOrderedSlots.findIndex(s => s === null);
                    if (emptyIdx !== -1) {
                      handlePickForSlot(den, emptyIdx);
                    } else {
                      playSound('pop');
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl border font-bold text-sm flex items-center gap-2 cursor-pointer transition-all ${
                    isPlaced 
                      ? 'opacity-30 bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed'
                      : `${style.bg} ${style.text} ${style.border} hover:scale-105 active:scale-95 shadow-2xs`
                  }`}
                >
                  <span className="font-black text-base">1/{den}</span>
                  <span className="text-xs opacity-90">({(100 / den).toFixed(1)}%)</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ordering Slots Tray */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {userOrderedSlots.map((slotDen, idx) => {
            const slotStyle = slotDen ? FRACTION_COLORS[slotDen] : null;

            return (
              <div
                key={`slot-${idx}`}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-between min-h-[110px] ${
                  slotDen
                    ? `${slotStyle?.bg} ${slotStyle?.text} border-slate-900/20 shadow-md`
                    : 'border-dashed border-slate-300 bg-slate-50/70 text-slate-400 hover:border-blue-400 hover:bg-blue-50/40'
                }`}
              >
                <div className="w-full flex items-center justify-between text-[11px] font-bold opacity-85">
                  <span>Slot #{idx + 1}</span>
                  <span className="uppercase text-[9px]">
                    {targetOrderMode === 'ascending' 
                      ? (idx === 0 ? 'Smallest' : idx === 3 ? 'Largest' : '')
                      : (idx === 0 ? 'Largest' : idx === 3 ? 'Smallest' : '')}
                  </span>
                </div>

                <div className="my-1 text-center">
                  {slotDen ? (
                    <div className="space-y-0.5">
                      <div className="text-2xl font-black">1/{slotDen}</div>
                      <div className="text-[11px] opacity-90 font-mono">{(100 / slotDen).toFixed(1)}%</div>
                    </div>
                  ) : (
                    <div className="text-xs font-medium text-slate-400">Empty Slot</div>
                  )}
                </div>

                {slotDen && (
                  <button
                    onClick={() => handleClearSlot(idx)}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
                  >
                    Clear Slot
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Validation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex-1">
            {orderCheckResult && (
              <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                orderCheckResult.isCorrect 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}>
                {orderCheckResult.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{orderCheckResult.message}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleCheckOrder}
            className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md ml-auto"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Validate Sequence</span>
          </button>
        </div>

      </div>

    </div>
  );
};
