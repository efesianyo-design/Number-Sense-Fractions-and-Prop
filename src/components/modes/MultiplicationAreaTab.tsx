import React, { useState, useMemo, useEffect } from 'react';
import { FractionDenominator, ActivityLog, StudentProfile } from '../../types';
import { DENOMINATORS, FRACTION_PALETTE, fractionToLatex, simplifyFraction, gcd } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti } from '../../utils/confetti';
import { 
  Grid3X3, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Award, 
  HelpCircle,
  Maximize2,
  Sliders,
  Plus,
  Minus
} from 'lucide-react';

interface MultiplicationAreaTabProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
  initialFractions?: {
    f1?: { num: number; den: FractionDenominator };
    f2?: { num: number; den: FractionDenominator };
  };
}

interface AreaPreset {
  id: string;
  title: string;
  fraction1: { num: number; den: FractionDenominator };
  fraction2: { num: number; den: FractionDenominator };
  description: string;
}

const PRESETS: AreaPreset[] = [
  {
    id: 'p-half-half',
    title: '1/2 × 1/2 = 1/4',
    fraction1: { num: 1, den: 2 },
    fraction2: { num: 1, den: 2 },
    description: 'Taking half of a half results in one quarter of the whole square.',
  },
  {
    id: 'p-twothirds-threefourths',
    title: '2/3 × 3/4 = 6/12 = 1/2',
    fraction1: { num: 2, den: 3 },
    fraction2: { num: 3, den: 4 },
    description: '2 vertical thirds intersecting 3 horizontal quarters yields 6 out of 12 cells (1/2).',
  },
  {
    id: 'p-threefifths-half',
    title: '3/5 × 1/2 = 3/10',
    fraction1: { num: 3, den: 5 },
    fraction2: { num: 1, den: 2 },
    description: '3 fifths of 1 half partitions the square into 10 cells, shading 3 of them.',
  },
  {
    id: 'p-fourfifths-twothirds',
    title: '4/5 × 2/3 = 8/15',
    fraction1: { num: 4, den: 5 },
    fraction2: { num: 2, den: 3 },
    description: '4 fifths multiplied by 2 thirds gives 8 of 15 composite partition cells.',
  },
  {
    id: 'p-onethird-threefourths',
    title: '1/3 × 3/4 = 3/12 = 1/4',
    fraction1: { num: 1, den: 3 },
    fraction2: { num: 3, den: 4 },
    description: '1 third of 3 quarters equals 3 twelfths, which simplifies directly to 1/4.',
  },
  {
    id: 'p-fivesixths-half',
    title: '5/6 × 1/2 = 5/12',
    fraction1: { num: 5, den: 6 },
    fraction2: { num: 1, den: 2 },
    description: '5 sixths of a half partition yields 5 out of 12 unit parts.',
  },
];

export const MultiplicationAreaTab: React.FC<MultiplicationAreaTabProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  student,
  initialFractions,
}) => {
  // Factor 1 (Columns / Width partition)
  const [f1, setF1] = useState<{ num: number; den: FractionDenominator }>(
    initialFractions?.f1 || { num: 2, den: 3 }
  );

  // Factor 2 (Rows / Height partition)
  const [f2, setF2] = useState<{ num: number; den: FractionDenominator }>(
    initialFractions?.f2 || { num: 3, den: 4 }
  );

  // Cell inspection hover
  const [hoveredCell, setHoveredCell] = useState<{ col: number; row: number } | null>(null);

  // Sync if props change
  useEffect(() => {
    if (initialFractions?.f1) setF1(initialFractions.f1);
    if (initialFractions?.f2) setF2(initialFractions.f2);
  }, [initialFractions]);

  // Total grid dimensions & overlap metrics
  const totalCells = f1.den * f2.den;
  const overlappingCells = f1.num * f2.num;
  const simplified = useMemo(
    () => simplifyFraction(overlappingCells, totalCells),
    [overlappingCells, totalCells]
  );
  const commonDivisor = gcd(overlappingCells, totalCells);

  // KaTeX expressions
  const productLatex = useMemo(() => {
    if (commonDivisor > 1 && (simplified.num !== overlappingCells || simplified.den !== totalCells)) {
      return `\\frac{${f1.num}}{${f1.den}} \\times \\frac{${f2.num}}{${f2.den}} = \\frac{${f1.num} \\times ${f2.num}}{${f1.den} \\times ${f2.den}} = \\frac{${overlappingCells}}{${totalCells}} = \\frac{${simplified.num}}{${simplified.den}}`;
    }
    return `\\frac{${f1.num}}{${f1.den}} \\times \\frac{${f2.num}}{${f2.den}} = \\frac{${f1.num} \\times ${f2.num}}{${f1.den} \\times ${f2.den}} = \\frac{${overlappingCells}}{${totalCells}}`;
  }, [f1, f2, overlappingCells, totalCells, simplified, commonDivisor]);

  // Sync live KaTeX
  useEffect(() => {
    onUpdateLiveLatex(`\\text{2D Area Model: } ${productLatex}`);
  }, [productLatex, onUpdateLiveLatex]);

  // Presets
  const handleLoadPreset = (preset: AreaPreset) => {
    setF1(preset.fraction1);
    setF2(preset.fraction2);
    playSound('jump');

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Fraction Multiplication',
      title: `Preset Area Model: ${preset.title}`,
      details: preset.description,
      latexExpression: `\\frac{${preset.fraction1.num}}{${preset.fraction1.den}} \\times \\frac{${preset.fraction2.num}}{${preset.fraction2.den}}`,
      success: true,
      score: 15,
    });
  };

  // Celebrate
  const handleCelebrate = () => {
    playSound('success');
    fireMathConfetti();

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Fraction Multiplication',
      title: `Mastered 2D Area Product: ${productLatex}`,
      details: `Visualized ${f1.num}/${f1.den} × ${f2.num}/${f2.den} = ${overlappingCells}/${totalCells} (${simplified.num}/${simplified.den}) using 2D overlapping unit area grid.`,
      latexExpression: productLatex,
      success: true,
      score: 35,
    });
  };

  const p1 = FRACTION_PALETTE[f1.den] || FRACTION_PALETTE[3];
  const p2 = FRACTION_PALETTE[f2.den] || FRACTION_PALETTE[4];

  return (
    <div id="multiplication-area-engine" className="space-y-5 animate-fadeIn">
      
      {/* 1. Header & Presets Ribbon */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                2D Area Grid Model for Fraction Multiplication
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  W × H Overlap Model
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Visualize fraction multiplication by partitioning a 1×1 unit square horizontally and vertically. The double-shaded intersection is the exact product.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setF1({ num: 2, den: 3 });
              setF2({ num: 3, den: 4 });
              playSound('pop');
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset (2/3 × 3/4)
          </button>
        </div>

        {/* Preset Ribbon */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Curriculum Product Presets:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const isSelected =
                f1.num === p.fraction1.num &&
                f1.den === p.fraction1.den &&
                f2.num === p.fraction2.num &&
                f2.den === p.fraction2.den;

              return (
                <button
                  key={p.id}
                  onClick={() => handleLoadPreset(p)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
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

      {/* 2. Interactive Area Grid & Factor Adjusters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Factor Adjusters */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Factor 1 (Width / Columns) */}
          <div className="bg-white border-2 border-blue-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                  1
                </div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Factor 1 (Columns / Width):
                </span>
              </div>
              <span className="text-sm font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-xl border border-blue-200">
                {f1.num}/{f1.den}
              </span>
            </div>

            {/* Denominator Selector (Vertical Columns) */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500">
                Columns / Denominator ({f1.den} equal columns):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {([2, 3, 4, 5, 6, 8, 10, 12] as FractionDenominator[]).map((d) => (
                  <button
                    key={`f1-den-${d}`}
                    onClick={() => {
                      setF1((prev) => ({
                        den: d,
                        num: Math.min(prev.num, d),
                      }));
                      playSound('click');
                    }}
                    className={`px-2.5 py-1 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                      f1.den === d
                        ? 'bg-blue-600 text-white border-blue-700 shadow-2xs scale-105'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {d}ths
                  </button>
                ))}
              </div>
            </div>

            {/* Numerator Adjuster (Shaded Columns) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Shaded Columns / Numerator ({f1.num} columns):</span>
                <span>{f1.num} of {f1.den}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={f1.num <= 1}
                  onClick={() => {
                    setF1((prev) => ({ ...prev, num: Math.max(1, prev.num - 1) }));
                    playSound('pop');
                  }}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center font-black cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 flex gap-1">
                  {Array.from({ length: f1.den }).map((_, i) => (
                    <button
                      key={`f1-col-${i}`}
                      onClick={() => {
                        setF1((prev) => ({ ...prev, num: i + 1 }));
                        playSound('snap');
                      }}
                      className={`flex-1 h-7 rounded-md border text-[10px] font-black transition-all cursor-pointer ${
                        i < f1.num
                          ? 'bg-blue-500 text-white border-blue-600'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={f1.num >= f1.den}
                  onClick={() => {
                    setF1((prev) => ({ ...prev, num: Math.min(prev.den, prev.num + 1) }));
                    playSound('snap');
                  }}
                  className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-30 flex items-center justify-center font-black cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Factor 2 (Height / Rows) */}
          <div className="bg-white border-2 border-amber-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-black">
                  2
                </div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Factor 2 (Rows / Height):
                </span>
              </div>
              <span className="text-sm font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-xl border border-amber-200">
                {f2.num}/{f2.den}
              </span>
            </div>

            {/* Denominator Selector (Horizontal Rows) */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500">
                Rows / Denominator ({f2.den} equal rows):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {([2, 3, 4, 5, 6, 8, 10, 12] as FractionDenominator[]).map((d) => (
                  <button
                    key={`f2-den-${d}`}
                    onClick={() => {
                      setF2((prev) => ({
                        den: d,
                        num: Math.min(prev.num, d),
                      }));
                      playSound('click');
                    }}
                    className={`px-2.5 py-1 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                      f2.den === d
                        ? 'bg-amber-500 text-white border-amber-600 shadow-2xs scale-105'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {d}ths
                  </button>
                ))}
              </div>
            </div>

            {/* Numerator Adjuster (Shaded Rows) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Shaded Rows / Numerator ({f2.num} rows):</span>
                <span>{f2.num} of {f2.den}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={f2.num <= 1}
                  onClick={() => {
                    setF2((prev) => ({ ...prev, num: Math.max(1, prev.num - 1) }));
                    playSound('pop');
                  }}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center font-black cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 flex gap-1">
                  {Array.from({ length: f2.den }).map((_, i) => (
                    <button
                      key={`f2-row-${i}`}
                      onClick={() => {
                        setF2((prev) => ({ ...prev, num: i + 1 }));
                        playSound('snap');
                      }}
                      className={`flex-1 h-7 rounded-md border text-[10px] font-black transition-all cursor-pointer ${
                        i < f2.num
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={f2.num >= f2.den}
                  onClick={() => {
                    setF2((prev) => ({ ...prev, num: Math.min(prev.den, prev.num + 1) }));
                    playSound('snap');
                  }}
                  className="w-8 h-8 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 disabled:opacity-30 flex items-center justify-center font-black cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Legend Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
              Color Layer Inspection Legend:
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
              <div className="bg-blue-100 text-blue-800 p-1.5 rounded-xl border border-blue-200">
                Width {f1.num}/{f1.den}
              </div>
              <div className="bg-amber-100 text-amber-800 p-1.5 rounded-xl border border-amber-200">
                Height {f2.num}/{f2.den}
              </div>
              <div className="bg-emerald-500 text-white p-1.5 rounded-xl shadow-xs border border-emerald-600 animate-pulse">
                Overlap ({overlappingCells}/{totalCells})
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: 2D Unit Square Canvas & Step Proof */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-indigo-600" />
                1 × 1 Unit Square Area Canvas ({totalCells} Subdivided Unit Cells)
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {overlappingCells} Overlapping Cells
              </span>
            </div>

            {/* Visual Canvas Container */}
            <div className="relative aspect-square max-w-[380px] sm:max-w-[420px] mx-auto bg-slate-900 rounded-2xl p-2 border-4 border-slate-800 shadow-xl overflow-hidden select-none">
              
              {/* The 1x1 Square Grid */}
              <div 
                className="w-full h-full bg-slate-800 rounded-xl grid relative border border-slate-700 overflow-hidden"
                style={{
                  gridTemplateColumns: `repeat(${f1.den}, 1fr)`,
                  gridTemplateRows: `repeat(${f2.den}, 1fr)`,
                }}
              >
                {Array.from({ length: f2.den }).map((_, rIdx) =>
                  Array.from({ length: f1.den }).map((_, cIdx) => {
                    const isColShaded = cIdx < f1.num;
                    const isRowShaded = rIdx < f2.num;
                    const isOverlap = isColShaded && isRowShaded;
                    const isHovered = hoveredCell?.col === cIdx && hoveredCell?.row === rIdx;

                    let cellBg = 'bg-slate-800/80 hover:bg-slate-700/60';
                    let cellText = '';
                    let textColor = 'text-slate-500';

                    if (isOverlap) {
                      cellBg = 'bg-emerald-500 hover:bg-emerald-400 shadow-inner';
                      cellText = '★';
                      textColor = 'text-emerald-950 font-black';
                    } else if (isColShaded) {
                      cellBg = 'bg-blue-600/70 hover:bg-blue-500/70';
                      cellText = '│';
                      textColor = 'text-blue-200';
                    } else if (isRowShaded) {
                      cellBg = 'bg-amber-500/70 hover:bg-amber-400/70';
                      cellText = '─';
                      textColor = 'text-amber-200';
                    }

                    return (
                      <div
                        key={`cell-${rIdx}-${cIdx}`}
                        onMouseEnter={() => setHoveredCell({ col: cIdx, row: rIdx })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`border border-white/20 transition-all flex items-center justify-center cursor-pointer relative ${cellBg}`}
                        title={`Cell (Col ${cIdx + 1}, Row ${rIdx + 1}) = 1/${totalCells} of Whole`}
                      >
                        <span className={`text-[10px] sm:text-xs select-none ${textColor}`}>
                          {cellText}
                        </span>

                        {isOverlap && (
                          <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono text-emerald-950/80 font-bold hidden sm:inline">
                            1/{totalCells}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Top Width Label Indicator */}
              <div className="absolute top-0 left-2 right-2 flex justify-between pointer-events-none text-[10px] font-bold text-blue-300 px-2 py-0.5 bg-blue-950/80 rounded-b-md border-b border-blue-500/40">
                <span>Width: {f1.num}/{f1.den} ({f1.num} cols)</span>
                <span>1.0 Whole</span>
              </div>

              {/* Left Height Label Indicator */}
              <div className="absolute bottom-2 left-0 top-6 flex flex-col justify-between pointer-events-none text-[9px] font-bold text-amber-300 py-2 px-0.5 bg-amber-950/80 rounded-r-md border-r border-amber-500/40 writing-vertical">
                <span>Height: {f2.num}/{f2.den}</span>
              </div>
            </div>

            {/* Socratic Math Step Proof Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-black text-slate-800 border-b border-slate-200 pb-2">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Step-by-Step Area Product Proof
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Total Partitions = {f1.den} × {f2.den} = {totalCells}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Numerator Product */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-black uppercase text-blue-600">
                    1. Overlap Numerator
                  </div>
                  <div className="font-mono font-bold text-slate-800">
                    {f1.num} × {f2.num} = {overlappingCells}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {overlappingCells} overlapping shaded cells.
                  </p>
                </div>

                {/* Denominator Product */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-black uppercase text-amber-600">
                    2. Total Denominator
                  </div>
                  <div className="font-mono font-bold text-slate-800">
                    {f1.den} × {f2.den} = {totalCells}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {totalCells} equal unit cells in 1 Whole.
                  </p>
                </div>

                {/* Simplification */}
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-1">
                  <div className="text-[10px] font-black uppercase text-emerald-700">
                    3. Simplified Product
                  </div>
                  <div className="font-mono font-black text-emerald-900">
                    {simplified.num}/{simplified.den}
                  </div>
                  <p className="text-[10px] text-emerald-700 leading-tight">
                    {commonDivisor > 1 ? `Reduced by GCD ${commonDivisor}` : 'Already lowest terms'}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 3. Big KaTeX Equation & Lock Milestone Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Formula & Visual Equivalence
              </div>
              <h4 className="text-sm sm:text-base font-black text-white">
                Multiplication Formula Verification
              </h4>
            </div>
          </div>

          <button
            onClick={handleCelebrate}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-4 py-2 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Lock & Log Area Product
          </button>
        </div>

        <div className="bg-slate-950/70 rounded-2xl p-4 sm:p-5 border border-white/10 text-center overflow-x-auto">
          <MathView
            latex={productLatex}
            displayMode={true}
            className="text-lg sm:text-2xl text-amber-300 font-bold"
          />
        </div>
      </div>

    </div>
  );
};
