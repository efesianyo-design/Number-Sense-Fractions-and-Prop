import React, { useState, useEffect, useMemo } from 'react';
import { ChallengeCard, ActivityLog, StudentProfile, FormLevel } from '../../types';
import { simplifyFraction, fractionToLatex, decimalToPercent } from '../../utils/math';
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
  Plus,
  BookOpen,
  Send,
  Trash2,
  Edit3,
  Layers,
  GraduationCap,
  Lightbulb,
  Check,
  ChevronRight,
  Share2
} from 'lucide-react';

interface FairShareKitchenModeProps {
  onLogActivity: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onUpdateLiveLatex: (latex: string) => void;
  onOpenSocraticCoach: (context: string) => void;
  student: StudentProfile | null;
}

export type FoodType = 'pizza' | 'chocolate' | 'bread' | 'bofrot' | 'sobolo' | 'pie';

export interface CustomWordProblem {
  id: string;
  title: string;
  level: FormLevel;
  foodType: FoodType;
  story: string;
  totalSlices: number;
  allocations: { person: string; slices: number; color: string }[];
  question: string;
  targetFraction: { num: number; den: number };
  targetDecimal?: number;
  points: number;
  timeLimitSeconds: number;
  explanation: string;
  latexProof: string;
  author: string;
  isUserCreated?: boolean;
}

// Built-in authentic Ghanaian classroom word problems
const DEFAULT_WORD_PROBLEMS: CustomWordProblem[] = [
  {
    id: 'gh-wp-1',
    title: 'Kwame and Ama Pizza Share',
    level: 'Form 1',
    foodType: 'pizza',
    story: 'Kwame and Ama bought a fresh 8-slice pizza at Accra Mall. Kwame ate 3 slices and Ama ate 3 slices. What fraction of the whole pizza is left over?',
    totalSlices: 8,
    allocations: [
      { person: 'Kwame', slices: 3, color: '#3b82f6' },
      { person: 'Ama', slices: 3, color: '#22c55e' },
    ],
    question: 'What fraction of the pizza remains?',
    targetFraction: { num: 2, den: 8 },
    points: 50,
    timeLimitSeconds: 60,
    explanation: 'Total eaten = 3 + 3 = 6 slices. Remaining = 8 - 6 = 2 slices out of 8. In simplest form: 2/8 = 1/4.',
    latexProof: '1 - \\left(\\frac{3}{8} + \\frac{3}{8}\\right) = 1 - \\frac{6}{8} = \\frac{2}{8} = \\frac{1}{4} = 25\\%',
    author: 'WAEC / GES Standard',
  },
  {
    id: 'gh-wp-2',
    title: 'Kumasi Market Bofrot Tray Sharing',
    level: 'Form 1',
    foodType: 'bofrot',
    story: 'At Kejetia Market in Kumasi, Uncle Yaw fried a fresh tray of 12 golden bofrots. Kojo took 4 bofrots for breakfast, and Esi took 2 bofrots. What fraction of the tray did Kojo receive?',
    totalSlices: 12,
    allocations: [
      { person: 'Kojo', slices: 4, color: '#3b82f6' },
      { person: 'Esi', slices: 2, color: '#22c55e' },
    ],
    question: 'What fraction of the total tray did Kojo get?',
    targetFraction: { num: 4, den: 12 },
    points: 50,
    timeLimitSeconds: 60,
    explanation: 'Kojo took 4 out of 12 bofrots. 4/12 simplifies by dividing numerator and denominator by 4 to get 1/3.',
    latexProof: '\\frac{4}{12} = \\frac{4 \\div 4}{12 \\div 4} = \\frac{1}{3} \\approx 33.3\\%',
    author: 'Sir Eugene Math Lab',
  },
  {
    id: 'gh-wp-3',
    title: 'Accra Sugar Bread Breakfast Loaf',
    level: 'Form 2',
    foodType: 'bread',
    story: 'A warm loaf of Accra sugar bread is cut into 10 equal thick slices. Kofi eats 2 slices, Abena eats 3 slices, and their mother takes 1 slice. What fraction remains for tea tomorrow?',
    totalSlices: 10,
    allocations: [
      { person: 'Kofi', slices: 2, color: '#3b82f6' },
      { person: 'Abena', slices: 3, color: '#ec4899' },
      { person: 'Mother', slices: 1, color: '#8b5cf6' },
    ],
    question: 'What fraction of the sugar bread loaf is left?',
    targetFraction: { num: 4, den: 10 },
    points: 75,
    timeLimitSeconds: 60,
    explanation: 'Total eaten = 2 + 3 + 1 = 6 slices out of 10. Remaining = 10 - 6 = 4 slices out of 10. Simplified = 2/5 (or 40%).',
    latexProof: '1 - \\frac{2 + 3 + 1}{10} = 1 - \\frac{6}{10} = \\frac{4}{10} = \\frac{2}{5} = 40\\%',
    author: 'GES Core Curriculum',
  },
  {
    id: 'gh-wp-4',
    title: 'Inter-Co Athletics Sobolo Jug Distribution',
    level: 'Form 2',
    foodType: 'sobolo',
    story: 'During the Inter-Colleges athletics competition, the school sports club prepared a 12-portion jug of chilled Sobolo. The sprinters drank 5 portions and the relay team drank 4 portions. What fraction remains in the jug?',
    totalSlices: 12,
    allocations: [
      { person: 'Sprinters', slices: 5, color: '#ef4444' },
      { person: 'Relay Team', slices: 4, color: '#3b82f6' },
    ],
    question: 'What fraction of the Sobolo jug is remaining?',
    targetFraction: { num: 3, den: 12 },
    points: 75,
    timeLimitSeconds: 60,
    explanation: 'Total drank = 5 + 4 = 9 portions out of 12. Remaining = 12 - 9 = 3 portions out of 12 = 1/4 of the jug.',
    latexProof: '1 - \\left(\\frac{5}{12} + \\frac{4}{12}\\right) = 1 - \\frac{9}{12} = \\frac{3}{12} = \\frac{1}{4} = 25\\%',
    author: 'Ashanti Regional SHS',
  },
  {
    id: 'gh-wp-5',
    title: 'Rectangular Golden Chocolate Bar Partition',
    level: 'Form 1',
    foodType: 'chocolate',
    story: 'A Ghanaian Golden Tree chocolate bar is divided into 6 equal rectangular blocks. 3 friends want to share it equally. How many blocks and what fraction of the bar does each friend get?',
    totalSlices: 6,
    allocations: [
      { person: 'Friend 1', slices: 2, color: '#3b82f6' },
      { person: 'Friend 2', slices: 2, color: '#22c55e' },
      { person: 'Friend 3', slices: 2, color: '#a855f7' },
    ],
    question: 'What fraction of the chocolate bar does each friend get?',
    targetFraction: { num: 2, den: 6 },
    points: 50,
    timeLimitSeconds: 60,
    explanation: '6 blocks divided equally among 3 friends gives 2 blocks each. The fraction is 2/6 = 1/3 of the whole chocolate bar.',
    latexProof: '\\frac{6 \\text{ blocks}}{3 \\text{ friends}} = 2 \\text{ blocks} = \\frac{2}{6} = \\frac{1}{3} \\approx 33.3\\%',
    author: 'WAEC Past Questions',
  },
];

const LOCAL_STORAGE_KEY = 'fair_share_user_word_problems';

export const FairShareKitchenMode: React.FC<FairShareKitchenModeProps> = ({
  onLogActivity,
  onUpdateLiveLatex,
  onOpenSocraticCoach,
  student,
}) => {
  // Navigation Tabs: 'solver' (Active Slicer & Problem), 'library' (Browse Word Problems), 'creator' (Add Word Problem)
  const [activeTab, setActiveTab] = useState<'solver' | 'library' | 'creator'>('solver');

  // Word Problems State (Default + User Created in LocalStorage)
  const [wordProblems, setWordProblems] = useState<CustomWordProblem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...parsed, ...DEFAULT_WORD_PROBLEMS];
      }
    } catch {
      // fallback
    }
    return DEFAULT_WORD_PROBLEMS;
  });

  // Current Active Problem
  const [activeProblemId, setActiveProblemId] = useState<string>(DEFAULT_WORD_PROBLEMS[0].id);
  const currentProblem = useMemo(() => {
    return wordProblems.find((p) => p.id === activeProblemId) || wordProblems[0];
  }, [wordProblems, activeProblemId]);

  // Food Slicer State
  const [foodType, setFoodType] = useState<FoodType>(currentProblem.foodType);
  const [sliceCount, setSliceCount] = useState<number>(currentProblem.totalSlices);
  
  // Slice Allocations (array of person indices or 'unassigned')
  const [sliceAllocations, setSliceAllocations] = useState<string[]>(() => {
    return new Array(currentProblem.totalSlices).fill('unassigned');
  });

  // Timed challenge state
  const [isChallengeActive, setIsChallengeActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(currentProblem.timeLimitSeconds);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [userAnswerNum, setUserAnswerNum] = useState<string>('');
  const [userAnswerDen, setUserAnswerDen] = useState<string>('');
  const [challengeFeedback, setChallengeFeedback] = useState<{ success: boolean; message: string; proof?: string } | null>(null);

  // New Word Problem Form State (Learner Creator)
  const [newTitle, setNewTitle] = useState('');
  const [newLevel, setNewLevel] = useState<FormLevel>(student?.level || 'Form 1');
  const [newFoodType, setNewFoodType] = useState<FoodType>('bofrot');
  const [newTotalSlices, setNewTotalSlices] = useState<number>(12);
  const [newStory, setNewStory] = useState('');
  const [newQuestion, setNewQuestion] = useState('What fraction of the total is left over?');
  const [newPerson1Name, setNewPerson1Name] = useState('Kwame');
  const [newPerson1Slices, setNewPerson1Slices] = useState<number>(3);
  const [newPerson2Name, setNewPerson2Name] = useState('Ama');
  const [newPerson2Slices, setNewPerson2Slices] = useState<number>(3);
  const [newPerson3Name, setNewPerson3Name] = useState('');
  const [newPerson3Slices, setNewPerson3Slices] = useState<number>(0);
  const [isGeneratingAIStory, setIsGeneratingAIStory] = useState(false);

  // Sync state whenever active problem changes
  useEffect(() => {
    if (currentProblem) {
      setFoodType(currentProblem.foodType);
      setSliceCount(currentProblem.totalSlices);
      setTimeLeft(currentProblem.timeLimitSeconds);
      setIsChallengeActive(false);
      setUserAnswerNum('');
      setUserAnswerDen('');
      setChallengeFeedback(null);

      // Pre-populate slices if problem specifies allocations
      const initialSlices = new Array(currentProblem.totalSlices).fill('unassigned');
      let cursor = 0;
      currentProblem.allocations.forEach((alloc) => {
        for (let i = 0; i < alloc.slices && cursor < currentProblem.totalSlices; i++) {
          initialSlices[cursor] = alloc.person;
          cursor++;
        }
      });
      setSliceAllocations(initialSlices);
    }
  }, [currentProblem]);

  // People in the current context
  const characterList = useMemo(() => {
    const defaultPeople = [
      { name: 'Kwame', color: '#3b82f6', bgClass: 'bg-blue-600', textClass: 'text-blue-600', lightBg: 'bg-blue-50' },
      { name: 'Ama', color: '#22c55e', bgClass: 'bg-green-600', textClass: 'text-green-600', lightBg: 'bg-green-50' },
      { name: 'Kofi', color: '#a855f7', bgClass: 'bg-purple-600', textClass: 'text-purple-600', lightBg: 'bg-purple-50' },
      { name: 'Abena', color: '#ec4899', bgClass: 'bg-pink-600', textClass: 'text-pink-600', lightBg: 'bg-pink-50' },
    ];

    if (currentProblem.allocations && currentProblem.allocations.length > 0) {
      return currentProblem.allocations.map((a, idx) => ({
        name: a.person,
        color: a.color || defaultPeople[idx % defaultPeople.length].color,
        bgClass: defaultPeople[idx % defaultPeople.length].bgClass,
        textClass: defaultPeople[idx % defaultPeople.length].textClass,
        lightBg: defaultPeople[idx % defaultPeople.length].lightBg,
      }));
    }
    return defaultPeople;
  }, [currentProblem]);

  // Allocation counts
  const allocationStats = useMemo(() => {
    const counts: Record<string, number> = {};
    characterList.forEach((c) => (counts[c.name] = 0));
    let unassigned = 0;

    sliceAllocations.forEach((owner) => {
      if (owner === 'unassigned') {
        unassigned++;
      } else {
        counts[owner] = (counts[owner] || 0) + 1;
      }
    });

    return { counts, unassigned };
  }, [sliceAllocations, characterList]);

  // Cycle slice owner on click
  const handleSliceClick = (index: number) => {
    setSliceAllocations((prev) => {
      const next = [...prev];
      const current = next[index];

      // Find current index in character list
      const charIndex = characterList.findIndex((c) => c.name === current);
      if (current === 'unassigned') {
        next[index] = characterList[0]?.name || 'Kwame';
      } else if (charIndex >= 0 && charIndex < characterList.length - 1) {
        next[index] = characterList[charIndex + 1].name;
      } else {
        next[index] = 'unassigned';
      }
      return next;
    });
    playSound('click');
  };

  // Slice count change
  const handleSliceCountChange = (newCount: number) => {
    setSliceCount(newCount);
    setSliceAllocations(new Array(newCount).fill('unassigned'));
    playSound('slice');
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
      setChallengeFeedback({ 
        success: false, 
        message: "Time's up! Try again or ask the Socratic Coach for a hint." 
      });
    }
    return () => clearInterval(interval);
  }, [isChallengeActive, timeLeft]);

  // Update Live KaTeX
  useEffect(() => {
    const parts = characterList.map((c) => {
      const cnt = allocationStats.counts[c.name] || 0;
      const simp = simplifyFraction(cnt, sliceCount);
      return `\\text{${c.name}: } \\frac{${simp.num}}{${simp.den}}`;
    });
    const uSimp = simplifyFraction(allocationStats.unassigned, sliceCount);
    parts.push(`\\text{Remaining: } \\frac{${uSimp.num}}{${uSimp.den}}`);

    const latex = parts.join(', \\quad ');
    onUpdateLiveLatex(latex);
  }, [allocationStats, sliceCount, characterList, onUpdateLiveLatex]);

  // Start 1-Minute Challenge
  const handleStartChallenge = () => {
    setIsChallengeActive(true);
    setTimeLeft(currentProblem.timeLimitSeconds);
    setUserAnswerNum('');
    setUserAnswerDen('');
    setChallengeFeedback(null);
    playSound('snap');
  };

  // Submit Answer
  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(userAnswerNum, 10);
    const den = parseInt(userAnswerDen || '1', 10);

    if (isNaN(num)) return;

    let isCorrect = false;

    if (currentProblem.targetDecimal !== undefined) {
      isCorrect = Math.abs(num - currentProblem.targetDecimal) < 0.01;
    } else {
      const val = num / den;
      const targetVal = currentProblem.targetFraction.num / currentProblem.targetFraction.den;
      isCorrect = Math.abs(val - targetVal) < 0.001;
    }

    if (isCorrect) {
      playSound('success');
      fireSuperConfetti();
      const pointsGained = currentProblem.points + (streak + 1) * 10;
      setScore((prev) => prev + pointsGained);
      setStreak((prev) => prev + 1);
      setIsChallengeActive(false);
      setChallengeFeedback({
        success: true,
        message: `Correct! Excellent mathematical reasoning! (+${pointsGained} pts)`,
        proof: currentProblem.latexProof,
      });

      onLogActivity({
        studentId: student?.id || 'guest',
        studentName: student?.name || 'Guest Student',
        studentLevel: student?.level || 'Form 1',
        topic: 'Fair-Share Kitchen',
        title: `Word Problem Solved: ${currentProblem.title}`,
        details: `Answered correctly: ${num}/${den} in ${currentProblem.timeLimitSeconds - timeLeft}s`,
        latexExpression: currentProblem.latexProof || `\\text{Answer: } \\frac{${num}}{${den}} = \\frac{${currentProblem.targetFraction.num}}{${currentProblem.targetFraction.den}}`,
        success: true,
        score: pointsGained,
        timeSpentSeconds: currentProblem.timeLimitSeconds - timeLeft,
      });
    } else {
      playSound('pop');
      setStreak(0);
      setChallengeFeedback({
        success: false,
        message: 'Not quite! Check your fraction partitioning or ask the Socratic Coach for guidance.',
      });
    }
  };

  // AI Story Generator for Custom Problem
  const handleAIGenerateStory = async () => {
    setIsGeneratingAIStory(true);
    playSound('snap');

    try {
      const res = await fetch('/api/gemini/generate-word-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: newLevel,
          foodItem: newFoodType,
          sliceCount: newTotalSlices,
          theme: 'Sharing street snacks or market food in Ghana',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.title) setNewTitle(data.title);
        if (data.story) setNewStory(data.story);
        if (data.question) setNewQuestion(data.question);
        if (data.totalSlices) setNewTotalSlices(data.totalSlices);
        if (data.foodItem) setNewFoodType(data.foodItem);

        if (data.allocations && data.allocations.length >= 1) {
          setNewPerson1Name(data.allocations[0].person || 'Kwame');
          setNewPerson1Slices(data.allocations[0].slices || 2);
          if (data.allocations.length >= 2) {
            setNewPerson2Name(data.allocations[1].person || 'Ama');
            setNewPerson2Slices(data.allocations[1].slices || 3);
          }
          if (data.allocations.length >= 3) {
            setNewPerson3Name(data.allocations[2].person || 'Kofi');
            setNewPerson3Slices(data.allocations[2].slices || 1);
          }
        }
        playSound('success');
      } else {
        // Offline Fallback Generator
        generateOfflineStory();
      }
    } catch {
      generateOfflineStory();
    } finally {
      setIsGeneratingAIStory(false);
    }
  };

  const generateOfflineStory = () => {
    const foodLabels: Record<FoodType, string> = {
      pizza: 'delicious 8-slice pizza at Osu Oxford Street',
      chocolate: 'bar of Golden Tree Chocolate with 12 squares',
      bread: 'fresh loaf of Accra Sugar Bread with 10 slices',
      bofrot: 'tray of 12 fresh golden bofrots in Kumasi',
      sobolo: 'chilled 12-cup jug of hibiscus Sobolo drink',
      pie: 'crispy meat pie sliced into 6 portions',
    };

    setNewTitle(`${newPerson1Name} and ${newPerson2Name}'s Fair Share`);
    setNewStory(
      `${newPerson1Name} and ${newPerson2Name} bought a ${foodLabels[newFoodType]}. ${newPerson1Name} took ${newPerson1Slices} portions and ${newPerson2Name} took ${newPerson2Slices} portions. What fraction of the whole is remaining for their classmate?`
    );
    setNewQuestion(`What fraction of the total ${newFoodType} is left over?`);
    playSound('success');
  };

  // Save Custom Word Problem to Library
  const handleSaveCustomProblem = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim() || !newStory.trim()) {
      alert('Please provide a title and story for the word problem.');
      return;
    }

    const allocs = [
      { person: newPerson1Name.trim() || 'Person 1', slices: Number(newPerson1Slices) || 1, color: '#3b82f6' },
      { person: newPerson2Name.trim() || 'Person 2', slices: Number(newPerson2Slices) || 1, color: '#22c55e' },
    ];
    if (newPerson3Name.trim() && Number(newPerson3Slices) > 0) {
      allocs.push({ person: newPerson3Name.trim(), slices: Number(newPerson3Slices), color: '#a855f7' });
    }

    const totalAllocated = allocs.reduce((sum, a) => sum + a.slices, 0);
    const remaining = Math.max(0, newTotalSlices - totalAllocated);

    // Compute target fraction (defaulting to remaining fraction)
    const targetSimp = simplifyFraction(remaining, newTotalSlices);

    const latexProof = `1 - \\frac{${allocs.map((a) => a.slices).join(' + ')}}{${newTotalSlices}} = 1 - \\frac{${totalAllocated}}{${newTotalSlices}} = \\frac{${remaining}}{${newTotalSlices}} = \\frac{${targetSimp.num}}{${targetSimp.den}} = ${decimalToPercent(remaining / newTotalSlices)}`;

    const newProblem: CustomWordProblem = {
      id: `user-wp-${Date.now()}`,
      title: newTitle.trim(),
      level: newLevel,
      foodType: newFoodType,
      story: newStory.trim(),
      totalSlices: newTotalSlices,
      allocations: allocs,
      question: newQuestion.trim() || 'What fraction is left over?',
      targetFraction: { num: targetSimp.num, den: targetSimp.den },
      points: 60,
      timeLimitSeconds: 60,
      explanation: `Total taken = ${totalAllocated}/${newTotalSlices}. Remaining = ${remaining}/${newTotalSlices} (${targetSimp.num}/${targetSimp.den}).`,
      latexProof,
      author: student?.name || 'Student Creator',
      isUserCreated: true,
    };

    const updated = [newProblem, ...wordProblems];
    setWordProblems(updated);

    // Persist user-created problems to localStorage
    try {
      const userOnly = updated.filter((p) => p.isUserCreated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userOnly));
    } catch {
      // localStorage error fallback
    }

    playSound('success');
    fireMathConfetti();

    // Switch to solver mode with the new problem loaded!
    setActiveProblemId(newProblem.id);
    setActiveTab('solver');

    onLogActivity({
      studentId: student?.id || 'guest',
      studentName: student?.name || 'Guest Student',
      studentLevel: student?.level || 'Form 1',
      topic: 'Fair-Share Kitchen',
      title: `Created Word Problem: "${newProblem.title}"`,
      details: `Authored a custom ${newProblem.foodType} word problem with ${newProblem.totalSlices} slices`,
      latexExpression: latexProof,
      success: true,
      score: 30,
    });
  };

  // Delete custom problem
  const handleDeleteCustomProblem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('pop');
    const updated = wordProblems.filter((p) => p.id !== id);
    setWordProblems(updated);
    try {
      const userOnly = updated.filter((p) => p.isUserCreated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userOnly));
    } catch {}

    if (activeProblemId === id) {
      setActiveProblemId(DEFAULT_WORD_PROBLEMS[0].id);
    }
  };

  return (
    <div id="fair-share-kitchen-workspace" className="flex-1 flex flex-col p-3 sm:p-5 max-w-6xl mx-auto w-full overflow-y-auto space-y-4 animate-fadeIn">
      
      {/* 1. Header Banner & Mode Navigator */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 font-bold shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  Fair-Share Kitchen & Word Problem Studio
                </h2>
                <span className="bg-orange-100 text-orange-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  Interactive Slicer & Solver
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Model real-world fair sharing with circular pizza, chocolate grids, Accra sugar bread, Bofrot trays, and Sobolo jugs.
              </p>
            </div>
          </div>

          {/* Points & Streak Counters */}
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 text-orange-700 font-black">
              <Trophy className="w-4 h-4 text-orange-600" />
              <span>{score} pts</span>
            </div>
            <div className="h-3.5 w-px bg-slate-300" />
            <div className="flex items-center gap-1 text-rose-600 font-black">
              <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
              <span>{streak} Streak</span>
            </div>
          </div>
        </div>

        {/* High-Contrast Navigation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => {
              setActiveTab('solver');
              playSound('click');
            }}
            className={`px-4 py-2.5 rounded-2xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'solver'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-orange-500/40'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <span>🍕 Interactive Slicer & Solver</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('library');
              playSound('click');
            }}
            className={`px-4 py-2.5 rounded-2xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'library'
                ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-orange-500/40'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-orange-500" />
            <span>📚 Problem Library ({wordProblems.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('creator');
              playSound('pop');
            }}
            className={`px-4 py-2.5 rounded-2xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'creator'
                ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-400/50'
                : 'bg-orange-50 hover:bg-orange-100 text-orange-900 border-orange-200'
            }`}
          >
            <Plus className="w-4 h-4 text-orange-600" />
            <span>✍️ Add & Create Word Problem</span>
          </button>
        </div>
      </div>

      {/* 2. TAB 1: INTERACTIVE SLICER & SOLVER */}
      {activeTab === 'solver' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Interactive Visual Food Canvas (6 Cols) */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 flex flex-col space-y-4 shadow-xs">
            
            {/* Top Toolbar: Food Selector & Slices Adjuster */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
                {[
                  { type: 'pizza', label: '🍕 Pizza' },
                  { type: 'chocolate', label: '🍫 Chocolate' },
                  { type: 'bofrot', label: '🍩 Bofrot' },
                  { type: 'bread', label: '🍞 Bread' },
                  { type: 'sobolo', label: '🍹 Sobolo' },
                ].map((f) => (
                  <button
                    key={f.type}
                    onClick={() => {
                      setFoodType(f.type as FoodType);
                      playSound('click');
                    }}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-colors cursor-pointer ${
                      foodType === f.type
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 font-bold text-[11px]">Slices:</span>
                {[2, 3, 4, 6, 8, 10, 12, 16].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => handleSliceCountChange(cnt)}
                    className={`w-7 h-7 rounded-xl font-mono font-bold text-xs cursor-pointer transition-colors ${
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
            <div className="flex-1 min-h-[280px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-4 flex items-center justify-center relative overflow-hidden">
              
              {/* 1. Circular Pizza / Pie Slices */}
              {foodType === 'pizza' && (
                <svg className="w-60 h-60 overflow-visible select-none drop-shadow-md" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="92" fill="#d97706" stroke="#92400e" strokeWidth="6" />
                  <circle cx="100" cy="100" r="82" fill="#fbbf24" />
                  
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

                    let fillColor = '#fbbf24'; // default yellow
                    const charObj = characterList.find((c) => c.name === owner);
                    if (charObj) fillColor = charObj.color;

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
              )}

              {/* 2. Chocolate Bar Grid */}
              {foodType === 'chocolate' && (
                <div
                  className="grid gap-2 p-3 bg-amber-950 rounded-2xl border-4 border-amber-900 shadow-md select-none"
                  style={{
                    gridTemplateColumns: `repeat(${sliceCount <= 4 ? sliceCount : sliceCount <= 6 ? 3 : 4}, minmax(0, 1fr))`,
                  }}
                >
                  {sliceAllocations.map((owner, idx) => {
                    const charObj = characterList.find((c) => c.name === owner);
                    const bgStyle = charObj ? { backgroundColor: charObj.color } : { backgroundColor: '#78350f' };

                    return (
                      <div
                        key={idx}
                        style={bgStyle}
                        onClick={() => handleSliceClick(idx)}
                        className="w-14 h-14 rounded-xl border border-white/20 flex flex-col items-center justify-center text-white font-bold text-[10px] shadow-xs cursor-pointer active:scale-95 transition-all"
                      >
                        <span>{owner === 'unassigned' ? 'Square' : owner}</span>
                        <span className="text-[9px] opacity-80 font-mono">1/{sliceCount}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. Golden Bofrot Tray */}
              {foodType === 'bofrot' && (
                <div
                  className="grid gap-3 p-4 bg-amber-100/80 rounded-2xl border-4 border-amber-300 shadow-md select-none"
                  style={{
                    gridTemplateColumns: `repeat(${sliceCount <= 4 ? sliceCount : sliceCount <= 6 ? 3 : 4}, minmax(0, 1fr))`,
                  }}
                >
                  {sliceAllocations.map((owner, idx) => {
                    const charObj = characterList.find((c) => c.name === owner);
                    const bgStyle = charObj
                      ? { backgroundColor: charObj.color, borderColor: charObj.color }
                      : { backgroundColor: '#d97706', borderColor: '#b45309' };

                    return (
                      <div
                        key={idx}
                        style={bgStyle}
                        onClick={() => handleSliceClick(idx)}
                        className="w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center text-white font-black text-[10px] shadow-sm cursor-pointer active:scale-95 transition-all relative group"
                      >
                        <span className="drop-shadow-xs">{owner === 'unassigned' ? `🍩 #${idx + 1}` : owner}</span>
                        <span className="text-[9px] opacity-90 font-mono">1/{sliceCount}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 4. Accra Sugar Bread Loaf Slices */}
              {foodType === 'bread' && (
                <div className="flex flex-col gap-1.5 p-3 bg-amber-200/90 rounded-2xl border-4 border-amber-600 shadow-md w-full max-w-sm">
                  <div className="text-[10px] font-black uppercase text-amber-900 text-center tracking-wider">
                    Accra Sugar Bread Loaf ({sliceCount} Slices)
                  </div>
                  <div className="flex gap-1 h-20 items-stretch bg-amber-100 p-1.5 rounded-xl border border-amber-300">
                    {sliceAllocations.map((owner, idx) => {
                      const charObj = characterList.find((c) => c.name === owner);
                      const bgStyle = charObj ? { backgroundColor: charObj.color } : { backgroundColor: '#f59e0b' };

                      return (
                        <div
                          key={idx}
                          style={bgStyle}
                          onClick={() => handleSliceClick(idx)}
                          className="flex-1 rounded-lg border border-amber-800/40 flex flex-col items-center justify-center text-white font-bold text-[9px] cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-xs"
                        >
                          <span className="rotate-90 sm:rotate-0 truncate">{owner === 'unassigned' ? `${idx+1}` : owner}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. Sobolo Liquid Cylinder Jug */}
              {foodType === 'sobolo' && (
                <div className="flex items-center gap-4">
                  <div className="w-24 h-60 bg-slate-100 rounded-3xl border-4 border-slate-400 p-1.5 flex flex-col-reverse relative shadow-inner overflow-hidden">
                    {sliceAllocations.map((owner, idx) => {
                      const charObj = characterList.find((c) => c.name === owner);
                      const bgStyle = charObj ? { backgroundColor: charObj.color } : { backgroundColor: '#be123c' };

                      return (
                        <div
                          key={idx}
                          style={{ ...bgStyle, height: `${100 / sliceCount}%` }}
                          onClick={() => handleSliceClick(idx)}
                          className="w-full border-t border-white/30 flex items-center justify-between px-2 text-white font-black text-[9px] cursor-pointer hover:opacity-90 transition-all"
                        >
                          <span>{owner === 'unassigned' ? `Cup ${idx+1}` : owner}</span>
                          <span className="opacity-75">1/{sliceCount}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="font-bold text-rose-800">🍹 1-Liter Sobolo Jug</div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Click each liquid segment to assign portions to team members.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Allocation Meter & Fractional Shares */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              {characterList.map((char) => {
                const count = allocationStats.counts[char.name] || 0;
                const simp = simplifyFraction(count, sliceCount);

                return (
                  <div key={char.name} className={`${char.lightBg} p-2.5 rounded-2xl border border-slate-200`}>
                    <div className={`text-[10px] font-black ${char.textClass}`}>{char.name}</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      <MathView latex={fractionToLatex(simp.num, simp.den)} />
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      {count}/{sliceCount} ({decimalToPercent(count / sliceCount)})
                    </div>
                  </div>
                );
              })}

              <div className="bg-slate-100 p-2.5 rounded-2xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-black">Remaining</div>
                <div className="font-bold text-slate-700 mt-0.5">
                  <MathView latex={fractionToLatex(simplifyFraction(allocationStats.unassigned, sliceCount).num, simplifyFraction(allocationStats.unassigned, sliceCount).den)} />
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  {allocationStats.unassigned}/{sliceCount} ({decimalToPercent(allocationStats.unassigned / sliceCount)})
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center font-medium">
              💡 Tap slices on the food model to cycle allocations: Unassigned → Kwame → Ama → Kofi → Remaining.
            </p>
          </div>

          {/* Right Column: Word Problem Card & Solution Engine (6 Cols) */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 flex flex-col space-y-4 shadow-xs">
            
            {/* Problem Navigation & Level Pill */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-orange-100 text-orange-800 border border-orange-200">
                  {currentProblem.level}
                </span>
                <h3 className="font-black text-sm text-slate-800 truncate max-w-[220px]">
                  {currentProblem.title}
                </h3>
              </div>

              {currentProblem.isUserCreated && (
                <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  👤 By {currentProblem.author}
                </span>
              )}
            </div>

            {/* Word Problem Story Card */}
            <div className="bg-orange-50/70 p-4 rounded-2xl border border-orange-200 space-y-2.5">
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                {currentProblem.story}
              </p>

              <div className="font-bold text-xs text-orange-950 bg-orange-200/50 p-2 rounded-xl border border-orange-300/60">
                ❓ {currentProblem.question}
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 font-mono font-bold">
                  <Timer className="w-4 h-4 text-orange-600" />
                  <span>{timeLeft}s timer</span>
                </div>
                <div className="flex items-center gap-1 text-orange-700 font-black">
                  <Award className="w-4 h-4" />
                  <span>+{currentProblem.points} Pts</span>
                </div>
              </div>
            </div>

            {/* Interactive Solution Form */}
            <form onSubmit={handleSubmitAnswer} className="space-y-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                  Enter Your Fractional Answer:
                </label>

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
                  <span className="text-2xl font-black text-slate-400 font-serif">/</span>
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
              </div>

              {/* Feedback Alert with Math Proof */}
              {challengeFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-bold space-y-2 animate-fadeIn ${
                    challengeFeedback.success
                      ? 'bg-green-50 border border-green-300 text-green-800'
                      : 'bg-rose-50 border border-rose-300 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {challengeFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" /> : <HelpCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                    <span>{challengeFeedback.message}</span>
                  </div>
                  {challengeFeedback.proof && (
                    <div className="bg-white/80 p-2.5 rounded-xl border border-green-200 text-center overflow-x-auto">
                      <MathView latex={challengeFeedback.proof} displayMode={true} className="text-sm text-green-900 font-bold" />
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {!isChallengeActive ? (
                  <button
                    id="start-challenge-timer-btn"
                    type="button"
                    onClick={handleStartChallenge}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-95"
                  >
                    <Timer className="w-4 h-4" />
                    Start 1-Min Challenge
                  </button>
                ) : (
                  <button
                    id="submit-challenge-answer-btn"
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Answer
                  </button>
                )}

                <button
                  id="ask-socratic-coach-challenge-btn"
                  type="button"
                  onClick={() => {
                    onOpenSocraticCoach(`Problem: ${currentProblem.title}. Story: ${currentProblem.story}. Question: ${currentProblem.question}`);
                    playSound('pop');
                  }}
                  className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Bot className="w-4 h-4 text-blue-600" />
                  Ask Socratic Coach
                </button>
              </div>
            </form>

            {/* Quick Socratic Hint Callout */}
            <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-amber-300 font-black text-[11px] uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Pedagogical Hint:</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {currentProblem.explanation}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* 3. TAB 2: PROBLEM LIBRARY (BROWSE & SOLVE) */}
      {activeTab === 'library' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Word Problem Library ({wordProblems.length} Problems Available)
              </h3>
              <p className="text-xs text-slate-500">
                Browse student-authored word problems and Ghanaian WAEC curriculum challenges.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveTab('creator');
                playSound('pop');
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Word Problem</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wordProblems.map((prob) => {
              const isSelected = prob.id === activeProblemId;

              return (
                <div
                  key={prob.id}
                  onClick={() => {
                    setActiveProblemId(prob.id);
                    setActiveTab('solver');
                    playSound('click');
                  }}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-3 group ${
                    isSelected
                      ? 'bg-orange-50/60 border-orange-400 shadow-md ring-2 ring-orange-400/50 scale-[1.01]'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {prob.level} • {prob.foodType.toUpperCase()}
                      </span>
                      {prob.isUserCreated && (
                        <button
                          onClick={(e) => handleDeleteCustomProblem(prob.id, e)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                          title="Delete word problem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                      {prob.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {prob.story}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                    <span className="text-[11px] font-mono text-slate-500">
                      {prob.totalSlices} Slices
                    </span>
                    <button className="bg-orange-600 text-white text-[11px] font-black px-3 py-1 rounded-lg flex items-center gap-1 group-hover:bg-orange-700 transition-colors">
                      <span>Solve Now</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB 3: WORD PROBLEM CREATOR STUDIO */}
      {activeTab === 'creator' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center font-black">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Learner Word Problem Creator
                </h3>
                <p className="text-xs text-slate-500">
                  Write your own fair share story problem with Ghanaian food, set allocations, and test your classmates!
                </p>
              </div>
            </div>

            {/* AI Assistant Button */}
            <button
              type="button"
              onClick={handleAIGenerateStory}
              disabled={isGeneratingAIStory}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black px-4 py-2 rounded-2xl shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isGeneratingAIStory ? '✨ Generating Story...' : '✨ AI Generate Ghanaian Story'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveCustomProblem} className="space-y-4">
            
            {/* Row 1: Title, Level, Food Item, Slices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 uppercase">Problem Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kofi's Sunday Bofrot Share"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 uppercase">Grade / Form Level:</label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value as FormLevel)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Form 1">Form 1 (JHS / SHS)</option>
                  <option value="Form 2">Form 2 (Intermediate)</option>
                  <option value="Form 3">Form 3 (Advanced WAEC)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 uppercase">Food / Item Type:</label>
                <select
                  value={newFoodType}
                  onChange={(e) => setNewFoodType(e.target.value as FoodType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="bofrot">🍩 Golden Bofrot Tray</option>
                  <option value="bread">🍞 Accra Sugar Bread</option>
                  <option value="sobolo">🍹 Sobolo Drink Jug</option>
                  <option value="pizza">🍕 Circular Pizza / Pie</option>
                  <option value="chocolate">🍫 Chocolate Bar Grid</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 uppercase">Total Slices / Portions:</label>
                <select
                  value={newTotalSlices}
                  onChange={(e) => setNewTotalSlices(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {[2, 3, 4, 6, 8, 10, 12, 16, 20, 24].map((cnt) => (
                    <option key={cnt} value={cnt}>
                      {cnt} Total Slices / Units
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Row 2: Character Allocations */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Character Portions & Share Allocation:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                <div className="bg-white p-3 rounded-xl border border-blue-200 space-y-1.5">
                  <span className="text-[10px] font-black text-blue-700 uppercase">Character 1</span>
                  <input
                    type="text"
                    value={newPerson1Name}
                    onChange={(e) => setNewPerson1Name(e.target.value)}
                    placeholder="Name (e.g. Kwame)"
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Slices taken:</span>
                    <input
                      type="number"
                      min={0}
                      max={newTotalSlices}
                      value={newPerson1Slices}
                      onChange={(e) => setNewPerson1Slices(Number(e.target.value))}
                      className="w-16 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg py-1"
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-green-200 space-y-1.5">
                  <span className="text-[10px] font-black text-green-700 uppercase">Character 2</span>
                  <input
                    type="text"
                    value={newPerson2Name}
                    onChange={(e) => setNewPerson2Name(e.target.value)}
                    placeholder="Name (e.g. Ama)"
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Slices taken:</span>
                    <input
                      type="number"
                      min={0}
                      max={newTotalSlices}
                      value={newPerson2Slices}
                      onChange={(e) => setNewPerson2Slices(Number(e.target.value))}
                      className="w-16 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg py-1"
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-1.5">
                  <span className="text-[10px] font-black text-purple-700 uppercase">Character 3 (Optional)</span>
                  <input
                    type="text"
                    value={newPerson3Name}
                    onChange={(e) => setNewPerson3Name(e.target.value)}
                    placeholder="Name (e.g. Kofi)"
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Slices taken:</span>
                    <input
                      type="number"
                      min={0}
                      max={newTotalSlices}
                      value={newPerson3Slices}
                      onChange={(e) => setNewPerson3Slices(Number(e.target.value))}
                      className="w-16 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg py-1"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Row 3: Story Narrative & Question */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 uppercase">Story Prompt (The Word Problem):</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the story: Who bought the item? Where were they? How many slices did each person take?"
                  value={newStory}
                  onChange={(e) => setNewStory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 uppercase">Question Asked to Solver:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. What fraction of the bofrot tray is left over for their teacher?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Submit & Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Problem & Launch Interactive Solver</span>
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};
