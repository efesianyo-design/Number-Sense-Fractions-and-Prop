import React, { useState, useRef, useMemo, useEffect } from 'react';
import { JumpVector, ActivityLog, StudentProfile, FormLevel } from '../../types';
import { fractionToLatex, simplifyFraction, DENOMINATORS } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti, fireSuperConfetti } from '../../utils/confetti';
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
  Undo2,
  HelpCircle,
  BookOpen,
  Lightbulb,
  X,
  Bot,
  GraduationCap,
  Layers,
  Compass,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';

interface JumpNumberLineModeProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  onOpenSocraticCoach?: (context: string) => void;
  student: StudentProfile | null;
}

type RangeType = 'integers' | 'fractions' | 'mixed';

interface NumberLinePreset {
  id: string;
  title: string;
  level: FormLevel;
  rangeType: RangeType;
  subdivisions: number;
  description: string;
  initialJumps: { from: number; to: number }[];
  latexGoal: string;
}

const NUMBER_LINE_PRESETS: NumberLinePreset[] = [
  {
    id: 'preset-frac-add',
    title: 'Fraction Addition: 1/4 + 2/4 = 3/4',
    level: 'Form 1',
    rangeType: 'fractions',
    subdivisions: 4,
    description: 'Start at 0, jump forward +1/4, then jump forward +2/4 to land at 3/4.',
    initialJumps: [
      { from: 0, to: 0.25 },
      { from: 0.25, to: 0.75 },
    ],
    latexGoal: '\\frac{1}{4} + \\frac{2}{4} = \\frac{3}{4}',
  },
  {
    id: 'preset-frac-sub',
    title: 'Fraction Subtraction: 5/6 - 2/6 = 3/6',
    level: 'Form 1',
    rangeType: 'fractions',
    subdivisions: 6,
    description: 'Jump to 5/6, then jump backwards by 2/6 to land on 3/6 (which simplifies to 1/2).',
    initialJumps: [
      { from: 0, to: 5 / 6 },
      { from: 5 / 6, to: 3 / 6 },
    ],
    latexGoal: '\\frac{5}{6} - \\frac{2}{6} = \\frac{3}{6} = \\frac{1}{2}',
  },
  {
    id: 'preset-int-jump',
    title: 'Integer Displacement: -3 + 5 = +2',
    level: 'Form 2',
    rangeType: 'integers',
    subdivisions: 2,
    description: 'Start at -3 on the integer line and take a forward jump of +5 units to reach +2.',
    initialJumps: [
      { from: -3, to: 2 },
    ],
    latexGoal: '-3 + 5 = 2',
  },
  {
    id: 'preset-mixed-jump',
    title: 'Mixed Numbers: 1 1/2 + 1 1/4 = 2 3/4',
    level: 'Form 2',
    rangeType: 'mixed',
    subdivisions: 4,
    description: 'Model mixed fraction addition along the 0 to 4 axis with quarter subdivisions.',
    initialJumps: [
      { from: 0, to: 1.5 },
      { from: 1.5, to: 2.75 },
    ],
    latexGoal: '1\\frac{1}{2} + 1\\frac{1}{4} = 2\\frac{3}{4}',
  },
];

export const JumpNumberLineMode: React.FC<JumpNumberLineModeProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  onOpenSocraticCoach,
  student,
}) => {
  const [rangeType, setRangeType] = useState<RangeType>('fractions');
  const [subdivisions, setSubdivisions] = useState<number>(4); // default 4ths
  const [jumps, setJumps] = useState<JumpVector[]>([]);
  const [dragStartPoint, setDragStartPoint] = useState<number | null>(null);
  const [currentHoverPoint, setCurrentHoverPoint] = useState<number | null>(null);

  // Guide Modal & Inline Banner state
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [showInlineGuide, setShowInlineGuide] = useState<boolean>(true);
  const [guideActiveTab, setGuideActiveTab] = useState<'basics' | 'vectors' | 'fractions' | 'rounding'>('basics');

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

  // Load a curriculum preset
  const handleLoadPreset = (preset: NumberLinePreset) => {
    setRangeType(preset.rangeType);
    setSubdivisions(preset.subdivisions);
    setDragStartPoint(null);
    setRoundedSpotlight(null);

    const generatedJumps: JumpVector[] = preset.initialJumps.map((j, idx) => {
      const delta = j.to - j.from;
      const isRight = delta > 0;
      return {
        id: `jump-preset-${idx}-${Date.now()}`,
        from: j.from,
        to: j.to,
        delta: Math.round(delta * 1000) / 1000,
        direction: isRight ? 'right' : 'left',
        color: isRight ? '#10b981' : '#f43f5e',
      };
    });

    setJumps(generatedJumps);
    playSound('success');
    fireMathConfetti();

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: preset.level,
      topic: 'Number Line Presets',
      title: `Loaded Preset: ${preset.title}`,
      details: preset.description,
      latexExpression: preset.latexGoal,
      success: true,
      score: 25,
    });
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
      
      {/* Top Toolbar Controls & Guide Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3 sm:p-4 rounded-3xl shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shadow-xs">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                Jump Number Line & Decimal Rounding
              </h2>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Vector Arcs & Axis
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Draw animated jump vector arcs, adjust unit subdivisions, and magnify decimal boundaries.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Guide & Tutorial Button */}
          <button
            id="open-numberline-guide-btn"
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
                onOpenSocraticCoach(`Number line workspace: Range=${rangeType}, Subdivisions=1/${subdivisions}, Current Equation: ${liveEquation}`);
                playSound('pop');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs cursor-pointer shadow-xs transition-colors"
            >
              <Bot className="w-4 h-4 text-blue-600" />
              <span>Ask Coach</span>
            </button>
          )}

          {/* Range Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] text-slate-500 uppercase font-bold px-1.5 hidden sm:inline">Range:</span>
            <button
              onClick={() => { setRangeType('fractions'); setJumps([]); setDragStartPoint(null); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                rangeType === 'fractions' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fractions (0 - 1)
            </button>
            <button
              onClick={() => { setRangeType('mixed'); setJumps([]); setDragStartPoint(null); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                rangeType === 'mixed' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mixed (0 - 4)
            </button>
            <button
              onClick={() => { setRangeType('integers'); setJumps([]); setDragStartPoint(null); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                rangeType === 'integers' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
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

      {/* Curriculum Presets Bar */}
      <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-black text-slate-700">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <span>Curriculum Practice Presets:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {NUMBER_LINE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-black">
                {preset.level}
              </span>
              <span>{preset.title.split(':')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step-by-Step Inline Guide Banner */}
      {showInlineGuide && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3.5 rounded-2xl text-xs space-y-2 relative shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-blue-900">
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
            <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
              <div className="font-black text-blue-700 text-[11px]">1. Set Range & Ticks</div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Pick 0-1, 0-4, or -5 to 5. Set subdivision fractions (e.g. 1/4, 1/6, 1/12).
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
              <div className="font-black text-blue-700 text-[11px]">2. Click Start Point</div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Click any tick mark on the number line. It glows orange with a crosshair.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
              <div className="font-black text-blue-700 text-[11px]">3. Click Destination</div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Click a target tick to create an animated curved jump arc with live delta $\pm\Delta$.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
              <div className="font-black text-blue-700 text-[11px]">4. Magnify & Round</div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Drag the decimal slider below to see distance math and rounding spotlights.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Jump Equation Display Banner */}
      <div className="bg-white border border-blue-200 p-3.5 sm:p-4 rounded-3xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs uppercase font-black text-slate-400">Live Arithmetic Equation:</span>
          <div className="text-base sm:text-lg text-blue-600 font-serif font-bold">
            <MathView latex={liveEquation} />
          </div>
        </div>
        {dragStartPoint !== null && (
          <div className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1 rounded-xl animate-pulse font-medium">
            <Crosshair className="w-4 h-4 text-orange-500" />
            <span>Click destination tick mark on the axis to complete jump arc</span>
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
            {jumps.map((jump) => {
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
                    Nearest: {roundedSpotlight.value}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Decimal Magnifier & Rounding Interactive Tool */}
      <div id="decimal-rounding-magnifier-dock" className="bg-white border border-slate-200 p-4 sm:p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-600" />
            <h3 className="font-black text-sm text-slate-800">
              Decimal Magnifier & Rounding Engine
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            Continuous Value: <span className="font-mono text-blue-600 font-black text-base">{decimalPin.toFixed(2)}</span>
          </span>
        </div>

        {/* Continuous Slider with Live Position */}
        <div className="space-y-2">
          <input
            id="decimal-magnifier-slider"
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
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>{rangeConfig.min}</span>
            <span>Mid: {((rangeConfig.min + rangeConfig.max) / 2).toFixed(1)}</span>
            <span>{rangeConfig.max}</span>
          </div>
        </div>

        {/* Rounding Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            id="round-to-whole-btn"
            onClick={() => handleRoundDecimal('whole')}
            className="bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 font-bold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            Round to Nearest Whole Number
          </button>
          <button
            id="round-to-tenth-btn"
            onClick={() => handleRoundDecimal('tenth')}
            className="bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-700 font-bold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            Round to Nearest Tenth (0.1)
          </button>
        </div>

        {/* Rounding Proof & Explanation */}
        {roundedSpotlight && (
          <div className="bg-green-50 border border-green-200 p-3.5 rounded-2xl text-xs text-green-800 space-y-1 animate-fadeIn">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Rounding Derivation:</span>
            </div>
            <p className="text-slate-700">{roundedSpotlight.explanation}</p>
          </div>
        )}
      </div>

      {/* COMPREHENSIVE GUIDE & TUTORIAL MODAL */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Jump Number Line & Decimal Guide
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mastering fraction arithmetic, integer vector displacement, and rounding
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
                { id: 'basics', label: '1. Basics', icon: '📏' },
                { id: 'vectors', label: '2. Vector Arcs', icon: '🦘' },
                { id: 'fractions', label: '3. Fractions', icon: '🧩' },
                { id: 'rounding', label: '4. Rounding', icon: '🔍' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setGuideActiveTab(tab.id as any)}
                  className={`py-2 text-center rounded-xl transition-all cursor-pointer ${
                    guideActiveTab === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.icon} {tab.label}</span>
                </button>
              ))}
            </div>

            {/* Modal Tab Content */}
            <div className="p-5 sm:p-6 space-y-4 text-xs leading-relaxed text-slate-700 flex-1">
              
              {guideActiveTab === 'basics' && (
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span>📏</span> The Continuous Real Axis
                  </h4>
                  <p>
                    A number line represents real numbers continuously in ordered horizontal space. Every point has a precise coordinate location.
                  </p>

                  <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200 space-y-1.5">
                    <div className="font-bold text-blue-900">Supported Axis Ranges:</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      <li><strong>Fractions (0 to 1)</strong>: Ideal for partitioning one unit whole into fractional subdivisions like 1/4, 1/6, 1/8, 1/12.</li>
                      <li><strong>Mixed Numbers (0 to 4)</strong>: Extends past 1 Whole to model improper fractions (e.g. 7/4 = 1 3/4).</li>
                      <li><strong>Integers (-5 to +5)</strong>: Visualizes positive and negative integer arithmetic and directional displacement.</li>
                    </ul>
                  </div>
                </div>
              )}

              {guideActiveTab === 'vectors' && (
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span>🦘</span> Drawing Vector Jump Arcs
                  </h4>
                  <p>
                    Addition and subtraction are modeled as directed jumps along the axis.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-green-50 p-3 rounded-2xl border border-green-200 space-y-1">
                      <div className="font-black text-green-900">Forward Addition ($+\Delta$)</div>
                      <p className="text-slate-600 text-[11px]">
                        Jumping from left to right represents adding positive values. The arc is colored <strong className="text-blue-600">Blue/Emerald</strong>.
                      </p>
                    </div>
                    <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 space-y-1">
                      <div className="font-black text-rose-900">Backward Subtraction ($-\Delta$)</div>
                      <p className="text-slate-600 text-[11px]">
                        Jumping from right to left represents subtracting values. The arc is colored <strong className="text-rose-600">Rose/Red</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-center">
                    Click Tick 1 (Orange Crosshair) $\longrightarrow$ Click Tick 2 (Animated Arc Formed)
                  </div>
                </div>
              )}

              {guideActiveTab === 'fractions' && (
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span>🧩</span> Fractions & Subdivisions
                  </h4>
                  <p>
                    Changing the <strong>Subdivision</strong> selector divides each whole integer into $d$ equal parts.
                  </p>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-800">Example: Adding 1/4 + 2/4 = 3/4</div>
                    <p className="text-[11px] text-slate-600">
                      1. Set Range to <strong>Fractions (0-1)</strong> and Subdivisions to <strong>Quarters (1/4)</strong>.<br />
                      2. Click 0, then click 1/4 (+1/4 jump).<br />
                      3. Click 3/4 (+2/4 jump).<br />
                      4. The live arithmetic equation automatically displays 1/4 + 2/4 = 3/4.
                    </p>
                  </div>
                </div>
              )}

              {guideActiveTab === 'rounding' && (
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <span>🔍</span> Decimal Magnifier & Rounding
                  </h4>
                  <p>
                    Rounding is based on measuring geometric distance on the continuous number line.
                  </p>
                  <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 space-y-2 text-slate-700">
                    <div className="font-bold text-purple-900">Nearest Whole & Nearest Tenth Rules:</div>
                    <ul className="list-disc list-inside space-y-1 text-[11px]">
                      <li>If the decimal part is $\ge 0.50$, round UP to the higher whole number.</li>
                      <li>If the decimal part is $\lt 0.50$, round DOWN to the lower whole number.</li>
                      <li>Clicking <strong>Round to Nearest Whole</strong> highlights the winning coordinate with a glowing green spotlight beacon!</li>
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
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
