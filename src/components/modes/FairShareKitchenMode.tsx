import React, { useState, useEffect, useMemo } from 'react';
import { ChallengeCard, ActivityLog, StudentProfile, FormLevel } from '../../types';
import { simplifyFraction, fractionToLatex } from '../../utils/math';
import { MathView } from '../MathView';
import { playSound } from '../../utils/audio';
import { fireMathConfetti, fireSuperConfetti } from '../../utils/confetti';
import { 
  UtensilsCrossed, 
  Pizza, 
  Timer, 
  Trophy, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  RotateCcw,
  Flame,
  Award,
  ChevronRight
} from 'lucide-react';

interface FairShareKitchenModeProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  onOpenSocraticCoach: (context: string) => void;
  student: StudentProfile | null;
}

const CHALLENGES: ChallengeCard[] = [
  {
    id: 'ch-shs-1',
    level: 'Form 1',
    title: 'Kwame and Ama Pizza Share',
    prompt: 'Kwame and Ama share an 8-slice pizza. Kwame eats 3 slices and Ama eats 3 slices. What fraction of the whole pizza is left over?',
    type: 'pizza',
    contextData: { totalSlices: 8, kwame: 3, ama: 3 },
    targetFraction: { num: 2, den: 8 },
    timeLimitSeconds: 60,
    points: 50,
    socraticHintOffline: [
      "Find total slices eaten first: 3 + 3 = 6 slices.",
      "How many slices remain out of the original 8?",
      "Can you simplify 2/8 by dividing numerator and denominator by 2?",
    ],
  },
  {
    id: 'ch-shs-2',
    level: 'Form 1',
    title: 'Rectangular Chocolate Bar Partition',
    prompt: 'A chocolate bar has 12 equal squares. 3 friends want to share it equally. How many squares and what fraction does each friend get?',
    type: 'chocolate',
    contextData: { totalSlices: 12, friends: 3 },
    targetFraction: { num: 4, den: 12 },
    timeLimitSeconds: 60,
    points: 50,
    socraticHintOffline: [
      "Divide the 12 total squares equally among the 3 friends.",
      "12 divided by 3 gives the number of squares per friend.",
      "What is 4/12 in simplified form?",
    ],
  },
  {
    id: 'ch-shs-3',
    level: 'Form 2',
    title: 'Textbook Discount Calculation',
    prompt: 'A Core Mathematics textbook costs GH₵ 160. The bookstore offers a 25% discount for SHS Form 2 students. What is the final price in Cedis?',
    type: 'discount',
    contextData: { price: 160, discount: 25 },
    targetFraction: { num: 1, den: 4 },
    targetDecimal: 120,
    timeLimitSeconds: 60,
    points: 75,
    socraticHintOffline: [
      "25% is equivalent to the fraction 1/4.",
      "Calculate 1/4 of GH₵ 160 to find the savings.",
      "Subtract the savings from GH₵ 160.",
    ],
  },
  {
    id: 'ch-shs-4',
    level: 'Form 3',
    title: 'Speech Day Punch Proportional Mix',
    prompt: 'For Speech Day, the dining hall mixes Sobolo and Ginger in the ratio 3 : 2. If they need 20 Litres of total punch, how many Litres of Sobolo are needed?',
    type: 'ratio',
    contextData: { ratio: [3, 2], totalLiters: 20 },
    targetFraction: { num: 3, den: 5 },
    targetDecimal: 12,
    timeLimitSeconds: 60,
    points: 100,
    socraticHintOffline: [
      "Add the ratio parts together: 3 + 2 = 5 total parts.",
      "Sobolo represents 3 parts out of 5, which is 3/5 of the total batch.",
      "Calculate (3/5) × 20 Litres.",
    ],
  },
];

export const FairShareKitchenMode: React.FC<FairShareKitchenModeProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  onOpenSocraticCoach,
  student,
}) => {
  // Food Slicer State
  const [foodType, setFoodType] = useState<'pizza' | 'chocolate'>('pizza');
  const [sliceCount, setSliceCount] = useState<number>(8); // 2, 3, 4, 6, 8, 12
  const [sliceAllocations, setSliceAllocations] = useState<('unassigned' | 'kwame' | 'ama' | 'kofi')[]>(() => new Array(8).fill('unassigned'));

  // Challenge Mode State
  const [activeChallengeIndex, setActiveChallengeIndex] = useState<number>(0);
  const [isChallengeActive, setIsChallengeActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [userAnswerNum, setUserAnswerNum] = useState<string>('');
  const [userAnswerDen, setUserAnswerDen] = useState<string>('');
  const [challengeFeedback, setChallengeFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const currentChallenge = CHALLENGES[activeChallengeIndex];

  // Allocation counts
  const allocationStats = useMemo(() => {
    const kwame = sliceAllocations.filter((s) => s === 'kwame').length;
    const ama = sliceAllocations.filter((s) => s === 'ama').length;
    const kofi = sliceAllocations.filter((s) => s === 'kofi').length;
    const unassigned = sliceAllocations.filter((s) => s === 'unassigned').length;

    return { kwame, ama, kofi, unassigned };
  }, [sliceAllocations]);

  // Update Slice Count
  const handleSliceCountChange = (newCount: number) => {
    setSliceCount(newCount);
    setSliceAllocations(new Array(newCount).fill('unassigned'));
    playSound('slice');
  };

  // Cycle slice owner on click
  const handleSliceClick = (index: number) => {
    setSliceAllocations((prev) => {
      const next = [...prev];
      const current = next[index];
      let newOwner: 'unassigned' | 'kwame' | 'ama' | 'kofi' = 'kwame';
      if (current === 'kwame') newOwner = 'ama';
      else if (current === 'ama') newOwner = 'kofi';
      else if (current === 'kofi') newOwner = 'unassigned';
      next[index] = newOwner;
      return next;
    });
    playSound('click');
  };

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if (isChallengeActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isChallengeActive && timeLeft === 0) {
      setIsChallengeActive(false);
      playSound('pop');
      setChallengeFeedback({ success: false, message: "Time's up! Try again or ask the Socratic Coach for a hint." });
    }
    return () => clearInterval(interval);
  }, [isChallengeActive, timeLeft]);

  // Update Live KaTeX
  useEffect(() => {
    const kSimp = simplifyFraction(allocationStats.kwame, sliceCount);
    const aSimp = simplifyFraction(allocationStats.ama, sliceCount);
    const uSimp = simplifyFraction(allocationStats.unassigned, sliceCount);

    const latex = `\\text{Kwame: } \\frac{${kSimp.num}}{${kSimp.den}}, \\; \\text{Ama: } \\frac{${aSimp.num}}{${aSimp.den}}, \\; \\text{Remaining: } \\frac{${uSimp.num}}{${uSimp.den}}`;
    onUpdateLiveLatex(latex);
  }, [allocationStats, sliceCount]);

  // Start 1-Minute Challenge
  const handleStartChallenge = () => {
    setIsChallengeActive(true);
    setTimeLeft(currentChallenge.timeLimitSeconds);
    setUserAnswerNum('');
    setUserAnswerDen('');
    setChallengeFeedback(null);
    playSound('snap');
  };

  // Submit challenge answer
  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(userAnswerNum, 10);
    const den = parseInt(userAnswerDen || '1', 10);

    if (isNaN(num)) return;

    let isCorrect = false;

    if (currentChallenge.targetDecimal !== undefined) {
      // Numerical answer check
      isCorrect = Math.abs(num - currentChallenge.targetDecimal) < 0.01;
    } else {
      // Fraction equivalence check: num/den == targetNum/targetDen
      const val = num / den;
      const targetVal = currentChallenge.targetFraction.num / currentChallenge.targetFraction.den;
      isCorrect = Math.abs(val - targetVal) < 0.001;
    }

    if (isCorrect) {
      playSound('success');
      fireSuperConfetti();
      const pointsGained = currentChallenge.points + (streak + 1) * 10;
      setScore((prev) => prev + pointsGained);
      setStreak((prev) => prev + 1);
      setIsChallengeActive(false);
      setChallengeFeedback({
        success: true,
        message: `Correct! Excellent mathematical reasoning! (+${pointsGained} pts)`,
      });

      onLogActivity({
        studentId: student?.id || 'guest',
        studentName: student?.name || 'Guest Student',
        studentLevel: student?.level || 'Form 1',
        topic: 'SHS 1-Min Challenge',
        title: `Challenge Solved: ${currentChallenge.title}`,
        details: `Answered correctly: ${num}/${den} in ${60 - timeLeft} seconds`,
        latexExpression: `\\text{Answer: } \\frac{${num}}{${den}} = \\frac{${currentChallenge.targetFraction.num}}{${currentChallenge.targetFraction.den}}`,
        success: true,
        score: pointsGained,
        timeSpentSeconds: 60 - timeLeft,
      });
    } else {
      playSound('pop');
      setStreak(0);
      setChallengeFeedback({
        success: false,
        message: 'Not quite! Check your fraction equivalence or ask the Socratic Coach for guidance.',
      });
    }
  };

  return (
    <div id="fair-share-kitchen-workspace" className="flex-1 flex flex-col p-3 sm:p-5 max-w-6xl mx-auto w-full overflow-y-auto space-y-5">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              Fair-Share Kitchen & 1-Minute SHS Challenges
            </h2>
            <p className="text-xs text-slate-500">
              Divide food items into fair shares and tackle Ghanaian high school timed problem cards.
            </p>
          </div>
        </div>

        {/* Score & Streak Counters */}
        <div className="flex items-center gap-3 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 text-orange-700 font-bold">
            <Trophy className="w-4 h-4 text-orange-600" />
            <span>{score} pts</span>
          </div>
          <div className="h-3.5 w-px bg-slate-300" />
          <div className="flex items-center gap-1 text-rose-600 font-bold">
            <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
            <span>{streak} Streak</span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Slicer on Left, Challenge on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Interactive Food Slicers (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 flex flex-col space-y-4 shadow-sm">
          
          {/* Controls: Food Type & Slice Count */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setFoodType('pizza')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  foodType === 'pizza' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Circular Pizza
              </button>
              <button
                onClick={() => setFoodType('chocolate')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  foodType === 'chocolate' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chocolate Bar
              </button>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-bold text-[11px]">Slices:</span>
              {[2, 3, 4, 6, 8, 12].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => handleSliceCountChange(cnt)}
                  className={`w-7 h-7 rounded-lg font-mono font-bold text-xs cursor-pointer transition-colors ${
                    sliceCount === cnt
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Slicer Visual Stage */}
          <div className="flex-1 min-h-[260px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-4 flex items-center justify-center relative overflow-hidden">
            
            {foodType === 'pizza' ? (
              /* Pizza Slices Circular SVG */
              <svg className="w-56 h-56 overflow-visible select-none drop-shadow-md" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="92" fill="#d97706" stroke="#92400e" strokeWidth="6" />
                <circle cx="100" cy="100" r="82" fill="#fbbf24" />
                
                {/* Slices wedges */}
                {sliceAllocations.map((owner, idx) => {
                  const anglePerSlice = 360 / sliceCount;
                  const startAngle = idx * anglePerSlice;
                  const endAngle = (idx + 1) * anglePerSlice;
                  
                  const x1 = 100 + 80 * Math.cos((Math.PI * (startAngle - 90)) / 180);
                  const y1 = 100 + 80 * Math.sin((Math.PI * (startAngle - 90)) / 180);
                  const x2 = 100 + 80 * Math.cos((Math.PI * (endAngle - 90)) / 180);
                  const y2 = 100 + 80 * Math.sin((Math.PI * (endAngle - 90)) / 180);

                  const largeArc = anglePerSlice > 180 ? 1 : 0;
                  const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;

                  let fillColor = '#fbbf24'; // yellow default
                  if (owner === 'kwame') fillColor = '#3b82f6'; // blue
                  if (owner === 'ama') fillColor = '#22c55e'; // emerald
                  if (owner === 'kofi') fillColor = '#a855f7'; // purple

                  return (
                    <path
                      key={idx}
                      d={pathData}
                      fill={fillColor}
                      stroke="#78350f"
                      strokeWidth="2.5"
                      onClick={() => handleSliceClick(idx)}
                      className="cursor-pointer hover:opacity-85 transition-all active:scale-95"
                    />
                  );
                })}

                <circle cx="100" cy="100" r="6" fill="#78350f" />
              </svg>
            ) : (
              /* Rectangular Chocolate Bar Grid */
              <div
                className="grid gap-2 p-3 bg-amber-900 rounded-2xl border-4 border-amber-950 shadow-md"
                style={{
                  gridTemplateColumns: `repeat(${sliceCount <= 4 ? sliceCount : sliceCount <= 6 ? 3 : 4}, minmax(0, 1fr))`,
                }}
              >
                {sliceAllocations.map((owner, idx) => {
                  let bg = 'bg-amber-700 hover:bg-amber-600';
                  let label = 'Square';
                  if (owner === 'kwame') { bg = 'bg-blue-600'; label = 'Kwame'; }
                  if (owner === 'ama') { bg = 'bg-green-600'; label = 'Ama'; }
                  if (owner === 'kofi') { bg = 'bg-purple-600'; label = 'Kofi'; }

                  return (
                    <div
                      key={idx}
                      onClick={() => handleSliceClick(idx)}
                      className={`${bg} w-14 h-14 rounded-xl border border-white/20 flex flex-col items-center justify-center text-white font-bold text-[10px] shadow-sm cursor-pointer active:scale-95 transition-all select-none`}
                    >
                      <span>{label}</span>
                      <span className="text-[9px] opacity-80 font-mono">1/{sliceCount}</span>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Allocation Legend & Fractional Shares */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200">
              <div className="text-[10px] text-blue-700 font-bold">Kwame</div>
              <div className="font-bold text-slate-900 mt-0.5">
                <MathView latex={fractionToLatex(allocationStats.kwame, sliceCount)} />
              </div>
            </div>
            <div className="bg-green-50 p-2.5 rounded-xl border border-green-200">
              <div className="text-[10px] text-green-700 font-bold">Ama</div>
              <div className="font-bold text-slate-900 mt-0.5">
                <MathView latex={fractionToLatex(allocationStats.ama, sliceCount)} />
              </div>
            </div>
            <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200">
              <div className="text-[10px] text-purple-700 font-bold">Kofi</div>
              <div className="font-bold text-slate-900 mt-0.5">
                <MathView latex={fractionToLatex(allocationStats.kofi, sliceCount)} />
              </div>
            </div>
            <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold">Remaining</div>
              <div className="font-bold text-slate-700 mt-0.5">
                <MathView latex={fractionToLatex(allocationStats.unassigned, sliceCount)} />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center font-medium">
            Tap slices to cycle assignment: Unassigned → Kwame (Blue) → Ama (Green) → Kofi (Purple).
          </p>
        </div>

        {/* Right: Ghanaian SHS 1-Minute Challenge Cards (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 flex flex-col space-y-4 shadow-sm">
          
          {/* Card Navigation */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 font-mono">
                {currentChallenge.level}
              </span>
              <h3 className="font-bold text-sm text-slate-800">{currentChallenge.title}</h3>
            </div>

            <div className="flex items-center space-x-1.5">
              {CHALLENGES.map((ch, idx) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChallengeIndex(idx);
                    setIsChallengeActive(false);
                    setChallengeFeedback(null);
                    playSound('click');
                  }}
                  className={`w-6 h-6 rounded-md font-mono text-xs font-bold cursor-pointer transition-colors ${
                    activeChallengeIndex === idx
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Challenge Prompt */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans font-medium">
              {currentChallenge.prompt}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Timer className="w-4 h-4 text-blue-600" />
                <span className="font-mono font-bold text-blue-700">{timeLeft}s countdown</span>
              </div>

              <div className="flex items-center gap-1 text-orange-600 font-bold">
                <Award className="w-4 h-4" />
                <span>+{currentChallenge.points} Points</span>
              </div>
            </div>
          </div>

          {/* Interactive Answer Box */}
          <form onSubmit={handleSubmitAnswer} className="space-y-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                {currentChallenge.targetDecimal !== undefined ? 'Enter Numeric Answer (Cedis / Litres):' : 'Enter Fractional Answer (Numerator / Denominator):'}
              </label>

              {currentChallenge.targetDecimal !== undefined ? (
                <input
                  id="challenge-numeric-answer-input"
                  type="number"
                  required
                  placeholder="e.g. 120"
                  value={userAnswerNum}
                  onChange={(e) => setUserAnswerNum(e.target.value)}
                  className="w-full bg-white border-2 border-slate-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-800 font-mono font-bold text-sm focus:outline-none"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <input
                    id="challenge-numerator-input"
                    type="number"
                    required
                    placeholder="Numerator"
                    value={userAnswerNum}
                    onChange={(e) => setUserAnswerNum(e.target.value)}
                    className="flex-1 bg-white border-2 border-slate-300 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold text-sm text-center focus:outline-none"
                  />
                  <span className="text-xl font-black text-slate-400 font-serif">/</span>
                  <input
                    id="challenge-denominator-input"
                    type="number"
                    required
                    placeholder="Denominator"
                    value={userAnswerDen}
                    onChange={(e) => setUserAnswerDen(e.target.value)}
                    className="flex-1 bg-white border-2 border-slate-300 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold text-sm text-center focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Feedback Message */}
            {challengeFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  challengeFeedback.success
                    ? 'bg-green-50 border border-green-300 text-green-800'
                    : 'bg-rose-50 border border-rose-300 text-rose-800'
                }`}
              >
                {challengeFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" /> : <HelpCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span>{challengeFeedback.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {!isChallengeActive ? (
                <button
                  id="start-challenge-timer-btn"
                  type="button"
                  onClick={handleStartChallenge}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <Timer className="w-4 h-4" />
                  Start 1-Min Challenge
                </button>
              ) : (
                <button
                  id="submit-challenge-answer-btn"
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Answer
                </button>
              )}

              <button
                id="ask-socratic-coach-challenge-btn"
                type="button"
                onClick={() => {
                  onOpenSocraticCoach(`Problem: ${currentChallenge.title}. Prompt: ${currentChallenge.prompt}`);
                  playSound('pop');
                }}
                className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Bot className="w-4 h-4 text-blue-600" />
                Ask Socratic Coach
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
};
