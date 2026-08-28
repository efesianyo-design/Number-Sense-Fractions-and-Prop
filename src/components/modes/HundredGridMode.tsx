import React, { useState, useMemo, useEffect } from 'react';
import { ActivityLog, StudentProfile } from '../../types';
import { simplifyFraction, fractionToLatex } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti } from '../../utils/confetti';
import { 
  Grid3X3, 
  ShoppingBag, 
  ChefHat, 
  RotateCcw, 
  Paintbrush, 
  Sparkles, 
  CheckCircle2, 
  TrendingDown,
  Scale
} from 'lucide-react';

interface HundredGridModeProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
}

export const HundredGridMode: React.FC<HundredGridModeProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
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

  // Market Discount Simulator State (Ghanaian Cedis GH₵)
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

  const handleFillQuarter = (fraction: number) => {
    const count = Math.round(100 * fraction);
    const next = new Array(100).fill(false);
    for (let i = 0; i < count; i++) next[i] = true;
    setGridCells(next);
    playSound('snap');
    fireMathConfetti();

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: '100-Grid Percentages',
      title: `Shaded ${count}% on 100-Grid Matrix`,
      details: `Discovered simplified equivalence: ${count}/100 = ${simplifyFraction(count, 100).num}/${simplifyFraction(count, 100).den}`,
      latexExpression: `\\frac{${count}}{100} = \\frac{${simplifyFraction(count, 100).num}}{${simplifyFraction(count, 100).den}} = ${(count / 100).toFixed(2)}`,
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
      title: `GH₵ ${marketPrice} at ${activeDiscountPct}% Discount`,
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
    <div id="hundred-grid-workspace" className="flex-1 flex flex-col p-3 sm:p-5 max-w-6xl mx-auto w-full overflow-y-auto space-y-5">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 font-bold">
            <Grid3X3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              100-Grid Percent & Proportional Scaler
            </h2>
            <p className="text-xs text-slate-500">
              Interactive 10x10 matrix with live conversions, Ghanaian market discounts, and recipe ratio scaler.
            </p>
          </div>
        </div>

        {/* Live Conversion Badges */}
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium">Equivalence:</span>
          <span className="font-serif font-bold text-blue-700">
            <MathView latex={`\\frac{${fractionData.count}}{100} = \\frac{${fractionData.simpNum}}{${fractionData.simpDen}}`} />
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-orange-600 font-bold">{fractionData.decimal}</span>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-green-700">{fractionData.percent}</span>
        </div>
      </div>

      {/* Main Grid & Converters Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: 10x10 Matrix & Brush Dock (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 flex flex-col items-center space-y-4 shadow-sm">
          
          <div className="w-full flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Paintbrush className="w-4 h-4 text-purple-600" />
              10x10 Matrix ({shadedCount}/100 Shaded)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleFillQuarter(0.25)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                25%
              </button>
              <button
                onClick={() => handleFillQuarter(0.50)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                50%
              </button>
              <button
                onClick={() => handleFillQuarter(0.75)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                75%
              </button>
              <button
                onClick={handleFillAll}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                100%
              </button>
              <button
                onClick={handleClearAll}
                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                title="Clear all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
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
                    ? 'bg-blue-600 shadow-sm border border-blue-700 scale-[0.98]'
                    : 'bg-white border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {/* Visual marker */}
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 text-center font-medium">
            Tip: Click or drag across squares to paint. Use quick presets to verify fraction simplifications.
          </p>
        </div>

        {/* Right: Live Conversion Cards (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              4-Way Unified Math Representation
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Grid Count</div>
                <div className="text-base font-bold text-purple-700 mt-1">
                  <MathView latex={`\\frac{${fractionData.count}}{100}`} />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Simplified Fraction</div>
                <div className="text-base font-bold text-blue-700 mt-1">
                  <MathView latex={`\\frac{${fractionData.simpNum}}{${fractionData.simpDen}}`} />
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Decimal Value</div>
                <div className="text-base font-mono font-bold text-orange-600 mt-1">
                  {fractionData.decimal}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Percentage</div>
                <div className="text-base font-bold text-green-700 mt-1">
                  {fractionData.percent}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Percentage Fill Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-sm">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Proportion Fill</span>
              <span className="text-green-700">{shadedCount}%</span>
            </div>
            <div className="w-full bg-slate-100 h-4 rounded-full p-0.5 border border-slate-200 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-green-500 h-full rounded-full transition-all duration-150"
                style={{ width: `${shadedCount}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Real-World Simulators: Market Discount & Recipe Ratio Scaler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        
        {/* Simulator 1: Market Discount Simulator (GH₵) */}
        <div id="market-discount-simulator" className="bg-white border border-orange-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Ghanaian Market Discount Simulator
                </h3>
                <p className="text-[11px] text-slate-500">Calculate percentage savings in Cedis (GH₵)</p>
              </div>
            </div>

            <button
              onClick={() => setSyncWithGrid(!syncWithGrid)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                syncWithGrid
                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}
            >
              {syncWithGrid ? 'Synced to 100-Grid' : 'Manual Input'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
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
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
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
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Verify & Log Market Calculation
          </button>
        </div>

        {/* Simulator 2: Recipe Ratio Scaler */}
        <div id="recipe-ratio-scaler" className="bg-white border border-green-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-600 font-bold">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Recipe Proportions & Ratio Scaler
                </h3>
                <p className="text-[11px] text-slate-500">Scale ingredients proportionally for classroom events</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 text-xs">
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
            <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
              <span>1 Serving</span>
              <span>10 Servings</span>
              <span>20 Servings</span>
            </div>
          </div>

          {/* Proportional Mixing Bars */}
          <div className="space-y-2 text-xs">
            {recipeParts.map((item, idx) => {
              const fractionOfTotal = item.parts / totalRecipeParts;
              const scaledQuantity = (item.basePerPart * item.parts * (recipeServings / 4)).toFixed(2);

              return (
                <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-700">{item.name}</span>
                    <span className="font-mono text-green-700 font-bold">
                      {scaledQuantity} {item.unit} ({item.parts}/{totalRecipeParts} of batch)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`${item.color} h-full rounded-full`}
                      style={{ width: `${fractionOfTotal * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center text-xs font-serif text-blue-700 font-bold">
            <MathView latex={`\\text{Ratio } = 3 \\text{ Pineapple} : 2 \\text{ Orange} : 1 \\text{ Ginger} \\quad (\\Sigma = ${totalRecipeParts} \\text{ parts})`} />
          </div>
        </div>

      </div>

    </div>
  );
};
