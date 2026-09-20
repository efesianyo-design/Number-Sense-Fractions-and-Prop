import React, { useState, useMemo, useEffect } from 'react';
import { ActivityLog, StudentProfile } from '../../types';
import { simplifyFraction, fractionToLatex } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti, fireSuperConfetti } from '../../utils/confetti';
import { 
  Grid3X3, 
  ShoppingBag, 
  ChefHat, 
  RotateCcw, 
  Paintbrush, 
  Sparkles, 
  CheckCircle2, 
  TrendingDown,
  Scale,
  HelpCircle,
  BookOpen,
  Lightbulb,
  X,
  Bot,
  GraduationCap,
  Percent,
  Sliders,
  DollarSign,
  Coffee
} from 'lucide-react';

interface HundredGridModeProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  onOpenSocraticCoach?: (context: string) => void;
  student: StudentProfile | null;
}

interface BenchmarkPreset {
  id: string;
  name: string;
  count: number;
  fractionLabel: string;
  decimalLabel: string;
  percentLabel: string;
}

const BENCHMARK_PRESETS: BenchmarkPreset[] = [
  { id: 'p-10', name: '1/10 (Tenth)', count: 10, fractionLabel: '1/10', decimalLabel: '0.10', percentLabel: '10%' },
  { id: 'p-20', name: '1/5 (Fifth)', count: 20, fractionLabel: '1/5', decimalLabel: '0.20', percentLabel: '20%' },
  { id: 'p-25', name: '1/4 (Quarter)', count: 25, fractionLabel: '1/4', decimalLabel: '0.25', percentLabel: '25%' },
  { id: 'p-50', name: '1/2 (Half)', count: 50, fractionLabel: '1/2', decimalLabel: '0.50', percentLabel: '50%' },
  { id: 'p-60', name: '3/5 (Three-Fifths)', count: 60, fractionLabel: '3/5', decimalLabel: '0.60', percentLabel: '60%' },
  { id: 'p-75', name: '3/4 (Three-Fourths)', count: 75, fractionLabel: '3/4', decimalLabel: '0.75', percentLabel: '75%' },
];

export const HundredGridMode: React.FC<HundredGridModeProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  onOpenSocraticCoach,
  student,
}) => {
  // 100-Grid Matrix State (array of 100 booleans)
  const [gridCells, setGridCells] = useState<boolean[]>(() => {
    const init = new Array(100).fill(false);
    // Pre-fill 25% (25 cells)
    for (let i = 0; i < 25; i++) init[i] = true;
    return init;
  });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [paintMode, setPaintMode] = useState<boolean>(true); // true = fill, false = erase

  // Guide Modal & Inline Guide State
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [showInlineGuide, setShowInlineGuide] = useState<boolean>(true);
  const [guideActiveTab, setGuideActiveTab] = useState<'matrix' | 'representation' | 'market' | 'recipes'>('matrix');

  // Market Discount Simulator State (Ghanaian Cedis GH₵)
  const [marketItem, setMarketItem] = useState<string>('Kumasi Market Kente Stole');
  const [marketPrice, setMarketPrice] = useState<number>(240);
  const [syncWithGrid, setSyncWithGrid] = useState<boolean>(true);
  const [customDiscount, setCustomDiscount] = useState<number>(25);

  // Recipe Ratio Scaler State
  const [recipeServings, setRecipeServings] = useState<number>(4);
  const [recipeParts, setRecipeParts] = useState<{ name: string; parts: number; unit: string; basePerPart: number; color: string }[]>([
    { name: 'Fresh Pineapple Juice', parts: 3, unit: 'L', basePerPart: 0.25, color: 'bg-amber-500' },
    { name: 'Orange Nectar', parts: 2, unit: 'L', basePerPart: 0.25, color: 'bg-orange-500' },
    { name: 'Ginger Extract', parts: 1, unit: 'L', basePerPart: 0.25, color: 'bg-emerald-500' },
  ]);

  // Shaded Count & Fraction Math
  const shadedCount = useMemo(() => {
    return gridCells.filter(Boolean).length;
  }, [gridCells]);

  const fractionData = useMemo(() => {
    const simplified = simplifyFraction(shadedCount, 100);
    const decimal = shadedCount / 100;
    const percent = shadedCount;
    return {
      count: shadedCount,
      rawNum: shadedCount,
      rawDen: 100,
      simpNum: simplified.num,
      simpDen: simplified.den,
      decimal: decimal.toFixed(2),
      percent: `${percent}%`,
    };
  }, [shadedCount]);

  // Active discount percentage (either from grid or manual)
  const activeDiscountPct = syncWithGrid ? shadedCount : customDiscount;

  const discountCalculations = useMemo(() => {
    const savings = (marketPrice * activeDiscountPct) / 100;
    const finalPrice = marketPrice - savings;
    return {
      savings: Math.round(savings * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
    };
  }, [marketPrice, activeDiscountPct]);

  // Update Live KaTeX equation in header
  useEffect(() => {
    const latex = `\\frac{${fractionData.count}}{100} = \\frac{${fractionData.simpNum}}{${fractionData.simpDen}} = ${fractionData.decimal} = ${fractionData.percent}`;
    onUpdateLiveLatex(latex);
  }, [fractionData]);

  // Toggle cell on click or drag
  const handleCellInteract = (index: number, isDirectClick = false) => {
    setGridCells((prev) => {
      const next = [...prev];
      if (isDirectClick) {
        next[index] = !next[index];
        setPaintMode(next[index]);
      } else {
        next[index] = paintMode;
      }
      return next;
    });
    playSound('pop');
  };

  // Quick Brush Tools
  const handleFillAll = () => {
    setGridCells(new Array(100).fill(true));
    playSound('snap');
  };

  const handleClearAll = () => {
    setGridCells(new Array(100).fill(false));
    playSound('click');
  };

  const handleFillPreset = (preset: BenchmarkPreset) => {
    const next = new Array(100).fill(false);
    for (let i = 0; i < preset.count; i++) next[i] = true;
    setGridCells(next);
    playSound('snap');
    fireMathConfetti();

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: '100-Grid Percentages',
      title: `Loaded Benchmark: ${preset.name}`,
      details: `Discovered simplified equivalence: ${preset.count}/100 = ${preset.fractionLabel} = ${preset.decimalLabel} = ${preset.percentLabel}`,
      latexExpression: `\\frac{${preset.count}}{100} = ${fractionToLatex(simplifyFraction(preset.count, 100).num, simplifyFraction(preset.count, 100).den)} = ${preset.decimalLabel} = ${preset.percentLabel}`,
      success: true,
      score: 20,
    });
  };

  // Log Discount Activity
  const handleLogDiscount = () => {
    playSound('success');
    fireMathConfetti();
    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Market Discount',
      title: `GH₵ ${marketPrice} at ${activeDiscountPct}% Discount (${marketItem})`,
      details: `Calculated savings of GH₵ ${discountCalculations.savings.toFixed(2)}, paying GH₵ ${discountCalculations.finalPrice.toFixed(2)}`,
      latexExpression: `\\text{GH₵ } ${marketPrice} - (${marketPrice} \\times ${activeDiscountPct}\\% ) = \\text{GH₵ } ${discountCalculations.finalPrice.toFixed(2)}`,
      success: true,
      score: 25,
    });
  };

  // Total Recipe parts
  const totalRecipeParts = useMemo(() => {
    return recipeParts.reduce((acc, item) => acc + item.parts, 0);
  }, [recipeParts]);

  return (
    <div id="hundred-grid-workspace" className="flex-1 flex flex-col p-3 sm:p-5 max-w-6xl mx-auto w-full overflow-y-auto space-y-4">
      
      {/* Top Toolbar Controls & Guide Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3 sm:p-4 rounded-3xl shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 font-bold shadow-xs">
            <Grid3X3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                100-Grid Percent & Ratio Scaler
              </h2>
              <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Parts per Hundred
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Paint a 10x10 matrix to link fractions, decimals, percentages, and Ghanaian market discounts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Guide & Tutorial Button */}
          <button
            id="open-grid-guide-btn"
            onClick={() => {
              setIsGuideModalOpen(true);
              playSound('pop');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs cursor-pointer shadow-xs transition-all active:scale-95"
          >
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span>💡 How to Use & Guide</span>
          </button>

          {/* Ask Socratic Coach */}
          {onOpenSocraticCoach && (
            <button
              onClick={() => {
                onOpenSocraticCoach(`100-Grid workspace: Shaded=${shadedCount}/100 (${fractionData.percent}), Simplified=${fractionData.simpNum}/${fractionData.simpDen}, Market Price=GH₵ ${marketPrice}, Discount=${activeDiscountPct}%`);
                playSound('pop');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs cursor-pointer shadow-xs transition-colors"
            >
              <Bot className="w-4 h-4 text-purple-600" />
              <span>Ask Coach</span>
            </button>
          )}

          {/* Quick Clear Button */}
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-rose-600 rounded-xl border border-slate-300 font-bold text-xs cursor-pointer transition-colors"
            title="Clear all shaded grid cells"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Benchmark Presets Bar */}
      <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-black text-slate-700">
          <GraduationCap className="w-4 h-4 text-purple-600" />
          <span>Quick Benchmark Presets:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {BENCHMARK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleFillPreset(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                shadedCount === preset.count
                  ? 'bg-purple-600 text-white border border-purple-700 shadow-sm'
                  : 'bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-800'
              }`}
            >
              <span className="font-mono">{preset.percentLabel}</span>
              <span className="opacity-75 text-[10px]">({preset.fractionLabel})</span>
            </button>
          ))}
          <button
            onClick={handleFillAll}
            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            100% (All)
          </button>
        </div>
      </div>

      {/* Step-by-Step Inline Guide Banner */}
      {showInlineGuide && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 p-3.5 rounded-2xl text-xs space-y-2 relative shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-purple-900">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Step-by-Step Interactive Guide:</span>
            </div>
            <button
              onClick={() => setShowInlineGuide(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              title="Dismiss inline guide"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-slate-700">
            <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
              <div className="font-black text-purple-700 text-[11px]">1. Click / Drag Grid</div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Click individual squares or drag across rows/columns to paint portions per hundred.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
              <div className="font-black text-purple-700 text-[11px]">2. 4-Way Conversions</div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Watch fraction N/100, simplified a/b, decimal 0.xx, and percent xx% update live.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
              <div className="font-black text-purple-700 text-[11px]">3. Market Discount (GH₵)</div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Apply grid percentage savings directly to authentic Ghanaian marketplace items in Cedis.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
              <div className="font-black text-purple-700 text-[11px]">4. Scale Recipe Ratios</div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Adjust serving multiplier sliders to scale juice proportions linearly for parties and events.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main 100-Grid Interactive Matrix & Conversion Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left: 10x10 Matrix Box (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs flex flex-col items-center">
          
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Paintbrush className="w-4 h-4 text-purple-600" />
              10x10 Matrix ({shadedCount}/100 Shaded)
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
              <span>{shadedCount}% Shaded</span>
            </div>
          </div>

          {/* 10x10 Interactive Grid Box */}
          <div
            id="hundred-grid-matrix"
            onMouseDown={() => setIsMouseDown(true)}
            onMouseUp={() => setIsMouseDown(false)}
            onMouseLeave={() => setIsMouseDown(false)}
            className="grid grid-cols-10 gap-1.5 p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 shadow-inner select-none w-full max-w-md aspect-square"
          >
            {gridCells.map((isFilled, idx) => (
              <div
                key={idx}
                id={`grid-cell-${idx}`}
                onMouseDown={() => handleCellInteract(idx, true)}
                onMouseEnter={() => {
                  if (isMouseDown) handleCellInteract(idx, false);
                }}
                className={`rounded-md sm:rounded-lg transition-all duration-75 cursor-pointer flex items-center justify-center font-mono text-[9px] ${
                  isFilled
                    ? 'bg-purple-600 shadow-xs border border-purple-700 scale-[0.98]'
                    : 'bg-white border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {/* Visual cell indicator */}
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 text-center font-medium">
            Tip: Click or drag across squares to paint. Use quick presets to verify fraction simplifications.
          </p>
        </div>

        {/* Right: Live Conversion Cards (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3.5 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              4-Way Unified Math Representation
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center shadow-2xs">
                <div className="text-[10px] text-slate-400 uppercase font-black">Grid Count</div>
                <div className="text-base font-bold text-purple-700 mt-1">
                  <MathView latex={`\\frac{${fractionData.count}}{100}`} />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center shadow-2xs">
                <div className="text-[10px] text-slate-400 uppercase font-black">Simplified Fraction</div>
                <div className="text-base font-bold text-blue-700 mt-1">
                  <MathView latex={`\\frac{${fractionData.simpNum}}{${fractionData.simpDen}}`} />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center shadow-2xs">
                <div className="text-[10px] text-slate-400 uppercase font-black">Decimal Value</div>
                <div className="text-base font-mono font-black text-orange-600 mt-1">
                  {fractionData.decimal}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center shadow-2xs">
                <div className="text-[10px] text-slate-400 uppercase font-black">Percentage</div>
                <div className="text-base font-black text-green-700 mt-1">
                  {fractionData.percent}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Percentage Fill Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-2.5 shadow-xs">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Proportion Fill Level</span>
              <span className="text-purple-700 font-black">{shadedCount}%</span>
            </div>
            <div className="w-full bg-slate-100 h-4 rounded-full p-0.5 border border-slate-200 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 via-indigo-600 to-green-500 h-full rounded-full transition-all duration-150"
                style={{ width: `${shadedCount}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Real-World Simulators: Market Discount & Recipe Ratio Scaler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        
        {/* Simulator 1: Market Discount Simulator (GH₵) */}
        <div id="market-discount-simulator" className="bg-white border border-orange-200 rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold shadow-xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Ghanaian Market Discount Simulator
                </h3>
                <p className="text-[11px] text-slate-500">Calculate percentage savings in Cedis (GH₵)</p>
              </div>
            </div>

            <button
              onClick={() => setSyncWithGrid(!syncWithGrid)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition-colors cursor-pointer ${
                syncWithGrid
                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}
            >
              {syncWithGrid ? 'Synced to 100-Grid' : 'Manual Input'}
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase">
              Marketplace Item:
            </label>
            <select
              value={marketItem}
              onChange={(e) => {
                setMarketItem(e.target.value);
                if (e.target.value.includes('Kente')) setMarketPrice(240);
                else if (e.target.value.includes('Rice')) setMarketPrice(380);
                else if (e.target.value.includes('Smock')) setMarketPrice(450);
                else if (e.target.value.includes('Yams')) setMarketPrice(120);
                playSound('snap');
              }}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="Kumasi Market Kente Stole">Kumasi Market Kente Stole (GH₵ 240)</option>
              <option value="50kg Bag of Volta Long-Grain Rice">50kg Bag of Volta Long-Grain Rice (GH₵ 380)</option>
              <option value="Northern Bolga Handwoven Fugu Smock">Northern Bolga Handwoven Fugu Smock (GH₵ 450)</option>
              <option value="Bundle of 10 Pona Yams">Bundle of 10 Pona Yams (GH₵ 120)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                Original Price (GH₵)
              </label>
              <input
                id="market-price-input"
                type="number"
                min={1}
                step={5}
                value={marketPrice}
                onChange={(e) => setMarketPrice(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                Discount Rate (%)
              </label>
              <input
                id="discount-rate-input"
                type="number"
                min={0}
                max={100}
                disabled={syncWithGrid}
                value={activeDiscountPct}
                onChange={(e) => setCustomDiscount(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-orange-700 font-mono font-bold text-sm focus:outline-none disabled:opacity-75"
              />
            </div>
          </div>

          {/* Market Receipt Breakdown */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Original Amount:</span>
              <span className="font-mono font-bold text-slate-800">GH₵ {marketPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-orange-700 font-bold">
              <span className="flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Discount Savings ({activeDiscountPct}%):
              </span>
              <span className="font-mono">- GH₵ {discountCalculations.savings.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-green-700 font-black text-sm">
              <span>Final Market Price:</span>
              <span className="font-mono">GH₵ {discountCalculations.finalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            id="log-discount-solution-btn"
            onClick={handleLogDiscount}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            Verify & Log Market Calculation
          </button>
        </div>

        {/* Simulator 2: Recipe Ratio Scaler */}
        <div id="recipe-ratio-scaler" className="bg-white border border-green-200 rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-green-600 font-bold shadow-xs">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Recipe Proportions & Ratio Scaler
                </h3>
                <p className="text-[11px] text-slate-500">Scale ingredients proportionally for classroom events</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold">Servings:</span>
              <span className="font-bold text-green-700 font-mono text-sm">{recipeServings}</span>
            </div>
          </div>

          {/* Servings Slider */}
          <div className="space-y-1">
            <input
              id="recipe-servings-slider"
              type="range"
              min={1}
              max={20}
              step={1}
              value={recipeServings}
              onChange={(e) => {
                setRecipeServings(parseInt(e.target.value, 10));
                playSound('snap');
              }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>1 Serving</span>
              <span>10 Servings</span>
              <span>20 Servings</span>
            </div>
          </div>

          {/* Ingredient Parts Breakdown */}
          <div className="space-y-2">
            {recipeParts.map((item, idx) => {
              const scaledQty = (item.basePerPart * item.parts * (recipeServings / 4)).toFixed(2);
              const partPct = Math.round((item.parts / totalRecipeParts) * 100);

              return (
                <div
                  key={idx}
                  className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="font-bold text-slate-700">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({partPct}% of mix)</span>
                  </div>
                  <div className="font-mono font-bold text-slate-900">
                    {scaledQty} {item.unit}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-green-50 p-3 rounded-2xl border border-green-200 text-xs text-green-800 space-y-1">
            <div className="font-black text-[11px]">Proportional Ratio Model:</div>
            <p className="text-[11px] text-slate-600">
              Pineapple : Orange : Ginger = <strong className="font-mono">3 : 2 : 1</strong> (Total 6 parts). Multiplied by <span className="font-mono font-bold text-green-700">{(recipeServings / 4).toFixed(2)}x</span> factor.
            </p>
          </div>
        </div>

      </div>

      {/* COMPREHENSIVE GUIDE & TUTORIAL MODAL */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600 font-bold shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    100-Grid & Percent Scaler Guide
                  </h3>
                  <p className="text-xs text-slate-500">
                    Connecting parts per hundred, fraction reduction, decimals, and marketplace math
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="grid grid-cols-4 p-2 bg-slate-50 border-b border-slate-200 text-xs font-bold">
              {[
                { id: 'matrix', label: '1. 10x10 Matrix', icon: '🎨' },
                { id: 'representation', label: '2. 4-Way Math', icon: '✨' },
                { id: 'market', label: '3. GH₵ Market', icon: '🇬🇭' },
                { id: 'recipes', label: '4. Ratio Scaler', icon: '🍹' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setGuideActiveTab(tab.id as any)}
                  className={`py-2 text-center rounded-xl transition-all cursor-pointer ${
                    guideActiveTab === tab.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.icon} {tab.label}</span>
                </button>
              ))}
            </div>

            {/* Modal Tab Content */}
            <div className="p-5 sm:p-6 space-y-4 text-xs leading-relaxed text-slate-700 flex-1">
              
              {guideActiveTab === 'matrix' && (
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span>🎨</span> The 10x10 Hundred Matrix
                  </h4>
                  <p>
                    Percent literally means <em>"per one hundred"</em> (from Latin <em>per centum</em>). The 10x10 grid is composed of exactly 100 equal unit squares.
                  </p>

                  <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 space-y-1.5">
                    <div className="font-bold text-purple-900">How to Interact:</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      <li><strong>Click to Toggle</strong>: Click any individual box to shade or clear it.</li>
                      <li><strong>Drag to Paint</strong>: Click and hold while sweeping across rows or columns to shade larger blocks rapidly.</li>
                      <li><strong>Preset Benchmarks</strong>: Click quick presets like $25\%$ ($\frac{1}{4}$), $50\%$ ($\frac{1}{2}$), and $75\%$ ($\frac{3}{4}$) to study common benchmark fractions.</li>
                    </ul>
                  </div>
                </div>
              )}

              {guideActiveTab === 'representation' && (
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span>✨</span> 4-Way Unified Math Representation
                  </h4>
                  <p>
                    Every shaded amount is simultaneously presented across 4 equivalent forms:
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-black text-purple-700">1. Grid Count (N/100)</div>
                      <p className="text-slate-600 text-[11px]">Direct count of colored squares out of 100 total.</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-black text-blue-700">2. Simplified Fraction (a/b)</div>
                      <p className="text-slate-600 text-[11px]">Reduced by greatest common divisor (e.g. 25/100 = 1/4).</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-black text-orange-700">3. Decimal (0.xx)</div>
                      <p className="text-slate-600 text-[11px]">Base-10 positional notation (25 ÷ 100 = 0.25).</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="font-black text-green-700">4. Percent (xx%)</div>
                      <p className="text-slate-600 text-[11px]">Standard percentage symbol (25%).</p>
                    </div>
                  </div>
                </div>
              )}

              {guideActiveTab === 'market' && (
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span>🇬🇭</span> Ghana Market Discount Simulator (GH₵)
                  </h4>
                  <p>
                    In Ghanaian commerce (e.g. Makola Market, Kejetia Market), calculating percentage discounts and price reductions is a daily essential.
                  </p>
                  <div className="bg-orange-50 p-3.5 rounded-2xl border border-orange-200 space-y-2 text-slate-700">
                    <div className="font-bold text-orange-900">Discount Math Formula:</div>
                    <p className="font-mono text-[11px] bg-white p-2 rounded-lg border border-orange-200">
                      Savings = Original Price × (Discount % ÷ 100)<br />
                      Final Price = Original Price - Savings
                    </p>
                    <p className="text-[11px]">
                      Example: A Kente stole priced at <strong>GH₵ 240</strong> with a <strong>25%</strong> discount saves 240 × 0.25 = <strong>GH₵ 60</strong>, leaving a final price of <strong>GH₵ 180</strong>.
                    </p>
                  </div>
                </div>
              )}

              {guideActiveTab === 'recipes' && (
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span>🍹</span> Proportional Ratio & Recipe Scaler
                  </h4>
                  <p>
                    Ratios describe how quantities scale together. When multiplying a batch recipe, every component is multiplied by the exact same scale factor.
                  </p>
                  <div className="bg-green-50 p-3.5 rounded-2xl border border-green-200 space-y-2 text-slate-700">
                    <div className="font-bold text-green-900">Part-to-Whole Ratio:</div>
                    <p className="text-[11px]">
                      If a pineapple punch recipe calls for 3 parts pineapple, 2 parts orange, and 1 part ginger (Total 6 parts):
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      <li>Pineapple represents $\frac{3}{6} = 50\%$ of the drink.</li>
                      <li>Orange represents $\frac{2}{6} = 33.3\%$ of the drink.</li>
                      <li>Ginger represents $\frac{1}{6} = 16.7\%$ of the drink.</li>
                    </ul>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Ghanaian SHS / JHS Curriculum Standard • Sir Eugene Tech
              </span>
              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
              >
                Got It, Start Exploring!
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
