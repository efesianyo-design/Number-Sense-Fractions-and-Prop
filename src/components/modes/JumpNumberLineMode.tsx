import React, { useState, useRef, useMemo, useEffect } from 'react';
import { JumpVector, ActivityLog, StudentProfile, FormLevel } from '../../types';
import { fractionToLatex, simplifyFraction, DENOMINATORS } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti } from '../../utils/confetti';
import { 
  Ruler, 
  Plus, 
  Minus, 
  RotateCcw, 
  Search, 
  Sparkles, 
  ArrowRight, 
  Crosshair,
  CheckCircle2,
  Undo2
} from 'lucide-react';

interface JumpNumberLineModeProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
}

type RangeType = 'integers' | 'fractions' | 'mixed';

export const JumpNumberLineMode: React.FC<JumpNumberLineModeProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  student,
}) => {
  const [rangeType, setRangeType] = useState<RangeType>('fractions');
  const [subdivisions, setSubdivisions] = useState<number>(4); // default 4ths
  const [jumps, setJumps] = useState<JumpVector[]>([]);
  const [dragStartPoint, setDragStartPoint] = useState<number | null>(null);
  const [currentHoverPoint, setCurrentHoverPoint] = useState<number | null>(null);

  // Decimal Magnifier & Rounding Pin
  const [decimalPin, setDecimalPin] = useState<number>(0.75);
  const [roundedSpotlight, setRoundedSpotlight] = useState<{ value: number; explanation: string } | null>(null);

  // Range boundaries
  const rangeConfig = useMemo(() => {
    switch (rangeType) {
      case 'integers':
        return { min: -5, max: 5, step: 1 / subdivisions, formatFraction: false };
      case 'mixed':
        return { min: 0, max: 4, step: 1 / subdivisions, formatFraction: true };
      case 'fractions':
      default:
        return { min: 0, max: 1, step: 1 / subdivisions, formatFraction: true };
    }
  }, [rangeType, subdivisions]);

  // Total net position
  const currentPosition = useMemo(() => {
    if (jumps.length === 0) return rangeConfig.min;
    return jumps[jumps.length - 1].to;
  }, [jumps, rangeConfig.min]);

  // Live KaTeX expression for Jump equation
  const liveEquation = useMemo(() => {
    if (jumps.length === 0) {
      return `x_0 = ${rangeConfig.min}`;
    }

    let expr = `${jumps[0].from}`;
    jumps.forEach((j) => {
      const isPos = j.delta >= 0;
      const simp = simplifyFraction(Math.abs(Math.round(j.delta * subdivisions)), subdivisions);
      const fracLatex = fractionToLatex(simp.num, simp.den);
      expr += ` ${isPos ? '+' : '-'} ${fracLatex}`;
    });

    const finalSimp = simplifyFraction(Math.round(currentPosition * subdivisions), subdivisions);
    expr += ` = ${fractionToLatex(finalSimp.num, finalSimp.den)}`;
    return expr;
  }, [jumps, currentPosition, rangeConfig.min, subdivisions]);

  useEffect(() => {
    onUpdateLiveLatex(liveEquation);
  }, [liveEquation]);

  // Ticks calculation
  const ticks = useMemo(() => {
    const list: { val: number; isMajor: boolean; label: string }[] = [];
    const totalSteps = Math.round((rangeConfig.max - rangeConfig.min) / rangeConfig.step);

    for (let i = 0; i <= totalSteps; i++) {
      const val = rangeConfig.min + i * rangeConfig.step;
      const isMajor = Math.abs(val % 1) < 0.001 || Math.abs(val % 1 - 1) < 0.001;

      let label = '';
      if (isMajor) {
        label = `${Math.round(val)}`;
      } else if (rangeConfig.formatFraction) {
        const whole = Math.floor(val);
        const rem = val - whole;
        const simp = simplifyFraction(Math.round(rem * subdivisions), subdivisions);
        label = whole > 0 ? `${whole} ${simp.num}/${simp.den}` : `${simp.num}/${simp.den}`;
      }

      list.push({ val: Math.round(val * 1000) / 1000, isMajor, label });
    }
    return list;
  }, [rangeConfig, subdivisions]);

  // Convert mathematical value to horizontal percentage
  const valueToPercent = (val: number) => {
    return ((val - rangeConfig.min) / (rangeConfig.max - rangeConfig.min)) * 100;
  };

  // Click on tick mark to jump or initiate jump
  const handleTickClick = (tickVal: number) => {
    if (dragStartPoint === null) {
      setDragStartPoint(tickVal);
      playSound('click');
    } else {
      if (tickVal === dragStartPoint) {
        setDragStartPoint(null);
        return;
      }
      // Create Jump Vector
      const delta = tickVal - dragStartPoint;
      const isRight = delta > 0;
      const newJump: JumpVector = {
        id: `jump-${Date.now()}`,
        from: dragStartPoint,
        to: tickVal,
        delta: Math.round(delta * 1000) / 1000,
        direction: isRight ? 'right' : 'left',
        color: isRight ? '#10b981' : '#f43f5e',
      };

      setJumps((prev) => [...prev, newJump]);
      setDragStartPoint(tickVal); // Chain next jump from destination
      playSound('jump');

      // Log jump activity
      onLogActivity({
        studentId: student?.id || 'guest',
        studentName: student?.name || 'Guest Student',
        studentLevel: student?.level || 'Form 1',
        topic: 'Number Line Jumps',
        title: `Vector Jump: ${dragStartPoint} to ${tickVal}`,
        details: `Jump displacement: ${delta > 0 ? '+' : ''}${delta.toFixed(2)} on subdivision 1/${subdivisions}`,
        latexExpression: `${dragStartPoint} ${delta >= 0 ? '+' : '-'} ${Math.abs(delta).toFixed(2)} = ${tickVal}`,
        success: true,
        score: 15,
      });
    }
  };

  const handleUndoJump = () => {
    if (jumps.length > 0) {
      setJumps((prev) => prev.slice(0, -1));
      playSound('pop');
    }
  };

  const handleResetJumps = () => {
    setJumps([]);
    setDragStartPoint(null);
    setRoundedSpotlight(null);
    playSound('click');
  };

  // Perform Decimal Rounding to Whole or Tenth
  const handleRoundDecimal = (target: 'whole' | 'tenth') => {
    playSound('round');
    let rounded: number;
    let explanation = '';

    if (target === 'whole') {
      rounded = Math.round(decimalPin);
      const distDown = Math.abs(decimalPin - Math.floor(decimalPin));
      const distUp = Math.abs(decimalPin - Math.ceil(decimalPin));
      explanation = `Rounded ${decimalPin.toFixed(2)} to nearest whole number: ${rounded} (distance to ${rounded} is ${Math.min(distDown, distUp).toFixed(2)} vs ${Math.max(distDown, distUp).toFixed(2)})`;
    } else {
      rounded = Math.round(decimalPin * 10) / 10;
      explanation = `Rounded ${decimalPin.toFixed(2)} to nearest tenth: ${rounded.toFixed(1)}`;
    }

    setRoundedSpotlight({ value: rounded, explanation });
    fireMathConfetti();

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Decimal Rounding',
      title: `Rounding Magnifier: ${decimalPin.toFixed(2)} -> ${rounded}`,
      details: explanation,
      latexExpression: `${decimalPin.toFixed(2)} \\approx ${rounded}`,
      success: true,
      score: 20,
    });
  };

  return (
    <div id="number-line-workspace" className="flex-1 flex flex-col p-3 sm:p-5 max-w-6xl mx-auto w-full overflow-y-auto space-y-4">
      
      {/* Top Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              Jump Number Line & Decimal Rounding
            </h2>
            <p className="text-xs text-slate-500">
              Draw animated jump vector arcs and magnify decimal boundaries.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Range Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] text-slate-500 uppercase font-bold px-1.5 hidden sm:inline">Range:</span>
            <button
              onClick={() => { setRangeType('fractions'); setJumps([]); setDragStartPoint(null); }}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                rangeType === 'fractions' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fractions (0 - 1)
            </button>
            <button
              onClick={() => { setRangeType('mixed'); setJumps([]); setDragStartPoint(null); }}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                rangeType === 'mixed' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mixed (0 - 4)
            </button>
            <button
              onClick={() => { setRangeType('integers'); setJumps([]); setDragStartPoint(null); }}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                rangeType === 'integers' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Integers (-5 to 5)
            </button>
          </div>

          {/* Subdivisions Selector */}
          <div className="flex items-center bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 text-xs gap-1.5">
            <span className="text-slate-500 font-bold text-[11px]">Subdivision:</span>
            <select
              value={subdivisions}
              onChange={(e) => {
                setSubdivisions(parseInt(e.target.value, 10));
                setJumps([]);
                setDragStartPoint(null);
                playSound('snap');
              }}
              className="bg-white border border-slate-300 text-blue-700 font-bold rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
            >
              <option value="2">Halves (1/2)</option>
              <option value="3">Thirds (1/3)</option>
              <option value="4">Quarters (1/4)</option>
              <option value="5">Fifths (1/5)</option>
              <option value="6">Sixths (1/6)</option>
              <option value="8">Eighths (1/8)</option>
              <option value="10">Tenths (1/10)</option>
              <option value="12">Twelfths (1/12)</option>
            </select>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleUndoJump}
            disabled={jumps.length === 0}
            className="p-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl border border-slate-300 cursor-pointer transition-colors"
            title="Undo last jump"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetJumps}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-rose-600 rounded-xl border border-slate-300 cursor-pointer transition-colors"
            title="Reset number line"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Jump Equation Display Banner */}
      <div className="bg-white border border-blue-200 p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase font-bold text-slate-400">Live Arithmetic Equation:</span>
          <div className="text-base sm:text-lg text-blue-600 font-serif font-bold">
            <MathView latex={liveEquation} />
          </div>
        </div>
        {dragStartPoint !== null && (
          <div className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1 rounded-xl animate-pulse font-medium">
            <Crosshair className="w-4 h-4 text-orange-500" />
            <span>Click destination tick mark to complete jump vector arc</span>
          </div>
        )}
      </div>

      {/* Interactive Number Line Canvas Stage */}
      <div id="number-line-canvas-stage" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 flex flex-col space-y-12 relative min-h-[340px] justify-center shadow-inner overflow-x-auto">
        
        {/* SVG Curved Jump Vector Arcs Layer */}
        <div className="relative w-full h-36">
          <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
            <defs>
              <marker
                id="arrow-right"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563EB" />
              </marker>
              <marker
                id="arrow-left"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#EF4444" />
              </marker>
            </defs>

            {/* Render completed jumps */}
            {jumps.map((jump, idx) => {
              const x1 = valueToPercent(jump.from);
              const x2 = valueToPercent(jump.to);
              const isRight = jump.direction === 'right';
              const midX = (x1 + x2) / 2;
              // Arc height proportional to jump distance
              const distance = Math.abs(x2 - x1);
              const arcHeight = Math.min(110, Math.max(40, distance * 1.5));
              const pathD = `M ${x1}% 120 Q ${midX}% ${120 - arcHeight}, ${x2}% 120`;
              const strokeCol = isRight ? '#2563EB' : '#EF4444';

              return (
                <g key={jump.id} className="animate-fadeIn">
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeCol}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    markerEnd={isRight ? 'url(#arrow-right)' : 'url(#arrow-left)'}
                    className="drop-shadow-sm"
                  />
                  {/* Jump Delta Badge */}
                  <text
                    x={`${midX}%`}
                    y={`${120 - arcHeight - 8}`}
                    fill={strokeCol}
                    fontSize="13"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="font-mono select-none"
                  >
                    {isRight ? `+${jump.delta.toFixed(2)}` : `${jump.delta.toFixed(2)}`}
                  </text>
                </g>
              );
            })}

            {/* Render in-progress jump guideline if dragging */}
            {dragStartPoint !== null && currentHoverPoint !== null && (
              <g className="opacity-70">
                <path
                  d={`M ${valueToPercent(dragStartPoint)}% 120 Q ${(valueToPercent(dragStartPoint) + valueToPercent(currentHoverPoint)) / 2}% 50, ${valueToPercent(currentHoverPoint)}% 120`}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
              </g>
            )}
          </svg>

          {/* The Horizontal Line Axis */}
          <div className="absolute top-[120px] left-0 right-0 h-1.5 bg-gradient-to-r from-slate-300 via-blue-600 to-slate-300 rounded-full shadow-xs" />

          {/* Tick marks */}
          {ticks.map((tick, idx) => {
            const leftPct = valueToPercent(tick.val);
            const isStart = dragStartPoint === tick.val;
            const isSpotlight = roundedSpotlight && Math.abs(roundedSpotlight.value - tick.val) < 0.001;

            return (
              <div
                key={idx}
                onClick={() => handleTickClick(tick.val)}
                onMouseEnter={() => setCurrentHoverPoint(tick.val)}
                onMouseLeave={() => setCurrentHoverPoint(null)}
                style={{ left: `${leftPct}%` }}
                className={`absolute top-[120px] -translate-x-1/2 flex flex-col items-center cursor-pointer group z-20 ${
                  isStart ? 'scale-125' : ''
                }`}
              >
                {/* Tick bar */}
                <div
                  className={`w-1 transition-all ${
                    tick.isMajor
                      ? 'h-6 -translate-y-2 bg-blue-600'
                      : 'h-3.5 -translate-y-1 bg-slate-300 group-hover:bg-blue-400'
                  } ${isStart ? 'bg-orange-500 ring-4 ring-orange-200 rounded-full' : ''}`}
                />

                {/* Tick Label */}
                <div
                  className={`mt-2 font-mono text-xs select-none transition-colors ${
                    tick.isMajor
                      ? 'font-black text-slate-900 text-sm'
                      : 'text-[10px] text-slate-400 group-hover:text-blue-600 font-semibold'
                  } ${isSpotlight ? 'text-green-600 font-black scale-125' : ''}`}
                >
                  {tick.label || tick.val}
                </div>

                {/* Spotlight Indicator */}
                {isSpotlight && (
                  <div className="absolute -top-12 bg-green-600 text-white font-bold px-3 py-1 rounded-full text-xs shadow-lg animate-bounce whitespace-nowrap">
                    Nearest Whole: {roundedSpotlight.value}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Decimal Magnifier & Rounding Interactive Tool */}
      <div id="decimal-rounding-magnifier-dock" className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Decimal & Rounding Magnifier Tool
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
            Pin Coordinate: {decimalPin.toFixed(2)}
          </span>
        </div>

        {/* Range Slider for Decimal Pin */}
        <div className="space-y-2">
          <input
            id="decimal-pin-slider"
            type="range"
            min={rangeConfig.min}
            max={rangeConfig.max}
            step={0.01}
            value={decimalPin}
            onChange={(e) => {
              setDecimalPin(parseFloat(e.target.value));
              setRoundedSpotlight(null);
            }}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
            <span>{rangeConfig.min}</span>
            <span>{((rangeConfig.min + rangeConfig.max) / 2).toFixed(1)}</span>
            <span>{rangeConfig.max}</span>
          </div>
        </div>

        {/* Actions & Result Explanation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-2.5">
            <button
              id="round-to-whole-btn"
              onClick={() => handleRoundDecimal('whole')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Round to Nearest Whole
            </button>

            <button
              id="round-to-tenth-btn"
              onClick={() => handleRoundDecimal('tenth')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <Crosshair className="w-4 h-4" />
              Round to Nearest Tenth (0.1)
            </button>
          </div>

          {roundedSpotlight && (
            <div className="text-xs text-green-800 bg-green-50 border border-green-300 p-2.5 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{roundedSpotlight.explanation}</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
