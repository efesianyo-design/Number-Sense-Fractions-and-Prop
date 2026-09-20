import React, { useState, useMemo, useEffect } from 'react';
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
  Eye,
  BookOpen,
  Scale,
  Puzzle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { FractionComparisonCard } from './FractionComparisonCard';
import { FractionWordProblemsModal, WordProblemScenario } from './FractionWordProblemsModal';

interface FourTrackBuilderTabProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  student: StudentProfile | null;
}

export const FourTrackBuilderTab: React.FC<FourTrackBuilderTabProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  student,
}) => {
  const [referenceLabelMode, setReferenceLabelMode] = useState<'fraction' | 'decimal' | 'percent'>('fraction');
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);
  const [showGuideLines, setShowGuideLines] = useState<boolean>(true);
  const [showUnlikeHelper, setShowUnlikeHelper] = useState<boolean>(false);
  const [showWordProblemsModal, setShowWordProblemsModal] = useState<boolean>(false);
  const [showComparisonEngine, setShowComparisonEngine] = useState<boolean>(true);

  // Unlike fractions helper state
  const [helperFrac1, setHelperFrac1] = useState<{ num: number; den: FractionDenominator }>({ num: 1, den: 3 });
  const [helperFrac2, setHelperFrac2] = useState<{ num: number; den: FractionDenominator }>({ num: 1, den: 4 });

  // Selected Strip Item for Split & Merge tools
  const [selectedPiece, setSelectedPiece] = useState<{ trackIdx: number; item: FractionStripItem; itemIndex: number } | null>(null);

  // 4 Snap comparison tracks with auto-restore from LocalStorage
  const [tracks, setTracks] = useState<ComparisonTrack[]>(() => {
    try {
      const saved = localStorage.getItem('math_studio_fraction_tracks_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4 && parsed.every(t => t && Array.isArray(t.items))) {
          return parsed;
        }
      }
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
        title: 'Track 4 (Twelfths & Sixteenths)',
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

  // Track Sums and Missing Gap calculation
  const trackSums = useMemo(() => {
    return tracks.map((track) => {
      let totalValue = 0;
      let commonDen = 1;
      const items = track?.items || [];
      items.forEach((item) => {
        commonDen = lcm(commonDen, item.denominator);
      });

      let totalNum = 0;
      items.forEach((item) => {
        totalValue += 1 / item.denominator;
        totalNum += (commonDen / item.denominator);
      });

      const simplified = simplifyFraction(totalNum, commonDen);
      const isWhole = Math.abs(totalValue - 1) < 0.001;
      const isOverWhole = totalValue > 1.001;
      const hasGap = totalValue > 0.001 && totalValue < 0.999;
      
      const gapNumerator = Math.max(0, commonDen - totalNum);
      const gapFraction = simplifyFraction(gapNumerator, commonDen);

      const subtractionLatex = `1 - \\left(${
        items.length > 0
          ? items.map((i) => `\\frac{1}{${i.denominator}}`).join(' + ')
          : '0'
      }\\right) = 1 - \\frac{${simplified.num}}{${simplified.den}} = \\frac{${gapFraction.num}}{${gapFraction.den}}`;

      return {
        totalValue,
        rawNum: totalNum,
        rawDen: commonDen,
        simplifiedNum: simplified.num,
        simplifiedDen: simplified.den,
        gapFraction,
        hasGap,
        subtractionLatex,
        isWhole,
        isOverWhole,
      };
    });
  }, [tracks]);

  // Check equivalences across tracks
  useEffect(() => {
    const current = trackSums[activeTrackIndex];
    const activeTrack = tracks[activeTrackIndex];
    if (!current || !activeTrack || (activeTrack.items || []).length === 0) return;

    const formula = `\\text{Track } ${activeTrackIndex + 1}: \\sum = \\frac{${current.simplifiedNum}}{${current.simplifiedDen}} = ${(current.totalValue * 100).toFixed(1)}\\%`;
    onUpdateLiveLatex(formula);

    if (current.isWhole) {
      playSound('success');
      fireMathConfetti();
      onLogActivity({
        studentId: student?.id || 'guest',
        studentName: student?.name || 'Guest Student',
        studentLevel: student?.level || 'Form 1',
        topic: '4-Track Builder',
        title: `Completed 1 Whole on Track ${activeTrackIndex + 1}`,
        details: `Placed strips summing to 1 Whole: ${(activeTrack.items || []).map(i => `1/${i.denominator}`).join(' + ')} = 1`,
        latexExpression: `\\sum \\frac{1}{d_i} = \\frac{${current.simplifiedNum}}{${current.simplifiedDen}} = 1`,
        success: true,
        score: 25,
      });
    }
  }, [trackSums, activeTrackIndex, onLogActivity, onUpdateLiveLatex, student, tracks]);

  // Add fraction piece to active track
  const handleAddPiece = (den: FractionDenominator, targetTrackIdx: number = activeTrackIndex) => {
    const currentSum = trackSums[targetTrackIdx].totalValue;

    if (currentSum + 1 / den > 1.001) {
      playSound('pop');
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
      if (!updated[targetTrackIdx]) return prev;
      const currentItems = updated[targetTrackIdx].items || [];
      updated[targetTrackIdx] = {
        ...updated[targetTrackIdx],
        items: [...currentItems, newItem],
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
      if (!updated[trackIdx]) return prev;
      const currentItems = updated[trackIdx].items || [];
      updated[trackIdx] = {
        ...updated[trackIdx],
        items: currentItems.filter((i) => i.id !== itemId),
      };
      return updated;
    });
  };

  // Split selected piece into smaller equivalent pieces
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
      if (!updated[trackIdx]) return prev;
      const items = [...(updated[trackIdx].items || [])];
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
      topic: '4-Track Builder',
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
    if (!track || !track.items || index1 >= track.items.length - 1) return;

    const item1 = track.items[index1];
    const item2 = track.items[index1 + 1];

    if (!item1 || !item2 || item1.denominator !== item2.denominator) return;

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
      if (!updated[trackIdx]) return prev;
      const items = [...(updated[trackIdx].items || [])];
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
      topic: '4-Track Builder',
      title: `Merge Tool: 2 × 1/${item1.denominator} into 1/${targetDen}`,
      details: `Combined two adjacent 1/${item1.denominator} pieces into 1/${targetDen}`,
      latexExpression: `\\frac{1}{${item1.denominator}} + \\frac{1}{${item1.denominator}} = \\frac{1}{${targetDen}}`,
      success: true,
      score: 20,
    });
  };

  // Snap to fill missing gap on a specific track
  const handleSnapFillGap = (trackIdx: number) => {
    const sumData = trackSums[trackIdx];
    if (!sumData || !sumData.hasGap) return;

    const { gapFraction, simplifiedNum, simplifiedDen } = sumData;
    const targetDen = gapFraction.den as FractionDenominator;
    const count = gapFraction.num;

    const newPieces: FractionStripItem[] = [];
    for (let i = 0; i < count; i++) {
      newPieces.push({
        id: `strip-gap-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        numerator: 1,
        denominator: targetDen,
        color: FRACTION_PALETTE[targetDen]?.bg || 'bg-amber-500',
      });
    }

    setTracks((prev) => {
      const updated = [...prev];
      if (!updated[trackIdx]) return prev;
      const currentItems = updated[trackIdx].items || [];
      updated[trackIdx] = {
        ...updated[trackIdx],
        items: [...currentItems, ...newPieces],
      };
      return updated;
    });

    playSound('success');
    fireMathConfetti();

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: '4-Track Builder',
      title: `Filled Missing Gap on Track ${trackIdx + 1}`,
      details: `Completed 1 Whole by snapping ${count} × 1/${targetDen}. Subtraction equation: 1 - (${simplifiedNum}/${simplifiedDen}) = ${count}/${targetDen}`,
      latexExpression: `1 - \\frac{${simplifiedNum}}{${simplifiedDen}} = \\frac{${count}}{${targetDen}}`,
      success: true,
      score: 25,
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
      { id: 4, title: 'Track 4 (Twelfths & Sixteenths)', items: [] },
    ]);
  };

  // Apply unlike denominator helper solution directly into Track 3 and 4
  const handleApplyUnlikeHelper = () => {
    const common = lcm(helperFrac1.den, helperFrac2.den) as FractionDenominator;
    const pieces1 = helperFrac1.num * (common / helperFrac1.den);
    const pieces2 = helperFrac2.num * (common / helperFrac2.den);

    const itemsTrack3: FractionStripItem[] = [];
    for (let i = 0; i < helperFrac1.num; i++) {
      itemsTrack3.push({ id: `h1-${i}`, numerator: 1, denominator: helperFrac1.den, color: FRACTION_PALETTE[helperFrac1.den].bg });
    }
    for (let i = 0; i < helperFrac2.num; i++) {
      itemsTrack3.push({ id: `h2-${i}`, numerator: 1, denominator: helperFrac2.den, color: FRACTION_PALETTE[helperFrac2.den].bg });
    }

    const itemsTrack4: FractionStripItem[] = [];
    const targetCommonDen = (common > 16 ? 16 : common) as FractionDenominator;
    const totalUnits = pieces1 + pieces2;
    for (let i = 0; i < Math.min(totalUnits, 16); i++) {
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
      topic: '4-Track Builder',
      title: `Unlike Denominators: 1/${helperFrac1.den} + 1/${helperFrac2.den}`,
      details: `Calculated LCM(${helperFrac1.den}, ${helperFrac2.den}) = ${common}, converting to ${pieces1}/${common} + ${pieces2}/${common} = ${pieces1 + pieces2}/${common}`,
      latexExpression: `\\frac{1}{${helperFrac1.den}} + \\frac{1}{${helperFrac2.den}} = \\frac{${pieces1}}{${common}} + \\frac{${pieces2}}{${common}} = \\frac{${pieces1 + pieces2}}{${common}}`,
      success: true,
      score: 30,
    });
  };

  return (
    <div id="four-track-builder-workspace" className="space-y-5 animate-fadeIn">
      
      {/* Track Tools Control Bar */}
      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Track:
          </span>
          <div className="flex items-center space-x-1">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                onClick={() => { setActiveTrackIndex(idx); playSound('click'); }}
                className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeTrackIndex === idx
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Unlike Denominator Helper Trigger */}
          <button
            id="unlike-denominators-helper-btn"
            onClick={() => setShowUnlikeHelper(true)}
            className="bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Split className="w-3.5 h-3.5 text-blue-600" />
            <span>Unlike LCM Helper</span>
          </button>

          {/* Guide Lines Toggle */}
          <button
            id="toggle-guidelines-btn"
            onClick={() => setShowGuideLines((prev) => !prev)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-colors ${
              showGuideLines
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Align Guides</span>
          </button>

          {/* Reset Tracks */}
          <button
            id="reset-all-tracks-btn"
            onClick={handleResetAll}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {/* Main 4-Track Stage Canvas */}
      <div id="fraction-strips-stage" className="bg-white rounded-3xl shadow-inner border border-slate-200 p-4 sm:p-7 flex flex-col space-y-5 relative">
        
        {/* Top Unit Reference Bar (1 Whole) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span className="font-bold text-slate-700">Reference Whole (1 Unit)</span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setReferenceLabelMode('fraction')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  referenceLabelMode === 'fraction' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Fraction
              </button>
              <button
                onClick={() => setReferenceLabelMode('decimal')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  referenceLabelMode === 'decimal' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Decimal
              </button>
              <button
                onClick={() => setReferenceLabelMode('percent')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  referenceLabelMode === 'percent' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                %
              </button>
            </div>
          </div>

          <div className="w-full h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md">
            <span>
              {referenceLabelMode === 'fraction' && '1 Whole Unit (1/1)'}
              {referenceLabelMode === 'decimal' && '1.00 Whole Unit'}
              {referenceLabelMode === 'percent' && '100% Whole Unit'}
            </span>
          </div>
        </div>

        {/* 4 Snap Tracks */}
        <div className="space-y-4">
          {tracks.map((track, trackIdx) => {
            const sumData = trackSums[trackIdx] || {
              totalValue: 0,
              rawNum: 0,
              rawDen: 1,
              simplifiedNum: 0,
              simplifiedDen: 1,
              gapFraction: { num: 0, den: 1 },
              hasGap: false,
              subtractionLatex: '',
              isWhole: false,
              isOverWhole: false,
            };
            const isActive = activeTrackIndex === trackIdx;
            const items = track?.items || [];

            return (
              <div
                key={track?.id || trackIdx}
                id={`track-container-${trackIdx + 1}`}
                onClick={() => setActiveTrackIndex(trackIdx)}
                className={`rounded-2xl p-3.5 border-2 transition-all cursor-pointer relative ${
                  isActive
                    ? 'border-blue-500 bg-blue-50/30 ring-4 ring-blue-50 shadow-md'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                {/* Track Header Line */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {trackIdx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      {track?.title || `Track ${trackIdx + 1}`}
                    </span>
                    {sumData.isWhole && (
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>= 1 Whole</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1.5 text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-slate-400 font-medium">Sum:</span>
                      <div className="font-bold text-slate-900 font-serif">
                        <MathView latex={fractionToLatex(sumData.simplifiedNum, sumData.simplifiedDen)} />
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({(sumData.totalValue * 100).toFixed(0)}%)
                      </span>
                    </div>

                    {items.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearTrack(trackIdx);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Clear track"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Track Strip Slot */}
                <div className="w-full h-14 bg-white rounded-xl border-2 border-slate-200 flex relative overflow-hidden shadow-inner">
                  {items.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs italic">
                      Track {trackIdx + 1} is empty. Tap fraction tiles below to add pieces...
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center">
                      {items.map((item, itemIdx) => {
                        const widthPct = (1 / item.denominator) * 100;
                        const palette = FRACTION_PALETTE[item.denominator] || FRACTION_PALETTE[2];
                        const isSelected =
                          selectedPiece?.trackIdx === trackIdx &&
                          selectedPiece?.item.id === item.id;

                        return (
                          <div
                            key={item.id}
                            style={{ width: `${widthPct}%` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPiece({ trackIdx, item, itemIndex: itemIdx });
                              playSound('pop');
                            }}
                            className={`h-full ${palette.bg} border-r-2 border-white flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-xs transition-transform hover:scale-[1.02] cursor-pointer group relative select-none ${
                              isSelected ? 'ring-4 ring-amber-400 ring-offset-2 z-20 brightness-110' : ''
                            }`}
                            title={`Piece 1/${item.denominator} - Tap to split or remove`}
                          >
                            <MathView latex={`\\frac{1}{${item.denominator}}`} />
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(trackIdx, item.id);
                              }}
                              className="absolute hidden group-hover:block bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded -top-5 z-20 shadow-md"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}

                      {/* Translucent Gap Indicator */}
                      {sumData.hasGap && (
                        <div
                          style={{ width: `${(1 - sumData.totalValue) * 100}%` }}
                          className="h-full bg-amber-100/60 border-2 border-dashed border-amber-400 flex items-center justify-between px-2 text-amber-900 relative group select-none"
                        >
                          <span className="text-[10px] font-bold">
                            Gap: {sumData.gapFraction.num}/{sumData.gapFraction.den}
                          </span>
                          {(DENOMINATORS as readonly number[]).includes(sumData.gapFraction.den) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSnapFillGap(trackIdx);
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs cursor-pointer"
                            >
                              Snap Gap
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature 2: Side-by-Side Track 1 vs Track 2 Comparison Engine */}
        {showComparisonEngine && (tracks[0]?.items || []).length > 0 && (tracks[1]?.items || []).length > 0 && (
          <div className="pt-2">
            <FractionComparisonCard
              track1={tracks[0]}
              track2={tracks[1]}
              track1Items={tracks[0]?.items}
              track2Items={tracks[1]?.items}
              track1Sum={trackSums[0]}
              track2Sum={trackSums[1]}
              onAddPieceToTrack={(trackIdx, den) => handleAddPiece(den, trackIdx)}
              onClearTrack={(trackIdx) => handleClearTrack(trackIdx)}
              onBridgeGap={(diffDen, count) => {
                const newPieces: FractionStripItem[] = [];
                for (let i = 0; i < count; i++) {
                  newPieces.push({
                    id: `bridge-${Date.now()}-${i}`,
                    numerator: 1,
                    denominator: diffDen,
                    color: FRACTION_PALETTE[diffDen]?.bg || 'bg-amber-500',
                  });
                }
                const t0Val = trackSums[0]?.totalValue || 0;
                const t1Val = trackSums[1]?.totalValue || 0;
                const targetTrack = t0Val < t1Val ? 0 : 1;
                setTracks((prev) => {
                  const updated = [...prev];
                  if (!updated[targetTrack]) return prev;
                  const currentItems = updated[targetTrack].items || [];
                  updated[targetTrack] = {
                    ...updated[targetTrack],
                    items: [...currentItems, ...newPieces],
                  };
                  return updated;
                });
                playSound('success');
                fireMathConfetti();
              }}
            />
          </div>
        )}

      </div>

      {/* Piece Selection & Split/Merge Actions Tray */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
            Tap to Add Fraction Tile to Track {activeTrackIndex + 1}
          </span>
          {selectedPiece && (
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
              Selected Piece: 1/{selectedPiece.item.denominator} on Track {selectedPiece.trackIdx + 1}
            </span>
          )}
        </div>

        {/* Fraction Palette Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
          {DENOMINATORS.map((den) => {
            const palette = FRACTION_PALETTE[den] || FRACTION_PALETTE[2];
            return (
              <button
                key={den}
                id={`add-piece-track-den-${den}`}
                onClick={() => handleAddPiece(den, activeTrackIndex)}
                className={`py-2 px-2 rounded-xl ${palette.bg} text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm hover:opacity-90 active:scale-95 cursor-pointer transition-all`}
              >
                <span className="text-[10px] opacity-80 uppercase">+{`1/${den}`}</span>
                <MathView latex={`\\frac{1}{${den}}`} />
              </button>
            );
          })}
        </div>

        {/* Split & Merge Operations if piece is selected */}
        {selectedPiece && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Split 1/{selectedPiece.item.denominator} into:</span>
              {[2, 3, 4, 5, 6, 8, 10, 12, 16].map((targetDen) => {
                const count = targetDen / selectedPiece.item.denominator;
                if (count <= 1 || !Number.isInteger(count) || !(DENOMINATORS as readonly number[]).includes(targetDen as FractionDenominator)) return null;

                return (
                  <button
                    key={targetDen}
                    onClick={() => handleSplitPiece(targetDen as FractionDenominator)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    {count} × 1/{targetDen}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setSelectedPiece(null)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1"
            >
              Cancel Selection
            </button>
          </div>
        )}
      </div>

      {/* Unlike Denominators Helper Modal */}
      {showUnlikeHelper && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Split className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Unlike Denominators LCM Helper
                </h3>
              </div>
              <button
                onClick={() => setShowUnlikeHelper(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              When adding fractions with different denominators, find the Least Common Multiple (LCM) to divide both strips into identical equal units.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Fraction 1:</label>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">1 /</span>
                  <select
                    value={helperFrac1.den}
                    onChange={(e) => setHelperFrac1({ ...helperFrac1, den: Number(e.target.value) as FractionDenominator })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm"
                  >
                    {DENOMINATORS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Fraction 2:</label>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">1 /</span>
                  <select
                    value={helperFrac2.den}
                    onChange={(e) => setHelperFrac2({ ...helperFrac2, den: Number(e.target.value) as FractionDenominator })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm"
                  >
                    {DENOMINATORS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Calculated LCM Proof */}
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 space-y-2 text-center">
              <div className="text-xs font-bold text-blue-900">
                Common Denominator: LCM({helperFrac1.den}, {helperFrac2.den}) = {lcm(helperFrac1.den, helperFrac2.den)}
              </div>
              <div className="text-base font-bold font-serif text-slate-900">
                <MathView latex={`\\frac{1}{${helperFrac1.den}} + \\frac{1}{${helperFrac2.den}} = \\frac{${lcm(helperFrac1.den, helperFrac2.den) / helperFrac1.den}}{${lcm(helperFrac1.den, helperFrac2.den)}} + \\frac{${lcm(helperFrac1.den, helperFrac2.den) / helperFrac2.den}}{${lcm(helperFrac1.den, helperFrac2.den)}} = \\frac{${(lcm(helperFrac1.den, helperFrac2.den) / helperFrac1.den) + (lcm(helperFrac1.den, helperFrac2.den) / helperFrac2.den)}}{${lcm(helperFrac1.den, helperFrac2.den)}}`} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowUnlikeHelper(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleApplyUnlikeHelper}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md cursor-pointer transition-all"
              >
                Apply to Track 3 & 4
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
