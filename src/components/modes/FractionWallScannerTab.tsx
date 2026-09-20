import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FractionDenominator, ActivityLog, StudentProfile, FractionStripItem } from '../../types';
import { DENOMINATORS, FRACTION_PALETTE, fractionToLatex, simplifyFraction, lcm } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti } from '../../utils/confetti';
import { 
  Layers, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  Sliders, 
  Scan, 
  ArrowUpDown, 
  Award,
  ChevronRight,
  Info
} from 'lucide-react';

interface FractionWallScannerTabProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
}

interface WallRow {
  denominator: FractionDenominator | 1;
  count: number;
  label: string;
  family: 'halves' | 'thirds' | 'fifths' | 'whole';
}

const WALL_ROWS: WallRow[] = [
  { denominator: 1, count: 1, label: '1 Whole', family: 'whole' },
  { denominator: 2, count: 2, label: 'Halves (1/2)', family: 'halves' },
  { denominator: 3, count: 3, label: 'Thirds (1/3)', family: 'thirds' },
  { denominator: 4, count: 4, label: 'Fourths (1/4)', family: 'halves' },
  { denominator: 5, count: 5, label: 'Fifths (1/5)', family: 'fifths' },
  { denominator: 6, count: 6, label: 'Sixths (1/6)', family: 'thirds' },
  { denominator: 8, count: 8, label: 'Eighths (1/8)', family: 'halves' },
  { denominator: 10, count: 10, label: 'Tenths (1/10)', family: 'fifths' },
  { denominator: 12, count: 12, label: 'Twelfths (1/12)', family: 'thirds' },
  { denominator: 16, count: 16, label: 'Sixteenths (1/16)', family: 'halves' },
];

interface TrainPreset {
  id: string;
  title: string;
  description: string;
  pieces: FractionDenominator[];
}

const TRAIN_PRESETS: TrainPreset[] = [
  {
    id: 'tp1',
    title: '1/3 + 1/4 (Twelfths Scanner)',
    description: 'Thirds and Fourths align cleanly only at 12ths row!',
    pieces: [3, 4],
  },
  {
    id: 'tp2',
    title: '1/2 + 1/3 (Sixths Scanner)',
    description: 'Half + Third aligns at Sixths and Twelfths.',
    pieces: [2, 3],
  },
  {
    id: 'tp3',
    title: '1/4 + 1/6 (Twelfths Scanner)',
    description: 'Fourths and Sixths align at 12ths (total 5/12).',
    pieces: [4, 6],
  },
  {
    id: 'tp4',
    title: '1/2 + 1/4 (Fourths Scanner)',
    description: 'Half + Fourth aligns at Fourths, Eighths, and Sixteenths.',
    pieces: [2, 4],
  },
  {
    id: 'tp5',
    title: '2/5 + 1/2 (Tenths Scanner)',
    description: 'Fifths and Halves align at 10ths (total 9/10).',
    pieces: [5, 5, 2],
  },
  {
    id: 'tp6',
    title: '1/4 + 1/8 (Eighths Scanner)',
    description: 'Fourths and Eighths align at 8ths and 16ths.',
    pieces: [4, 8],
  },
];

export const FractionWallScannerTab: React.FC<FractionWallScannerTabProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  student,
}) => {
  // Train pieces (list of denominators forming the scanning train)
  const [trainPieces, setTrainPieces] = useState<FractionDenominator[]>([3, 4]);

  // Active scanned row index (0 to WALL_ROWS.length - 1)
  const [activeRowIndex, setActiveRowIndex] = useState<number>(8); // Default to 12ths row
  const [isHoveringTrain, setIsHoveringTrain] = useState<boolean>(false);
  const [isLaserEnabled, setIsLaserEnabled] = useState<boolean>(true);

  // Train calculations: boundary positions, total sum, LCM
  const { totalTrainValue, trainBoundaries, commonDen, simplifiedSum } = useMemo(() => {
    let sumVal = 0;
    let common = 1;
    const boundaries: { pos: number; den: FractionDenominator }[] = [];

    trainPieces.forEach((den) => {
      sumVal += 1 / den;
      common = lcm(common, den);
      boundaries.push({ pos: sumVal, den });
    });

    let totalCommonNum = 0;
    trainPieces.forEach((den) => {
      totalCommonNum += common / den;
    });

    const simp = simplifyFraction(totalCommonNum, common);

    return {
      totalTrainValue: sumVal,
      trainBoundaries: boundaries,
      commonDen: common,
      simplifiedSum: simp,
    };
  }, [trainPieces]);

  // Check alignment for each row of the wall
  const rowAlignments = useMemo(() => {
    return WALL_ROWS.map((row, rIdx) => {
      const rowDen = row.denominator;
      let allBoundariesAlign = true;
      const boundaryChecks = trainBoundaries.map((b) => {
        const tickIndex = b.pos * rowDen;
        const aligns = Math.abs(tickIndex - Math.round(tickIndex)) < 0.0001;
        if (!aligns) allBoundariesAlign = false;
        return { pos: b.pos, aligns, tick: Math.round(tickIndex) };
      });

      const totalTicks = totalTrainValue * rowDen;
      const totalAligns = Math.abs(totalTicks - Math.round(totalTicks)) < 0.0001;
      const isPerfectMatch = allBoundariesAlign && totalAligns;

      return {
        row,
        rIdx,
        rowDen,
        allBoundariesAlign,
        totalAligns,
        isPerfectMatch,
        boundaryChecks,
        ticksCount: Math.round(totalTicks),
      };
    });
  }, [WALL_ROWS, trainBoundaries, totalTrainValue]);

  const activeRowAlignment = rowAlignments[activeRowIndex] || rowAlignments[0];

  // KaTeX formula
  const scannerLatex = useMemo(() => {
    if (trainPieces.length === 0) return '0 = 0';
    const original = trainPieces.map((d) => `\\frac{1}{${d}}`).join(' + ');
    const commonConverted = trainPieces.map((d) => `\\frac{${commonDen / d}}{${commonDen}}`).join(' + ');
    const totalNum = trainPieces.reduce((acc, d) => acc + commonDen / d, 0);
    const simp = simplifiedSum.den !== commonDen ? ` = \\frac{${simplifiedSum.num}}{${simplifiedSum.den}}` : '';

    return `\\text{Train: } ${original} = ${commonConverted} = \\frac{${totalNum}}{${commonDen}}${simp}`;
  }, [trainPieces, commonDen, simplifiedSum]);

  useEffect(() => {
    onUpdateLiveLatex(`\\text{Wall Scanner: } ${scannerLatex}`);
  }, [scannerLatex, onUpdateLiveLatex]);

  // Track celebratory trigger when snapping to a perfect match row
  const prevMatchRef = useRef<number | null>(null);

  const handleSelectRow = (rIdx: number) => {
    setActiveRowIndex(rIdx);
    const match = rowAlignments[rIdx];
    if (match.isPerfectMatch) {
      playSound('snap');
      if (prevMatchRef.current !== rIdx) {
        playSound('success');
        fireMathConfetti();
        prevMatchRef.current = rIdx;

        onLogActivity({
          studentId: student?.id || 'guest',
          studentName: student?.name || 'Guest Student',
          studentLevel: student?.level || 'Form 1',
          topic: 'Fraction Wall Scanner',
          title: `Scanned & Locked Common Denominator: ${match.rowDen}ths`,
          details: `Train [${trainPieces.map((p) => `1/${p}`).join(' + ')}] aligned perfectly with ${match.ticksCount} pieces of 1/${match.rowDen}`,
          latexExpression: scannerLatex,
          success: true,
          score: 30,
        });
      }
    } else {
      playSound('pop');
    }
  };

  // Add piece to train
  const handleAddPiece = (den: FractionDenominator) => {
    if (totalTrainValue + 1 / den > 1.05) {
      playSound('pop');
      return;
    }
    setTrainPieces((prev) => [...prev, den]);
    playSound('snap');
  };

  // Remove piece
  const handleRemovePiece = (index: number) => {
    if (trainPieces.length <= 1) return;
    setTrainPieces((prev) => prev.filter((_, i) => i !== index));
    playSound('slice');
  };

  // Load preset
  const handleLoadPreset = (preset: TrainPreset) => {
    setTrainPieces(preset.pieces);
    let c = 1;
    preset.pieces.forEach((p) => { c = lcm(c, p); });
    const targetRowIdx = WALL_ROWS.findIndex((r) => r.denominator === c);
    if (targetRowIdx !== -1) setActiveRowIndex(targetRowIdx);
    playSound('jump');
  };

  return (
    <div id="fraction-wall-scanner-engine" className="space-y-5 animate-fadeIn">
      {/* 1. Header Ribbon & Train Scanner Presets */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                Fraction Wall & Scanning Train Engine
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Edge-Alignment Laser
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Slide the composite fraction train up & down the Rainbow Wall. Observe where all joint edges lock onto wall tile boundaries!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLaserEnabled((prev) => !prev)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                isLaserEnabled
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isLaserEnabled ? 'Lasers Active' : 'Lasers Off'}
            </button>

            <button
              onClick={() => {
                setTrainPieces([3, 4]);
                setActiveRowIndex(8);
                playSound('pop');
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset (1/3 + 1/4)
            </button>
          </div>
        </div>

        {/* Quick Classroom Train Presets */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Scanning Train Presets:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRAIN_PRESETS.map((p) => {
              const isMatch = trainPieces.length === p.pieces.length &&
                trainPieces.every((piece, i) => piece === p.pieces[i]);

              return (
                <button
                  key={p.id}
                  onClick={() => handleLoadPreset(p)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    isMatch
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs scale-[1.02]'
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

      {/* 2. Floating Combined Train Builder & Position Controller */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
              🚂
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                Draggable Scanning Fraction Train:
              </span>
              <div className="text-xs text-slate-300 font-medium">
                Total Length = <span className="text-amber-300 font-bold font-mono">{(totalTrainValue * 100).toFixed(1)}%</span> of 1 Whole ({simplifiedSum.num}/{simplifiedSum.den})
              </div>
            </div>
          </div>

          {/* Row Position Selector / Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">Scan Row:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSelectRow(Math.max(0, activeRowIndex - 1))}
                disabled={activeRowIndex === 0}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ▲
              </button>
              <span className="px-2 py-1 bg-slate-800 rounded-lg text-xs font-mono font-bold text-amber-300">
                {WALL_ROWS[activeRowIndex].label}
              </span>
              <button
                onClick={() => handleSelectRow(Math.min(WALL_ROWS.length - 1, activeRowIndex + 1))}
                disabled={activeRowIndex === WALL_ROWS.length - 1}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ▼
              </button>
            </div>
          </div>
        </div>

        {/* The Combined Train Strip */}
        <div className="w-full h-16 bg-slate-950/80 border-2 border-amber-400/80 rounded-2xl flex items-center relative overflow-hidden shadow-inner p-1">
          {trainPieces.map((den, idx) => {
            const palette = FRACTION_PALETTE[den] || FRACTION_PALETTE[3];
            const pieceWidthPct = (1 / den) * 100;

            return (
              <div
                key={idx}
                style={{ width: `${pieceWidthPct}%` }}
                className={`h-full ${palette.bg} border-r-2 border-white/90 rounded-xl flex items-center justify-between px-3 text-white shadow-xs transition-all relative group select-none`}
              >
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-black drop-shadow-xs">
                    1/{den}
                  </span>
                  <span className="text-[9px] font-medium text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                    Piece #{idx + 1}
                  </span>
                </div>

                {trainPieces.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePiece(idx);
                    }}
                    title="Remove piece from train"
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md bg-black/40 hover:bg-black/80 text-white flex items-center justify-center text-xs transition-opacity cursor-pointer"
                  >
                    ✕
                  </button>
                )}

                {/* Laser Raycast Marker at joint */}
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-300 shadow-md" />
              </div>
            );
          })}

          {/* Remaining Gap in 1 Whole */}
          {totalTrainValue < 1 && (
            <div
              style={{ width: `${(1 - totalTrainValue) * 100}%` }}
              className="h-full bg-slate-900/60 border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-[10px] italic"
            >
              Empty ({((1 - totalTrainValue) * 100).toFixed(1)}%)
            </div>
          )}
        </div>

        {/* Add Train Piece Palette */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            Add strip to train:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {DENOMINATORS.map((d) => (
              <button
                key={d}
                onClick={() => handleAddPiece(d)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs px-2.5 py-1 rounded-xl transition-all cursor-pointer"
              >
                +1/{d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Full Rainbow Fraction Wall Canvas with Scanning Overlay */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 relative">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
          <span>Fraction Wall (1 Whole down to 1/16ths)</span>
          <span className="text-slate-500 font-normal">
            Click any row to align train scanner
          </span>
        </div>

        {/* Wall Stack Container */}
        <div className="space-y-1.5 relative">
          {rowAlignments.map(({ row, rIdx, rowDen, isPerfectMatch, ticksCount }) => {
            const isScannedRow = activeRowIndex === rIdx;
            const palette = FRACTION_PALETTE[rowDen] || FRACTION_PALETTE[1];

            return (
              <div
                key={rowDen}
                onClick={() => handleSelectRow(rIdx)}
                className={`relative rounded-xl p-1 transition-all cursor-pointer ${
                  isScannedRow
                    ? isPerfectMatch
                      ? 'bg-emerald-100/90 ring-4 ring-emerald-500 shadow-md scale-[1.01]'
                      : 'bg-indigo-50/90 ring-2 ring-indigo-400 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {/* Row Header Indicator */}
                <div className="flex items-center justify-between text-[11px] font-bold px-2 py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800">{row.label}</span>
                    {isScannedRow && isPerfectMatch && (
                      <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3" />
                        Common Denominator Aligned! ({ticksCount}/{rowDen})
                      </span>
                    )}
                    {isScannedRow && !isPerfectMatch && (
                      <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Misaligned Edges
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {row.count} × (1/{rowDen})
                  </span>
                </div>

                {/* The Row Tiles Strip */}
                <div className="w-full h-9 rounded-lg flex relative overflow-hidden shadow-inner">
                  {Array.from({ length: row.count }).map((_, tileIdx) => {
                    const unitPct = (1 / rowDen) * 100;
                    const tileStart = tileIdx / rowDen;
                    const tileEnd = (tileIdx + 1) / rowDen;
                    const isCoveredByTrain = tileEnd <= totalTrainValue + 0.0001;

                    return (
                      <div
                        key={tileIdx}
                        style={{ width: `${unitPct}%` }}
                        className={`h-full border-r border-white/80 flex items-center justify-center text-xs font-bold transition-all select-none ${
                          isScannedRow && isPerfectMatch && isCoveredByTrain
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : palette.bg + ' text-white'
                        }`}
                      >
                        <span className="drop-shadow-2xs text-[11px]">
                          {rowDen === 1 ? '1' : `1/${rowDen}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Laser Projection Guidelines from Train Joints */}
                {isLaserEnabled && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                    {trainBoundaries.map((b, bIdx) => {
                      const posPct = b.pos * 100;
                      if (posPct > 100) return null;

                      const tickIdx = b.pos * rowDen;
                      const isAligned = Math.abs(tickIdx - Math.round(tickIdx)) < 0.0001;

                      return (
                        <div
                          key={bIdx}
                          style={{ left: `${posPct}%` }}
                          className={`absolute top-0 bottom-0 w-0.5 ${
                            isAligned ? 'bg-emerald-500 shadow-md' : 'bg-rose-500/60'
                          }`}
                        >
                          <div className={`w-2 h-2 -ml-[3px] rounded-full ${isAligned ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Active Scan Analysis Card & Mathematical Conversion Breakdown */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-emerald-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Wall Scan Result on {WALL_ROWS[activeRowIndex].label}
              </div>
              <h4 className="text-sm sm:text-base font-black text-white">
                {activeRowAlignment.isPerfectMatch ? (
                  <span className="text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Common Denominator Found: {activeRowAlignment.rowDen}ths!
                  </span>
                ) : (
                  <span className="text-amber-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    {activeRowAlignment.rowDen}ths row does not align with all train joints.
                  </span>
                )}
              </h4>
            </div>
          </div>

          <div className="bg-white/10 px-3 py-1 rounded-xl text-xs font-mono text-emerald-300 border border-white/10">
            LCM({trainPieces.join(', ')}) = {commonDen}
          </div>
        </div>

        {/* Step-by-Step KaTeX Equation */}
        <div className="bg-slate-950/70 rounded-2xl p-4 sm:p-5 border border-white/10 text-center overflow-x-auto">
          <MathView
            latex={scannerLatex}
            displayMode={true}
            className="text-lg sm:text-2xl text-emerald-300 font-bold"
          />
        </div>

        {/* Piece-by-Piece Conversion Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {trainPieces.map((den, idx) => {
            const countInCommon = commonDen / den;
            return (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between text-emerald-300 font-bold">
                  <span>Train Piece #{idx + 1}</span>
                  <span className="bg-emerald-500/30 px-2 py-0.5 rounded-md">
                    1/{den}
                  </span>
                </div>
                <div className="text-slate-300 font-medium text-center py-1">
                  <MathView latex={`\\frac{1}{${den}} = \\frac{${countInCommon}}{${commonDen}}`} />
                </div>
                <div className="text-[10px] text-slate-400 text-center">
                  Takes up exactly {countInCommon} pieces of 1/{commonDen}
                </div>
              </div>
            );
          })}

          {/* Sum Summary Card */}
          <div className="bg-emerald-900/40 border border-emerald-500/40 rounded-2xl p-3 space-y-1">
            <div className="flex items-center justify-between text-amber-300 font-bold">
              <span>Total Train Length</span>
              <span className="bg-amber-500/30 px-2 py-0.5 rounded-md">Sum</span>
            </div>
            <div className="text-white font-bold text-center py-1">
              <MathView latex={`\\sum = \\frac{${trainPieces.reduce((acc, d) => acc + commonDen / d, 0)}}{${commonDen}}`} />
            </div>
            <div className="text-[10px] text-emerald-200 text-center">
              All piece boundaries land exactly on {commonDen}ths row tick lines.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
