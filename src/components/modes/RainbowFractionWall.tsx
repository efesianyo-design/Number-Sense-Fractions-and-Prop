import React, { useState, useMemo, useEffect } from 'react';
import { FractionDenominator, ActivityLog, StudentProfile } from '../../types';
import { FRACTION_PALETTE, fractionToLatex } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti } from '../../utils/confetti';
import { 
  Sparkles, 
  MousePointerClick, 
  X, 
  PlusCircle, 
  Sliders, 
  ArrowDownRight, 
  Layers, 
  Info,
  Filter
} from 'lucide-react';

interface RainbowFractionWallProps {
  onAddPieceToActiveTrack?: (den: FractionDenominator) => void;
  activeTrackNumber?: number;
  onUpdateLiveLatex?: (latex: string) => void;
  onLogActivity?: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  student?: StudentProfile | null;
}

interface WallLayer {
  denominator: FractionDenominator | 1;
  count: number;
  label: string;
  family: 'halves' | 'thirds' | 'fifths' | 'whole';
}

const WALL_LAYERS: WallLayer[] = [
  { denominator: 1, count: 1, label: '1 Whole', family: 'whole' },
  { denominator: 2, count: 2, label: 'Halves', family: 'halves' },
  { denominator: 3, count: 3, label: 'Thirds', family: 'thirds' },
  { denominator: 4, count: 4, label: 'Fourths', family: 'halves' },
  { denominator: 5, count: 5, label: 'Fifths', family: 'fifths' },
  { denominator: 6, count: 6, label: 'Sixths', family: 'thirds' },
  { denominator: 8, count: 8, label: 'Eighths', family: 'halves' },
  { denominator: 10, count: 10, label: 'Tenths', family: 'fifths' },
  { denominator: 12, count: 12, label: 'Twelfths', family: 'thirds' },
  { denominator: 16, count: 16, label: 'Sixteenths', family: 'halves' },
];

export const RainbowFractionWall: React.FC<RainbowFractionWallProps> = ({
  onAddPieceToActiveTrack,
  activeTrackNumber = 1,
  onUpdateLiveLatex,
  onLogActivity,
  student,
}) => {
  const [selectedFraction, setSelectedFraction] = useState<{ num: number; den: FractionDenominator | 1 } | null>({ num: 1, den: 2 });
  const [hoverPositionPct, setHoverPositionPct] = useState<number | null>(50);
  const [displayMode, setDisplayMode] = useState<'fraction' | 'decimal' | 'percent'>('fraction');
  const [activeFamilyFilter, setActiveFamilyFilter] = useState<'all' | 'halves' | 'thirds' | 'fifths'>('all');
  const [shrinkingSliderDen, setShrinkingSliderDen] = useState<number>(4);

  // Filtered layers
  const visibleLayers = useMemo(() => {
    if (activeFamilyFilter === 'all') return WALL_LAYERS;
    return WALL_LAYERS.filter(l => l.family === 'whole' || l.family === activeFamilyFilter);
  }, [activeFamilyFilter]);

  // Find all equivalent fractions across layers for the selected fraction
  const equivalentMatches = useMemo(() => {
    if (!selectedFraction) return [];
    const val = selectedFraction.num / selectedFraction.den;
    const matches: { den: FractionDenominator | 1; num: number }[] = [];

    WALL_LAYERS.forEach(layer => {
      for (let n = 1; n <= layer.count; n++) {
        const testVal = n / layer.denominator;
        if (Math.abs(testVal - val) < 0.0001) {
          matches.push({ den: layer.denominator, num: n });
        }
      }
    });

    return matches;
  }, [selectedFraction]);

  // LaTeX equivalence string
  const equivalenceLatex = useMemo(() => {
    if (!selectedFraction || equivalentMatches.length === 0) return '';
    return equivalentMatches
      .map(m => (m.den === 1 ? '1' : `\\frac{${m.num}}{${m.den}}`))
      .join(' = ');
  }, [selectedFraction, equivalentMatches]);

  // Sync to KaTeX ribbon
  useEffect(() => {
    if (onUpdateLiveLatex && equivalenceLatex) {
      onUpdateLiveLatex(`\\text{Wall Equivalence: } ${equivalenceLatex}`);
    }
  }, [equivalenceLatex, onUpdateLiveLatex]);

  const handleSelectTile = (num: number, den: FractionDenominator | 1) => {
    setSelectedFraction({ num, den });
    const pct = (num / den) * 100;
    setHoverPositionPct(pct);
    playSound('pop');

    if (onLogActivity) {
      onLogActivity({
        studentId: student?.id || 'guest',
        studentName: student?.name || 'Guest Student',
        studentLevel: student?.level || 'Form 1',
        topic: 'Rainbow Fraction Wall',
        title: `Inspected Equivalence for ${num}/${den}`,
        details: `Discovered equivalent fractions along the vertical projection line: ${equivalenceLatex}`,
        latexExpression: equivalenceLatex,
        success: true,
        score: 10,
      });
    }
  };

  return (
    <div id="rainbow-fraction-wall-workspace" className="space-y-6 animate-fadeIn">
      
      {/* Top Filter & Display Controls Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-800 space-y-4">
        
        {/* Header Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <span className="font-black text-sm">🧱</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Rainbow Fraction Wall Showcase
                </h3>
                <span className="bg-gradient-to-r from-amber-400 to-rose-400 text-slate-950 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full shadow-xs">
                  10 Layers
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tap any tile to project vertical dashed laser guidelines and discover equal subdivisions.
              </p>
            </div>
          </div>

          {/* Family Filters & Display Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Family Filter */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400 px-2 font-medium flex items-center gap-1 text-[11px]">
                <Filter className="w-3 h-3 text-amber-400" />
                Family:
              </span>
              <button
                onClick={() => { setActiveFamilyFilter('all'); playSound('click'); }}
                className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeFamilyFilter === 'all' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setActiveFamilyFilter('halves'); playSound('click'); }}
                className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeFamilyFilter === 'halves' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Halves (2,4,8,16)
              </button>
              <button
                onClick={() => { setActiveFamilyFilter('thirds'); playSound('click'); }}
                className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeFamilyFilter === 'thirds' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Thirds (3,6,12)
              </button>
              <button
                onClick={() => { setActiveFamilyFilter('fifths'); playSound('click'); }}
                className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeFamilyFilter === 'fifths' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Fifths (5,10)
              </button>
            </div>

            {/* Display Mode */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => { setDisplayMode('fraction'); playSound('click'); }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  displayMode === 'fraction' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Fractions
              </button>
              <button
                onClick={() => { setDisplayMode('decimal'); playSound('click'); }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  displayMode === 'decimal' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Decimals
              </button>
              <button
                onClick={() => { setDisplayMode('percent'); playSound('click'); }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  displayMode === 'percent' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Percent %
              </button>
            </div>
          </div>
        </div>

        {/* Live Equivalence Inspector Card */}
        {selectedFraction && (
          <div className="bg-slate-800/90 border-2 border-amber-400/40 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Equivalence Chain:</span>
              </div>
              <div className="text-base sm:text-lg font-serif text-white font-black tracking-wide">
                <MathView latex={equivalenceLatex} />
              </div>
              <span className="text-xs font-mono text-amber-300 font-bold bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                = {((selectedFraction.num / selectedFraction.den) * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onAddPieceToActiveTrack && selectedFraction.den !== 1 && (
                <button
                  onClick={() => {
                    onAddPieceToActiveTrack(selectedFraction.den as FractionDenominator);
                    playSound('snap');
                    fireMathConfetti();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add 1/{selectedFraction.den} to Track {activeTrackNumber}</span>
                </button>
              )}
              <button
                onClick={() => { setSelectedFraction(null); setHoverPositionPct(null); playSound('click'); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 cursor-pointer"
                title="Clear Laser Guideline"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Fraction Wall Stack Canvas */}
        <div 
          className="relative bg-slate-950/80 p-3 sm:p-5 rounded-2xl border border-slate-800/80 space-y-1.5 select-none overflow-hidden"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left - 12;
            const width = rect.width - 24;
            const pct = Math.max(0, Math.min(100, (x / width) * 100));
            if (!selectedFraction) {
              setHoverPositionPct(pct);
            }
          }}
          onMouseLeave={() => {
            if (!selectedFraction) setHoverPositionPct(null);
          }}
        >
          {/* Laser Projection Line */}
          {hoverPositionPct !== null && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400/95 shadow-[0_0_15px_rgba(251,191,36,1)] z-30 pointer-events-none transition-all duration-75"
              style={{ left: `calc(${hoverPositionPct}% + 12px)` }}
            >
              <div className="absolute -top-1 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                {hoverPositionPct.toFixed(1)}%
              </div>
            </div>
          )}

          {/* Wall Layers */}
          {visibleLayers.map((layer) => {
            const den = layer.denominator;
            const palette = FRACTION_PALETTE[den] || FRACTION_PALETTE[2];

            return (
              <div key={den} className="flex items-center w-full h-8 sm:h-9">
                <div className="flex-1 flex h-full rounded-lg overflow-hidden border border-slate-700/50 shadow-inner">
                  {Array.from({ length: layer.count }).map((_, i) => {
                    const tileNum = i + 1;
                    const isMatch = equivalentMatches.some(m => m.den === den && m.num >= tileNum);
                    const isExactRightBoundary = equivalentMatches.some(m => m.den === den && m.num === tileNum);
                    const isDirectlySelected = selectedFraction?.den === den && selectedFraction?.num === tileNum;

                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectTile(tileNum, den)}
                        className={`h-full flex-1 flex items-center justify-center font-bold text-[10px] sm:text-xs transition-all relative border-r border-slate-900/60 cursor-pointer ${palette.bg} text-white ${
                          isDirectlySelected
                            ? 'ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-900 z-10 brightness-110 font-black'
                            : isExactRightBoundary
                            ? 'brightness-125 saturate-150 font-black ring-2 ring-white'
                            : isMatch
                            ? 'brightness-110'
                            : 'opacity-85 hover:opacity-100 hover:brightness-110'
                        }`}
                        title={`Layer: ${layer.label} - Piece ${tileNum}/${den}`}
                      >
                        {displayMode === 'fraction' && (
                          <MathView latex={den === 1 ? '1' : `\\frac{1}{${den}}`} />
                        )}
                        {displayMode === 'decimal' && (
                          <span>{(1 / den).toFixed(den > 8 ? 3 : 2)}</span>
                        )}
                        {displayMode === 'percent' && (
                          <span>{(100 / den).toFixed(0)}%</span>
                        )}

                        {isExactRightBoundary && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-md" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* "Shrinking Unit" Interactive Explorer */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                The "Shrinking Unit" Visual Principle
              </h4>
              <p className="text-xs text-slate-500">
                Fundamental Rule: As denominator <span className="font-mono font-bold text-slate-800">d</span> increases, the individual unit piece width <span className="font-serif font-bold text-slate-800">1/d</span> decreases!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-xl text-xs font-bold text-slate-700">
            <span>Selected Unit:</span>
            <span className="font-serif text-sm font-black text-blue-700">
              <MathView latex={`\\frac{1}{${shrinkingSliderDen}}`} />
            </span>
            <span className="font-mono text-slate-500">
              = {(100 / shrinkingSliderDen).toFixed(1)}% of 1 Whole
            </span>
          </div>
        </div>

        {/* Interactive Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min={1}
            max={16}
            step={1}
            value={shrinkingSliderDen}
            onChange={(e) => {
              const val = Number(e.target.value);
              // snap to valid denominators if possible
              setShrinkingSliderDen(val);
              playSound('snap');
            }}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <div className="flex justify-between text-[11px] font-bold text-slate-400 px-1">
            <span>1 Whole (100% - Largest)</span>
            <span>1/2 (50%)</span>
            <span>1/4 (25%)</span>
            <span>1/8 (12.5%)</span>
            <span>1/16 (6.25% - Smallest)</span>
          </div>
        </div>

        {/* Comparison Demonstration Bar */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Visual Width of 1 Piece (<MathView latex={`\\frac{1}{${shrinkingSliderDen}}`} />):</span>
            <span className="font-mono text-blue-600 font-bold">
              {(100 / shrinkingSliderDen).toFixed(2)}% Width
            </span>
          </div>

          <div className="w-full h-12 bg-slate-100 rounded-xl border border-slate-200 p-1 flex">
            <div 
              style={{ width: `${(1 / shrinkingSliderDen) * 100}%` }}
              className={`h-full ${FRACTION_PALETTE[shrinkingSliderDen]?.bg || 'bg-blue-600'} text-white rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm transition-all duration-200`}
            >
              <MathView latex={`\\frac{1}{${shrinkingSliderDen}}`} />
            </div>
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic">
              {(100 - 100 / shrinkingSliderDen).toFixed(1)}% remaining space of the whole
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
