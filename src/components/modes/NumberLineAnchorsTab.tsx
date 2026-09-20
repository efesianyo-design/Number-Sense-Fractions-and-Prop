import React, { useState, useMemo, useEffect } from 'react';
import { FractionDenominator, ActivityLog, StudentProfile } from '../../types';
import { DENOMINATORS, FRACTION_PALETTE, fractionToLatex, simplifyFraction, gcd } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti } from '../../utils/confetti';
import { 
  Ruler, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  Plus, 
  Trash2, 
  Award, 
  TrendingUp,
  Layers,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

interface NumberLineAnchorsTabProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
}

interface AnchorPreset {
  id: string;
  title: string;
  fraction: { num: number; den: FractionDenominator };
  description: string;
  subdivisionsToDiscover: FractionDenominator[];
}

const PRESETS: AnchorPreset[] = [
  {
    id: 'anc1',
    title: '1/2 Benchmark Anchor',
    fraction: { num: 1, den: 2 },
    description: '1/2 aligns with 2/4, 3/6, 4/8, 5/10, 6/12, 8/16.',
    subdivisionsToDiscover: [2, 4, 6, 8, 10, 12, 16],
  },
  {
    id: 'anc2',
    title: '3/4 Benchmark Anchor',
    fraction: { num: 3, den: 4 },
    description: '3/4 aligns with 6/8, 9/12, 12/16.',
    subdivisionsToDiscover: [4, 8, 12, 16],
  },
  {
    id: 'anc3',
    title: '2/3 Benchmark Anchor',
    fraction: { num: 2, den: 3 },
    description: '2/3 aligns with 4/6, 8/12.',
    subdivisionsToDiscover: [3, 6, 12],
  },
  {
    id: 'anc4',
    title: '4/5 Benchmark Anchor',
    fraction: { num: 4, den: 5 },
    description: '4/5 aligns with 8/10.',
    subdivisionsToDiscover: [5, 10],
  },
  {
    id: 'anc5',
    title: '5/6 Benchmark Anchor',
    fraction: { num: 5, den: 6 },
    description: '5/6 aligns with 10/12.',
    subdivisionsToDiscover: [6, 12],
  },
  {
    id: 'anc6',
    title: '3/8 Benchmark Anchor',
    fraction: { num: 3, den: 8 },
    description: '3/8 aligns with 6/16.',
    subdivisionsToDiscover: [8, 16],
  },
];

export const NumberLineAnchorsTab: React.FC<NumberLineAnchorsTabProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  student,
}) => {
  // Active placed strip above the number line
  const [activeFraction, setActiveFraction] = useState<{ num: number; den: FractionDenominator }>({ num: 1, den: 2 });

  // Number line subdivision ticks (scrubbed via slider)
  const [subdivisions, setSubdivisions] = useState<FractionDenominator>(4);

  // Discovered equivalent fractions chain for the current fraction
  const [discoveredEquivalents, setDiscoveredEquivalents] = useState<
    { num: number; den: FractionDenominator }[]
  >([{ num: 1, den: 2 }]);

  // Check if current subdivision aligns with the fraction
  const currentFractionValue = activeFraction.num / activeFraction.den;
  const tickPosition = currentFractionValue * subdivisions;
  const isExactTick = Math.abs(tickPosition - Math.round(tickPosition)) < 0.0001;
  const equivalentNum = Math.round(tickPosition);

  // Auto-accumulate discovered equivalents
  useEffect(() => {
    if (isExactTick) {
      const alreadyLogged = discoveredEquivalents.some(
        (eq) => eq.num === equivalentNum && eq.den === subdivisions
      );

      if (!alreadyLogged) {
        setDiscoveredEquivalents((prev) => [
          ...prev,
          { num: equivalentNum, den: subdivisions },
        ]);
        playSound('snap');
      }
    }
  }, [subdivisions, isExactTick, equivalentNum, activeFraction]);

  // Equivalence chain string for KaTeX
  const equivalenceChainLatex = useMemo(() => {
    // Sort discovered by denominator
    const sorted = [...discoveredEquivalents].sort((a, b) => a.den - b.den);
    if (sorted.length === 0) return `${activeFraction.num}/${activeFraction.den}`;
    return sorted.map((e) => `\\frac{${e.num}}{${e.den}}`).join(' = ');
  }, [discoveredEquivalents, activeFraction]);

  useEffect(() => {
    onUpdateLiveLatex(`\\text{Number Line Anchor: } ${equivalenceChainLatex}`);
  }, [equivalenceChainLatex, onUpdateLiveLatex]);

  // Load preset
  const handleLoadPreset = (preset: AnchorPreset) => {
    setActiveFraction(preset.fraction);
    setSubdivisions(preset.fraction.den);
    setDiscoveredEquivalents([preset.fraction]);
    playSound('jump');

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Number Line Anchors',
      title: `Selected Anchor: ${preset.title}`,
      details: preset.description,
      latexExpression: `\\frac{${preset.fraction.num}}{${preset.fraction.den}}`,
      success: true,
      score: 10,
    });
  };

  // Change fraction
  const handleSetFraction = (num: number, den: FractionDenominator) => {
    setActiveFraction({ num, den });
    setDiscoveredEquivalents([{ num, den }]);
    playSound('click');
  };

  // Scrub subdivision slider
  const handleSliderChange = (newSub: FractionDenominator) => {
    setSubdivisions(newSub);
    const tick = (activeFraction.num / activeFraction.den) * newSub;
    if (Math.abs(tick - Math.round(tick)) < 0.0001) {
      playSound('correct');
    } else {
      playSound('pop');
    }
  };

  // Celebrate discovery
  const handleCelebrate = () => {
    playSound('success');
    fireMathConfetti();
    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Number Line Anchors',
      title: `Discovered Equivalence Chain: ${equivalenceChainLatex}`,
      details: `Calibrated number line subdivisions (${discoveredEquivalents.map((e) => `${e.num}/${e.den}`).join(', ')}) matching ${activeFraction.num}/${activeFraction.den}`,
      latexExpression: equivalenceChainLatex,
      success: true,
      score: 35,
    });
  };

  const palette = FRACTION_PALETTE[activeFraction.den] || FRACTION_PALETTE[2];

  return (
    <div id="number-line-anchors-engine" className="space-y-5 animate-fadeIn">
      {/* 1. Header & Presets Ribbon */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                Dynamic Subdivided Number Line Anchor
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Interactive Tick Calibrator
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Position fraction strips above the modular number line axis. Scrub subdivisions to reveal equivalent fraction milestones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveFraction({ num: 1, den: 2 });
                setSubdivisions(4);
                setDiscoveredEquivalents([{ num: 1, den: 2 }]);
                playSound('pop');
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset (1/2 Anchor)
            </button>
          </div>
        </div>

        {/* Anchor Presets */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Benchmark Fraction Anchors:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const isSelected = activeFraction.num === p.fraction.num && activeFraction.den === p.fraction.den;
              return (
                <button
                  key={p.id}
                  onClick={() => handleLoadPreset(p)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs scale-[1.02]'
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

      {/* 2. Fraction Strip & Subdivision Controller */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
        
        {/* Fraction Palette Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            Select Anchor Strip:
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { num: 1, den: 2 },
              { num: 2, den: 3 },
              { num: 3, den: 4 },
              { num: 4, den: 5 },
              { num: 5, den: 6 },
              { num: 3, den: 8 },
              { num: 7, den: 10 },
              { num: 5, den: 12 },
            ].map((item) => {
              const isSelected = activeFraction.num === item.num && activeFraction.den === item.den;
              const p = FRACTION_PALETTE[item.den as FractionDenominator];

              return (
                <button
                  key={`${item.num}-${item.den}`}
                  onClick={() => handleSetFraction(item.num, item.den as FractionDenominator)}
                  className={`px-3 py-1 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? `${p.bg} text-white border-transparent shadow-xs scale-105`
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {item.num}/{item.den}
                </button>
              );
            })}
          </div>
        </div>

        {/* Placed Fraction Strip View */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Fraction Strip: {activeFraction.num}/{activeFraction.den}</span>
            <span className="font-mono text-slate-500">
              Length = {(currentFractionValue * 100).toFixed(1)}% of 1 Whole
            </span>
          </div>

          <div className="w-full h-16 bg-slate-50 border-2 border-slate-300 rounded-2xl flex items-center relative overflow-hidden shadow-inner p-1">
            <div
              style={{ width: `${currentFractionValue * 100}%` }}
              className={`h-full ${palette.bg} rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs border-r-2 border-white relative`}
            >
              <span>{activeFraction.num}/{activeFraction.den}</span>

              {/* Downward Pointer Needle */}
              <div className="absolute right-0 bottom-0 translate-y-1/2 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-8 border-t-amber-400 z-10" />
            </div>

            {/* Remaining to Whole */}
            {currentFractionValue < 1 && (
              <div
                style={{ width: `${(1 - currentFractionValue) * 100}%` }}
                className="h-full bg-slate-100/60 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs italic"
              >
                Remaining to 1.0
              </div>
            )}
          </div>
        </div>

        {/* Subdivision Slider Control */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">
                Number Line Subdivision Axis:
              </span>
              <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-0.5 rounded-lg shadow-2xs">
                {subdivisions} Equal Subdivisions ({subdivisions}ths)
              </span>
            </div>

            {isExactTick ? (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Perfect Tick Alignment: {equivalentNum}/{subdivisions}!
              </span>
            ) : (
              <span className="text-slate-400 text-xs italic">
                Scrub slider to find subdivisions that align with strip end
              </span>
            )}
          </div>

          {/* Quick Denominator Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {DENOMINATORS.map((d) => (
              <button
                key={d}
                onClick={() => handleSliderChange(d)}
                className={`flex-1 min-w-[40px] py-1 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                  subdivisions === d
                    ? 'bg-blue-600 border-blue-700 text-white shadow-xs scale-105'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Number Line Canvas */}
        <div className="space-y-4 pt-2">
          <div className="w-full relative py-6 select-none">
            {/* Main Axis Line */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full relative">
              {/* Left End Tick 0 */}
              <div className="absolute left-0 -top-3 bottom-0 w-0.5 bg-slate-800 h-7" />
              <div className="absolute left-0 top-5 -translate-x-1/2 text-xs font-black text-slate-800">
                0
              </div>

              {/* Right End Tick 1 */}
              <div className="absolute right-0 -top-3 bottom-0 w-0.5 bg-slate-800 h-7" />
              <div className="absolute right-0 top-5 translate-x-1/2 text-xs font-black text-slate-800">
                1
              </div>

              {/* Subdivided Ticks */}
              {Array.from({ length: subdivisions + 1 }).map((_, idx) => {
                if (idx === 0 || idx === subdivisions) return null;
                const tickPct = (idx / subdivisions) * 100;
                const isMatchingStripEnd = isExactTick && idx === equivalentNum;

                return (
                  <div
                    key={idx}
                    style={{ left: `${tickPct}%` }}
                    className="absolute -top-2.5 bottom-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  >
                    {/* Tick Mark */}
                    <div
                      className={`w-0.5 transition-all ${
                        isMatchingStripEnd
                          ? 'h-8 bg-emerald-600 w-1 shadow-sm'
                          : 'h-6 bg-slate-400'
                      }`}
                    />

                    {/* Tick Label */}
                    <div
                      className={`text-[10px] font-bold mt-2 transition-all whitespace-nowrap ${
                        isMatchingStripEnd
                          ? 'text-emerald-700 font-black text-xs scale-110 bg-emerald-50 px-1 rounded-md border border-emerald-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {idx}/{subdivisions}
                    </div>
                  </div>
                );
              })}

              {/* Strip Alignment Needle Laser */}
              <div
                style={{ left: `${currentFractionValue * 100}%` }}
                className="absolute -top-5 bottom-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
              >
                <div className={`w-0.5 h-12 shadow-sm ${isExactTick ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div className={`w-3 h-3 rounded-full -mt-1.5 shadow-md ${isExactTick ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Discovered Equivalence Chain Display */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Discovered Equivalence Milestones
              </div>
              <h4 className="text-sm sm:text-base font-black text-white">
                Live Subdivided Equivalence Chain
              </h4>
            </div>
          </div>

          <button
            onClick={handleCelebrate}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Lock & Log Equivalence
          </button>
        </div>

        {/* Big Formula */}
        <div className="bg-slate-950/70 rounded-2xl p-4 sm:p-5 border border-white/10 text-center overflow-x-auto">
          <MathView
            latex={equivalenceChainLatex}
            displayMode={true}
            className="text-lg sm:text-2xl text-amber-300 font-bold"
          />
        </div>

        {/* Discovered Milestones Pills */}
        <div className="space-y-2">
          <span className="text-xs text-slate-400 font-semibold">
            Equivalences calibrated on the number line so far:
          </span>
          <div className="flex flex-wrap gap-2">
            {discoveredEquivalents
              .sort((a, b) => a.den - b.den)
              .map((eq, idx) => (
                <div
                  key={idx}
                  className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-2"
                >
                  <span className="text-xs font-black text-amber-300">
                    {eq.num}/{eq.den}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({eq.den}ths subdivision)
                  </span>
                </div>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
};
