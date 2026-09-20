import React, { useState } from 'react';
import { FractionDenominator } from '../../types';
import { FRACTION_COLORS } from './DirectComparisonOrderingWorkspace';
import { playSound } from '../../utils/audio';
import { Scissors, Sparkles, Layers, Sliders } from 'lucide-react';

interface ContinuousPartitionSliderProps {
  initialDenominator?: number;
}

export const ContinuousPartitionSlider: React.FC<ContinuousPartitionSliderProps> = ({
  initialDenominator = 4,
}) => {
  const [partitions, setPartitions] = useState<number>(initialDenominator);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setPartitions(val);
    if (highlightedIndex >= val) {
      setHighlightedIndex(val - 1);
    }
    playSound('slice');
  };

  const percentagePerUnit = (100 / partitions).toFixed(2);

  // Derive color styling or fallback
  const knownDen = partitions as FractionDenominator;
  const unitColor = FRACTION_COLORS[knownDen]?.bg || 'bg-blue-600';
  const unitTextColor = FRACTION_COLORS[knownDen]?.text || 'text-white';

  return (
    <div id="continuous-partition-slider" className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 text-white shadow-md space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              <span>Continuous Unit Partition Modeler</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded-full border border-blue-700/50">
                Limit Discovery: 1/n
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Drag the slider to slice 1 whole bar into <span className="text-amber-300 font-bold font-mono">n = {partitions}</span> equal segments in real-time.
            </p>
          </div>
        </div>

        {/* Live metric badge */}
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-700">
          <span className="text-xs text-slate-400">Unit Size:</span>
          <span className="font-mono font-black text-amber-300 text-sm">
            1/{partitions} = {percentagePerUnit}%
          </span>
        </div>
      </div>

      {/* Interactive Range Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono text-slate-400 px-1">
          <span>n = 1 (Whole)</span>
          <span className="text-amber-400 font-bold">Partitions: {partitions}</span>
          <span>n = 16 (Fine Slices)</span>
        </div>
        <input
          type="range"
          min="1"
          max="16"
          step="1"
          value={partitions}
          onChange={handleSliderChange}
          className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
          {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((mark) => (
            <button
              key={mark}
              onClick={() => {
                setPartitions(mark);
                playSound('snap');
              }}
              className={`hover:text-amber-300 transition-colors cursor-pointer ${
                partitions === mark ? 'text-amber-400 font-bold' : ''
              }`}
            >
              {mark}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Sliced Bar Visualizer */}
      <div className="space-y-2">
        <div className="w-full bg-slate-950 h-14 rounded-2xl border-2 border-slate-700/80 p-1 relative overflow-hidden flex items-center gap-0.5">
          {Array.from({ length: partitions }).map((_, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <div
                key={idx}
                onClick={() => {
                  setHighlightedIndex(idx);
                  playSound('pickup');
                }}
                className={`h-full flex-1 rounded-lg transition-all duration-200 cursor-pointer flex flex-col items-center justify-center relative select-none ${
                  isHighlighted
                    ? `${unitColor} ${unitTextColor} shadow-md scale-100 ring-2 ring-amber-300 z-10`
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={`Slice #${idx + 1}: 1/${partitions}`}
              >
                {partitions <= 10 && (
                  <span className="text-[11px] font-black font-mono leading-none">
                    1/{partitions}
                  </span>
                )}
                {partitions <= 6 && (
                  <span className="text-[9px] opacity-80 font-mono">
                    {percentagePerUnit}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Mathematical Explanation Ribbon */}
        <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Each partition is exactly <strong className="text-amber-300">1/{partitions}</strong> of the unit whole ($100\% \div {partitions} = {percentagePerUnit}\%$).
            </span>
          </div>
          <div className="font-mono text-cyan-300 font-bold shrink-0 hidden sm:block">
            {partitions} \times \frac&#123;1&#125;&#123;{partitions}&#125; = 1
          </div>
        </div>
      </div>
    </div>
  );
};
