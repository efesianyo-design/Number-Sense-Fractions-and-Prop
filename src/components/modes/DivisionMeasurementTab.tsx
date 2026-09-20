import React, { useState, useMemo, useEffect } from 'react';
import { FractionDenominator, ActivityLog, StudentProfile } from '../../types';
import { DENOMINATORS, FRACTION_PALETTE, fractionToLatex, simplifyFraction, lcm, gcd, mixedToLatex } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti } from '../../utils/confetti';
import { 
  Divide, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Award, 
  HelpCircle,
  Play,
  Pause,
  Sliders,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface DivisionMeasurementTabProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
}

interface DivisionPreset {
  id: string;
  title: string;
  category: 'proper' | 'whole' | 'improper';
  dividend: { num: number; den: FractionDenominator | 1 };
  divisor: { num: number; den: FractionDenominator | 1 };
  description: string;
}

const PRESETS: DivisionPreset[] = [
  // Proper Fractions
  {
    id: 'd1',
    title: '1/4 ÷ 1/3 = 3/4',
    category: 'proper',
    dividend: { num: 1, den: 4 },
    divisor: { num: 1, den: 3 },
    description: 'Dividend is 3/12, Divisor is 4/12. Dividend covers 3 out of 4 units.',
  },
  {
    id: 'd2',
    title: '1/2 ÷ 2/3 = 3/4',
    category: 'proper',
    dividend: { num: 1, den: 2 },
    divisor: { num: 2, den: 3 },
    description: '3/6 ÷ 4/6 = 3/4 of the divisor.',
  },
  {
    id: 'd3',
    title: '2/5 ÷ 1/2 = 4/5',
    category: 'proper',
    dividend: { num: 2, den: 5 },
    divisor: { num: 1, den: 2 },
    description: '4/10 ÷ 5/10 = 4/5 of the divisor.',
  },
  {
    id: 'd4',
    title: '3/8 ÷ 3/4 = 1/2',
    category: 'proper',
    dividend: { num: 3, den: 8 },
    divisor: { num: 3, den: 4 },
    description: '3/8 ÷ 6/8 = 3/6 = 1/2 of the divisor.',
  },

  // Whole-by-Fraction
  {
    id: 'd5',
    title: '1 ÷ 1/3 = 3',
    category: 'whole',
    dividend: { num: 1, den: 1 },
    divisor: { num: 1, den: 3 },
    description: 'How many 1/3 strips fit into 1 Whole? Exactly 3.',
  },
  {
    id: 'd6',
    title: '1 ÷ 1/4 = 4',
    category: 'whole',
    dividend: { num: 1, den: 1 },
    divisor: { num: 1, den: 4 },
    description: 'How many 1/4 strips fit into 1 Whole? Exactly 4.',
  },
  {
    id: 'd7',
    title: '1 ÷ 2/3 = 3/2 (1½)',
    category: 'whole',
    dividend: { num: 1, den: 1 },
    divisor: { num: 2, den: 3 },
    description: '3/3 ÷ 2/3 = 3/2 = 1½ copies of the divisor.',
  },

  // Improper Results (Quotient > 1)
  {
    id: 'd8',
    title: '1/2 ÷ 1/6 = 3',
    category: 'improper',
    dividend: { num: 1, den: 2 },
    divisor: { num: 1, den: 6 },
    description: '3/6 ÷ 1/6 = 3 full sixths fit into one half.',
  },
  {
    id: 'd9',
    title: '3/4 ÷ 1/8 = 6',
    category: 'improper',
    dividend: { num: 3, den: 4 },
    divisor: { num: 1, den: 8 },
    description: '6/8 ÷ 1/8 = 6 full eighths fit into 3/4.',
  },
  {
    id: 'd10',
    title: '2/3 ÷ 1/6 = 4',
    category: 'improper',
    dividend: { num: 2, den: 3 },
    divisor: { num: 1, den: 6 },
    description: '4/6 ÷ 1/6 = 4 sixths fit into 2/3.',
  },
];

export const DivisionMeasurementTab: React.FC<DivisionMeasurementTabProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  student,
}) => {
  // Dividend & Divisor state
  const [dividend, setDividend] = useState<{ num: number; den: FractionDenominator | 1 }>({ num: 1, den: 4 });
  const [divisor, setDivisor] = useState<{ num: number; den: FractionDenominator | 1 }>({ num: 1, den: 3 });

  // Interactive Divisor Copies Slider / Animation
  const [placedDivisorCopies, setPlacedDivisorCopies] = useState<number>(1);
  const [showSubGrid, setShowSubGrid] = useState<boolean>(true);

  // Calculations
  const {
    dividendVal,
    divisorVal,
    quotientVal,
    commonDen,
    dividendUnits,
    divisorUnits,
    quotientFrac,
    simplifiedQuotient,
    isIntegerQuotient,
    wholeQuotient,
    remNum,
  } = useMemo(() => {
    const dVal = dividend.num / dividend.den;
    const divVal = divisor.num / divisor.den;
    const qVal = dVal / divVal;

    const common = lcm(dividend.den, divisor.den);
    const dUnits = dividend.num * (common / dividend.den);
    const divUnits = divisor.num * (common / divisor.den);

    const qNum = dUnits;
    const qDen = divUnits;
    const simp = simplifyFraction(qNum, qDen);

    const isInt = qNum % qDen === 0;
    const whole = Math.floor(qNum / qDen);
    const rem = qNum % qDen;

    return {
      dividendVal: dVal,
      divisorVal: divVal,
      quotientVal: qVal,
      commonDen: common,
      dividendUnits: dUnits,
      divisorUnits: divUnits,
      quotientFrac: { num: qNum, den: qDen },
      simplifiedQuotient: simp,
      isIntegerQuotient: isInt,
      wholeQuotient: whole,
      remNum: rem,
    };
  }, [dividend, divisor]);

  // Live KaTeX formula
  const divisionLatex = useMemo(() => {
    const dFrac = dividend.den === 1 ? `${dividend.num}` : `\\frac{${dividend.num}}{${dividend.den}}`;
    const divFrac = divisor.den === 1 ? `${divisor.num}` : `\\frac{${divisor.num}}{${divisor.den}}`;
    const commonStep = `\\frac{\\frac{${dividendUnits}}{${commonDen}}}{\\frac{${divisorUnits}}{${commonDen}}}`;
    const directFraction = `\\frac{${dividendUnits}}{${divisorUnits}}`;
    const simp = simplifiedQuotient.den === 1 ? `${simplifiedQuotient.num}` : `\\frac{${simplifiedQuotient.num}}{${simplifiedQuotient.den}}`;

    let mixed = '';
    if (!isIntegerQuotient && simplifiedQuotient.num > simplifiedQuotient.den) {
      const w = Math.floor(simplifiedQuotient.num / simplifiedQuotient.den);
      const r = simplifiedQuotient.num % simplifiedQuotient.den;
      mixed = ` = ${w}\\frac{${r}}{${simplifiedQuotient.den}}`;
    }

    return `${dFrac} \\div ${divFrac} = ${commonStep} = ${directFraction} = ${simp}${mixed}`;
  }, [dividend, divisor, dividendUnits, divisorUnits, commonDen, simplifiedQuotient, isIntegerQuotient]);

  useEffect(() => {
    onUpdateLiveLatex(`\\text{Division: } ${divisionLatex}`);
  }, [divisionLatex, onUpdateLiveLatex]);

  // Select preset
  const handleSelectPreset = (preset: DivisionPreset) => {
    setDividend(preset.dividend);
    setDivisor(preset.divisor);
    setPlacedDivisorCopies(1);
    playSound('jump');

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Fraction Division',
      title: `Tested Division Preset: ${preset.title}`,
      details: preset.description,
      latexExpression: `\\frac{${preset.dividend.num}}{${preset.dividend.den}} \\div \\frac{${preset.divisor.num}}{${preset.divisor.den}}`,
      success: true,
      score: 15,
    });
  };

  // Trigger celebration on solving
  const handleCelebrate = () => {
    playSound('success');
    fireMathConfetti();
    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Fraction Division',
      title: `Solved Measurement Division: ${dividend.num}/${dividend.den} ÷ ${divisor.num}/${divisor.den}`,
      details: `Discovered that ${dividendUnits}/${commonDen} contains ${dividendUnits}/${divisorUnits} of ${divisorUnits}/${commonDen} = ${simplifiedQuotient.num}/${simplifiedQuotient.den}`,
      latexExpression: divisionLatex,
      success: true,
      score: 35,
    });
  };

  // Max display width based on max strip length
  const maxSpan = Math.max(1, dividendVal, divisorVal * 1.2);

  const dividendPalette = FRACTION_PALETTE[dividend.den] || FRACTION_PALETTE[4];
  const divisorPalette = FRACTION_PALETTE[divisor.den] || FRACTION_PALETTE[3];
  const commonPalette = FRACTION_PALETTE[commonDen] || FRACTION_PALETTE[12];

  return (
    <div id="fraction-division-engine" className="space-y-5 animate-fadeIn">
      {/* 1. Header & Classroom Presets Ribbon */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Divide className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                Fraction Division by Measurement Modeler
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  "How Many Divisors Fit in Dividend?"
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Visualize division as measurement by common units: rename both strips into {commonDen}ths, then count the ratio bracket.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDividend({ num: 1, den: 4 });
                setDivisor({ num: 1, den: 3 });
                setPlacedDivisorCopies(1);
                playSound('pop');
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset (1/4 ÷ 1/3)
            </button>
          </div>
        </div>

        {/* Preset Tabs by Category */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Presets:
            </span>
            {PRESETS.map((p) => {
              const isSelected =
                dividend.num === p.dividend.num &&
                dividend.den === p.dividend.den &&
                divisor.num === p.divisor.num &&
                divisor.den === p.divisor.den;

              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs scale-[1.02]'
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

      {/* 2. Interactive Dividend & Divisor Custom Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dividend Strip Configurator */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              1. Dividend (Target Amount to Measure):
            </span>
            <span className="text-xs font-bold text-amber-700 font-mono">
              {dividend.num}/{dividend.den} ({ (dividendVal * 100).toFixed(1) }%)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Numerator */}
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Numerator:</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setDividend((prev) => ({ ...prev, num: n }));
                      playSound('click');
                    }}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      dividend.num === n
                        ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Denominator */}
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Denominator:</label>
              <div className="flex flex-wrap items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDividend((prev) => ({ ...prev, den: d as FractionDenominator }));
                      playSound('click');
                    }}
                    className={`px-2 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      dividend.den === d
                        ? 'bg-amber-600 border-amber-700 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {d === 1 ? '1' : `/${d}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divisor Strip Configurator */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              2. Divisor (Measuring Unit):
            </span>
            <span className="text-xs font-bold text-blue-700 font-mono">
              {divisor.num}/{divisor.den} ({ (divisorVal * 100).toFixed(1) }%)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Numerator */}
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Numerator:</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setDivisor((prev) => ({ ...prev, num: n }));
                      playSound('click');
                    }}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      divisor.num === n
                        ? 'bg-blue-600 border-blue-700 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Denominator */}
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Denominator:</label>
              <div className="flex flex-wrap items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDivisor((prev) => ({ ...prev, den: d as FractionDenominator }));
                      playSound('click');
                    }}
                    className={`px-2 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      divisor.den === d
                        ? 'bg-blue-700 border-blue-800 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {d === 1 ? '1' : `/${d}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Three-Row Visual Workspace */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
        
        {/* 1 Whole Reference Ruler */}
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>0</span>
            <span className="font-mono">1 Whole Standard (100%)</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full relative">
            <div 
              style={{ width: `${(1 / maxSpan) * 100}%` }}
              className="h-full bg-slate-400 rounded-full"
            />
          </div>
        </div>

        {/* Row 1: Dividend Strip */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center text-[10px]">
                A
              </span>
              <span>Row 1: Dividend (What we have) = {dividend.num}/{dividend.den}</span>
            </span>
            <span className="text-amber-700 font-mono text-xs">
              = {dividendUnits} / {commonDen}ths
            </span>
          </div>

          <div className="w-full h-14 bg-slate-50 border-2 border-slate-300 rounded-2xl flex items-center relative overflow-hidden shadow-inner p-1">
            <div
              style={{ width: `${(dividendVal / maxSpan) * 100}%` }}
              className={`h-full ${dividendPalette.bg} rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs border-r-2 border-white`}
            >
              {dividend.num > 1 ? `${dividend.num}/${dividend.den}` : `1/${dividend.den}`}
            </div>
          </div>
        </div>

        {/* Row 2: Divisor Strip */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center text-[10px]">
                B
              </span>
              <span>Row 2: Divisor (Measuring Unit) = {divisor.num}/{divisor.den}</span>
            </span>
            <span className="text-blue-700 font-mono text-xs">
              = {divisorUnits} / {commonDen}ths
            </span>
          </div>

          <div className="w-full h-14 bg-slate-50 border-2 border-slate-300 rounded-2xl flex items-center relative overflow-hidden shadow-inner p-1">
            <div
              style={{ width: `${(divisorVal / maxSpan) * 100}%` }}
              className={`h-full ${divisorPalette.bg} rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs border-r-2 border-white`}
            >
              {divisor.num > 1 ? `${divisor.num}/${divisor.den}` : `1/${divisor.den}`}
            </div>
          </div>
        </div>

        {/* Row 3: Common Unit Partition & Visual Ratio Bracket */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-900 flex items-center justify-center text-[10px]">
                C
              </span>
              <span>Row 3: Common Partition Grid ({commonDen}ths) & Measurement Ratio</span>
            </span>
            <span className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded-md">
              Dividend = {dividendUnits} blocks | Divisor = {divisorUnits} blocks
            </span>
          </div>

          {/* Partition Grid Strip */}
          <div className="w-full h-16 bg-slate-50 border-2 border-slate-300 rounded-2xl flex items-center relative overflow-hidden shadow-inner p-1">
            {Array.from({ length: Math.ceil(maxSpan * commonDen) }).map((_, idx) => {
              const isCoveredByDividend = idx < dividendUnits;
              const isCoveredByDivisor = idx < divisorUnits;

              let tileClass = 'bg-slate-200/50 text-slate-400';
              if (isCoveredByDividend && isCoveredByDivisor) {
                // Shared coverage
                tileClass = 'bg-indigo-600 text-white shadow-xs';
              } else if (isCoveredByDividend && !isCoveredByDivisor) {
                // Excess dividend over 1 copy of divisor
                tileClass = 'bg-amber-500 text-white shadow-xs';
              } else if (!isCoveredByDividend && isCoveredByDivisor) {
                // Divisor portion not reached by dividend
                tileClass = 'bg-blue-200 border-blue-400 text-blue-800 border-dashed';
              }

              const unitPct = (1 / commonDen / maxSpan) * 100;

              return (
                <div
                  key={idx}
                  style={{ width: `${unitPct}%` }}
                  className={`h-full border-r border-white flex flex-col items-center justify-center text-[11px] font-bold transition-all select-none ${tileClass}`}
                >
                  <span>1/{commonDen}</span>
                  {idx < Math.max(dividendUnits, divisorUnits) && (
                    <span className="text-[8px] opacity-80 mt-0.5">#{idx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Visual Ratio Measurement Bracket */}
          <div className="relative pt-2 pb-4">
            <div 
              style={{ width: `${(divisorVal / maxSpan) * 100}%` }}
              className="border-2 border-t-0 border-indigo-600 h-4 rounded-b-xl relative flex items-center justify-center"
            >
              <div className="absolute -bottom-6 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                Divisor Spans {divisorUnits} Units → Dividend Covers {dividendUnits} / {divisorUnits} = {simplifiedQuotient.num}/{simplifiedQuotient.den}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Live Division Equation Card & Socratic Step-by-Step Reasoner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Division as Common-Unit Measurement
              </div>
              <h4 className="text-sm sm:text-base font-black text-white">
                Step-by-Step Socratic Ratio Proof
              </h4>
            </div>
          </div>

          <button
            onClick={handleCelebrate}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Verify & Celebrate!
          </button>
        </div>

        {/* Big Display KaTeX Formula */}
        <div className="bg-slate-950/70 rounded-2xl p-4 sm:p-5 border border-white/10 text-center overflow-x-auto">
          <MathView
            latex={divisionLatex}
            displayMode={true}
            className="text-lg sm:text-2xl text-amber-300 font-bold"
          />
        </div>

        {/* Step-by-Step Reasoner Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Step 1 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-indigo-300 font-bold">
              <span>Step 1: Common Units</span>
              <span className="bg-indigo-500/30 px-2 py-0.5 rounded-md">LCM</span>
            </div>
            <div className="text-slate-300 leading-relaxed font-medium">
              Find common denominator for <span className="text-amber-300">{dividend.den}</span> and <span className="text-blue-300">{divisor.den}</span>:
            </div>
            <div className="text-center py-1 font-bold text-amber-300">
              LCM({dividend.den}, {divisor.den}) = {commonDen}
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-amber-300 font-bold">
              <span>Step 2: Rename Dividend</span>
              <span className="bg-amber-500/30 px-2 py-0.5 rounded-md">Dividend</span>
            </div>
            <div className="text-slate-300 leading-relaxed font-medium">
              Convert {dividend.num}/{dividend.den} into {commonDen}ths:
            </div>
            <div className="text-center py-1 font-bold text-white">
              <MathView latex={`\\frac{${dividend.num}}{${dividend.den}} = \\frac{${dividendUnits}}{${commonDen}}`} />
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-blue-300 font-bold">
              <span>Step 3: Rename Divisor</span>
              <span className="bg-blue-500/30 px-2 py-0.5 rounded-md">Divisor</span>
            </div>
            <div className="text-slate-300 leading-relaxed font-medium">
              Convert {divisor.num}/{divisor.den} into {commonDen}ths:
            </div>
            <div className="text-center py-1 font-bold text-white">
              <MathView latex={`\\frac{${divisor.num}}{${divisor.den}} = \\frac{${divisorUnits}}{${commonDen}}`} />
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-emerald-300 font-bold">
              <span>Step 4: Ratio Measurement</span>
              <span className="bg-emerald-500/30 px-2 py-0.5 rounded-md">Result</span>
            </div>
            <div className="text-emerald-100/90 leading-relaxed font-medium">
              "How many groups of {divisorUnits} fit in {dividendUnits}?"
            </div>
            <div className="text-center py-1 font-bold text-amber-300 text-sm">
              {simplifiedQuotient.num}/{simplifiedQuotient.den}
              {!isIntegerQuotient && simplifiedQuotient.num > simplifiedQuotient.den && (
                <span className="text-xs text-white ml-1">
                  ({Math.floor(simplifiedQuotient.num / simplifiedQuotient.den)} {simplifiedQuotient.num % simplifiedQuotient.den}/{simplifiedQuotient.den})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Inverse Multiplication Rule Verification */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          <span className="font-semibold flex items-center gap-1.5 text-blue-200">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Check via Inverted Multiplication Rule (Keep-Change-Flip):
          </span>
          <div className="bg-white/10 px-3 py-1 rounded-xl font-mono text-amber-300 border border-white/10">
            <MathView
              latex={`\\frac{${dividend.num}}{${dividend.den}} \\times \\frac{${divisor.den}}{${divisor.num}} = \\frac{${dividend.num * divisor.den}}{${dividend.den * divisor.num}} = \\frac{${simplifiedQuotient.num}}{${simplifiedQuotient.den}}`}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
