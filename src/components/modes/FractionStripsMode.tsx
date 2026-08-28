import React, { useState, useEffect, useMemo } from 'react';
import { FractionDenominator, FractionStripItem, ComparisonTrack, ActivityLog, StudentProfile } from '../../types';
import { DENOMINATORS, FRACTION_PALETTE, fractionToLatex, simplifyFraction, lcm } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti } from '../../utils/confetti';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  HelpCircle, 
  ArrowRightLeft, 
  Layers, 
  CheckCircle2, 
  Split,
  Eye
} from 'lucide-react';

interface FractionStripsModeProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
}

export const FractionStripsMode: React.FC<FractionStripsModeProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  student,
}) => {
  const [referenceLabelMode, setReferenceLabelMode] = useState<'fraction' | 'decimal' | 'percent'>('fraction');
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);
  const [showGuideLines, setShowGuideLines] = useState<boolean>(true);
  const [showUnlikeHelper, setShowUnlikeHelper] = useState<boolean>(false);

  // Unlike fractions helper state
  const [helperFrac1, setHelperFrac1] = useState<{ num: number; den: FractionDenominator }>({ num: 1, den: 3 });
  const [helperFrac2, setHelperFrac2] = useState<{ num: number; den: FractionDenominator }>({ num: 1, den: 4 });

  // Selected Strip Item for Split & Merge tools
  const [selectedPiece, setSelectedPiece] = useState<{ trackIdx: number; item: FractionStripItem; itemIndex: number } | null>(null);

  // 4 Snap comparison tracks with auto-restore from LocalStorage
  const [tracks, setTracks] = useState<ComparisonTrack[]>(() => {
    try {
      const saved = localStorage.getItem('math_studio_fraction_tracks_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 1,
        title: 'Track 1 (Halves & Quarters)',
        items: [
          { id: '1-1', numerator: 1, denominator: 2, color: FRACTION_PALETTE[2].bg },
        ],
      },
      {
        id: 2,
        title: 'Track 2 (Compare Track)',
        items: [
          { id: '2-1', numerator: 1, denominator: 4, color: FRACTION_PALETTE[4].bg },
          { id: '2-2', numerator: 1, denominator: 4, color: FRACTION_PALETTE[4].bg },
        ],
      },
      {
        id: 3,
        title: 'Track 3 (Thirds & Sixths)',
        items: [
          { id: '3-1', numerator: 1, denominator: 3, color: FRACTION_PALETTE[3].bg },
        ],
      },
      {
        id: 4,
        title: 'Track 4 (Twelfths)',
        items: [
          { id: '4-1', numerator: 1, denominator: 6, color: FRACTION_PALETTE[6].bg },
          { id: '4-2', numerator: 1, denominator: 6, color: FRACTION_PALETTE[6].bg },
        ],
      },
    ];
  });

  // Auto-save tracks to LocalStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem('math_studio_fraction_tracks_v1', JSON.stringify(tracks));
    } catch {
      // ignore
    }
  }, [tracks]);

  // Track Sums calculation
  const trackSums = useMemo(() => {
    return tracks.map((track) => {
      let totalValue = 0;
      let commonDen = 1;
      track.items.forEach((item) => {
        commonDen = lcm(commonDen, item.denominator);
      });

      let totalNum = 0;
      track.items.forEach((item) => {
        totalValue += 1 / item.denominator;
        totalNum += (commonDen / item.denominator);
      });

      const simplified = simplifyFraction(totalNum, commonDen);
      return {
        totalValue,
        rawNum: totalNum,
        rawDen: commonDen,
        simplifiedNum: simplified.num,
        simplifiedDen: simplified.den,
        isWhole: Math.abs(totalValue - 1) < 0.001,
        isOverWhole: totalValue > 1.001,
      };
    });
  }, [tracks]);

  // Check equivalences across tracks
  useEffect(() => {
    // Check if active track is equivalent to 1 Whole or to another track
    const current = trackSums[activeTrackIndex];
    if (!current || tracks[activeTrackIndex].items.length === 0) return;

    // Update live KaTeX expression
    const formula = `\\text{Track } ${activeTrackIndex + 1}: \\sum = \\frac{${current.simplifiedNum}}{${current.simplifiedDen}} = ${(current.totalValue * 100).toFixed(1)}\\%`;
    onUpdateLiveLatex(formula);

    if (current.isWhole) {
      playSound('success');
      fireMathConfetti();
      onLogActivity({
        studentId: student?.id || 'guest',
        studentName: student?.name || 'Guest Student',
        studentLevel: student?.level || 'Form 1',
        topic: 'Fraction Equivalence',
        title: `Completed 1 Whole on Track ${activeTrackIndex + 1}`,
        details: `Placed strips summing to 1 Whole: ${tracks[activeTrackIndex].items.map(i => `1/${i.denominator}`).join(' + ')} = 1`,
        latexExpression: `\\sum \\frac{1}{d_i} = \\frac{${current.simplifiedNum}}{${current.simplifiedDen}} = 1`,
        success: true,
        score: 25,
      });
    } else {
      // Check pairwise match with other tracks
      tracks.forEach((otherTrack, oIdx) => {
        if (oIdx !== activeTrackIndex && otherTrack.items.length > 0) {
          const other = trackSums[oIdx];
          if (Math.abs(current.totalValue - other.totalValue) < 0.001 && current.totalValue > 0) {
            playSound('success');
            onLogActivity({
              studentId: student?.id || 'guest',
              studentName: student?.name || 'Guest Student',
              studentLevel: student?.level || 'Form 1',
              topic: 'Fraction Equivalence',
              title: `Equivalence Found: Track ${activeTrackIndex + 1} ≡ Track ${oIdx + 1}`,
              details: `Discovered that ${tracks[activeTrackIndex].items.map(i => `1/${i.denominator}`).join(' + ')} is equivalent to ${otherTrack.items.map(i => `1/${i.denominator}`).join(' + ')}`,
              latexExpression: `\\frac{${current.simplifiedNum}}{${current.simplifiedDen}} = \\frac{${other.simplifiedNum}}{${other.simplifiedDen}}`,
              success: true,
              score: 20,
            });
          }
        }
      });
    }
  }, [trackSums, activeTrackIndex]);

  // Add fraction piece to active track
  const handleAddPiece = (den: FractionDenominator) => {
    const active = tracks[activeTrackIndex];
    const currentSum = trackSums[activeTrackIndex].totalValue;

    if (currentSum + 1 / den > 1.001) {
      playSound('pop');
      // Still allow placing but with visual overflow indicator
    } else {
      playSound('snap');
    }

    const newItem: FractionStripItem = {
      id: `strip-${Date.now()}-${Math.random()}`,
      numerator: 1,
      denominator: den,
      color: FRACTION_PALETTE[den]?.bg || 'bg-cyan-600',
    };

    setTracks((prev) => {
      const updated = [...prev];
      updated[activeTrackIndex] = {
        ...updated[activeTrackIndex],
        items: [...updated[activeTrackIndex].items, newItem],
      };
      return updated;
    });
  };

  // Remove a specific strip item
  const handleRemoveItem = (trackIdx: number, itemId: string) => {
    playSound('pop');
    if (selectedPiece?.item.id === itemId) setSelectedPiece(null);
    setTracks((prev) => {
      const updated = [...prev];
      updated[trackIdx] = {
        ...updated[trackIdx],
        items: updated[trackIdx].items.filter((i) => i.id !== itemId),
      };
      return updated;
    });
  };

  // Split selected piece into smaller equivalent pieces (e.g. 1/2 -> two 1/4s, or 1/3 -> two 1/6s)
  const handleSplitPiece = (targetDen: FractionDenominator) => {
    if (!selectedPiece) return;
    const { trackIdx, item, itemIndex } = selectedPiece;
    const count = targetDen / item.denominator;
    if (count <= 1 || !Number.isInteger(count)) return;

    const newPieces: FractionStripItem[] = [];
    for (let i = 0; i < count; i++) {
      newPieces.push({
        id: `strip-split-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        numerator: 1,
        denominator: targetDen,
        color: FRACTION_PALETTE[targetDen]?.bg || 'bg-blue-500',
      });
    }

    setTracks((prev) => {
      const updated = [...prev];
      const items = [...updated[trackIdx].items];
      items.splice(itemIndex, 1, ...newPieces);
      updated[trackIdx] = { ...updated[trackIdx], items };
      return updated;
    });

    setSelectedPiece(null);
    playSound('snap');
    fireMathConfetti();

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Fraction Equivalence',
      title: `Split Tool: 1/${item.denominator} into ${count} × 1/${targetDen}`,
      details: `Partitioned unit fraction 1/${item.denominator} into ${count} equivalent ${targetDen}ths`,
      latexExpression: `\\frac{1}{${item.denominator}} = \\frac{${count}}{${targetDen}}`,
      success: true,
      score: 20,
    });
  };

  // Merge two adjacent pieces with identical denominator into a larger equivalent piece
  const handleMergeAdjacent = (trackIdx: number, index1: number) => {
    const track = tracks[trackIdx];
    if (index1 >= track.items.length - 1) return;

    const item1 = track.items[index1];
    const item2 = track.items[index1 + 1];

    if (item1.denominator !== item2.denominator) return;

    // e.g. two 1/4s -> one 1/2; two 1/6s -> one 1/3; two 1/8s -> one 1/4; two 1/10s -> one 1/5; two 1/12s -> one 1/6
    const targetDen = (item1.denominator / 2) as FractionDenominator;
    if (!(DENOMINATORS as readonly number[]).includes(targetDen)) return;

    const mergedItem: FractionStripItem = {
      id: `strip-merged-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      numerator: 1,
      denominator: targetDen,
      color: FRACTION_PALETTE[targetDen]?.bg || 'bg-emerald-500',
    };

    setTracks((prev) => {
      const updated = [...prev];
      const items = [...updated[trackIdx].items];
      items.splice(index1, 2, mergedItem);
      updated[trackIdx] = { ...updated[trackIdx], items };
      return updated;
    });

    setSelectedPiece(null);
    playSound('success');
    fireMathConfetti();

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Fraction Equivalence',
      title: `Merge Tool: 2 × 1/${item1.denominator} into 1/${targetDen}`,
      details: `Combined two adjacent 1/${item1.denominator} pieces into 1/${targetDen}`,
      latexExpression: `\\frac{1}{${item1.denominator}} + \\frac{1}{${item1.denominator}} = \\frac{1}{${targetDen}}`,
      success: true,
      score: 20,
    });
  };

  // Clear single track
  const handleClearTrack = (trackIdx: number) => {
    playSound('click');
    if (selectedPiece?.trackIdx === trackIdx) setSelectedPiece(null);
    setTracks((prev) => {
      const updated = [...prev];
      updated[trackIdx] = {
        ...updated[trackIdx],
        items: [],
      };
      return updated;
    });
  };

  // Reset all tracks
  const handleResetAll = () => {
    playSound('click');
    setSelectedPiece(null);
    setTracks([
      { id: 1, title: 'Track 1 (Halves & Quarters)', items: [] },
      { id: 2, title: 'Track 2 (Compare Track)', items: [] },
      { id: 3, title: 'Track 3 (Thirds & Sixths)', items: [] },
      { id: 4, title: 'Track 4 (Twelfths)', items: [] },
    ]);
  };

  // Apply unlike denominator helper solution directly into Track 3 and 4
  const handleApplyUnlikeHelper = () => {
    const common = lcm(helperFrac1.den, helperFrac2.den) as FractionDenominator;
    const pieces1 = helperFrac1.num * (common / helperFrac1.den);
    const pieces2 = helperFrac2.num * (common / helperFrac2.den);

    // Populate Track 3 with Frac1 & Frac2
    const itemsTrack3: FractionStripItem[] = [];
    for (let i = 0; i < helperFrac1.num; i++) {
      itemsTrack3.push({ id: `h1-${i}`, numerator: 1, denominator: helperFrac1.den, color: FRACTION_PALETTE[helperFrac1.den].bg });
    }
    for (let i = 0; i < helperFrac2.num; i++) {
      itemsTrack3.push({ id: `h2-${i}`, numerator: 1, denominator: helperFrac2.den, color: FRACTION_PALETTE[helperFrac2.den].bg });
    }

    // Populate Track 4 with converted equivalent common denominator strips
    const itemsTrack4: FractionStripItem[] = [];
    const targetCommonDen = (common > 12 ? 12 : common) as FractionDenominator;
    const totalUnits = pieces1 + pieces2;
    for (let i = 0; i < Math.min(totalUnits, 12); i++) {
      itemsTrack4.push({ id: `hc-${i}`, numerator: 1, denominator: targetCommonDen, color: FRACTION_PALETTE[targetCommonDen]?.bg || 'bg-fuchsia-600' });
    }

    setTracks((prev) => {
      const updated = [...prev];
      updated[2] = { ...updated[2], title: `Track 3: 1/${helperFrac1.den} + 1/${helperFrac2.den}`, items: itemsTrack3 };
      updated[3] = { ...updated[3], title: `Track 4: Common Denominator (${targetCommonDen}ths)`, items: itemsTrack4 };
      return updated;
    });

    setActiveTrackIndex(3);
    setShowUnlikeHelper(false);
    playSound('success');
    fireMathConfetti();

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Unlike Denominators',
      title: `Unlike Denominators: 1/${helperFrac1.den} + 1/${helperFrac2.den}`,
      details: `Calculated LCM(${helperFrac1.den}, ${helperFrac2.den}) = ${common}, converting to ${pieces1}/${common} + ${pieces2}/${common} = ${pieces1 + pieces2}/${common}`,
      latexExpression: `\\frac{1}{${helperFrac1.den}} + \\frac{1}{${helperFrac2.den}} = \\frac{${pieces1}}{${common}} + \\frac{${pieces2}}{${common}} = \\frac{${pieces1 + pieces2}}{${common}}`,
      success: true,
      score: 30,
    });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, den: FractionDenominator) => {
    e.dataTransfer.setData('text/plain', den.toString());
  };

  const handleDropOnTrack = (e: React.DragEvent, trackIdx: number) => {
    e.preventDefault();
    const denStr = e.dataTransfer.getData('text/plain');
    const parsedDen = parseInt(denStr, 10);
    if ((DENOMINATORS as readonly number[]).includes(parsedDen)) {
      const den = parsedDen as FractionDenominator;
      setActiveTrackIndex(trackIdx);
      const newItem: FractionStripItem = {
        id: `strip-${Date.now()}-${Math.random()}`,
        numerator: 1,
        denominator: den,
        color: FRACTION_PALETTE[den]?.bg || 'bg-cyan-600',
      };
      setTracks((prev) => {
        const updated = [...prev];
        updated[trackIdx] = {
          ...updated[trackIdx],
          items: [...updated[trackIdx].items, newItem],
        };
        return updated;
      });
      playSound('snap');
    }
  };

  return (
    <div id="fraction-strips-workspace" className="flex-1 flex flex-col p-3 sm:p-5 max-w-6xl mx-auto w-full overflow-y-auto space-y-4">
      
      {/* Top Toolbar & Unlike Denominator Helper Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              Fraction Strips & Snap Equivalence
            </h2>
            <p className="text-xs text-slate-500">
              Drag or tap fraction unit pieces onto comparison tracks to visually prove equivalence.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Unlike Denominator Helper Modal Trigger */}
          <button
            id="unlike-denominators-helper-btn"
            onClick={() => setShowUnlikeHelper(true)}
            className="bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <Split className="w-4 h-4 text-blue-600" />
            <span>Unlike Denominators Helper</span>
          </button>

          {/* Guide Lines Toggle */}
          <button
            id="toggle-guidelines-btn"
            onClick={() => setShowGuideLines((prev) => !prev)}
            className={`text-xs font-semibold px-3 py-2 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-colors ${
              showGuideLines
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
            }`}
            title="Toggle vertical common boundary alignment lines"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Align Guides</span>
          </button>

          {/* Reset Tracks */}
          <button
            id="reset-all-tracks-btn"
            onClick={handleResetAll}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 hover:text-rose-600 flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Clear all tracks"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Visual Comparison Stage */}
      <div id="fraction-strips-stage" className="bg-white rounded-3xl shadow-inner border border-slate-200 p-4 sm:p-8 flex flex-col space-y-6 relative">
        
        {/* Subtle grid background guideline lines */}
        <div className="absolute inset-0 flex justify-between px-8 pointer-events-none opacity-5">
          <div className="w-px bg-black h-full ml-[12.5%]"></div>
          <div className="w-px bg-black h-full ml-[12.5%]"></div>
          <div className="w-px bg-black h-full ml-[12.5%]"></div>
          <div className="w-px bg-black h-full ml-[12.5%]"></div>
          <div className="w-px bg-black h-full ml-[12.5%]"></div>
          <div className="w-px bg-black h-full ml-[12.5%]"></div>
          <div className="w-px bg-black h-full ml-[12.5%]"></div>
        </div>

        {/* Reference Bar: 1 Whole */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              Reference Whole
            </span>

            {/* Toggleable label modes [1 Whole / 1.0 / 100%] */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                id="ref-label-fraction-btn"
                onClick={() => setReferenceLabelMode('fraction')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                  referenceLabelMode === 'fraction' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 Whole
              </button>
              <button
                id="ref-label-decimal-btn"
                onClick={() => setReferenceLabelMode('decimal')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                  referenceLabelMode === 'decimal' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1.0
              </button>
              <button
                id="ref-label-percent-btn"
                onClick={() => setReferenceLabelMode('percent')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                  referenceLabelMode === 'percent' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                100%
              </button>
            </div>
          </div>

          {/* 1 Whole Bar Visual Container */}
          <div className="w-full h-14 sm:h-16 bg-slate-800 rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
            {referenceLabelMode === 'fraction' && <span>1 Whole = <MathView latex="1 = \frac{1}{1}" /></span>}
            {referenceLabelMode === 'decimal' && <span>1.0 Decimal Value</span>}
            {referenceLabelMode === 'percent' && <span>100% Total Proportion</span>}
          </div>
        </div>

        {/* 4 Snap Comparison Tracks */}
        <div className="space-y-4 relative">
          
          {/* Vertical Dashed Alignment Guide Lines */}
          {showGuideLines && (
            <div className="absolute inset-0 pointer-events-none z-10 flex">
              {[1/12, 2/12, 3/12, 4/12, 6/12, 8/12, 9/12, 10/12].map((frac, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 border-r border-blue-400/40 border-dashed"
                  style={{ left: `${frac * 100}%` }}
                />
              ))}
            </div>
          )}

          {tracks.map((track, trackIdx) => {
            const sumData = trackSums[trackIdx];
            const isActive = activeTrackIndex === trackIdx;

            return (
              <div
                key={track.id}
                id={`comparison-track-${track.id}`}
                onClick={() => setActiveTrackIndex(trackIdx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnTrack(e, trackIdx)}
                className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  sumData.isWhole
                    ? 'bg-green-50/40 border-4 border-green-400 ring-4 ring-green-100'
                    : isActive
                    ? 'bg-blue-50/30 border-2 border-blue-500 shadow-md ring-4 ring-blue-50'
                    : 'bg-white border-2 border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Track Header */}
                <div className="flex items-center justify-between text-xs mb-2.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isActive ? 'bg-blue-600 animate-ping' : 'bg-slate-300'
                      }`}
                    />
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">
                      {track.title}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Active Track
                      </span>
                    )}
                  </div>

                  {/* Track Summary Badges & Clear */}
                  <div className="flex items-center space-x-2">
                    {track.items.length > 0 && (
                      <div className="flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        <span className="text-slate-500 text-[11px] font-semibold">Sum:</span>
                        <div className="font-bold text-slate-900">
                          <MathView latex={fractionToLatex(sumData.simplifiedNum, sumData.simplifiedDen)} />
                        </div>
                        <span className="text-slate-500 font-mono text-[10px]">
                          ({(sumData.totalValue * 100).toFixed(0)}%)
                        </span>
                        {sumData.isWhole && (
                          <span className="flex items-center gap-1 text-green-700 font-bold text-[10px] ml-1 bg-green-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-green-600" /> Equivalence!
                          </span>
                        )}
                        {sumData.isOverWhole && (
                          <span className="text-rose-600 font-bold text-[10px] ml-1">
                            &gt; 1 Whole
                          </span>
                        )}
                      </div>
                    )}

                    {track.items.length > 0 && (
                      <button
                        id={`clear-track-${track.id}-btn`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearTrack(trackIdx);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Clear track"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Track Strips Slot Lane */}
                <div className="h-14 sm:h-16 w-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex relative overflow-hidden">
                  {track.items.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs italic font-medium">
                      Drag strips here or tap buttons below...
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center">
                      {track.items.map((item, itemIdx) => {
                        const widthPct = (1 / item.denominator) * 100;
                        const palette = FRACTION_PALETTE[item.denominator] || FRACTION_PALETTE[2];
                        const isSelected = selectedPiece?.trackIdx === trackIdx && selectedPiece?.item.id === item.id;

                        // Check if adjacent piece can be merged
                        const nextItem = track.items[itemIdx + 1];
                        const canMergeNext = nextItem && nextItem.denominator === item.denominator && item.denominator % 2 === 0;

                        return (
                          <div
                            key={item.id}
                            style={{ width: `${widthPct}%` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTrackIndex(trackIdx);
                              setSelectedPiece({ trackIdx, item, itemIndex: itemIdx });
                              playSound('click');
                            }}
                            className={`h-full ${palette.bg} border-r-2 border-white flex items-center justify-center text-white font-bold text-xs sm:text-base shadow-sm transition-all cursor-pointer select-none group relative ${
                              isSelected ? 'ring-4 ring-amber-400 ring-offset-2 z-20 scale-[1.02]' : 'hover:opacity-95'
                            }`}
                            title={`1/${item.denominator} (Tap to select, split or merge)`}
                          >
                            <MathView latex={`\\frac{1}{${item.denominator}}`} />
                            
                            {/* Action badge on hover or select */}
                            <div className="absolute hidden group-hover:flex items-center gap-1 bg-slate-900/90 backdrop-blur-xs text-[9px] px-2 py-0.5 rounded text-white -top-6 z-30 shadow-md whitespace-nowrap">
                              <span>Select / Split</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>

        {/* Selected Strip Piece Split & Merge Inspector Drawer */}
        {selectedPiece && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
                <Split className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase font-bold text-amber-800 tracking-wider flex items-center gap-1.5">
                  <span>Piece Selected in Track {selectedPiece.trackIdx + 1}</span>
                  <span className="bg-amber-200 text-amber-900 px-2 py-0.2 rounded-md font-mono">
                    1/{selectedPiece.item.denominator}
                  </span>
                </div>
                <div className="text-xs text-slate-700 font-medium">
                  Split into equivalent subdivisions or merge matching adjacent pieces:
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Split Actions based on current denominator */}
              {selectedPiece.item.denominator === 2 && (
                <>
                  <button
                    onClick={() => handleSplitPiece(4)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    Split → 2 × 1/4
                  </button>
                  <button
                    onClick={() => handleSplitPiece(6)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    Split → 3 × 1/6
                  </button>
                </>
              )}

              {selectedPiece.item.denominator === 3 && (
                <>
                  <button
                    onClick={() => handleSplitPiece(6)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    Split → 2 × 1/6
                  </button>
                  <button
                    onClick={() => handleSplitPiece(12)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    Split → 4 × 1/12
                  </button>
                </>
              )}

              {selectedPiece.item.denominator === 4 && (
                <>
                  <button
                    onClick={() => handleSplitPiece(8)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    Split → 2 × 1/8
                  </button>
                  <button
                    onClick={() => handleSplitPiece(12)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    Split → 3 × 1/12
                  </button>
                </>
              )}

              {selectedPiece.item.denominator === 5 && (
                <button
                  onClick={() => handleSplitPiece(10)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Split → 2 × 1/10
                </button>
              )}

              {selectedPiece.item.denominator === 6 && (
                <button
                  onClick={() => handleSplitPiece(12)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Split → 2 × 1/12
                </button>
              )}

              {/* Merge check */}
              {tracks[selectedPiece.trackIdx].items[selectedPiece.itemIndex + 1]?.denominator === selectedPiece.item.denominator &&
                (selectedPiece.item.denominator === 4 || selectedPiece.item.denominator === 6 || selectedPiece.item.denominator === 8 || selectedPiece.item.denominator === 10 || selectedPiece.item.denominator === 12) && (
                <button
                  onClick={() => handleMergeAdjacent(selectedPiece.trackIdx, selectedPiece.itemIndex)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  {`Merge 2 × 1/${selectedPiece.item.denominator} → 1/${selectedPiece.item.denominator / 2}`}
                </button>
              )}

              {/* Delete Button */}
              <button
                onClick={() => handleRemoveItem(selectedPiece.trackIdx, selectedPiece.item.id)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>

              {/* Deselect */}
              <button
                onClick={() => setSelectedPiece(null)}
                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Equivalence Discovered Showcase Banner */}
        {trackSums.some((s, idx) => s.isWhole && tracks[idx].items.length > 0) && (
          <div className="mt-auto flex justify-center pt-2">
            <div className="bg-white px-8 py-4 rounded-2xl shadow-xl border-t-4 border-green-500 flex items-center gap-6 sm:gap-8 animate-bounce-short">
              <div className="text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Reference Whole</div>
                <div className="text-2xl font-black text-slate-800">1</div>
              </div>
              <div className="text-3xl font-black text-slate-300">=</div>
              <div className="text-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Active Track</div>
                <div className="text-2xl font-black text-green-600">
                  <MathView latex={fractionToLatex(trackSums[activeTrackIndex].simplifiedNum, trackSums[activeTrackIndex].simplifiedDen)} />
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200"></div>
              <div className="bg-green-100 text-green-800 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm">
                EQUIVALENCE FOUND!
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Tap-to-Slot & Drag Palette Tray */}
      <div id="fraction-strip-palette-dock" className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Add Fraction Strips (Target: Track {activeTrackIndex + 1})
          </h3>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Drag piece onto track or click button
          </span>
        </div>

        {/* Fraction Buttons Styled exactly to Vibrant Palette */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
          {DENOMINATORS.map((den) => {
            const palette = FRACTION_PALETTE[den];
            return (
              <button
                id={`add-fraction-1-${den}-btn`}
                key={den}
                draggable
                onDragStart={(e) => handleDragStart(e, den)}
                onClick={() => handleAddPiece(den)}
                className={`flex flex-col items-center justify-center gap-1 ${palette.lightBg} ${palette.hover} border-2 ${palette.border} ${palette.text} py-3 rounded-xl font-bold shadow-xs cursor-pointer active:scale-95 transition-all`}
              >
                <span className="text-base sm:text-lg">
                  <MathView latex={`\\frac{1}{${den}}`} />
                </span>
                <span className="text-[10px] opacity-75 font-mono">
                  {(100 / den).toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Unlike Denominator Helper Modal */}
      {showUnlikeHelper && (
        <div id="unlike-denominators-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div id="unlike-denominators-modal-card" className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-800 relative">
            <button
              id="close-unlike-helper-btn"
              onClick={() => setShowUnlikeHelper(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg bg-slate-100 cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Split className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Unlike Denominators Helper</h3>
                <p className="text-xs text-slate-500">Find common multiples and convert fractions into matching subdivisions</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fraction 1</label>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-slate-700">1 / </span>
                    <select
                      value={helperFrac1.den}
                      onChange={(e) => setHelperFrac1({ num: 1, den: parseInt(e.target.value, 10) as FractionDenominator })}
                      className="bg-white border-2 border-slate-300 text-slate-800 font-bold rounded-xl p-2 text-sm w-full cursor-pointer focus:border-blue-500 focus:outline-none"
                    >
                      {DENOMINATORS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fraction 2</label>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-slate-700">1 / </span>
                    <select
                      value={helperFrac2.den}
                      onChange={(e) => setHelperFrac2({ num: 1, den: parseInt(e.target.value, 10) as FractionDenominator })}
                      className="bg-white border-2 border-slate-300 text-slate-800 font-bold rounded-xl p-2 text-sm w-full cursor-pointer focus:border-blue-500 focus:outline-none"
                    >
                      {DENOMINATORS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Conversion Output */}
              {(() => {
                const common = lcm(helperFrac1.den, helperFrac2.den);
                const p1 = common / helperFrac1.den;
                const p2 = common / helperFrac2.den;
                const sumNum = p1 + p2;

                return (
                  <div className="bg-slate-50 p-4 rounded-xl border border-blue-200 space-y-3 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-semibold">Least Common Multiple (LCM):</span>
                      <span className="font-mono font-bold text-blue-600 text-sm">LCM({helperFrac1.den}, {helperFrac2.den}) = {common}</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-center text-sm font-serif text-blue-700 font-bold shadow-xs">
                      <MathView latex={`\\frac{1}{${helperFrac1.den}} = \\frac{${p1}}{${common}}, \\quad \\frac{1}{${helperFrac2.den}} = \\frac{${p2}}{${common}}`} />
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-center text-sm font-serif text-green-700 font-bold shadow-xs">
                      <MathView latex={`\\text{Total Sum} = \\frac{${p1}}{${common}} + \\frac{${p2}}{${common}} = \\frac{${sumNum}}{${common}}`} />
                    </div>
                  </div>
                );
              })()}

              <button
                id="place-in-comparison-lane-btn"
                onClick={handleApplyUnlikeHelper}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Place into Comparison Tracks 3 & 4
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
